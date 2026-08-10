"use client";

import { Bot, ChevronLeft, ChevronRight, LayoutDashboard, Settings, Sparkles, UserRound, FileText, Hammer, Code2, Briefcase, Users, Play, GitBranch } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { SidebarLeetCodeBadge } from "./leetcode/SidebarBadge";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/feed" },
  { id: "learning", label: "Feed", icon: Play, path: "/learning" },
  { id: "assistant", label: "Assistant", icon: Bot, path: "/assistant" },
  { id: "profile", label: "Profile", icon: UserRound, path: "/profile" },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

const careerItems = [
  { id: "career_resume", label: "Resume Intelligence", icon: FileText, path: "/career/resume/upload" },
  { id: "career_foundry", label: "Project Foundry", icon: Hammer, path: "/career/foundry/dashboard" },
  { id: "career_coding", label: "LeetCode Profile", icon: Code2, path: "/career/coding" },
  { id: "career_hackerrank", label: "HackerRank Profile", icon: Code2, path: "/career/hackerrank" },
  { id: "career_unified", label: "Unified Profile", icon: Code2, path: "/career/coding/unified" },
  { id: "career_github", label: "GitHub Intelligence", icon: GitBranch, path: "/career/coding/github" },
  { id: "career_market", label: "Job Market", icon: Briefcase, path: "/career/market/jobs" },
  { id: "career_collab", label: "Peer Collab", icon: Users, path: "/career/collab/match" },
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
  const [careerOpen, setCareerOpen] = useState(false);

  const handleNavigate = (id: string, path?: string) => {
    if (path && path.startsWith("/career")) {
      window.location.href = path;
    } else {
      onNavigate(id);
    }
  };

  return (
    <aside
      className={`fixed bottom-6 left-6 top-6 z-40 hidden flex-col rounded-[32px] border border-slate-200/80 bg-white/88 p-4 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-[width] duration-300 lg:flex ${
        collapsed ? "w-24" : "w-72"
      }`}
    >
      <div className={`flex ${collapsed ? "flex-col items-center justify-center gap-4" : "items-center justify-between gap-3"}`}>
        <button
          type="button"
          onClick={() => onNavigate("dashboard")}
          className={`flex min-w-0 items-center gap-3 rounded-2xl ${collapsed ? "p-0" : "p-2"} text-left transition hover:bg-slate-50`}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-950 text-sm font-semibold text-white">
            <img src="/logo.png" alt="PrioryxAI Logo" className="h-full w-full object-cover" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">PrioryxAI</p>
              <p className="truncate text-xs text-slate-500">Student command OS</p>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={onToggle}
          className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
        </button>
      </div>

      <nav className="mt-8 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;

          return (
            <button
              type="button"
              key={item.id}
              onClick={() => handleNavigate(item.id, item.path)}
              className={`group relative flex w-full items-center overflow-hidden rounded-2xl py-3 text-sm transition ${
                collapsed ? "justify-center px-0" : "gap-3 px-3"
              } ${
                active ? "text-slate-950" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-2xl bg-slate-100"
                  transition={{ duration: 0.2 }}
                />
              )}
              <Icon className="relative z-10 shrink-0" size={18} />
              {!collapsed && <span className="relative z-10 truncate font-medium">{item.label}</span>}
            </button>
          );
        })}

        {!collapsed && (
          <div className="pt-4 pb-1">
            <button
              type="button"
              onClick={() => setCareerOpen(!careerOpen)}
              className="flex w-full items-center justify-between px-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-700 hover:text-slate-900 transition"
            >
              AI Career Guidance
              <motion.div animate={{ rotate: careerOpen ? 90 : 0 }}>
                <ChevronRight size={14} />
              </motion.div>
            </button>
          </div>
        )}

        <AnimatePresence>
          {(!collapsed && careerOpen) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-1.5 overflow-hidden"
            >
              {careerItems.map((item) => {
                const Icon = item.icon;
                const active = activeView === item.id || (typeof window !== "undefined" && window.location.pathname.startsWith(item.path));
                
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => handleNavigate(item.id, item.path)}
                    className={`group relative flex w-full items-center overflow-hidden rounded-2xl py-2 text-sm transition ${
                      collapsed ? "justify-center px-0" : "gap-3 px-3"
                    } ${
                      active ? "text-slate-950 bg-slate-100" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="relative z-10 shrink-0" size={16} />
                    <span className="relative z-10 truncate font-medium">{item.label}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <div className="mt-auto space-y-3">
        <SidebarLeetCodeBadge collapsed={collapsed} />
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
          {!collapsed ? (
            <>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Your workspace</p>
              <p className="mt-3 text-sm leading-6 text-slate-500">Stay ahead of every deadline with AI-ranked priorities.</p>
            </>
          ) : (
            <div className="flex justify-center">
              <span className="rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-950">AI</span>
            </div>
          )}
        </div>

        {isPro ? (
          <div className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700`}>
            <Sparkles size={14} />
            {!collapsed && "Pro Active"}
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenPricing}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 ${
              collapsed ? "px-0" : ""
            }`}
          >
            <Sparkles size={16} />
            {!collapsed && "Upgrade"}
          </button>
        )}
      </div>
    </aside>
  );
}
