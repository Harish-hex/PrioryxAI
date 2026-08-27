"use client";

import type { ReactNode } from "react";
import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import WavesBackground from "@/components/ui/waves-background";
import { SimpleSkeleton } from "@/components/ui/skeleton";

export default function CareerLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isPro, setIsPro] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const cached = sessionStorage.getItem("prioryx_status");
      if (cached) {
        const parsed = JSON.parse(cached);
        return Boolean(parsed.pro_status) && (!parsed.pro_expires_at || new Date(parsed.pro_expires_at) > new Date());
      }
    } catch {}
    return false;
  });

  useEffect(() => {
    fetch("/api/user/status")
      .then(async (res) => {
        if (res.ok) return (await res.json()) as Record<string, unknown>;
        return {} as Record<string, unknown>;
      })
      .then((data) => {
        if (Object.keys(data).length > 0) {
          sessionStorage.setItem("prioryx_status", JSON.stringify(data));
        }
        const effectivePro =
          Boolean(data.pro_status) &&
          (!data.pro_expires_at || new Date(data.pro_expires_at as string) > new Date());
        setIsPro(effectivePro);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="app-background min-h-screen text-slate-900 dark:text-slate-100">
      <WavesBackground />
      <Sidebar
        activeView="career"
        collapsed={collapsed}
        isPro={isPro}
        onNavigate={(view) => {
          // router.push instead of window.location.href — the latter forced a
          // full document reload for every nav out of the career section.
          const pathMap: Record<string, string> = {
            dashboard: "/feed",
            assistant: "/assistant",
            learning: "/learning",
            career: "/career/resume/upload",
            profile: "/profile",
            settings: "/settings",
          };
          router.push(pathMap[view] ?? `/${view}`);
        }}
        onOpenPricing={() => {}} // Could wire this to a global pricing modal if needed
        onToggle={() => setCollapsed((v) => !v)}
      />

      <div
        className={`min-h-screen px-3 pb-24 pt-3 sm:px-5 sm:pt-4 lg:pb-12 lg:pr-8 lg:pt-6 transition-[padding] duration-300 ${
          collapsed ? "lg:pl-36" : "lg:pl-[21rem]"
        }`}
      >
        <div className="mx-auto max-w-7xl">
          <Suspense fallback={<SimpleSkeleton />}>
            {children}
          </Suspense>
        </div>
      </div>

      {/* The desktop sidebar is `hidden lg:flex`, so below 1024px there was no
          navigation at all. This is the mobile counterpart. */}
      <MobileNav />
    </div>
  );
}
