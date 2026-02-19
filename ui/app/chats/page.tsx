'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserPlus, MessageCircle, User, ArrowRight,
  Search, Loader2, Sparkles, Share2,
} from 'lucide-react';
import apiClient from '@/lib/api_client';
import { useAuth } from '@/context/AuthContext';

interface ChatUser {
  id: string;
  userName: string;
  email: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timeStamp: string;
  chatId: string;
  isRead: boolean;
}

interface ChatPreview {
  id: string;
  startedAt: string;
  user1Id: string;
  user2Id: string;
  user1: ChatUser;
  user2: ChatUser;
  messages: ChatMessage[];
}

function formatTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatsPage() {
  const { currentUser } = useAuth();
  const router = useRouter();

  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New conversation
  const [newUsername, setNewUsername] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Friend introduction (bridge) — full replace coming in next task
  const [bridge, setBridge] = useState({ userA: '', userB: '' });
  const [isBridging, setIsBridging] = useState(false);

  // Fetch existing chats
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await apiClient.get('/messaging/chats/all');
        setChats(res.data ?? []);
      } catch (err) {
        console.error('Failed to load chats', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChats();
  }, []);

  // Connect by username: add friend + open/create chat
  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !currentUser) return;

    setIsCreating(true);
    try {
      // 1. Resolve username → user
      const resUser = await apiClient.get(`/users/find-by-username?username=${encodeURIComponent(newUsername)}`);
      const users: ChatUser[] = Array.isArray(resUser.data) ? resUser.data : [resUser.data];
      if (!users.length) throw new Error('User not found');
      const foundUser = users[0];

      if (foundUser.id === currentUser.id) {
        alert("You can't start a chat with yourself.");
        return;
      }

      // 2. Create friendship (ignore if it already exists)
      try {
        await apiClient.post('/social/friendships', {
          user1Id: currentUser.id,
          user2Id: foundUser.id,
        });
      } catch {
        // Friendship already exists — proceed to chat
      }

      // 3. Create (or retrieve existing) chat
      const resChat = await apiClient.post('/messaging/chats/create', {
        user1Id: currentUser.id,
        user2Id: foundUser.id,
      });

      router.push(`/chats/${resChat.data}?recipient=${encodeURIComponent(foundUser.userName)}`);
    } catch {
      alert('User not found or could not start a conversation.');
    } finally {
      setIsCreating(false);
      setNewUsername('');
    }
  };

  const [bridgeResult, setBridgeResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Friend introduction: create a pending match between two of your friends
  const handleConnectPeople = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bridge.userA || !bridge.userB || !currentUser) return;
    setBridgeResult(null);
    setIsBridging(true);
    try {
      const resA = await apiClient.get(`/users/find-by-username?username=${encodeURIComponent(bridge.userA)}`);
      const resB = await apiClient.get(`/users/find-by-username?username=${encodeURIComponent(bridge.userB)}`);
      const usersA: ChatUser[] = Array.isArray(resA.data) ? resA.data : [resA.data];
      const usersB: ChatUser[] = Array.isArray(resB.data) ? resB.data : [resB.data];
      if (!usersA.length || !usersB.length) throw new Error('One or both users not found');

      await apiClient.post('/social/matching/from-friend', {
        userAId: usersA[0].id,
        userBId: usersB[0].id,
      });

      setBridgeResult({ ok: true, msg: `Introduction sent! ${bridge.userA} and ${bridge.userB} will see each other's profiles and can accept.` });
      setBridge({ userA: '', userB: '' });
    } catch (err: any) {
      const msg = err?.response?.data || 'One or both users were not found, or you must be friends with both of them.';
      setBridgeResult({ ok: false, msg });
    } finally {
      setIsBridging(false);
    }
  };

  const getOtherUser = (chat: ChatPreview) =>
    chat.user1.userName === currentUser?.userName ? chat.user2 : chat.user1;

  if (!currentUser || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20 px-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 flex items-center gap-4 animate-pulse bg-white rounded-4xl">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-24 bg-slate-100 rounded" />
                <div className="h-3 w-full bg-slate-50 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20 px-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* New Conversation */}
        <section className="bg-white p-6 rounded-4xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <UserPlus size={20} className="text-indigo-600" />
            New Conversation
          </h2>
          <form onSubmit={handleStartChat} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Enter a username to connect..."
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 text-gray-600 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isCreating || !newUsername.trim()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isCreating ? <Loader2 size={18} className="animate-spin" /> : 'Connect'}
            </button>
          </form>
          <p className="text-xs text-slate-400 mt-3 ml-1">
            Adds them as a friend and opens a chat.
          </p>
        </section>

        {/* Friend Introduction */}
        <section className="bg-linear-to-br from-indigo-600 to-violet-700 p-8 rounded-4xl shadow-xl shadow-indigo-200 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Share2 size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Introduce Two Friends</h2>
              <p className="text-indigo-100 text-xs">Connect two of your friends — they decide if they want to meet</p>
            </div>
          </div>

          <p className="text-indigo-200 text-xs mb-5">
            Both people must already be your friends. Your identity stays anonymous to them.
          </p>

          {bridgeResult && (
            <div className={`mb-4 px-4 py-3 rounded-2xl text-sm font-medium ${
              bridgeResult.ok ? 'bg-emerald-500/20 text-emerald-100' : 'bg-red-500/20 text-red-100'
            }`}>
              {bridgeResult.msg}
            </div>
          )}

          <form onSubmit={handleConnectPeople} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="First friend's username"
                value={bridge.userA}
                onChange={(e) => { setBridge({ ...bridge, userA: e.target.value }); setBridgeResult(null); }}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl outline-none focus:bg-white/20 transition-all placeholder:text-indigo-200 text-sm"
              />
              <input
                type="text"
                placeholder="Second friend's username"
                value={bridge.userB}
                onChange={(e) => { setBridge({ ...bridge, userB: e.target.value }); setBridgeResult(null); }}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl outline-none focus:bg-white/20 transition-all placeholder:text-indigo-200 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isBridging || !bridge.userA || !bridge.userB}
              className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isBridging ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <><Sparkles size={18} /> Send Introduction</>
              )}
            </button>
          </form>
        </section>

        {/* Chats List */}
        <section className="bg-white rounded-4xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <h2 className="text-lg font-bold text-slate-900">Recent Messages</h2>
          </div>

          <div className="divide-y divide-slate-50">
            {chats.length > 0 ? (
              chats.map((chat) => {
                const other = getOtherUser(chat);
                const lastMsg = chat.messages.at(-1);
                return (
                  <div
                    key={chat.id}
                    onClick={() => router.push(`/chats/${chat.id}?recipient=${encodeURIComponent(other.userName)}`)}
                    className="p-4 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                      <User size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className="font-bold text-slate-900 truncate">{other.userName}</h3>
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tighter shrink-0 ml-2">
                          {lastMsg ? formatTime(lastMsg.timeStamp) : ''}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 truncate mt-0.5">
                        {lastMsg ? lastMsg.content : 'No messages yet...'}
                      </p>
                    </div>
                    <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="text-slate-300" size={32} />
                </div>
                <p className="text-slate-500 font-medium">No conversations yet.</p>
                <p className="text-sm text-slate-400">Enter a username above to get started!</p>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
