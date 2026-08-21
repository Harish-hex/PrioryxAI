"use client";

import { LeetCodeProfile } from "@/lib/leetcode/types";
import { PlacementScoreGauge } from "./PlacementScoreGauge";
import { RefreshCw, ExternalLink } from "lucide-react";
import Image from "next/image";

export function LeetCodeConnectCard({
  profile,
  score,
  onSync,
  syncing
}: {
  profile: LeetCodeProfile;
  score: number;
  onSync: () => void;
  syncing: boolean;
}) {
  return (
    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 relative z-10">
        
        {/* Profile Info */}
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 relative rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden bg-slate-800 flex items-center justify-center">
            {profile.avatar ? (
              <Image 
                src={profile.avatar} 
                alt={profile.username}
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : (
              <span className="text-3xl font-black text-indigo-400">
                {profile.username?.slice(0, 2).toUpperCase() || 'LC'}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{profile.name || profile.username}</h2>
            <a 
              href={`https://leetcode.com/${profile.username}`} 
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1 mb-4 transition-colors"
            >
              @{profile.username} <ExternalLink className="w-3 h-3" />
            </a>
            
            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-white/70">
              <div>
                <span className="block text-xs text-slate-400 dark:text-white/40 uppercase tracking-wider mb-0.5">Ranking</span>
                <span className="font-semibold text-slate-800 dark:text-white/90">{profile.ranking?.toLocaleString() || 'N/A'}</span>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />
              <div>
                <span className="block text-xs text-slate-400 dark:text-white/40 uppercase tracking-wider mb-0.5">Reputation</span>
                <span className="font-semibold text-slate-800 dark:text-white/90">{profile.reputation?.toLocaleString() || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Score Gauge */}
        <div className="flex flex-col items-center">
          <PlacementScoreGauge score={score} label="Placement Readiness" />
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex justify-end">
        <button
          onClick={onSync}
          disabled={syncing}
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 px-4 py-2 rounded-lg"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync LeetCode Data'}
        </button>
      </div>
    </div>
  );
}
