"use client";

import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";

export default function CareerLayout({ children }: { children: ReactNode }) {
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
    <div className="min-h-screen text-slate-900 bg-white">
      <Sidebar
        activeView="career"
        collapsed={collapsed}
        isPro={isPro}
        onNavigate={(view) => {
          window.location.href = view === "dashboard" ? "/feed" : `/${view}`;
        }}
        onOpenPricing={() => {}} // Could wire this to a global pricing modal if needed
        onToggle={() => setCollapsed((v) => !v)}
      />

      <div
        className={`min-h-screen transition-[padding] duration-300 ${
          collapsed ? "lg:pl-36" : "lg:pl-[21rem]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
