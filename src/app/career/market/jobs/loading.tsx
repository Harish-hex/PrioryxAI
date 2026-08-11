import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center p-6 space-y-4">
      <Loader2 size={32} className="animate-spin text-indigo-400" />
      <p className="text-slate-500 font-medium">Loading Job Market...</p>
    </div>
  );
}
