"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Bell, Bot, CalendarClock, CheckCircle2, Clock3, Command, Copy, ExternalLink, LayoutDashboard, Loader2, Menu, RefreshCw, Settings, Sparkles, UserRound, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AssistantPanel } from "@/components/assistant-panel";
import { DashboardView, type Task } from "@/components/dashboard-view";
import { PricingModal } from "@/components/pricing-modal";
import { ProfilePage } from "@/components/profile-page";
import { SettingsPanel } from "@/components/settings-panel";
import { Sidebar } from "@/components/sidebar";
import { CareerSheet } from "@/components/mobile-nav";

const pageTitles: Record<string, string> = {
  dashboard: "Dashboard",
  assistant: "Assistant",
  profile: "Profile",
  settings: "Settings",
};

const pageSubtitles: Record<string, string> = {
  dashboard: "Keep the next important step visible and let everything else stay quiet.",
  assistant: "Use context from your tasks to turn a busy day into a simple plan.",
  profile: "Present projects and proof points in a sharper, calmer format.",
  settings: "Tune how the workspace behaves without adding extra noise.",
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
  const [careerSheetOpen, setCareerSheetOpen] = useState(false);

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
          setIsPro(true);
          setPaymentPending(false);
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
      <Sidebar
        activeView={activeView}
        collapsed={collapsed}
        isPro={isPro}
        onNavigate={navigateToView}
        onOpenPricing={() => setPricingOpen(true)}
        onToggle={() => setCollapsed((v) => !v)}
      />

      <div
        className={`min-h-screen px-3 pb-24 pt-3 transition-[padding] duration-300 sm:px-5 sm:pt-4 lg:pb-12 lg:pr-8 lg:pt-6 ${
          collapsed ? "lg:pl-36" : "lg:pl-[21rem]"
        }`}
      >
        {/* Sticky header */}
        <header className="glass sticky top-4 z-30 mx-auto mb-6 max-w-7xl rounded-[28px] px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3 lg:gap-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs text-slate-500 sm:text-sm">
                <Command size={13} className="sm:w-[15px] sm:h-[15px]" />
                <span>PrioryxAI workspace</span>
              </div>
              <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-950 sm:mt-2 sm:text-3xl lg:text-4xl">
                {pageTitles[activeView]}
              </h1>
              <p className="mt-1 hidden max-w-2xl text-sm leading-6 text-slate-500 sm:mt-2 sm:block sm:text-[15px]">
                {pageSubtitles[activeView]}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-600 md:inline-flex">
                <CalendarClock size={16} />
                <span>This week</span>
              </div>

              {/* Profile dropdown */}
              <div ref={profileMenuRef} className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => { setProfileMenuOpen((o) => !o); setNotifOpen(false); }}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-sm transition ${
                    profileMenuOpen
                      ? "border-slate-300 bg-slate-100 text-slate-950"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
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
                      className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
                    >
                      <div className="border-b border-slate-100 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-950">@{username}</p>
                        <p className="mt-1 text-xs text-slate-500">Open, share, or edit your recruiter-facing profile.</p>
                      </div>
                      <div className="p-2">
                        <button
                          type="button"
                          onClick={() => { navigateToView("profile"); setProfileMenuOpen(false); }}
                          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                        >
                          <UserRound size={15} className="text-slate-400" />
                          <span>Open in-app profile</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleOpenPublicProfile}
                          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                        >
                          <ExternalLink size={15} className="text-slate-400" />
                          <span>Open public profile</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyProfileLink}
                          className="flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                        >
                          <span className="inline-flex items-center gap-3">
                            <Copy size={15} className="text-slate-400" />
                            <span>Copy public profile link</span>
                          </span>
                          {profileLinkCopied && <span className="text-xs text-emerald-600">Copied</span>}
                        </button>
                        <button
                          type="button"
                          onClick={() => { navigateToView("settings"); setProfileMenuOpen(false); }}
                          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                        >
                          <Settings size={15} className="text-slate-400" />
                          <span>Edit profile settings</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Notification bell */}
              <div ref={notifRef} className="relative">
                <button
                  type="button"
                  onClick={() => { setNotifOpen((o) => !o); setProfileMenuOpen(false); }}
                  className={`relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
                    notifOpen
                      ? "border-slate-300 bg-slate-100 text-slate-900"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {notificationCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white">
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
                      className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-1rem)] rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.12)] z-50 overflow-hidden"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
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
                              className="flex cursor-pointer items-start gap-3 px-4 py-3 transition hover:bg-slate-50"
                              onClick={() => { navigateToView("dashboard"); setNotifOpen(false); }}
                            >
                              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-slate-900">{task.title}</p>
                                <div className="mt-0.5 flex items-center gap-2">
                                  <Clock3 size={11} className="shrink-0 text-slate-400" />
                                  <span className={`text-xs ${isOverdue ? "text-red-500" : isUrgent ? "text-red-400" : isWarning ? "text-amber-500" : "text-slate-500"}`}>
                                    {timeLabel}
                                  </span>
                                  {task.type && <span className="text-xs text-slate-400">· {task.type}</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {reminderNotifications.length > 0 && (
                          <div className="border-b border-t border-slate-100 px-4 py-2.5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Reminders</p>
                          </div>
                        )}
                        {reminderNotifications.map((item) => (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => handleNotificationAction(item)}
                            className="block w-full px-4 py-3 text-left transition hover:bg-slate-50"
                          >
                            <p className="text-sm font-medium text-slate-900">{item.title}</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">{item.reason}</p>
                            <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                              {item.action_label ?? "Open"}
                              <ExternalLink size={12} />
                            </span>
                          </button>
                        ))}

                        {deadlineNotifications.length === 0 && reminderNotifications.length === 0 && (
                          <div className="px-4 py-8 text-center">
                            <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
                            <p className="text-sm font-medium text-slate-900">All clear!</p>
                            <p className="mt-1 text-xs text-slate-500">No urgent deadlines or setup reminders right now.</p>
                          </div>
                        )}

                        {pendingTasks.filter((t) => !t.due_at).length > 0 && (
                          <div className="px-4 py-2.5">
                            <p className="text-xs text-slate-400">
                              +{pendingTasks.filter((t) => !t.due_at).length} task{pendingTasks.filter((t) => !t.due_at).length > 1 ? "s" : ""} with no deadline
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-100 px-4 py-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => { navigateToView("dashboard"); setNotifOpen(false); }}
                            className="text-xs font-medium text-slate-700 transition hover:underline underline-offset-2"
                          >
                            View all in feed →
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNotificationAction({ action_view: "settings" })}
                            className="text-xs text-slate-400 transition hover:text-slate-700"
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
                <div className="inline-flex items-center gap-1.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700 sm:gap-2 sm:px-4">
                  <Sparkles size={14} />
                  <span className="hidden sm:inline">Pro ✓</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPricingOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:gap-2 sm:px-4"
                >
                  <Sparkles size={16} />
                  <span className="hidden sm:inline">Pro</span>
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
                  {manualActivating ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
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

        <AnimatePresence mode="wait">
          <motion.section
            key={activeView}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-7xl"
            exit={{ opacity: 0, y: 8 }}
            initial={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {view[activeView]}
          </motion.section>
        </AnimatePresence>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 bg-white/92 pb-safe backdrop-blur-xl lg:hidden" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}>
        <div className="flex items-center justify-around px-2 pt-2">
          {[
            { id: "dashboard", label: "Home", icon: LayoutDashboard },
            { id: "assistant", label: "AI", icon: Bot },
            { id: "career", label: "Career", icon: Menu },
            { id: "profile", label: "Profile", icon: UserRound },
            { id: "settings", label: "Settings", icon: Settings },
          ].map(({ id, label, icon: Icon }) => {
            const active = id === "career" ? careerSheetOpen : activeView === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => (id === "career" ? setCareerSheetOpen(true) : navigateToView(id))}
                className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-medium transition ${
                  active ? "text-slate-950" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-2xl transition ${active ? "bg-slate-950 text-white" : ""}`}>
                  <Icon size={18} />
                </div>
                {label}
              </button>
            );
          })}
        </div>
      </nav>

      <CareerSheet open={careerSheetOpen} onClose={() => setCareerSheetOpen(false)} />

      <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} isPro={isPro} />
    </main>
  );
}
