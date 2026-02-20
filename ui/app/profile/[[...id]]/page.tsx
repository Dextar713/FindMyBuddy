'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { User, AlignLeft, ShieldCheck, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api_client';
import { useAuth, CurrentUser } from '@/context/AuthContext';

interface Profile {
  id: string;
  email: string;
  userName: string;
  description: string;
  age?: number;
}

export default function ProfilePage() {
  // Next 15/16: page `params` can be async in server components. Since this is a client page,
  // use the navigation hook instead to avoid the \"params is a Promise\" runtime error.
  const params = useParams();
  const { currentUser, setCurrentUser } = useAuth();
  const rawId = (params as any)?.id as string | string[] | undefined;
  const profileId = Array.isArray(rawId) ? rawId[0] : rawId;
  const isOwner = !profileId;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setPageLoading(true);
      try {
        if (isOwner) {
          // Own profile — use context (already seeded from localStorage)
          if (currentUser) {
            setProfile({
              id: currentUser.id,
              email: currentUser.email,
              userName: currentUser.userName,
              description: currentUser.description,
              age: currentUser.age,
            });
          }
        } else {
          // Another user's profile — fetch from API
          const res = await apiClient.get(`/users/${profileId}`);
          setProfile(res.data);
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setPageLoading(false);
      }
    };

    loadProfile();
  }, [profileId, currentUser]);

  const handleUpdate = async () => {
    if (!profile || !isOwner) return;
    setLoading(true);
    try {
      const res = await apiClient.patch(`/users/edit/${profile.id}`, {
        userName: profile.userName,
        description: profile.description,
        email: profile.email,
        age: profile.age,
      });
      // Keep context and localStorage in sync
      setCurrentUser(res.data as CurrentUser);
      alert('Profile updated!');
    } catch (err) {
      console.error('Update failed', err);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-6">
        <div className="max-w-2xl mx-auto bg-white rounded-4xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="h-32 bg-linear-to-r from-indigo-500 to-purple-500" />
          <div className="p-12 text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-24 h-24 bg-slate-100 rounded-3xl mb-4" />
              <div className="h-4 w-32 bg-slate-100 rounded mb-2" />
              <div className="h-3 w-48 bg-slate-50 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-4xl shadow-sm border border-slate-100 overflow-hidden">

        {/* Header Decoration */}
        <div className="h-32 bg-linear-to-r from-indigo-500 to-purple-500" />

        {!profile ? (
          <div className="p-12 text-center text-slate-500">User not found.</div>
        ) : (
          <div className="p-8 -mt-12">
            {/* Avatar */}
            <div className="w-24 h-24 bg-white rounded-3xl shadow-md flex items-center justify-center mb-6 border-4 border-white">
              <User className="w-12 h-12 text-slate-300" />
            </div>

            <h1 className="text-3xl font-bold text-slate-900 mb-1">
              {isOwner ? 'Your Profile' : profile.userName}
            </h1>
            <p className="text-slate-500 mb-8">
              {isOwner ? 'Manage your public presence and account settings.' : 'Find Your Buddy Member'}
            </p>

            <div className="space-y-6">
              {/* Username */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Username</label>
                {isOwner ? (
                  <input
                    value={profile.userName}
                    onChange={(e) => setProfile({ ...profile, userName: e.target.value })}
                    className="w-full mt-2 p-4 bg-slate-50 text-black rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                ) : (
                  <p className="mt-2 p-4 bg-slate-50 rounded-2xl font-medium text-slate-700">@{profile.userName}</p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Bio</label>
                {isOwner ? (
                  <textarea
                    value={profile.description}
                    onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                    rows={4}
                    className="w-full mt-2 p-4 bg-slate-50 text-black rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                    placeholder="Tell people about yourself..."
                  />
                ) : (
                  <p className="mt-2 p-4 bg-slate-50 rounded-2xl text-slate-600 leading-relaxed italic">
                    &quot;{profile.description || "This user hasn't added a bio yet."}&quot;
                  </p>
                )}
              </div>

              {/* Owner-only section */}
              {isOwner && (
                <div className="pt-6 border-t border-slate-100 space-y-6">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email (Private)</label>
                    <div className="mt-2 p-4 bg-slate-100 text-slate-400 rounded-2xl cursor-not-allowed flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> {profile.email}
                    </div>
                  </div>

                  <button
                    onClick={handleUpdate}
                    disabled={loading}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
