import { Loader2 } from "lucide-react";

export default function StudyRoomLoading() {
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={24} className="animate-spin text-slate-400" />
    </div>
  );
}
