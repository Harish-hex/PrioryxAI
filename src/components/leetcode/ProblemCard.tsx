"use client";

import { CheckCircle, ExternalLink, ShieldAlert, AlertTriangle, Zap, Check } from "lucide-react";
import { useState } from "react";
import { ProblemRecommendation } from "@/lib/leetcode/types";

export function ProblemCard({
  problem,
  onComplete
}: {
  problem: ProblemRecommendation;
  onComplete: (slug: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (problem.completed) return;
    setLoading(true);
    await onComplete(problem.problem_slug);
    setLoading(false);
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff.toUpperCase()) {
      case 'EASY': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'HARD': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-800 border-gray-700';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return <ShieldAlert className="w-3 h-3 text-red-500 mr-1" />;
      case 'HIGH': return <AlertTriangle className="w-3 h-3 text-orange-500 mr-1" />;
      case 'MEDIUM': return <Zap className="w-3 h-3 text-yellow-500 mr-1" />;
      default: return null;
    }
  };

  return (
    <div className={`p-4 rounded-xl border transition-all ${problem.completed ? 'border-green-500/30 bg-green-500/5 opacity-70' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider flex items-center ${getDifficultyColor(problem.difficulty)}`}>
              {problem.difficulty}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-white/10 bg-white/5 text-white/70 uppercase tracking-wider flex items-center">
              {getPriorityIcon(problem.priority)}
              {problem.priority}
            </span>
          </div>
          <h3 className="font-semibold text-white/90 line-clamp-1" title={problem.problem_title}>
            {problem.problem_title}
          </h3>
        </div>
        
        <button
          onClick={handleComplete}
          disabled={problem.completed || loading}
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            problem.completed 
              ? 'bg-green-500 text-white' 
              : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/90 hover:bg-white/10'
          }`}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : problem.completed ? (
            <Check className="w-4 h-4" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
        </button>
      </div>

      <p className="text-sm text-white/50 mb-4 line-clamp-2" title={problem.why_this_problem}>
        {problem.why_this_problem}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded">
            {problem.topic}
          </span>
          {problem.company_tags?.slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] bg-white/5 text-white/40 px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
          {(problem.company_tags?.length || 0) > 2 && (
            <span className="text-[10px] bg-white/5 text-white/40 px-2 py-0.5 rounded">
              +{problem.company_tags.length - 2}
            </span>
          )}
        </div>
        
        <a 
          href={`https://leetcode.com/problems/${problem.problem_slug}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/40 hover:text-indigo-400 transition-colors p-1"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
