'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Send, User, MoreVertical, Loader2, Ban } from 'lucide-react';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { v4 as uuidv4 } from 'uuid';
import apiClient from '@/lib/api_client';
import { useAuth } from '@/context/AuthContext';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timeStamp: string;
  chatId: string;
  isRead: boolean;
}

function formatTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function SingleChatPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const connectionRef = useRef<HubConnection | null>(null);

  const { currentUser, token } = useAuth();

  const recipientName = searchParams.get('recipient') ?? 'Chat';
  const recipientId = searchParams.get('recipientId') ?? '';

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Determine whether this chat partner is blocked by current user
  useEffect(() => {
    const loadBlocked = async () => {
      if (!recipientId || !currentUser) return;
      try {
        const res = await apiClient.get('/social/blocks');
        const blocks: any[] = res.data ?? [];
        setIsBlocked(blocks.some((b) => String(b.blockedId ?? b.BlockedId) === recipientId));
      } catch {
        // ignore
      }
    };
    loadBlocked();
  }, [recipientId, currentUser]);

  // Fetch initial chat history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await apiClient.get(`/messaging/chats/${params.id}/history`);
        setMessages(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Could not load chat', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (params.id) fetchHistory();
  }, [params.id]);

  // Setup SignalR connection (token is sent via accessTokenProvider because cookie is not sent cross-origin to the gateway)
  useEffect(() => {
    const chatId =
      typeof params.id === 'string'
        ? params.id
        : Array.isArray(params.id)
          ? params.id[0]
          : undefined;

    if (!chatId || !currentUser || !token || isBlocked) {
      setIsConnected(false);
      return;
    }

    const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:5001';
    const hubUrl = `${gatewayUrl}/friendnet/messaging/hubs/chat?chatId=${encodeURIComponent(chatId)}`;

    // Stop any previous connection before creating a new one (dev StrictMode / token refresh / route changes)
    if (connectionRef.current) {
      connectionRef.current.stop().catch(() => undefined);
      connectionRef.current = null;
    }

    let disposed = false;
    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        withCredentials: true,
        accessTokenFactory: () => Promise.resolve(token ?? ''),
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    // Handle incoming messages
    connection.on('ReceiveMessage', (message: Message) => {
      setMessages((prev) => {
        // Avoid duplicates - check if message already exists
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    // Handle connection state
    connection.onclose(() => setIsConnected(false));
    connection.onreconnecting(() => setIsConnected(false));
    connection.onreconnected(() => setIsConnected(true));

    // Start connection
    connection
      .start()
      .then(() => {
        if (!disposed) setIsConnected(true);
      })
      .catch((err) => {
        if (disposed) return;
        // Common in Next.js dev/StrictMode: cleanup stops the connection during start()
        const msg = String(err?.message ?? err);
        if (msg.includes('stopped during negotiation')) {
          setIsConnected(false);
          return;
        }
        console.error('SignalR connection error:', err);
        setIsConnected(false);
      });

    // Cleanup on unmount
    return () => {
      disposed = true;
      connection.stop().catch(() => undefined);
      connectionRef.current = null;
    };
  }, [params.id, currentUser, token, isBlocked]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !connectionRef.current || isBlocked) return;

    const messageData: Message = {
      // Important: server broadcasts back the DTO it received (not DB-generated Id),
      // so we must generate a stable Id client-side to avoid duplicates.
      id: uuidv4(),
      content: newMessage,
      senderId: currentUser.id,
      chatId: params.id?.toString() ?? '',
      timeStamp: new Date().toISOString(),
      isRead: false,
    };

    setNewMessage('');

    // Optimistic update - add message immediately.
    // Important: use the SAME id as messageData so when the server echoes it back
    // via ReceiveMessage, our dedupe-by-id keeps only one copy.
    setMessages((prev) => [...prev, messageData]);

    try {
      // Send via SignalR hub
      await connectionRef.current.invoke('SendMessage', { Message: messageData });
      // Note: The server will broadcast the real message back via ReceiveMessage,
      // which will replace the optimistic one (or we could remove the optimistic one here)
    } catch (err) {
      console.error('Message failed to send', err);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== messageData.id));
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center px-4 justify-between z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <User size={20} />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight">{recipientName}</h1>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${
              isConnected ? 'text-emerald-500' : 'text-slate-400'
            }`}>
              {isConnected ? 'Online' : 'Connecting...'}
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2 text-slate-400 hover:text-slate-600"
            aria-label="Chat options"
          >
          <MoreVertical size={20} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-100 rounded-2xl shadow-lg overflow-hidden">
              <button
                onClick={async () => {
                  setMenuOpen(false);
                  if (!recipientId) return;
                  if (!confirm(`Block ${recipientName}? You will no longer see this chat.`)) return;
                  try {
                    await apiClient.post('/social/blocks', { blockedId: recipientId });
                    setIsBlocked(true);
                    // Stop live connection and return to chats list (where it will be hidden)
                    await connectionRef.current?.stop().catch(() => undefined);
                    router.push('/chats');
                  } catch (err) {
                    console.error('Failed to block user', err);
                    alert('Failed to block user.');
                  }
                }}
                className="w-full px-4 py-3 text-sm font-semibold text-left hover:bg-slate-50 flex items-center gap-2"
              >
                <Ban size={16} className="text-red-500" />
                Block user
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto pt-20 pb-24 px-4 space-y-4 bg-slate-50/50">
        {isLoading ? (
          <div className="flex justify-center pt-10">
            <Loader2 className="animate-spin text-indigo-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 pt-16">
            <p className="text-sm font-medium">No messages yet.</p>
            <p className="text-xs">Say hi to {recipientName}!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm shadow-sm ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                  }`}
                >
                  <p className="leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-1 opacity-70 ${isMe ? 'text-right' : 'text-left'}`}>
                    {formatTime(msg.timeStamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollRef} />
      </main>

      {/* Input Bar */}
      <footer className="fixed bottom-0 w-full bg-white border-t border-slate-100 p-4 pb-8 sm:pb-4">
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-100 text-gray-600 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            disabled={!isConnected || isBlocked}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !isConnected || isBlocked}
            className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
        {isBlocked && (
          <div className="max-w-4xl mx-auto mt-2 text-xs text-red-600 font-semibold">
            You blocked this user. Unblock them by using “New Conversation” and connecting by username.
          </div>
        )}
      </footer>
    </div>
  );
}
