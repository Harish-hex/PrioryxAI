"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Users, Zap, MessageCircle, Copy, CheckCircle2, Trophy, Flame, Award } from "lucide-react";
import type { PeerMatch } from "@/lib/mcp/types";

interface UserProfile {
  connect_code?: string;
  display_name?: string;
}

interface Challenge {
  type: 'problem' | 'streak' | 'badge';
  label: string;
  desc: string;
  icon: React.ReactNode;
}

const CHALLENGE_TYPES: Challenge[] = [
  { type: 'problem', label: 'LeetCode Duel', desc: 'Same problem, fastest solve wins', icon: <Zap size={12} /> },
  { type: 'streak', label: 'Streak War', desc: '7-day coding streak challenge', icon: <Flame size={12} /> },
  { type: 'badge', label: 'Badge Race', desc: 'Earn a HackerRank badge first', icon: <Award size={12} /> },
];

export default function PeerMatchPage() {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<PeerMatch[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [connectCode, setConnectCode] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [connectResult, setConnectResult] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Challenge modal state
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState<PeerMatch | null>(null);
  const [challengeType, setChallengeType] = useState<'problem' | 'streak' | 'badge'>('problem');
  const [challengeTarget, setChallengeTarget] = useState('');
  const [challengeDeadline, setChallengeDeadline] = useState('');
  const [sendingChallenge, setSendingChallenge] = useState(false);

  useEffect(() => {
    // Load user's own profile (connect code)
    fetch('/api/career/collab/profile')
      .then((r) => r.json())
      .then((d) => { if (d.profile) setUserProfile(d.profile); })
      .catch(() => {});

    // Load peer matches
    fetch('/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: 'ai.matchPeerCollaborators', input: {} }),
    })
      .then((res) => {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) return;
        let buffer = '';
        const read = async (): Promise<void> => {
          const { done, value } = await reader.read();
          if (done) return;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.result?.matches) setMatches(data.result.matches);
              } catch {}
            }
          }
          return read();
        };
        return read();
      })
      .finally(() => setLoading(false));
  }, []);

  const createSession = async (peerId: string) => {
    const res = await fetch('/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'ai.facilitateRealTimeSession',
        input: { peerId, sessionType: 'pair_programming' },
      }),
    });
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) return;
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (line.startsWith('data: ') && line.includes('roomUrl')) {
          const data = JSON.parse(line.slice(6));
          if (data.result?.roomUrl) window.location.href = data.result.roomUrl;
        }
      }
    }
  };

  const copyCode = async () => {
    const code = userProfile?.connect_code ?? '';
    if (!code) return;
    await navigator.clipboard.writeText(code).catch(() => {});
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleConnectByCode = async () => {
    if (connectCode.length < 4) return;
    setConnecting(true);
    setConnectResult(null);
    try {
      const res = await fetch('/api/career/collab/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: connectCode.toUpperCase() }),
      });
      const data = await res.json();
      setConnectResult(res.ok ? `Connected with ${data.name ?? 'peer'}!` : (data.error ?? 'Code not found. Check and try again.'));
    } catch {
      setConnectResult('Network error. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const openChallengeModal = (peer: PeerMatch, type: 'problem' | 'streak' | 'badge') => {
    setSelectedPeer(peer);
    setChallengeType(type);
    setChallengeTarget('');
    setChallengeDeadline('');
    setShowChallengeModal(true);
  };

  const submitChallenge = async () => {
    if (!selectedPeer) return;
    setSendingChallenge(true);
    try {
      await fetch('/api/career/collab/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opponentId: selectedPeer.userId,
          challengeType,
          target: challengeTarget,
          deadline: challengeDeadline || null,
        }),
      });
      setShowChallengeModal(false);
    } catch {}
    finally { setSendingChallenge(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold flex items-center gap-3 mb-2">
          <Users className="text-violet-500" size={28} />
          Peer Collaboration
        </h1>
        <p className="text-slate-500 mb-8">
          Find peers with complementary skills for pair programming sessions
        </p>

        {/* ── Your Connect Code ── */}
        <div className="border border-blue-200 bg-blue-50 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-700 mb-1">Your Connect Code</p>
              <p className="text-4xl font-bold font-mono tracking-widest text-blue-900">
                {userProfile?.connect_code ?? '------'}
              </p>
              <p className="text-xs text-blue-600 mt-1">Share this with classmates so they can connect with you</p>
            </div>
            <button
              onClick={copyCode}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              {codeCopied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
              {codeCopied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
        </div>

        {/* ── Connect by Code ── */}
        <div className="border border-slate-200 rounded-xl p-5 mb-8">
          <h3 className="font-semibold text-slate-900 mb-3">Connect with a Peer</h3>
          <div className="flex gap-3">
            <input
              value={connectCode}
              onChange={(e) => setConnectCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="Enter peer's code (e.g. YUG4K2)"
              maxLength={6}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono uppercase tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              onClick={handleConnectByCode}
              disabled={connectCode.length < 4 || connecting}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-indigo-600 transition"
            >
              {connecting ? <Loader2 size={14} className="animate-spin" /> : 'Connect'}
            </button>
          </div>
          {connectResult && (
            <p className={`mt-2 text-sm ${connectResult.startsWith('Connected') ? 'text-green-600' : 'text-red-500'}`}>
              {connectResult}
            </p>
          )}
        </div>

        {/* ── Peer Matches ── */}
        <h2 className="text-lg font-semibold text-slate-900 mb-4">AI-Matched Peers</h2>
        <div className="space-y-4">
          {matches.map((peer, i) => (
            <motion.div
              key={peer.userId}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center gap-4">
                <div className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-lg font-bold text-white">
                  {peer.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-slate-900">{peer.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{peer.whyMatch}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Zap size={12} className="text-amber-500" />
                      Match: <strong className="text-slate-800">{peer.matchScore}%</strong>
                    </span>
                    <span>Readiness: <strong className="text-slate-800">{peer.placementScore}/100</strong></span>
                  </div>
                </div>

                <button
                  onClick={() => createSession(peer.userId)}
                  className="shrink-0 rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-600 transition inline-flex items-center gap-1.5"
                >
                  <MessageCircle size={14} /> Connect
                </button>
              </div>

              {/* Challenge buttons */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-2">Challenge this peer:</p>
                <div className="flex flex-wrap gap-2">
                  {CHALLENGE_TYPES.map((c) => (
                    <button
                      key={c.type}
                      onClick={() => openChallengeModal(peer, c.type)}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-indigo-300 transition text-slate-700"
                      title={c.desc}
                    >
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {matches.length === 0 && (
          <div className="text-center py-20">
            <Users size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No peer matches found yet.</p>
            <p className="text-slate-400 text-sm mt-1">Complete your profile to get matched with peers who have complementary skills.</p>
          </div>
        )}
      </div>

      {/* ── Challenge Modal ── */}
      {showChallengeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={20} className="text-amber-500" />
              <h3 className="font-semibold text-slate-900">
                Challenge {selectedPeer?.name}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Challenge Type</label>
                <div className="flex gap-2">
                  {CHALLENGE_TYPES.map((c) => (
                    <button
                      key={c.type}
                      onClick={() => setChallengeType(c.type)}
                      className={`flex-1 text-xs py-2 px-3 rounded-lg border font-medium transition ${
                        challengeType === c.type
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {challengeType === 'problem' && (
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">LeetCode Problem Slug</label>
                  <input
                    value={challengeTarget}
                    onChange={(e) => setChallengeTarget(e.target.value)}
                    placeholder="e.g. two-sum"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <p className="text-xs text-slate-400 mt-1">Both get notified. First to solve wins!</p>
                </div>
              )}

              {challengeType === 'streak' && (
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Streak Duration</label>
                  <select
                    value={challengeTarget}
                    onChange={(e) => setChallengeTarget(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">Select duration</option>
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                  </select>
                </div>
              )}

              {challengeType === 'badge' && (
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">HackerRank Badge Name</label>
                  <input
                    value={challengeTarget}
                    onChange={(e) => setChallengeTarget(e.target.value)}
                    placeholder="e.g. Problem Solving (Intermediate)"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Deadline (optional)</label>
                <input
                  type="datetime-local"
                  value={challengeDeadline}
                  onChange={(e) => setChallengeDeadline(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={submitChallenge}
                disabled={sendingChallenge || !challengeTarget}
                className="flex-1 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-600 disabled:opacity-50 transition"
              >
                {sendingChallenge ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Send Challenge'}
              </button>
              <button
                onClick={() => setShowChallengeModal(false)}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 text-slate-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
