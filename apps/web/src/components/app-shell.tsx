"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Bell, Bot, Briefcase, CalendarClock, Check, CheckCircle2, Clock3, Command, Copy, ExternalLink, GraduationCap, LayoutDashboard, Loader2, Menu, RefreshCw, Settings, UserRound, X, Zap } from "lucide-react";
import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import type { Task } from "@/components/dashboard-view";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { SimpleSkeleton } from "@/components/ui/skeleton";

// Lazy-load subviews and heavy modals on-demand. Each import() is named so it
// can be triggered ahead of time (idle warm-up + sidebar hover) as well as by
// dynamic() itself — webpack dedupes a repeated import() to the same chunk, so
// a pre-warmed chunk resolves instantly when dynamic()'s loader runs later.
const importAssistantPanel = () => import("@/components/assistant-panel");
const importProfilePage = () => import("@/components/profile-page");
const importSettingsPanel = () => import("@/components/settings-panel");
const importFeedPageContent = () => import("@/components/youtube/FeedPageContent");

const AssistantPanel = dynamic(() => importAssistantPanel().then((m) => m.AssistantPanel), {
  loading: () => <SimpleSkeleton className="h-96 w-full rounded-3xl" />,
  ssr: false,
});

const ProfilePage = dynamic(() => importProfilePage().then((m) => m.ProfilePage), {
  loading: () => <SimpleSkeleton className="h-96 w-full rounded-3xl" />,
  ssr: false,
});

const SettingsPanel = dynamic(() => importSettingsPanel().then((m) => m.SettingsPanel), {
  loading: () => <SimpleSkeleton className="h-96 w-full rounded-3xl" />,
  ssr: false,
});

const PricingModal = dynamic(() => import("@/components/pricing-modal").then((m) => m.PricingModal), {
  ssr: false,
});

const FeedPageContent = dynamic(() => importFeedPageContent().then((m) => m.FeedPageContent), {
  loading: () => <SimpleSkeleton className="h-96 w-full rounded-3xl" />,
  ssr: false,
});

// DashboardView is the default view on the busiest route (/feed) — unlike the
// other panels above it stays ssr:true so its content is still server-rendered,
// but splitting it into its own chunk keeps it out of app-shell's initial JS.
const DashboardView = dynamic(() => import("@/components/dashboard-view").then((m) => m.DashboardView), {
  loading: () => <SimpleSkeleton className="h-96 w-full rounded-3xl" />,
});

// Warms all in-shell view chunks. Safe to call repeatedly — webpack caches by
// module, so a second call for an already-loaded chunk is a no-op.
function prefetchShellViews() {
  importAssistantPanel();
  importProfilePage();
  importSettingsPanel();
  importFeedPageContent();
}

const CareerSheet = dynamic(() => import("@/components/mobile-nav").then((m) => m.CareerSheet), {
  ssr: false,
});

const WavesBackground = dynamic(() => import("@/components/ui/waves-background"), {
  ssr: false,
});

import { getCurrentWeekDays, recordDailyActivity } from "@/lib/streak-tracker";
import { recordUserActivity } from "@/lib/activity-tracker";

const pageTitles: Record<string, string> = {
  dashboard: "Dashboard",
  assistant: "Assistant",
  learning: "Learning",
  career: "Career",
  profile: "Profile",
  settings: "Settings",
};

const pageSubtitles: Record<string, string> = {
  dashboard: "Keep the next important step visible and let everything else stay quiet.",
  assistant: "Use context from your tasks to turn a busy day into a simple plan.",
  learning: "AI-curated learning videos based on your profile and goals.",
  career: "Build projects, match jobs, and grow your professional profile.",
  profile: "Present projects and proof points in a sharper, calmer format.",
  settings: "Tune how the workspace behaves without adding extra noise.",
};

const viewToPath: Record<string, string> = {
  dashboard: "/feed",
  assistant: "/assistant",
  learning: "/learning",
  career: "/career/resume/upload",
  profile: "/profile",
  settings: "/settings",
};

interface AppShellProps {
  username: string;
  initialView?: string;
  /** Server-fetched initial data (see src/app/feed/page.tsx) — when present,
   * the shell seeds its state from these instead of starting empty and
   * waiting for the post-mount client fetch, so the first paint already has
   * real content. Each is the same shape /api/feed, /api/stats, and
   * /api/user/status normally return; null means the server-side loader
   * failed or this route didn't provide one, and the shell falls back to its
   * usual client fetch. */
  initialFeed?: { feed?: any[]; setup?: any[]; hasMore?: boolean; totalCount?: number; hiddenPreview?: any } | null;
  initialStats?: any | null;
  initialStatus?: { pro_status?: boolean; pro_expires_at?: string | null; messages_today?: number; vision_uploads_today?: number } | null;
}

function StreakCalendar({ stats, isPro }: { stats: any; isPro: boolean }) {
  const [weekData, setWeekData] = useState(() => getCurrentWeekDays(stats));

  const refreshWeek = useCallback(() => {
    setWeekData(getCurrentWeekDays(stats));
  }, [stats]);

  useEffect(() => {
    refreshWeek();
  }, [refreshWeek]);

  useEffect(() => {
    function handleActivityUpdate() {
      refreshWeek();
    }
    window.addEventListener("prioryx_activity_updated", handleActivityUpdate);
    window.addEventListener("storage", handleActivityUpdate);
    return () => {
      window.removeEventListener("prioryx_activity_updated", handleActivityUpdate);
      window.removeEventListener("storage", handleActivityUpdate);
    };
  }, [refreshWeek]);

  const { days, completedCount, weekRange } = weekData;

  return (
    <>
      {/* Desktop 7-Day Row — read-only: a day ticks itself the moment the
          user actually does something (a task, a DSA solve, a login, ...);
          it is never something the user can click to mark for themselves. */}
      <div
        className="hidden md:flex items-center gap-1.5 rounded-[24px] neu-inset px-4 py-2 transition-all"
        title={`Weekly Streak: ${completedCount} / 7 days completed (${weekRange}) · Resets after Saturday (Sunday)`}
      >
        <div className="flex items-center gap-2 sm:gap-2.5">
          {days.map((item) => {
            const { day, isToday, isCompleted, isPast, isFuture } = item;

            return (
              <div
                key={day}
                className="flex flex-col items-center gap-1 min-w-[28px]"
                title={
                  isFuture
                    ? `${day}: Upcoming`
                    : isCompleted
                    ? `${day}: Completed`
                    : isToday
                    ? `${day}: Today — not completed yet`
                    : `${day}: No activity recorded`
                }
              >
                <span
                  className={`flex h-7 w-7 sm:h-7.5 sm:w-7.5 items-center justify-center rounded-full transition-all duration-200 ${
                    isCompleted
                      ? "bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950 scale-100 group-hover:opacity-90"
                      : isToday
                      ? "neu-inset border-2 border-cyan-500/50 text-cyan-600 dark:border-cyan-400/60 dark:text-cyan-300 font-bold group-hover:scale-105"
                      : isPast
                      ? "neu-raised-sm opacity-40 hover:opacity-80 text-slate-400 group-hover:border group-hover:border-slate-400/40"
                      : "neu-raised-sm opacity-25 text-transparent"
                  }`}
                >
                  {isCompleted ? (
                    <Check size={13} className="stroke-[3]" />
                  ) : isToday ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-pulse" />
                  ) : isPast ? (
                    <span className="h-1 w-1 rounded-full bg-slate-400/40" />
                  ) : null}
                </span>
                <span
                  className={`text-[10px] tracking-wider transition-colors ${
                    isToday
                      ? "font-bold text-slate-950 dark:text-white"
                      : isCompleted
                      ? "font-bold text-slate-800 dark:text-slate-200"
                      : "font-semibold text-slate-400 dark:text-slate-400"
                  }`}
                >
                  {day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Streak Badge — read-only, same auto-tracked weekly count. */}
      <div
        className="flex md:hidden items-center gap-1.5 rounded-2xl neu-inset px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200"
        title={`Weekly Streak: ${completedCount} / 7 days completed (${weekRange})`}
      >
        <Zap size={13} className="text-cyan-500 fill-cyan-500/20" />
        <span>{completedCount}/7</span>
      </div>
    </>
  );
}

export default function AppShell({ username, initialView = "dashboard", initialFeed, initialStats, initialStatus }: AppShellProps) {
  const [activeView, setActiveView] = useState(initialView);
  const [collapsed, setCollapsed] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [careerSheetOpen, setCareerSheetOpen] = useState(false);

  // Prefer server-rendered initial data (see feed/page.tsx) so first paint has
  // real content instead of an empty shell. Falls back to the sessionStorage
  // snapshot from a previous client fetch, then to empty, only when this
  // route didn't provide server data (e.g. a route other than /feed reusing
  // this shell, or the server-side loader failed).
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (initialFeed?.feed) return initialFeed.feed;
    if (typeof window === "undefined") return [];
    try {
      const cached = sessionStorage.getItem("prioryx_feed");
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.feed ?? [];
      }
    } catch {}
    return [];
  });
  const [setupItems, setSetupItems] = useState<any[]>(() => {
    if (initialFeed?.setup) return initialFeed.setup;
    if (typeof window === "undefined") return [];
    try {
      const cached = sessionStorage.getItem("prioryx_feed");
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.setup ?? [];
      }
    } catch {}
    return [];
  });
  const [stats, setStats] = useState(() => {
    if (initialStats) return initialStats;
    if (typeof window === "undefined") return null;
    try {
      const cached = sessionStorage.getItem("prioryx_stats");
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });
  const [loadingTasks, setLoadingTasks] = useState(() => {
    if (initialFeed) return false;
    if (typeof window === "undefined") return true;
    try {
      return !sessionStorage.getItem("prioryx_feed");
    } catch {
      return true;
    }
  });
  const [hasMore, setHasMore] = useState(() => initialFeed?.hasMore ?? false);
  const [totalCount, setTotalCount] = useState<number | undefined>(() => initialFeed?.totalCount);
  const [hiddenPreview, setHiddenPreview] = useState<{ count: number; topJobTitle: string | null; breakdown: string | null } | null>(() => initialFeed?.hiddenPreview ?? null);

  // Pro state
  const [isPro, setIsPro] = useState(() => {
    const source = initialStatus ?? (() => {
      if (typeof window === "undefined") return null;
      try {
        const cached = sessionStorage.getItem("prioryx_status");
        return cached ? JSON.parse(cached) : null;
      } catch {
        return null;
      }
    })();
    if (!source) return false;
    return Boolean(source.pro_status) && (!source.pro_expires_at || new Date(source.pro_expires_at) > new Date());
  });
  const [messagesUsedToday, setMessagesUsedToday] = useState(() => initialStatus?.messages_today ?? 0);
  const [visionUsedToday, setVisionUsedToday] = useState(() => initialStatus?.vision_uploads_today ?? 0);

  // Task context passed from "Plan with AI" — carried into AssistantPanel
  const [assistantTask, setAssistantTask] = useState<any | null>(null);

  // Notification dropdown
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [profileLinkCopied, setProfileLinkCopied] = useState(false);

  // Close floating menus on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) setNotifOpen(false);
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) setProfileMenuOpen(false);
    }
    if (notifOpen || profileMenuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen, profileMenuOpen]);

  // Post-payment activation state
  const [paymentPending, setPaymentPending] = useState(false);
  const [paymentActivated, setPaymentActivated] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/user/status");
      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem("prioryx_status", JSON.stringify(data));
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
    try {
      const res = await fetch("/api/feed");
      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem("prioryx_feed", JSON.stringify(data));
        setTasks(data.feed ?? []);
        setSetupItems(data.setup ?? []);
        setHasMore(data.hasMore ?? false);
        setTotalCount(data.totalCount);
        setHiddenPreview(data.hiddenPreview ?? null);
      }
    } catch {}
    finally {
      setLoadingTasks(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem("prioryx_stats", JSON.stringify(data));
        setStats(data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    recordDailyActivity();
    // Server-rendered initial* props (see feed/page.tsx) already carry
    // first-paint data for this exact request — only fetch on mount whatever
    // the server didn't provide (e.g. its loader failed, or this shell is
    // being used by a route that doesn't pass initial data). Fetching all
    // three unconditionally here would just re-run work the server render
    // already paid for moments ago.
    const toFetch: Promise<unknown>[] = [];
    if (!initialFeed) toFetch.push(fetchFeed());
    if (!initialStats) toFetch.push(fetchStats());
    if (!initialStatus) toFetch.push(fetchStatus());
    if (toFetch.length > 0) Promise.allSettled(toFetch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFeed, fetchStats, fetchStatus]);

  // Warm the other in-shell view chunks once the critical dashboard fetch is
  // underway, so the first click into Assistant/Learning/Profile/Settings
  // doesn't pay a cold JS-chunk download+parse on top of its own data fetch.
  useEffect(() => {
    const idle = (window as any).requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 300));
    const cancelIdle = (window as any).cancelIdleCallback ?? clearTimeout;
    const handle = idle(prefetchShellViews);
    return () => cancelIdle(handle);
  }, []);

  // Track previous isPro to detect the moment it flips true → show activation banner
  const prevIsProRef = useRef(false);
  useEffect(() => {
    if (!prevIsProRef.current && isPro) {
      setPaymentPending(false);
      setPaymentActivated(true);
      setTimeout(() => setPaymentActivated(false), 6000);
    }
    prevIsProRef.current = isPro;
  }, [isPro]);

  // Manual Pro activation — calls verify with session trust
  const [manualActivating, setManualActivating] = useState(false);
  const handleManualActivate = useCallback(async () => {
    setManualActivating(true);
    setPaymentFailed(false);
    setPaymentPending(true);
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ razorpay_payment_id: "manual_claim" }),
      });
      if (res.ok) {
        setIsPro(true);
        setPaymentPending(false);
        setPaymentActivated(true);
        setTimeout(() => setPaymentActivated(false), 6000);
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("[payment] manual activate failed:", res.status, err);
        setPaymentPending(false);
        setPaymentFailed(true);
      }
    } catch (e) {
      console.error("[payment] manual activate threw:", e);
      setPaymentPending(false);
      setPaymentFailed(true);
    } finally {
      setManualActivating(false);
    }
  }, []);

  // Shared polling function — polls /api/user/status every 5s for up to 2 minutes
  const startPaymentPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    let attempts = 0;
    const MAX_ATTEMPTS = 24; // 24 × 5s = 2 minutes
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
            if (pollRef.current) clearInterval(pollRef.current);
            return;
          }
        }
      } catch {}
      if (attempts >= MAX_ATTEMPTS) {
        setPaymentPending(false);
        setPaymentFailed(true);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 5000);
  }, []);

  // Sync active view with browser back/forward navigation
  useEffect(() => {
    function handlePopState() {
      const path = window.location.pathname;
      const viewEntry = Object.entries(viewToPath).find(([, p]) => p === path);
      if (viewEntry) setActiveView(viewEntry[0]);
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Referrer-based trigger: user came back from Razorpay without ?payment=success
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromRazorpay =
      document.referrer.includes("rzp.io") ||
      document.referrer.includes("razorpay.com");
    if (!fromRazorpay) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") return;
    setPaymentPending(true);
    startPaymentPolling();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // URL-based trigger: ?payment=success in redirect URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") !== "success") return;

    const razorpayParams = {
      razorpay_payment_id: params.get("razorpay_payment_id"),
      razorpay_payment_link_id: params.get("razorpay_payment_link_id"),
      razorpay_payment_link_reference_id: params.get("razorpay_payment_link_reference_id"),
      razorpay_payment_link_status: params.get("razorpay_payment_link_status"),
      razorpay_subscription_id: params.get("razorpay_subscription_id"),
      razorpay_signature: params.get("razorpay_signature"),
    };
    const hasRedirectParams = Boolean(razorpayParams.razorpay_payment_id);

    window.history.replaceState(null, "", window.location.pathname);
    setPaymentPending(true);

    async function activateViaRedirect() {
      try {
        const res = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(razorpayParams),
        });
        if (res.ok) {
          // Activate instantly — don't wait for the next /api/user/status poll tick.
          setIsPro(true);
          setPaymentPending(false);
          try {
            const cached = sessionStorage.getItem("prioryx_status");
            const parsed = cached ? JSON.parse(cached) : {};
            sessionStorage.setItem(
              "prioryx_status",
              JSON.stringify({ ...parsed, pro_status: true })
            );
          } catch {}
          // Reconcile with the server in the background (expiry date, usage counters, etc.)
          fetchStatus();
          return true;
        }
        const errData = await res.json().catch(() => ({}));
        console.error("[payment] verify failed:", res.status, errData);
      } catch (e) {
        console.error("[payment] verify threw:", e);
      }
      return false;
    }

    if (hasRedirectParams) {
      activateViaRedirect().then((activated) => {
        if (!activated) startPaymentPolling();
      });
    } else {
      startPaymentPolling();
    }

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Silent delayed re-fetches for non-pro users on page load
  useEffect(() => {
    if (isPro) return;
    const t1 = setTimeout(() => fetchStatus(), 5_000);
    const t2 = setTimeout(() => fetchStatus(), 15_000);
    const t3 = setTimeout(() => fetchStatus(), 30_000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function navigateToView(view: string) {
    setActiveView(view);
    const nextPath = viewToPath[view] ?? "/feed";
    if (typeof window !== "undefined" && window.location.pathname !== nextPath) {
      window.history.pushState(null, "", nextPath);
    }
  }

  async function handleAddTask(text: string) {
    try {
      recordUserActivity("task_created", { text });
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
      recordUserActivity("task_completed", { taskId: id });
      await fetch(`/api/tasks/${id}/complete`, { method: "PATCH" });
      setTasks((prev) => prev.filter((t) => t.id !== id));
      fetchStats();
    } catch {}
  }

  async function handleSnoozeTask(id: string, hours: number) {
    try {
      recordUserActivity("task_snoozed", { taskId: id, hours });
      await fetch(`/api/tasks/${id}/snooze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours }),
      });
      fetchFeed();
    } catch {}
  }

  const pendingTasks = tasks.filter((t) => !t.completed);
  const deadlineNotifications = [...pendingTasks]
    .filter((task) => {
      if (!task.due_at) return false;
      const hoursUntilDue = (new Date(task.due_at).getTime() - Date.now()) / 3_600_000;
      return hoursUntilDue <= 72;
    })
    .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime())
    .slice(0, 8);
  const reminderNotifications = setupItems.slice(0, 3);
  const notificationCount = Math.min(9, deadlineNotifications.length + reminderNotifications.length);

  async function handleCopyProfileLink() {
    const publicProfileUrl = `${window.location.origin}/u/${username}`;
    try {
      await navigator.clipboard.writeText(publicProfileUrl);
      setProfileLinkCopied(true);
      window.setTimeout(() => {
        setProfileLinkCopied(false);
        setProfileMenuOpen(false);
      }, 1200);
    } catch {
      window.prompt("Copy your public profile link:", publicProfileUrl);
      setProfileMenuOpen(false);
    }
  }

  function handleOpenPublicProfile() {
    window.open(`/u/${username}`, "_blank", "noopener,noreferrer");
    setProfileMenuOpen(false);
  }

  function handleNotificationAction(item: any) {
    if (item?.action_view === "external" && item?.external_url) {
      window.open(item.external_url, "_blank", "noopener,noreferrer");
      setNotifOpen(false);
      return;
    }
    if (item?.action_view === "assistant") { navigateToView("assistant"); setNotifOpen(false); return; }
    if (item?.action_view === "profile") { navigateToView("profile"); setNotifOpen(false); return; }
    if (item?.action_view === "dashboard") { navigateToView("dashboard"); setNotifOpen(false); return; }
    navigateToView("settings");
    setNotifOpen(false);
  }

  const view: Record<string, React.ReactNode> = {
    dashboard: (
      <DashboardView
        loading={loadingTasks}
        tasks={pendingTasks}
        setupItems={setupItems}
        stats={stats}
        isPro={isPro}
        hasMore={hasMore}
        totalCount={totalCount}
        hiddenPreview={hiddenPreview}
        onAddTask={handleAddTask}
        onCompleteTask={handleCompleteTask}
        onSnoozeTask={handleSnoozeTask}
        onOpenAssistant={(task) => { setAssistantTask(task ?? null); navigateToView("assistant"); }}
        onOpenSettings={() => navigateToView("settings")}
        onOpenPricing={() => setPricingOpen(true)}
      />
    ),
    assistant: (
      <AssistantPanel
        tasks={pendingTasks}
        isPro={isPro}
        messagesUsedToday={messagesUsedToday}
        initialTask={assistantTask}
        onTaskConsumed={() => setAssistantTask(null)}
        onMessageSent={fetchStatus}
        onOpenPricing={() => setPricingOpen(true)}
      />
    ),
    learning: <FeedPageContent />,
    career: (
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-slate-500">Career view - use /career/resume/upload route</p>
        </div>
      </div>
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
        onNavigateToDashboard={() => navigateToView("dashboard")}
      />
    ),
  };

  return (
    <main className="app-background min-h-screen overflow-x-hidden text-slate-900">
      <WavesBackground />
      <Sidebar
        activeView={activeView}
        collapsed={collapsed}
        isPro={isPro}
        onNavigate={navigateToView}
        onOpenPricing={() => setPricingOpen(true)}
        onToggle={() => setCollapsed((v) => !v)}
        onPrefetchView={(id) => {
          if (id === "assistant") importAssistantPanel();
          else if (id === "profile") importProfilePage();
          else if (id === "settings") importSettingsPanel();
          else if (id === "learning") importFeedPageContent();
        }}
      />

      <div
        className={`min-h-screen px-3 pb-24 pt-3 transition-[padding] duration-300 sm:px-5 sm:pt-4 lg:pb-12 lg:pr-8 lg:pt-6 ${
          collapsed ? "lg:pl-36" : "lg:pl-[21rem]"
        }`}
      >
        {/* Sticky header */}
        <header className="neu-card sticky top-4 z-30 mx-auto mb-6 max-w-7xl rounded-[28px] px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3 lg:gap-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
                <img src="/logo.png" alt="PrioryxAI" className="h-4 w-4 shrink-0 object-contain" />
                <span>PrioryxAI workspace</span>
              </div>
              <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:mt-2 sm:text-3xl lg:text-4xl">
                {pageTitles[activeView]}
              </h1>
              <p className="mt-1 hidden max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:mt-2 sm:block sm:text-[15px]">
                {pageSubtitles[activeView]}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2.5">
              {/* 7-day Streak Calendar */}
              <StreakCalendar stats={stats} isPro={isPro} />

              {/* Notification bell */}
              <div ref={notifRef} className="relative">
                <button
                  type="button"
                  onClick={() => { setNotifOpen((o) => !o); setProfileMenuOpen(false); }}
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl neu-btn text-slate-700 dark:text-slate-200"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {notificationCount > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-950">
                      {notificationCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-[28px] neu-card sm:w-96"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 px-4 py-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
                          <Bell size={14} className="text-slate-400" /> Notifications
                        </div>
                        <button
                          type="button"
                          onClick={() => setNotifOpen(false)}
                          className="rounded-lg p-1 text-slate-400 hover:text-slate-700 transition"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                        {deadlineNotifications.length > 0 && (
                          <div className="border-b border-slate-100 px-4 py-2.5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Upcoming deadlines</p>
                          </div>
                        )}
                        {deadlineNotifications.map((task) => {
                          const due = new Date(task.due_at!);
                          const diffH = (due.getTime() - Date.now()) / 3_600_000;
                          const isOverdue = diffH < 0;
                          const isUrgent = !isOverdue && diffH < 24;
                          const isWarning = !isOverdue && diffH >= 24 && diffH < 72;
                          const dotColor = isOverdue ? "bg-red-500" : isUrgent ? "bg-red-400" : isWarning ? "bg-amber-400" : "bg-emerald-400";
                          const timeLabel = isOverdue
                            ? `Overdue by ${Math.abs(Math.round(diffH))}h`
                            : diffH < 24
                            ? `Due in ${Math.round(diffH)}h`
                            : diffH < 48
                            ? "Due tomorrow"
                            : due.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

                          return (
                            <div
                              key={task.id}
                              className="flex cursor-pointer items-start gap-3 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-white/5"
                              onClick={() => { navigateToView("dashboard"); setNotifOpen(false); }}
                            >
                              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{task.title}</p>
                                <div className="mt-0.5 flex items-center gap-2">
                                  <Clock3 size={11} className="shrink-0 text-slate-400 dark:text-slate-400" />
                                  <span className={`text-xs ${isOverdue ? "text-red-500" : isUrgent ? "text-red-400" : isWarning ? "text-amber-500" : "text-slate-500 dark:text-slate-400"}`}>
                                    {timeLabel}
                                  </span>
                                  {task.type && <span className="text-xs text-slate-400 dark:text-slate-400">· {task.type}</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {reminderNotifications.length > 0 && (
                          <div className="border-b border-t border-slate-100 px-4 py-2.5 dark:border-white/10">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-400">Reminders</p>
                          </div>
                        )}
                        {reminderNotifications.map((item) => (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => handleNotificationAction(item)}
                            className="block w-full px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-white/5"
                          >
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{item.title}</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.reason}</p>
                            <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                              {item.action_label ?? "Open"}
                              <ExternalLink size={12} />
                            </span>
                          </button>
                        ))}

                        {deadlineNotifications.length === 0 && reminderNotifications.length === 0 && (
                          <div className="px-4 py-8 text-center">
                            <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
                            <p className="text-sm font-medium text-slate-900 dark:text-white">All clear!</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">No urgent deadlines or setup reminders right now.</p>
                          </div>
                        )}

                        {pendingTasks.filter((t) => !t.due_at).length > 0 && (
                          <div className="px-4 py-2.5">
                            <p className="text-xs text-slate-400 dark:text-slate-400">
                              +{pendingTasks.filter((t) => !t.due_at).length} task{pendingTasks.filter((t) => !t.due_at).length > 1 ? "s" : ""} with no deadline
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-100 px-4 py-2.5 dark:border-white/10">
                        <div className="flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => { navigateToView("dashboard"); setNotifOpen(false); }}
                            className="text-xs font-medium text-slate-700 transition hover:underline underline-offset-2 dark:text-slate-300"
                          >
                            View all in feed →
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNotificationAction({ action_view: "settings" })}
                            className="text-xs text-slate-400 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                          >
                            Open settings
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Pro badge / Upgrade button */}
              {isPro ? (
                <div className="inline-flex items-center gap-1.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700 sm:gap-2 sm:px-4 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <span>Pro</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPricingOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:gap-2 sm:px-4 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                >
                  <span>Upgrade to Pro</span>
                </button>
              )}
            </div>
          </div>

        </header>

        {/* Post-payment activation banners */}
        <AnimatePresence>
          {paymentPending && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mx-auto mb-4 max-w-7xl flex items-center gap-3 rounded-[22px] border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700"
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
              className="mx-auto mb-4 max-w-7xl flex items-center gap-3 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
            >
              <CheckCircle2 size={15} className="shrink-0" />
              Pro is now active on your account. Enjoy unlimited access!
            </motion.div>
          )}
          {paymentFailed && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mx-auto mb-4 max-w-7xl flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"
            >
              <span className="flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0 text-amber-500" />
                Payment received but activation is taking longer than expected.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleManualActivate}
                  disabled={manualActivating}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {manualActivating && <Loader2 size={11} className="animate-spin" />}
                  Activate now
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setPaymentFailed(false);
                    await fetchStatus();
                    const res = await fetch("/api/user/status");
                    if (res.ok) {
                      const data = await res.json();
                      const activated = Boolean(data.pro_status) && (!data.pro_expires_at || new Date(data.pro_expires_at) > new Date());
                      if (activated) {
                        setIsPro(true);
                        setPaymentActivated(true);
                        setTimeout(() => setPaymentActivated(false), 6000);
                      } else {
                        setPaymentFailed(true);
                      }
                    } else {
                      setPaymentFailed(true);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
                >
                  <RefreshCw size={11} /> Refresh
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/*
          mode="wait" serialized a 0.2s exit-then-0.2s-enter on every click —
          a fixed ~400ms tax independent of how fast the data actually is.
          popLayout lets the incoming view start rendering immediately while
          the outgoing one fades out in place, so the click *feels* instant
          while keeping a light, intentional transition instead of a hard cut.
        */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.section
            key={activeView}
            animate={{ opacity: 1 }}
            className="mx-auto max-w-7xl"
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
          >
            <Suspense fallback={<SimpleSkeleton />}>
              {view[activeView]}
            </Suspense>
          </motion.section>
        </AnimatePresence>
      </div>

      {/* Native-Grade Mobile Bottom Navigation */}
      <MobileNav />

      <CareerSheet open={careerSheetOpen} onClose={() => setCareerSheetOpen(false)} />

      <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} isPro={isPro} />
    </main>
  );
}
