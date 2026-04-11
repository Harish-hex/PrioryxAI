"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, CalendarClock, Command, Sparkles } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AssistantPanel } from "@/components/assistant-panel";
import { DashboardView, type Task } from "@/components/dashboard-view";
import { PricingModal } from "@/components/pricing-modal";
import { ProfilePage } from "@/components/profile-page";
import { SettingsPanel } from "@/components/settings-panel";
import { Sidebar } from "@/components/sidebar";

const pageTitles: Record<string, string> = {
  dashboard: "Command Center",
  assistant: "AI Assistant",
  profile: "Public Profile",
  settings: "Settings",
};

const pageSubtitles: Record<string, string> = {
  dashboard: "Your AI-ranked feed for the next high-leverage move.",
  assistant: "Ask for plans, tradeoffs, reminders, or recruiter-ready summaries.",
  profile: "A clean engineering profile built for fast recruiter scanning.",
  settings: "Tune your workspace, notifications, and integrations.",
};

const viewToPath: Record<string, string> = {
  dashboard: "/feed",
  assistant: "/assistant",
  profile: "/profile",
  settings: "/settings",
};

interface AppShellProps {
  username: string;
  initialView?: string;
}

export default function AppShell({ username, initialView = "dashboard" }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeView, setActiveView] = useState(initialView);
  const [collapsed, setCollapsed] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  const fetchFeed = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const res = await fetch("/api/feed");
      if (res.ok) {
        const data = await res.json();
        // /api/feed returns { feed: Task[], nextMove }
        setTasks(data.feed ?? []);
      }
    } catch {
      // silently fail — user still sees empty state
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) setStats(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchFeed();
    fetchStats();
  }, [fetchFeed, fetchStats]);

  function navigateToView(view: string) {
    setActiveView(view);
    const nextPath = viewToPath[view] ?? "/feed";
    if (pathname !== nextPath) {
      router.push(nextPath);
    }
  }

  async function handleAddTask(text: string) {
    try {
      const res = await fetch("/api/ingest/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        await fetchFeed();
        await fetchStats();
      }
    } catch {}
  }

  async function handleCompleteTask(id: string) {
    try {
      await fetch(`/api/tasks/${id}/complete`, { method: "PATCH" });
      setTasks((prev) => prev.filter((t) => t.id !== id));
      fetchStats();
    } catch {}
  }

  async function handleSnoozeTask(id: string, hours: number) {
    try {
      await fetch(`/api/tasks/${id}/snooze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours }),
      });
      fetchFeed();
    } catch {}
  }

  const pendingTasks = tasks.filter((t) => !t.completed);

  const view: Record<string, React.ReactNode> = {
    dashboard: (
      <DashboardView
        loading={loadingTasks}
        tasks={pendingTasks}
        stats={stats}
        onAddTask={handleAddTask}
        onCompleteTask={handleCompleteTask}
        onSnoozeTask={handleSnoozeTask}
        onOpenAssistant={() => navigateToView("assistant")}
        onOpenSettings={() => navigateToView("settings")}
        onOpenPricing={() => setPricingOpen(true)}
      />
    ),
    assistant: <AssistantPanel tasks={pendingTasks} />,
    profile: <ProfilePage username={username} />,
    settings: <SettingsPanel onOpenPricing={() => setPricingOpen(true)} />,
  };

  return (
    <main className="app-background min-h-screen overflow-hidden text-neutral-100">
      <Sidebar
        activeView={activeView}
        collapsed={collapsed}
        onNavigate={navigateToView}
        onOpenPricing={() => setPricingOpen(true)}
        onToggle={() => setCollapsed((v) => !v)}
      />

      <div
        className={`min-h-screen px-4 pb-10 pt-4 transition-[padding] duration-300 sm:px-6 lg:pt-6 ${
          collapsed ? "lg:pl-28" : "lg:pl-80"
        }`}
      >
        <header className="glass sticky top-4 z-30 mx-auto mb-5 flex max-w-7xl items-center justify-between gap-4 rounded-lg px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <Command size={15} />
              <span>DeadlineOS</span>
            </div>
            <h1 className="mt-1 truncate text-2xl font-semibold text-white sm:text-3xl">
              {pageTitles[activeView]}
            </h1>
            <p className="mt-1 hidden text-sm text-neutral-400 sm:block">
              {pageSubtitles[activeView]}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="hidden rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-neutral-200 transition hover:border-white/20 hover:bg-white/[0.1] md:inline-flex items-center gap-2"
            >
              <CalendarClock size={16} />
              <span>@{username}</span>
            </button>
            <button
              type="button"
              className="rounded-lg border border-white/10 bg-white/[0.06] p-2.5 text-neutral-200 transition hover:border-white/20 hover:bg-white/[0.1]"
              aria-label="Notifications"
            >
              <Bell size={18} />
            </button>
            <button
              type="button"
              onClick={() => setPricingOpen(true)}
              className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-black shadow-glow transition hover:scale-[1.02] hover:bg-neutral-100"
            >
              <span className="inline-flex items-center gap-2">
                <Sparkles size={16} />
                Pro
              </span>
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.section
            key={activeView}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-7xl"
            exit={{ opacity: 0, y: 10 }}
            initial={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {view[activeView]}
          </motion.section>
        </AnimatePresence>
      </div>

      <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
    </main>
  );
}
