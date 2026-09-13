"use client";

import { PriorityTopic } from "@/lib/leetcode/types";

export function PriorityTopicTable({ topics }: { topics: PriorityTopic[] }) {
  if (!topics || topics.length === 0) return null;

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'CRITICAL': return 'text-red-400 bg-red-400/10';
      case 'HIGH': return 'text-orange-400 bg-orange-400/10';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-400/10';
      default: return 'text-green-400 bg-green-400/10';
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase text-white/40">
            <th className="pb-3 pr-4 font-semibold">Topic</th>
            <th className="pb-3 pr-4 font-semibold">Priority</th>
            <th className="pb-3 pr-4 font-semibold">Level Gap</th>
            <th className="pb-3 font-semibold w-1/2">AI Rationale</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {topics.map((t, i) => (
            <tr key={i} className="border-b border-white/5 hover:bg-white/5">
              <td className="py-3 pr-4 text-white/90 font-medium capitalize">{t.topic.replace(/-/g, ' ')}</td>
              <td className="py-3 pr-4">
                <span className={`text-[10px] px-2 py-1 rounded font-bold tracking-wider ${getPriorityColor(t.priority)}`}>
                  {t.priority}
                </span>
              </td>
              <td className="py-3 pr-4">
                <div className="flex items-center text-xs">
                  <span className="text-white/40">{t.current_level}</span>
                  <span className="mx-2 text-white/20">→</span>
                  <span className="text-white/90">{t.target_level}</span>
                </div>
              </td>
              <td className="py-3 text-white/60 text-xs">
                {t.reason}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
