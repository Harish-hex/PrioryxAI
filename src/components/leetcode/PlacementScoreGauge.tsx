"use client";

import React from 'react';
import { motion } from 'framer-motion';

export function PlacementScoreGauge({ score, label }: { score: number, label?: string }) {
  // Normalize score between 0 and 100
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  
  // Calculate color based on score
  let color = '#ef4444'; // red (<40)
  if (normalizedScore >= 40 && normalizedScore < 60) color = '#f97316'; // orange
  if (normalizedScore >= 60 && normalizedScore < 75) color = '#eab308'; // yellow
  if (normalizedScore >= 75) color = '#22c55e'; // green

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative w-48 h-48 mx-auto">
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 140 140">
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          className="text-slate-200 dark:text-white/10"
        />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          stroke={color}
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-bold text-slate-900 dark:text-white tracking-tighter">{Math.round(normalizedScore) || 0}</span>
        <span className="text-xs text-slate-500 dark:text-white/50 uppercase font-medium">/ 100</span>
      </div>
      {label && (
        <div className="mt-4 text-center">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 dark:bg-white/5 border" style={{ borderColor: color, color }}>
            {label.replace('_', ' ')}
          </span>
        </div>
      )}
    </div>
  );
}
