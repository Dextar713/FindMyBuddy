'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Send, User, MoreVertical, Loader2 } from 'lucide-react';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
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

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

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
    if (!params.id || !currentUser) return;

    const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:5001';
    const hubUrl = `${gatewayUrl}/friendnet/messaging/hubs/chat?chatId=${params.id}`;

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        withCredentials: true,
        accessTokenFactory: () => Promise.resolve(token ?? ''),
      })
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
        setIsConnected(true);
      })
      .catch((err) => {
        console.error('SignalR connection error:', err);
        setIsConnected(false);
      });

    // Cleanup on unmount
    return () => {
      connection.stop().catch(console.error);
      connectionRef.current = null;
    };
  }, [params.id, currentUser, token]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !connectionRef.current) return;

    const messageData: Message = {
      id: '', // Server will generate the ID
      content: newMessage,
      senderId: currentUser.id,
      chatId: params.id?.toString() ?? '',
      timeStamp: new Date().toISOString(),
      isRead: false,
    };

    setNewMessage('');

    // Optimistic update - add message immediately
    const optimisticMessage: Message = {
      ...messageData,
      id: `temp-${Date.now()}`, // Temporary ID for optimistic update
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      // Send via SignalR hub
      await connectionRef.current.invoke('SendMessage', { Message: messageData });
      // Note: The server will broadcast the real message back via ReceiveMessage,
      // which will replace the optimistic one (or we could remove the optimistic one here)
    } catch (err) {
      console.error('Message failed to send', err);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
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
        <button className="p-2 text-slate-400 hover:text-slate-600">
          <MoreVertical size={20} />
        </button>
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
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !isConnected}
            className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      </footer>
    </div>
  );
}
