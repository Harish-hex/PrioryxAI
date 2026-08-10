"use client";

import { useState } from "react";
import { UserStream } from "@/lib/leetcode/types";

const STREAMS: { value: UserStream; label: string }[] = [
  { value: 'SDE', label: 'Software Engineering (SDE)' },
  { value: 'ML_AI', label: 'Machine Learning & AI' },
  { value: 'DATA_SCIENCE', label: 'Data Science' },
  { value: 'FRONTEND', label: 'Frontend Engineering' },
  { value: 'BACKEND', label: 'Backend Engineering' },
  { value: 'FULLSTACK', label: 'Full Stack Engineering' },
  { value: 'COMPETITIVE', label: 'Competitive Programming' },
  { value: 'CS_GENERAL', label: 'Computer Science (General)' }
];

const COMPANIES = [
  'Google', 'Meta', 'Amazon', 'Microsoft', 'Apple', 'Netflix',
  'Stripe', 'Uber', 'Airbnb', 'Flipkart', 'Swiggy', 'Zomato',
  'Atlassian', 'Adobe', 'Goldman Sachs', 'JPMorgan', 'Bloomberg'
];

export function StreamSelector({
  stream,
  setStream,
  targetCompanies,
  setTargetCompanies
}: {
  stream: UserStream;
  setStream: (s: UserStream) => void;
  targetCompanies: string[];
  setTargetCompanies: (c: string[]) => void;
}) {
  const [search, setSearch] = useState("");

  const toggleCompany = (c: string) => {
    if (targetCompanies.includes(c)) {
      setTargetCompanies(targetCompanies.filter(x => x !== c));
    } else {
      setTargetCompanies([...targetCompanies, c]);
    }
  };

  const filteredCompanies = COMPANIES.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Target Stream</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {STREAMS.map(s => (
            <button
              key={s.value}
              onClick={() => setStream(s.value)}
              className={`px-4 py-3 rounded-lg text-sm font-medium text-left transition-colors border ${
                stream === s.value 
                  ? 'bg-indigo-100 border-indigo-500 text-indigo-700' 
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Target Companies <span className="text-slate-400 font-normal">({targetCompanies.length} selected)</span>
        </label>
        <input
          type="text"
          placeholder="Search companies..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm mb-3 focus:outline-none focus:border-indigo-500"
        />
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
          {filteredCompanies.map(c => (
            <button
              key={c}
              onClick={() => toggleCompany(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                targetCompanies.includes(c)
                  ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
