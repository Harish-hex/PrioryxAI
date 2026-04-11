"use client";

import { Bot, ChevronLeft, ChevronRight, Gem, LayoutDashboard, Settings, Sparkles, UserRound } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "assistant", label: "Assistant", icon: Bot },
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  activeView: string;
  collapsed: boolean;
  isPro: boolean;
  onNavigate: (view: string) => void;
  onOpenPricing: () => void;
  onToggle: () => void;
}

export function Sidebar({ activeView, collapsed, isPro, onNavigate, onOpenPricing, onToggle }: SidebarProps) {
  return (
    <aside
      className={`fixed bottom-4 left-4 top-4 z-40 hidden flex-col rounded-lg border border-white/10 bg-black/55 p-3 shadow-glass backdrop-blur-2xl transition-[width] duration-300 lg:flex ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigate("dashboard")}
          className="flex min-w-0 items-center gap-3 rounded-lg p-2 text-left transition hover:bg-white/[0.07]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg accent-border p-px">
            <div className="flex h-full w-full items-center justify-center rounded-[7px] bg-black text-white">
              <Gem size={19} />
            </div>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">PrioryxAI</p>
              <p className="truncate text-xs text-neutral-500">Student command OS</p>
            </div>
          )}
        </button>

        {!collapsed && (
          <button
            type="button"
            onClick={onToggle}
            className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-neutral-400 transition hover:text-white"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={17} />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          type="button"
          onClick={onToggle}
          className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-2 text-neutral-400 transition hover:text-white"
          aria-label="Expand sidebar"
        >
          <ChevronRight size={17} />
        </button>
      )}

      <nav className="mt-7 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;

          return (
            <button
              type="button"
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${
                active ? "text-white" : "text-neutral-400 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg border border-white/[0.12] bg-white/[0.09]"
                  transition={{ duration: 0.2 }}
                />
              )}
              <Icon className="relative z-10 shrink-0" size={18} />
              {!collapsed && <span className="relative z-10 truncate font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
          <div className="h-2 rounded-full bg-white/10">
            <div className="h-2 w-3/4 rounded-full bg-gradient-to-r from-aura via-volt to-mint" />
          </div>
          {!collapsed && (
            <>
              <p className="mt-3 text-sm font-medium text-white">PrioryxAI</p>
              <p className="mt-1 text-xs leading-5 text-neutral-500">Stay ahead of every deadline.</p>
            </>
          )}
        </div>

        {isPro ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-mint/20 bg-mint/10 px-3 py-2.5 text-sm font-semibold text-mint">
            {collapsed ? "✓" : (
              <>
                <Sparkles size={14} />
                Pro Active
              </>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenPricing}
            className="w-full rounded-lg bg-white px-3 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.02] hover:bg-neutral-100"
          >
            {collapsed ? "Pro" : "Upgrade to Pro"}
          </button>
        )}
      </div>
    </aside>
  );
}
