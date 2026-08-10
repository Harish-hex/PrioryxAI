'use client';

import { ExamEntry } from '@/lib/schedule/extractor';

export function ExamPreview({ entries, onClear }: { entries: ExamEntry[], onClear: () => void }) {
  const sortedEntries = [...entries].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <div className="mt-4">
      <div className="space-y-3">
        {sortedEntries.map((entry, i) => {
          const typeIcon = entry.type === "exam" ? "EXAM" : entry.type === "assignment" ? "ASSIGNMENT" : "EVENT";
          const priorityColor = entry.priority === "high" 
            ? "border-l-red-500" 
            : entry.priority === "medium" 
            ? "border-l-amber-500" 
            : "border-l-emerald-500";
            
          const dateStr = entry.date
            ? new Date(entry.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
            : "No Date";

          return (
            <div key={i} className={`flex items-start gap-3 rounded-[16px] border border-slate-200 bg-white border-l-[4px] p-4 ${priorityColor}`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-snug text-slate-950">{entry.title}</p>
                  <span className="shrink-0 tabular-nums text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                    {dateStr}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                  {entry.subject && (
                    <span className="text-xs text-slate-500 font-medium">{entry.subject}</span>
                  )}
                  {(entry.startTime || entry.endTime) && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      • {entry.startTime || '?'} - {entry.endTime || '?'}
                    </span>
                  )}
                  {entry.location && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      • {entry.location}
                    </span>
                  )}
                  <span className="capitalize rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 ml-auto">
                    {entry.type}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 flex justify-end">
        <button 
          onClick={onClear}
          className="text-xs text-slate-500 hover:text-slate-800 underline-offset-2 hover:underline"
        >
          Clear & re-upload
        </button>
      </div>
    </div>
  );
}
