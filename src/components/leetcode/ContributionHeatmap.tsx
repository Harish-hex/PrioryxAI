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

  // LeetCode's `calendarString` keys are UTC-day epoch-second timestamps
  // (midnight UTC). Bucketing with local-timezone midnight caused off-by-one-day
  // cells for any user not in UTC — so every date here is computed in UTC.
  const rows = 7;
  const cellSize = 12;
  const gap = 3;
  const DAY_MS = 24 * 60 * 60 * 1000;

  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const rangeStartUtc = todayUtc - 364 * DAY_MS;

  // Align the grid's first column to the actual weekday (Sun=0) of the start
  // date, like GitHub's heatmap, instead of assuming a fixed offset.
  const startWeekday = new Date(rangeStartUtc).getUTCDay();
  const gridStartUtc = rangeStartUtc - startWeekday * DAY_MS;
  const totalDays = Math.ceil((todayUtc - gridStartUtc) / DAY_MS) + 1;
  const cols = Math.ceil(totalDays / rows);

  const cells = [];
  let cursorUtc = gridStartUtc;

  for (let c = 0; c < cols; c++) {
    const colCells = [];
    for (let r = 0; r < rows; r++) {
      const cellDate = new Date(cursorUtc);
      const ts = Math.floor(cursorUtc / 1000).toString();
      const count = data[ts] || 0;
      const isFuture = cursorUtc > todayUtc;

      let fill = '#27272a'; // gray
      if (!isFuture) {
        if (count > 0 && count <= 2) fill = '#064e3b'; // very dark green
        else if (count > 2 && count <= 5) fill = '#047857';
        else if (count > 5) fill = '#10b981';
      }

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
          opacity={isFuture ? 0 : 1}
          className="transition-colors hover:stroke-white hover:stroke-1"
        >
          {!isFuture && <title>{`${count} submissions on ${cellDate.toDateString()}`}</title>}
        </rect>
      );
      cursorUtc += DAY_MS;
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
