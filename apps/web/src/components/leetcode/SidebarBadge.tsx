"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Code2 } from "lucide-react";

export function SidebarLeetCodeBadge({ collapsed }: { collapsed: boolean }) {
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    async function fetchScore() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from('leetcode_profiles')
        .select('placement_readiness_score')
        .eq('user_id', user.id)
        .single();
        
      if (data) {
        setScore(data.placement_readiness_score);
      }
    }
    fetchScore();
  }, []);

  if (score === null) return null;

  let color = 'bg-red-500';
  if (score >= 40 && score < 60) color = 'bg-orange-500';
  if (score >= 60 && score < 75) color = 'bg-yellow-500';
  if (score >= 75) color = 'bg-emerald-500';

  if (collapsed) {
    return (
      <div className="flex justify-center mb-2">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600">
          <Code2 size={14} />
          <span className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-full ${color} border-2 border-white`} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 mb-2">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs font-semibold text-slate-600">LC Score:</span>
      <span className="text-xs font-bold text-slate-900 ml-auto">{score}/100</span>
    </div>
  );
}
