"use client";

export function LoadingLine({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

export function LoadingCard() {
  return (
    <div className="glass rounded-lg p-4">
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
