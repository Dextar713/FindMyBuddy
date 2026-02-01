'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, MessageCircle, User, ArrowRight, Search, Loader2, Sparkles, Share2 } from 'lucide-react';
import apiClient from '@/lib/api_client';


interface Message {
  id: string;
  senderId: string;
  content: string;
  timeStamp: string;
	chatId: string;
	isRead: boolean;
}

interface User {
	id: string;
	userName: string;
	email: string;
}

interface ChatPreview {
  id: string;
  startedAt: string;
	user1Id: string;
	user2Id: string;
	user1: User;
	user2: User;
	messages: Message[];
}

export default function ChatsPage() {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
	const [bridge, setBridge] = useState({ userA: '', userB: '' });
  const [isBridging, setIsBridging] = useState(false);

	const handleConnectPeople = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bridge.userA || !bridge.userB) return;

    setIsBridging(true);
    try {
      // API call to create a chat between two specific usernames
			const responseUser1 = await apiClient.get(`/users/find-by-username?username=${bridge.userA}`);
			const responseUser2 = await apiClient.get(`/users/find-by-username?username=${bridge.userB}`);
      const response: any = await apiClient.post('/messaging/chats/create', { 
        user1Id: responseUser1.data[0].id,
        user2Id: responseUser2.data[0].id
      });

			console.log(response);
      
      alert(`Success! ${bridge.userA} and ${bridge.userB} are now connected.`);
      setBridge({ userA: '', userB: '' });
      
      // Optionally redirect to that chat if the current user is an admin 
      // or just stay on the page to connect more people.
    } catch (err) {
      alert("One or both users were not found.");
    } finally {
      setIsBridging(false);
    }
  };

  // 1. Fetch existing chats
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const data = await apiClient.get('/messaging/chats/all');
        console.log(data);
        setChats(data.data);
      } catch (err) {
        console.error("Failed to load chats", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChats();
  }, []);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
        setUser(JSON.parse(storedUser));
        }
    }, []);

  // 2. Start a new chat by username
  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !user) return;

    setIsCreating(true);
    try {
      const responseUser = await apiClient.get(`/users/find-by-username?username=${newUsername}`);
      console.log(responseUser.data);
      console.log("Hellooo!!")

      // Assuming your backend finds the user and returns/creates a chat ID
      const response: any = await apiClient.post('/messaging/chats/create', {
        user1Id: user.id,
        user2Id: responseUser.data[0].id
      });

      console.log("-------------")
      console.log(response)
      router.push(`/chats/${response.data}`);
    } catch (err) {
      alert("User not found or could not start chat.");
      console.log(err)
    } finally {
      setIsCreating(false);
    }
  };

  return (<>
    {user != null && isLoading == false ?
    <div className="min-h-screen bg-slate-50 pt-20 px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* New Chat Section */}
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
                placeholder="Enter valid username..."
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 text-gray-600 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
              />
            </div>
            <button 
              type="submit"
              disabled={isCreating}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isCreating ? <Loader2 size={18} className="animate-spin" /> : "Start chat"}
            </button>
          </form>
        </section>

				{/* BRIDGE CONNECTION SECTION */}
        <section className="bg-linear-to-br from-indigo-600 to-violet-700 p-8 rounded-4xl shadow-xl shadow-indigo-200 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Share2 size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Connect People</h2>
              <p className="text-indigo-100 text-xs">Introduce two buddies to each other</p>
            </div>
          </div>

          <form onSubmit={handleConnectPeople} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="First Username"
                  value={bridge.userA}
                  onChange={(e) => setBridge({...bridge, userA: e.target.value})}
                  className="w-full pl-4 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl outline-none focus:bg-white/20 transition-all placeholder:text-indigo-200 text-sm"
                />
              </div>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Second Username"
                  value={bridge.userB}
                  onChange={(e) => setBridge({...bridge, userB: e.target.value})}
                  className="w-full pl-4 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl outline-none focus:bg-white/20 transition-all placeholder:text-indigo-200 text-sm"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isBridging || !bridge.userA || !bridge.userB}
              className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isBridging ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Sparkles size={18} />
                  Connect Buddies
                </>
              )}
            </button>
          </form>
        </section>

        {/* Chats List Section */}
        <section className="bg-white rounded-4xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <h2 className="text-lg font-bold text-slate-900">Recent Messages</h2>
          </div>

          <div className="divide-y divide-slate-50">
            {isLoading ? (
              <div className="p-10 text-center text-slate-400">Loading chats...</div>
            ) : chats.length > 0 ? (
              chats.map((chat) => (
                <div 
                  key={chat.id}
                  onClick={() => router.push(`/chats/${chat.id}`)}
                  className="p-4 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  {/* Dummy Profile Icon */}
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                    <User size={28} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-bold text-slate-900 truncate">{chat.user1.userName === user.userName ? chat.user2.userName : chat.user1.userName}</h3>
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tighter">
                        {chat.messages.length > 0 ? chat.messages.at(-1)?.timeStamp : ''}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 truncate mt-0.5">
                      {chat.messages.length > 0 ? chat.messages.at(-1)?.content : 'No messages so far...'}
                    </p>
                  </div>
                  
                  <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="text-slate-300" size={32} />
                </div>
                <p className="text-slate-500 font-medium">No conversations yet.</p>
                <p className="text-sm text-slate-400">Start one by entering a username above!</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
    : <div className="divide-y divide-slate-50">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
          {/* Avatar Skeleton */}
          <div className="w-14 h-14 bg-slate-100 rounded-2xl" />
          
          <div className="flex-1 space-y-3">
            <div className="flex justify-between">
              {/* Name Skeleton */}
              <div className="h-4 w-24 bg-slate-100 rounded" />
              {/* Time Skeleton */}
              <div className="h-3 w-10 bg-slate-50 rounded" />
            </div>
            {/* Message Preview Skeleton */}
            <div className="h-3 w-full bg-slate-50 rounded" />
          </div>
        </div>
      ))}
    </div>}
  </>);
}