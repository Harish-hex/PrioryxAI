"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface TopicRadarChartProps {
  topics: Array<{ topic: string; score: number; max: number }>;
}

export function TopicRadarChart({ topics }: TopicRadarChartProps) {
  if (!topics || topics.length === 0) return null;

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={topics}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis dataKey="topic" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
            itemStyle={{ color: '#818cf8' }}
          />
          <Radar name="Mastery" dataKey="score" stroke="#818cf8" fill="#818cf8" fillOpacity={0.5} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
