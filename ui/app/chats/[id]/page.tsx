'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, User, MoreVertical, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api_client';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timeStamp: string;
	chatId: string;
	isRead: boolean;
}

export default function SingleChatPage() {
  const params = useParams();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipient, setRecipient] = useState({ name: 'Loading...', id: '' });
  const [currentUserId, setCurrentUserId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // 1. Get current user from localstorage and fetch chat history
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUserId(storedUser.id);

    const fetchChatData = async () => {
      try {
        // Fetch specific chat history using the ID from URL
        const data: any = await apiClient.get(`/messaging/chats/${params.id}/history`);
				console.log(data);
        setMessages(data.data);
        setRecipient({ name: data.recipientName, id: data.recipientId });
      } catch (err) {
        console.error("Could not load chat", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChatData();
  }, [params.id]);

	useEffect(() => {
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			setUser(JSON.parse(storedUser));
		}
	}, []);

  // 2. Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const textToSend = newMessage;
    setNewMessage(''); // Clear input immediately for "fast" feel

    try {
			const messageData: Message = {
        content: textToSend,
        senderId: user.id,
        id: uuidv4(),
        chatId: params.id?.toString() || '',
        timeStamp: new Date().toISOString(),
        isRead: true
      }
      const sentData: any = await apiClient.post(`/messaging/chats/send`, messageData);
      setMessages([...messages, messageData]); // Append new message
    } catch (err) {
      console.error("Message failed to send");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center px-4 justify-between z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold">
            <User size={20} />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight">{recipient.name}</h1>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Online</p>
          </div>
        </div>
        <button className="p-2 text-slate-400 hover:text-slate-600">
          <MoreVertical size={20} />
        </button>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto pt-20 pb-24 px-4 space-y-4 bg-slate-50/50">
        {isLoading ? (
          <div className="flex justify-center pt-10"><Loader2 className="animate-spin text-indigo-600" /></div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`
                  max-w-[75%] px-4 py-3 rounded-2xl text-sm shadow-sm
                  ${isMe 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}
                `}>
                  <p className="leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-1 opacity-70 ${isMe ? 'text-right' : 'text-left'}`}>
                    {msg.timeStamp}
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
          />
          <button 
            type="submit"
            className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
            disabled={!newMessage.trim()}
          >
            <Send size={18} />
          </button>
        </form>
      </footer>
    </div>
  );
}