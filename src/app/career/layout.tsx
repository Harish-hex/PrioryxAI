"use client";

import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";

export default function CareerLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    fetch("/api/user/status")
      .then(async (res) => {
        if (res.ok) return (await res.json()) as Record<string, unknown>;
        return {} as Record<string, unknown>;
      })
      .then((data) => {
        const effectivePro =
          Boolean(data.pro_status) &&
          (!data.pro_expires_at || new Date(data.pro_expires_at as string) > new Date());
        setIsPro(effectivePro);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen text-slate-900 bg-white dark:bg-slate-950 dark:text-slate-100">
      <Sidebar
        activeView="career"
        collapsed={collapsed}
        isPro={isPro}
        onNavigate={(view) => {
          // router.push instead of window.location.href — the latter forced a
          // full document reload for every nav out of the career section.
          router.push(view === "dashboard" ? "/feed" : `/${view}`);
        }}
        onOpenPricing={() => {}} // Could wire this to a global pricing modal if needed
        onToggle={() => setCollapsed((v) => !v)}
      />

      <div
        className={`min-h-screen transition-[padding] duration-300 ${
          collapsed ? "lg:pl-36" : "lg:pl-[21rem]"
        } pb-20 lg:pb-0`}
      >
        {children}
      </div>

      {/* The desktop sidebar is `hidden lg:flex`, so below 1024px there was no
          navigation at all. This is the mobile counterpart. */}
      <MobileNav />
    </div>
  );
}
