'use client';

import { TimetableEntry } from '@/lib/schedule/extractor';

export function TimetablePreview({ entries, onClear }: { entries: TimetableEntry[], onClear: () => void }) {
  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const sortedEntries = [...entries].sort((a, b) => {
    const dayA = daysOrder.indexOf(a.day);
    const dayB = daysOrder.indexOf(b.day);
    if (dayA !== dayB) return dayA - dayB;
    if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
    return 0;
  });

  return (
    <div className="mt-4">
      <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-100 bg-slate-50/50 text-xs text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Day</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedEntries.map((entry, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-950">{entry.day}</td>
                  <td className="px-4 py-3">{entry.subject}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{entry.startTime || '-'} to {entry.endTime || '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{entry.location || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="capitalize rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 border border-slate-200">
                      {entry.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
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
