"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CreateRoomForm } from "@/components/collab/rooms/CreateRoomForm";

export default function NewStudyRoomPage() {
  return (
    <div className="space-y-6">
      <header className="neu-card rounded-[28px] p-6 sm:p-7">
        <Link
          href="/career/collab/rooms"
          className="neu-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300"
        >
          <ChevronLeft size={13} /> Back to Study Rooms
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
          New Study Room
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Give it a clear purpose — peers join rooms with a stated focus far more often than open-ended lounges.
        </p>
      </header>

      <CreateRoomForm />
    </div>
  );
}
