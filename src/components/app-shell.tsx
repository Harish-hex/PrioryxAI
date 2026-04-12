"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Bell, CheckCircle2, Clock3, Command, Copy, ExternalLink, Loader2, RefreshCw, Settings, Sparkles, UserRound, X } from "lucide-react";
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
  const [activeView, setActiveView] = useState(initialView);
  const [collapsed, setCollapsed] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [setupItems, setSetupItems] = useState<any[]>([]);
  const [stats, setStats] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const [hiddenPreview, setHiddenPreview] = useState<{ count: number; topJobTitle: string | null; breakdown: string | null } | null>(null);

  // Pro state
  const [isPro, setIsPro] = useState(false);
  const [messagesUsedToday, setMessagesUsedToday] = useState(0);
  const [visionUsedToday, setVisionUsedToday] = useState(0);

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

      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileMenuOpen(false);
      }
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
      if (res.ok) setStats(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchFeed();
    fetchStats();
    fetchStatus();
  }, [fetchFeed, fetchStats, fetchStatus]);

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

  // Shared polling function — polls /api/user/status every 5s for up to 5 minutes
  const startPaymentPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    let attempts = 0;
    const MAX_ATTEMPTS = 60; // 60 × 5s = 5 minutes
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
            setIsPro(true); // triggers prevIsProRef effect → shows banner
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

  // Fix 1 — Referrer-based trigger: user came back from Razorpay without ?payment=success
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromRazorpay =
      document.referrer.includes("rzp.io") ||
      document.referrer.includes("razorpay.com");
    if (!fromRazorpay) return;
    // Don't double-start if ?payment=success also triggers below
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") return;
    setPaymentPending(true);
    startPaymentPolling();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fix 2 — URL-based trigger: ?payment=success in redirect URL (+ optional Razorpay params)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") !== "success") return;

    // Grab Razorpay redirect params before stripping URL
    const razorpayParams = {
      razorpay_payment_id: params.get("razorpay_payment_id"),
      razorpay_payment_link_id: params.get("razorpay_payment_link_id"),
      razorpay_payment_link_reference_id: params.get("razorpay_payment_link_reference_id"),
      razorpay_payment_link_status: params.get("razorpay_payment_link_status"),
      razorpay_signature: params.get("razorpay_signature"),
    };
    // Only need a payment_id — signature is optional (verified server-side when available)
    const hasRedirectParams = Boolean(razorpayParams.razorpay_payment_id);

    // Strip all query params from the URL without a page reload
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
          setIsPro(true);
          setPaymentPending(false);
          return true;
        }
        const errData = await res.json().catch(() => ({}));
        console.error('[payment] verify failed:', res.status, errData);
      } catch (e) {
        console.error('[payment] verify threw:', e);
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

  // Fix 3 — Silent delayed re-fetches for all non-pro users on page load
  // Catches webhook activations that fire after the initial fetchStatus() call
  useEffect(() => {
    if (isPro) return;
    const t1 = setTimeout(() => fetchStatus(), 5_000);
    const t2 = setTimeout(() => fetchStatus(), 15_000);
    const t3 = setTimeout(() => fetchStatus(), 30_000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  // Run once on mount — isPro in deps would re-trigger unnecessarily
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

    if (item?.action_view === "assistant") {
      navigateToView("assistant");
      setNotifOpen(false);
      return;
    }

    if (item?.action_view === "profile") {
      navigateToView("profile");
      setNotifOpen(false);
      return;
    }

    if (item?.action_view === "dashboard") {
      navigateToView("dashboard");
      setNotifOpen(false);
      return;
    }

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
            <div ref={profileMenuRef} className="relative hidden md:block">
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen((open) => !open);
                  setNotifOpen(false);
                }}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  profileMenuOpen
                    ? "border-volt/30 bg-volt/10 text-white"
                    : "border-white/10 bg-white/[0.06] text-neutral-200 hover:border-white/20 hover:bg-white/[0.1]"
                }`}
                title="Profile actions"
              >
                <UserRound size={16} />
                <span>@{username}</span>
              </button>

              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-lg border border-white/10 bg-[#0d0d0d] shadow-2xl"
                  >
                    <div className="border-b border-white/10 px-4 py-3">
                      <p className="text-sm font-semibold text-white">@{username}</p>
                      <p className="mt-1 text-xs text-neutral-500">Open, share, or edit your recruiter-facing profile.</p>
                    </div>

                    <div className="p-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigateToView("profile");
                          setProfileMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-neutral-200 transition hover:bg-white/[0.05]"
                      >
                        <UserRound size={15} className="text-volt" />
                        <span>Open in-app profile</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenPublicProfile}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-neutral-200 transition hover:bg-white/[0.05]"
                      >
                        <ExternalLink size={15} className="text-volt" />
                        <span>Open public profile</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyProfileLink}
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-neutral-200 transition hover:bg-white/[0.05]"
                      >
                        <span className="inline-flex items-center gap-3">
                          <Copy size={15} className="text-volt" />
                          <span>Copy public profile link</span>
                        </span>
                        {profileLinkCopied && <span className="text-xs text-mint">Copied</span>}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigateToView("settings");
                          setProfileMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-neutral-200 transition hover:bg-white/[0.05]"
                      >
                        <Settings size={15} className="text-volt" />
                        <span>Edit profile settings</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notification bell + dropdown */}
            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((open) => !open);
                  setProfileMenuOpen(false);
                }}
                className={`relative rounded-lg border p-2.5 transition ${
                  notifOpen
                    ? "border-volt/30 bg-volt/10 text-volt"
                    : "border-white/10 bg-white/[0.06] text-neutral-200 hover:border-white/20 hover:bg-white/[0.1]"
                }`}
                aria-label="Notifications"
              >
                <Bell size={18} />
                {notificationCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white ring-2 ring-black">
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
                    className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-white/10 bg-[#0d0d0d] shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Bell size={14} className="text-volt" /> Notification center
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotifOpen(false)}
                        className="rounded-md p-1 text-neutral-500 hover:text-white transition"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto divide-y divide-white/[0.06]">
                      {deadlineNotifications.length > 0 && (
                        <div className="border-b border-white/[0.06] px-4 py-2.5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Upcoming deadlines</p>
                        </div>
                      )}
                      {deadlineNotifications.map((task) => {
                        const due = new Date(task.due_at!);
                        const diffH = (due.getTime() - Date.now()) / 3_600_000;
                        const isOverdue = diffH < 0;
                        const isUrgent = !isOverdue && diffH < 24;
                        const isWarning = !isOverdue && diffH >= 24 && diffH < 72;

                        const dotColor = isOverdue ? "bg-red-500" : isUrgent ? "bg-red-400" : isWarning ? "bg-amber-400" : "bg-green-400";
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
                            className="flex cursor-pointer items-start gap-3 px-4 py-3 transition hover:bg-white/[0.03]"
                            onClick={() => {
                              navigateToView("dashboard");
                              setNotifOpen(false);
                            }}
                          >
                            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-white">{task.title}</p>
                              <div className="mt-0.5 flex items-center gap-2">
                                <Clock3 size={11} className="shrink-0 text-neutral-500" />
                                <span className={`text-xs ${isOverdue ? "text-red-400" : isUrgent ? "text-red-300" : isWarning ? "text-amber-300" : "text-neutral-400"}`}>
                                  {timeLabel}
                                </span>
                                {task.type && <span className="text-xs text-neutral-600">· {task.type}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {reminderNotifications.length > 0 && (
                        <div className="border-b border-t border-white/[0.06] px-4 py-2.5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Useful reminders</p>
                        </div>
                      )}
                      {reminderNotifications.map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => handleNotificationAction(item)}
                          className="block w-full px-4 py-3 text-left transition hover:bg-white/[0.03]"
                        >
                          <p className="text-sm font-medium text-white">{item.title}</p>
                          <p className="mt-1 text-xs leading-5 text-neutral-500">{item.reason}</p>
                          <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-volt">
                            {item.action_label ?? "Open"}
                            <ExternalLink size={12} />
                          </span>
                        </button>
                      ))}

                      {deadlineNotifications.length === 0 && reminderNotifications.length === 0 && (
                        <div className="px-4 py-8 text-center">
                          <CheckCircle2 size={24} className="mx-auto mb-2 text-mint" />
                          <p className="text-sm font-medium text-white">All clear!</p>
                          <p className="mt-1 text-xs text-neutral-500">No urgent deadlines or setup reminders right now.</p>
                        </div>
                      )}

                      {pendingTasks.filter((t) => !t.due_at).length > 0 && (
                        <div className="px-4 py-2.5">
                          <p className="text-xs text-neutral-600">
                            +{pendingTasks.filter((t) => !t.due_at).length} task{pendingTasks.filter((t) => !t.due_at).length > 1 ? "s" : ""} with no deadline
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-white/10 px-4 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            navigateToView("dashboard");
                            setNotifOpen(false);
                          }}
                          className="text-xs text-volt transition hover:underline underline-offset-2"
                        >
                          View all in feed →
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNotificationAction({ action_view: "settings" })}
                          className="text-xs text-neutral-400 transition hover:text-white"
                        >
                          Open settings
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
          {paymentFailed && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mx-auto mb-4 max-w-7xl flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
            >
              <span className="flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0 text-amber-400" />
                Payment received but Pro activation is delayed — this can take a minute.
              </span>
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
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-400/20"
              >
                <RefreshCw size={12} /> Refresh now
              </button>
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
