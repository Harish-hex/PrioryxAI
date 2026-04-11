"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, CalendarClock, CheckCircle2, Command, Loader2, Sparkles } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const searchParams = useSearchParams();
  const [activeView, setActiveView] = useState(initialView);
  const [collapsed, setCollapsed] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [setupItems, setSetupItems] = useState<any[]>([]);
  const [stats, setStats] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  // Pro state
  const [isPro, setIsPro] = useState(false);
  const [messagesUsedToday, setMessagesUsedToday] = useState(0);
  const [visionUsedToday, setVisionUsedToday] = useState(0);

  // Post-payment activation state
  const [paymentPending, setPaymentPending] = useState(false);
  const [paymentActivated, setPaymentActivated] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/user/status");
      if (res.ok) {
        const data = await res.json();
        const effectivePro =
          Boolean(data.pro_status) &&
          (!data.pro_expires_at || new Date(data.pro_expires_at) > new Date());
        setIsPro(effectivePro);
        setMessagesUsedToday(data.messages_today ?? 0);
        setVisionUsedToday(data.vision_uploads_today ?? 0);
      }
    } catch {}
  }, []);

  const fetchFeed = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const res = await fetch("/api/feed");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.feed ?? []);
        setSetupItems(data.setup ?? []);
        setHasMore(data.hasMore ?? false);
      }
    } catch {}
    finally {
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
    fetchStatus();
  }, [fetchFeed, fetchStats, fetchStatus]);

  // Detect return from Razorpay payment page (?payment=success)
  useEffect(() => {
    if (searchParams.get("payment") !== "success") return;

    // Strip the query param from the URL without a page reload
    const cleanUrl = pathname;
    router.replace(cleanUrl);

    setPaymentPending(true);

    // Poll /api/user/status every 3 s (up to ~90 s) until pro activates
    let attempts = 0;
    const MAX_ATTEMPTS = 30;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch("/api/user/status");
        if (res.ok) {
          const data = await res.json();
          const activated =
            Boolean(data.pro_status) &&
            (!data.pro_expires_at || new Date(data.pro_expires_at) > new Date());
          if (activated) {
            setIsPro(true);
            setPaymentPending(false);
            setPaymentActivated(true);
            if (pollRef.current) clearInterval(pollRef.current);
            // Hide the success banner after 6 s
            setTimeout(() => setPaymentActivated(false), 6000);
            return;
          }
        }
      } catch {}
      if (attempts >= MAX_ATTEMPTS) {
        setPaymentPending(false);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        setupItems={setupItems}
        stats={stats}
        isPro={isPro}
        hasMore={hasMore}
        onAddTask={handleAddTask}
        onCompleteTask={handleCompleteTask}
        onSnoozeTask={handleSnoozeTask}
        onOpenAssistant={() => navigateToView("assistant")}
        onOpenSettings={() => navigateToView("settings")}
        onOpenPricing={() => setPricingOpen(true)}
      />
    ),
    assistant: (
      <AssistantPanel
        tasks={pendingTasks}
        isPro={isPro}
        messagesUsedToday={messagesUsedToday}
        onMessageSent={fetchStatus}
        onOpenPricing={() => setPricingOpen(true)}
      />
    ),
    profile: <ProfilePage username={username} />,
    settings: (
      <SettingsPanel
        onOpenPricing={() => setPricingOpen(true)}
        isPro={isPro}
        visionUsedToday={visionUsedToday}
        onVisionUploaded={async () => {
          await Promise.all([fetchStatus(), fetchFeed(), fetchStats()]);
        }}
      />
    ),
  };

  return (
    <main className="app-background min-h-screen overflow-hidden text-neutral-100">
      <Sidebar
        activeView={activeView}
        collapsed={collapsed}
        isPro={isPro}
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
              <span>PrioryxAI</span>
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
            {isPro ? (
              <div className="rounded-lg border border-mint/25 bg-mint/10 px-3 py-2 text-sm font-semibold text-mint">
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles size={14} /> Pro ✓
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPricingOpen(true)}
                className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-black shadow-glow transition hover:scale-[1.02] hover:bg-neutral-100"
              >
                <span className="inline-flex items-center gap-2">
                  <Sparkles size={16} />
                  Upgrade to Pro
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Post-payment activation banners */}
        <AnimatePresence>
          {paymentPending && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mx-auto mb-4 max-w-7xl flex items-center gap-3 rounded-lg border border-aura/30 bg-aura/10 px-4 py-3 text-sm text-violet-200"
            >
              <Loader2 size={15} className="animate-spin shrink-0" />
              Payment received — activating Pro on your account…
            </motion.div>
          )}
          {paymentActivated && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mx-auto mb-4 max-w-7xl flex items-center gap-3 rounded-lg border border-mint/30 bg-mint/10 px-4 py-3 text-sm font-semibold text-mint"
            >
              <CheckCircle2 size={15} className="shrink-0" />
              Pro is now active on your account. Enjoy unlimited access!
            </motion.div>
          )}
        </AnimatePresence>

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

      <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} isPro={isPro} />
    </main>
  );
}
