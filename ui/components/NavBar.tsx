'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { MessageSquare, User, Home, LogIn, UserPlus, LogOut, Heart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/lib/api_client';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, logout, currentUser } = useAuth();
  const [pendingMatchCount, setPendingMatchCount] = useState(0);

  // Fetch pending match count whenever the user is logged in
  useEffect(() => {
    if (!isLoggedIn || !currentUser) {
      setPendingMatchCount(0);
      return;
    }

    const fetchPendingCount = async () => {
      try {
        const res = await apiClient.get('/social/matching');
        const matches: any[] = res.data ?? [];
        const pending = matches.filter(
          (m) => m.status === 'Pending' && (m.user1Id === currentUser.id || m.user2Id === currentUser.id)
        );
        setPendingMatchCount(pending.length);
      } catch {
        // silent — not critical
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30_000);
    return () => clearInterval(interval);
  }, [isLoggedIn, currentUser]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
            <span className="text-white font-black text-sm">FYB</span>
          </div>
          <span className="font-bold text-slate-900 tracking-tight hidden sm:block">
            Find Your Buddy
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-1 sm:gap-4">
          {isLoggedIn ? (
            <>
              <NavLink href="/" icon={<Home size={18} />} label="Home" active={isActive('/')} />
              <NavLink href="/chats" icon={<MessageSquare size={18} />} label="Chats" active={isActive('/chats')} />
              {/* Matches link with pending badge */}
              <Link
                href="/matches"
                className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all
                  ${isActive('/matches')
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <Heart size={18} />
                <span className="hidden md:block">Matches</span>
                {pendingMatchCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {pendingMatchCount > 9 ? '9+' : pendingMatchCount}
                  </span>
                )}
              </Link>
              <NavLink href="/profile" icon={<User size={18} />} label="Profile" active={isActive('/profile')} />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
              >
                <LogOut size={18} />
                <span className="hidden xs:block">Logout</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
              >
                <LogIn size={18} />
                <span className="hidden xs:block">Login</span>
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
              >
                <UserPlus size={18} />
                <span>Join</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all
        ${active
          ? 'bg-indigo-50 text-indigo-600'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
      `}
    >
      {icon}
      <span className="hidden md:block">{label}</span>
    </Link>
  );
}
