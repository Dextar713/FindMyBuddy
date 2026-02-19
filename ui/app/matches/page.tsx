'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Heart, User, Check, X, Loader2, RefreshCw,
  UserCheck, Shuffle, Clock, SlidersHorizontal, Zap,
} from 'lucide-react';
import apiClient from '@/lib/api_client';
import { useAuth } from '@/context/AuthContext';

interface MatchDto {
  id: string;
  type: 'FromFriend' | 'Random';
  status: 'Pending' | 'Accepted' | 'Rejected';
  user1Id: string;
  user2Id: string;
  user1Accepted: boolean;
  user2Accepted: boolean;
  user1UserName: string | null;
  user2UserName: string | null;
  createdAt: string;
}

function MatchTypeBadge({ type }: { type: MatchDto['type'] }) {
  if (type === 'FromFriend') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-violet-100 text-violet-600 rounded-full">
        <UserCheck size={10} /> Introduction
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full">
      <Shuffle size={10} /> Random
    </span>
  );
}

export default function MatchesPage() {
  const { currentUser } = useAuth();
  const router = useRouter();

  const [matches, setMatches] = useState<MatchDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ ok: boolean; msg: string } | null>(null);

  // Random match state
  const [isRandoming, setIsRandoming] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ minAge: '', maxAge: '' });
  const [randomError, setRandomError] = useState<string | null>(null);

  const fetchMatches = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await apiClient.get('/social/matching');
      const all: MatchDto[] = res.data ?? [];
      const pending = all.filter(
        (m) =>
          m.status === 'Pending' &&
          (m.user1Id === currentUser?.id || m.user2Id === currentUser?.id),
      );
      setMatches(pending);
    } catch (err) {
      console.error('Failed to load matches', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser) fetchMatches();
  }, [currentUser, fetchMatches]);

  // Random match
  const handleRandomMatch = async () => {
    setIsRandoming(true);
    setRandomError(null);
    try {
      const body: Record<string, number> = {};
      const min = parseInt(filters.minAge, 10);
      const max = parseInt(filters.maxAge, 10);
      if (!isNaN(min) && min > 0) body.minAge = min;
      if (!isNaN(max) && max > 0) body.maxAge = max;

      await apiClient.post('/social/matching/random', body);
      // Refresh the list so the new pending match appears immediately
      await fetchMatches(true);
      setToastMsg({ ok: true, msg: "A random buddy has been matched! They appear in your list below — accept to connect." });
    } catch (err: any) {
      const msg = err?.response?.data || 'No eligible users found with the current filters. Try broadening the age range.';
      setRandomError(msg);
    } finally {
      setIsRandoming(false);
    }
  };

  // Accept
  const handleAccept = async (match: MatchDto) => {
    setActionId(match.id);
    try {
      const res = await apiClient.post(`/social/matching/${match.id}/accept`);
      const bothAccepted =
        typeof res.data === 'string' ? res.data.includes('both') : !!res.data?.bothAccepted;

      setMatches((prev) => prev.filter((m) => m.id !== match.id));
      setToastMsg({
        ok: true,
        msg: bothAccepted
          ? '🎉 Both accepted! A new friendship and chat have been created. Check your chats!'
          : 'Accepted! Waiting for the other person to respond.',
      });
    } catch (err: any) {
      setToastMsg({ ok: false, msg: err?.response?.data || 'Could not accept the match. Please try again.' });
    } finally {
      setActionId(null);
    }
  };

  // Reject
  const handleReject = async (match: MatchDto) => {
    setActionId(match.id);
    try {
      await apiClient.post(`/social/matching/${match.id}/reject`);
      setMatches((prev) => prev.filter((m) => m.id !== match.id));
    } catch (err: any) {
      setToastMsg({ ok: false, msg: err?.response?.data || 'Could not decline the match.' });
    } finally {
      setActionId(null);
    }
  };

  const getOtherUserName = (match: MatchDto) =>
    match.user1Id === currentUser?.id
      ? (match.user2UserName ?? 'Unknown')
      : (match.user1UserName ?? 'Unknown');

  const getOtherId = (match: MatchDto) =>
    match.user1Id === currentUser?.id ? match.user2Id : match.user1Id;

  const iHaveAccepted = (match: MatchDto) =>
    match.user1Id === currentUser?.id ? match.user1Accepted : match.user2Accepted;

  if (!currentUser || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20 px-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 bg-white rounded-4xl animate-pulse flex gap-4 items-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-32 bg-slate-100 rounded" />
                <div className="h-3 w-48 bg-slate-50 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20 px-6 pb-10">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Heart size={24} className="text-indigo-600" />
              Matches
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Find a random buddy or accept an introduction from a friend.
            </p>
          </div>
          <button
            onClick={() => fetchMatches()}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Global toast */}
        {toastMsg && (
          <div
            className={`px-5 py-4 rounded-2xl text-sm font-medium flex items-start gap-3 ${
              toastMsg.ok
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                : 'bg-red-50 text-red-700 border border-red-100'
            }`}
          >
            <span className="flex-1">{toastMsg.msg}</span>
            {toastMsg.ok && toastMsg.msg.includes('chat') && (
              <button
                onClick={() => router.push('/chats')}
                className="shrink-0 text-xs font-bold underline"
              >
                Go to Chats
              </button>
            )}
            <button onClick={() => setToastMsg(null)} className="shrink-0 text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
        )}

        {/* ── Random Match card ── */}
        <section className="bg-linear-to-br from-indigo-600 to-violet-700 p-8 rounded-4xl shadow-xl shadow-indigo-200 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Zap size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Find a Random Buddy</h2>
              <p className="text-indigo-100 text-xs">
                The system picks someone new — not a friend, not blocked.
              </p>
            </div>
          </div>

          {/* Age filter toggle */}
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="mt-4 flex items-center gap-1.5 text-xs text-indigo-200 hover:text-white transition-colors"
          >
            <SlidersHorizontal size={13} />
            {showFilters ? 'Hide filters' : 'Age filter (optional)'}
          </button>

          {showFilters && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-indigo-200 mb-1">Min age</label>
                <input
                  type="number"
                  min={18}
                  max={99}
                  placeholder="e.g. 18"
                  value={filters.minAge}
                  onChange={(e) => setFilters({ ...filters, minAge: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-2xl outline-none focus:bg-white/20 transition-all placeholder:text-indigo-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] text-indigo-200 mb-1">Max age</label>
                <input
                  type="number"
                  min={18}
                  max={99}
                  placeholder="e.g. 40"
                  value={filters.maxAge}
                  onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-2xl outline-none focus:bg-white/20 transition-all placeholder:text-indigo-300 text-sm"
                />
              </div>
            </div>
          )}

          {randomError && (
            <p className="mt-3 text-xs text-red-200 bg-red-500/20 px-3 py-2 rounded-xl">
              {randomError}
            </p>
          )}

          <button
            onClick={handleRandomMatch}
            disabled={isRandoming}
            className="mt-5 w-full py-4 bg-white text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isRandoming ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <><Shuffle size={18} /> Match Me Randomly</>
            )}
          </button>
        </section>

        {/* ── Pending list header ── */}
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-slate-700">
            Pending ({matches.length})
          </h2>
          <p className="text-xs text-slate-400">Accept to start a friendship &amp; open a chat</p>
        </div>

        {/* ── Pending match cards ── */}
        {matches.length === 0 ? (
          <div className="bg-white rounded-4xl p-12 text-center shadow-sm border border-slate-100">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="text-indigo-300" size={32} />
            </div>
            <p className="text-slate-600 font-semibold">No pending matches</p>
            <p className="text-sm text-slate-400 mt-1">
              Hit the button above or wait for a friend to introduce you to someone.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
              const otherName = getOtherUserName(match);
              const otherId = getOtherId(match);
              const alreadyAccepted = iHaveAccepted(match);
              const isActioning = actionId === match.id;

              return (
                <div
                  key={match.id}
                  className="bg-white rounded-4xl shadow-sm border border-slate-100 p-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                      <User size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 truncate">{otherName}</h3>
                        <MatchTypeBadge type={match.type} />
                      </div>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Clock size={11} />
                        {new Date(match.createdAt).toLocaleDateString([], {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                      {alreadyAccepted && (
                        <p className="text-xs text-emerald-600 font-semibold mt-1">
                          ✓ You accepted — waiting for them
                        </p>
                      )}
                    </div>
                  </div>

                  {/* View profile */}
                  <button
                    onClick={() => router.push(`/profile/${otherId}`)}
                    className="mt-4 w-full text-xs text-indigo-600 font-semibold hover:underline text-left"
                  >
                    View profile →
                  </button>

                  {/* Accept / Decline */}
                  {!alreadyAccepted && (
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleAccept(match)}
                        disabled={isActioning}
                        className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isActioning
                          ? <Loader2 size={16} className="animate-spin" />
                          : <><Check size={16} /> Accept</>}
                      </button>
                      <button
                        onClick={() => handleReject(match)}
                        disabled={isActioning}
                        className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isActioning
                          ? <Loader2 size={16} className="animate-spin" />
                          : <><X size={16} /> Decline</>}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
