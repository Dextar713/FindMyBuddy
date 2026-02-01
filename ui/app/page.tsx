'use client';

import React from 'react';
import { Zap, Shield, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold tracking-tighter italic text-indigo-600">FindYourBuddy</div>
        <button onClick={() => router.push("/register")}
          className="px-5 py-2 rounded-full border border-slate-200 hover:bg-slate-50 transition-all text-sm font-medium">
          Register
        </button>
        <button onClick={() => router.push("/login")}
          className="px-5 py-2 rounded-full border border-slate-200 hover:bg-slate-50 transition-all text-sm font-medium">
          Login
        </button>
      </nav>

      {/* Hero Section */}
      <header className="max-w-4xl mx-auto text-center pt-20 pb-16 px-6">
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-6 bg-linear-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
          Connect without the noise.
        </h1>
        <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          The minimalist matching platform for meaningful friendships. Fast, private, and focused on what matters: your next great conversation.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-semibold hover:bg-indigo-700 hover:scale-[1.02] transition-all shadow-lg shadow-indigo-200">
            Start Matching - It's Free
          </button>
          <button className="px-8 py-4 bg-slate-100 text-slate-700 rounded-2xl font-semibold hover:bg-slate-200 transition-all">
            See how it works
          </button>
        </div>
      </header>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-8">
        <FeatureCard 
          icon={<Zap className="w-6 h-6 text-amber-500" />}
          title="Instant Matching"
          description="Our algorithm prioritizes shared interests and speed, getting you to the chat faster."
        />
        <FeatureCard 
          icon={<Shield className="w-6 h-6 text-emerald-500" />}
          title="Privacy First"
          description="Zero tracking, zero ads. Your data belongs to you, and your conversations stay private."
        />
        <FeatureCard 
          icon={<MessageCircle className="w-6 h-6 text-indigo-500" />}
          title="Minimalist Chat"
          description="A distraction-free messaging experience designed for real human connection."
        />
      </section>

      {/* Social Proof / Teaser */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl font-bold mb-4">Building a better social feed.</h2>
          <p className="text-slate-600 mb-8">No infinite scrolls, no doom-scrolling. Just updates from people you actually care about.</p>
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 max-w-md mx-auto">
             <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">A</div>
             <div className="text-left">
                <p className="font-bold text-sm">Alex just posted an update</p>
                <p className="text-xs text-slate-400">2 minutes ago • San Francisco</p>
             </div>
          </div>
        </div>
      </section>

      <footer className="py-12 text-center text-slate-400 text-sm">
        © 2026 FindYourBuddy. Less scrolling, more living.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl border border-slate-100 bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50/50 transition-all group">
      <div className="mb-4 p-3 bg-slate-50 rounded-2xl w-fit group-hover:bg-indigo-50 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}