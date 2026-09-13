"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "card" | "avatar" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = "text",
  width,
  height,
  ...props
}: SkeletonProps) {
  const baseStyles = "animate-pulse bg-muted rounded";

  const variantStyles = {
    text: "h-4 w-full",
    card: "h-32 w-full rounded-xl",
    avatar: "rounded-full",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      style={{ width, height }}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className, ...props }: { lines?: number } & Omit<SkeletonProps, "variant">) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" width={i === lines - 1 ? "60%" : "100%"} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className, ...props }: Omit<SkeletonProps, "variant">) {
  return (
    <div className={cn("space-y-4 p-4", className)} {...props}>
      <Skeleton variant="text" width="40%" />
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="rectangular" height="120" />
    </div>
  );
}

export function DashboardSkeleton({ className, ...props }: Omit<SkeletonProps, "variant">) {
  return (
    <div className={cn("space-y-6 p-6", className)} {...props}>
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="33%" />
        <Skeleton variant="text" width="50%" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
    </div>
  );
}

export function SimpleSkeleton({ className, ...props }: Omit<SkeletonProps, "variant">) {
  return (
    <div className={cn("space-y-4 p-6", className)} {...props}>
      <Skeleton variant="text" width="48" />
      <Skeleton variant="text" width="96" />
      <div className="space-y-3 mt-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" height="24" />
        ))}
      </div>
    </div>
  );
}