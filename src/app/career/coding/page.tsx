"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { LeetCodeConnectCard } from "@/components/leetcode/LeetCodeConnectCard";
import { StreamSelector } from "@/components/leetcode/StreamSelector";
import { UserStream, LeetCodeProfile } from "@/lib/leetcode/types";
import { Loader2, ArrowRight, Code2, LineChart, Target, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LeetCodeDashboard() {
  const [profile, setProfile] = useState<LeetCodeProfile | null>(null);
  const [score, setScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  // Connection Form State
  const [username, setUsername] = useState("");
  const [stream, setStream] = useState<UserStream>("SDE");
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const res = await fetch('/api/leetcode/profile');
      const { data } = await res.json();

      if (data && data.profile_data) {
        setProfile(data.profile_data as LeetCodeProfile);
        setScore(data.placement_readiness_score);
        setUsername(data.leetcode_username);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleConnect = async () => {
    if (!username.trim()) return;
    setConnecting(true);
    setError("");

    try {
      const res = await fetch('/api/leetcode/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, stream, targetCompanies })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to connect');
      
      setProfile(data.profile);
      setScore(data.quickScore);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/leetcode/sync', { method: 'POST', body: JSON.stringify({ stream }) });
      const data = await res.json();
      if (!res.ok) {
        if (data.rateLimited) {
          alert(`Rate limited. Try again in ${Math.ceil(data.nextSyncIn / 60)} minutes.`);
        } else {
          throw new Error(data.error);
        }
      } else {
        setProfile(data.profile);
        setScore(data.score);
      }
    } catch (err: any) {
      alert("Failed to sync: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Connect Your Coding Profile</h1>
          <p className="text-slate-600">Link your LeetCode account to unlock deep AI analysis, personalized study plans, and placement readiness tracking.</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-900/70 mb-2">LeetCode Username</label>
              <input
                type="text"
                placeholder="e.g. neetcode"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            
            <StreamSelector 
              stream={stream} 
              setStream={setStream} 
              targetCompanies={targetCompanies} 
              setTargetCompanies={setTargetCompanies} 
            />

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleConnect}
              disabled={connecting || !username}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {connecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Connecting & Analysing...
                </>
              ) : (
                'Connect & Analyse'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-slate-900">Coding Profile Intelligence</h1>
      </div>

      <LeetCodeConnectCard 
        profile={profile} 
        score={score} 
        onSync={handleSync}
        syncing={syncing}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => router.push('/career/coding/analysis')}
          className="bg-slate-50 border border-slate-200 rounded-2xl p-6 cursor-pointer hover:bg-slate-100 hover:border-indigo-500/50 transition-all group"
        >
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
            <LineChart className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2 flex justify-between">
            Deep Analysis
            <ArrowRight className="w-5 h-5 text-slate-900/20 group-hover:text-indigo-400 transition-colors" />
          </h3>
          <p className="text-sm text-slate-500">View your detailed SWOT analysis, skill radar, contest trends, and AI-generated roadmap.</p>
        </div>

        <div 
          onClick={() => router.push('/career/coding/study-plan')}
          className="bg-slate-50 border border-slate-200 rounded-2xl p-6 cursor-pointer hover:bg-slate-100 hover:border-emerald-500/50 transition-all group"
        >
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2 flex justify-between">
            Study Plan
            <ArrowRight className="w-5 h-5 text-slate-900/20 group-hover:text-emerald-400 transition-colors" />
          </h3>
          <p className="text-sm text-slate-500">Access your personalized problem set generated by AI to fill your specific skill gaps.</p>
        </div>

        <div 
          onClick={() => router.push('/career/coding/progress')}
          className="bg-slate-50 border border-slate-200 rounded-2xl p-6 cursor-pointer hover:bg-slate-100 hover:border-orange-500/50 transition-all group"
        >
          <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400 mb-4 group-hover:scale-110 transition-transform">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2 flex justify-between">
            Progress Tracking
            <ArrowRight className="w-5 h-5 text-slate-900/20 group-hover:text-orange-400 transition-colors" />
          </h3>
          <p className="text-sm text-slate-500">Monitor your daily streak, completion rates, and overall placement readiness timeline.</p>
        </div>
      </div>
    </div>
  );
}
