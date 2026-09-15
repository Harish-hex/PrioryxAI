"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { RoomBrowser } from "@/components/collab/rooms/RoomBrowser";

export default function StudyRoomsPage() {
  return (
    <div className="space-y-6">
      <header className="neu-card rounded-[28px] p-6 sm:p-7">
        <Link
          href="/career/collab/match"
          className="neu-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300"
        >
          <ChevronLeft size={13} /> Back to Collab
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
          Study Rooms
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Focused, real-time sessions with peers — DSA sprints, project reviews, mock interviews, and accountability check-ins.
        </p>
      </header>

      <RoomBrowser />
    </div>
  );
}
