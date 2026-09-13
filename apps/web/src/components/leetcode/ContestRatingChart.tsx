"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ContestHistory } from '@/lib/leetcode/types';

export function ContestRatingChart({ history }: { history: ContestHistory[] }) {
  if (!history || history.length === 0) return null;

  // Ensure data is sorted by time
  const data = [...history]
    .filter(h => h.attended)
    .sort((a, b) => a.contest.startTime - b.contest.startTime)
    .map(h => ({
      name: h.contest.title,
      rating: Math.round(h.rating),
      date: new Date(h.contest.startTime * 1000).toLocaleDateString()
    }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="name" 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} 
            tickFormatter={(value) => value.replace('Weekly Contest ', 'W').replace('Biweekly Contest ', 'B')} 
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} 
            domain={['auto', 'auto']}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
            labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
          />
          <Line 
            type="monotone" 
            dataKey="rating" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
