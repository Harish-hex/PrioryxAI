"use client";

import React, { useMemo } from 'react';

export function ContributionHeatmap({ calendarString }: { calendarString: string }) {
  const data = useMemo(() => {
    try {
      const parsed = JSON.parse(calendarString || '{}');
      // Format is { "timestamp": count }
      return parsed as Record<string, number>;
    } catch {
      return {};
    }
  }, [calendarString]);

  // Construct a 52x7 grid
  // In a real scenario we'd align exactly to the last 365 days. 
  // For simplicity, we'll build a fixed grid of 52 weeks (cols) x 7 days (rows)
  const cols = 52;
  const rows = 7;
  const cellSize = 12;
  const gap = 3;

  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 364 * 24 * 60 * 60 * 1000);
  oneYearAgo.setHours(0,0,0,0);

  const cells = [];
  const currentDate = new Date(oneYearAgo);

  for (let c = 0; c < cols; c++) {
    const colCells = [];
    for (let r = 0; r < rows; r++) {
      const ts = Math.floor(currentDate.getTime() / 1000).toString();
      const count = data[ts] || 0;
      
      let fill = '#27272a'; // gray
      if (count > 0 && count <= 2) fill = '#064e3b'; // very dark green
      else if (count > 2 && count <= 5) fill = '#047857';
      else if (count > 5) fill = '#10b981';

      colCells.push(
        <rect
          key={`${c}-${r}`}
          x={c * (cellSize + gap)}
          y={r * (cellSize + gap)}
          width={cellSize}
          height={cellSize}
          fill={fill}
          rx={2}
          ry={2}
          className="transition-colors hover:stroke-white hover:stroke-1"
        >
          <title>{`${count} submissions on ${currentDate.toDateString()}`}</title>
        </rect>
      );
      currentDate.setDate(currentDate.getDate() + 1);
    }
    cells.push(<g key={c}>{colCells}</g>);
  }

  return (
    <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
      <svg width={cols * (cellSize + gap)} height={rows * (cellSize + gap)} className="mx-auto">
        {cells}
      </svg>
    </div>
  );
}
