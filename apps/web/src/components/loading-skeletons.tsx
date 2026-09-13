"use client";

export function LoadingLine({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-2xl ${className}`} />;
}

export function LoadingCard() {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-4">
        <div className="w-full space-y-3">
          <LoadingLine className="h-4 w-28" />
          <LoadingLine className="h-5 w-3/4" />
          <LoadingLine className="h-4 w-1/2" />
        </div>
        <LoadingLine className="h-10 w-20 shrink-0" />
      </div>
    </div>
  );
}
