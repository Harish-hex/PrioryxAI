"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Bot, Eye, EyeOff, GitBranch, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import ModernLoginSignup from "@/components/ui/modern-login-signup";

const ERROR_COPY: Record<string, string> = {
  oauth_failed: "OAuth sign-in could not be started. Please try again.",
  no_code: "The provider did not return an auth code.",
  auth_failed: "We could not finish signing you in. Please try again.",
};

type OAuthPopupMessage = {
  type?: string;
  next?: string;
  error?: string;
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/feed";
  const authMode = searchParams.get("mode");
  const urlError = searchParams.get("error");
  const oauthCode = searchParams.get("code");
  const oauthProviderError = searchParams.get("error_description")
    ? "auth_failed"
    : searchParams.get("error_code")
      ? "auth_failed"
      : null;

  const [tab, setTab] = useState<"signin" | "signup">(authMode === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    urlError ? (ERROR_COPY[urlError] ?? "Sign-in failed.") : null
  );
  const [info, setInfo] = useState<string | null>(null);
  const oauthPopupRef = useRef<Window | null>(null);
  const popupClosedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!oauthCode && !oauthProviderError) return;
    const params = new URLSearchParams(searchParams.toString());
    window.location.replace(`/api/auth/callback?${params.toString()}`);
  }, [oauthCode, oauthProviderError, searchParams]);

  useEffect(() => {
    setTab(authMode === "signup" ? "signup" : "signin");
    setError(null);
    setInfo(null);
  }, [authMode]);

  useEffect(() => {
    function handleOAuthMessage(event: MessageEvent<OAuthPopupMessage>) {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "prioryx-oauth-error") {
        setError(ERROR_COPY[event.data.error ?? "auth_failed"] ?? "Sign-in failed.");
        setInfo(null);
        oauthPopupRef.current?.close();
        return;
      }

      if (event.data?.type !== "prioryx-oauth-complete") return;

      const destination =
        typeof event.data.next === "string" && event.data.next.startsWith("/")
          ? event.data.next
          : next;

      oauthPopupRef.current?.close();
      window.location.assign(destination);
    }

    window.addEventListener("message", handleOAuthMessage);
    return () => {
      window.removeEventListener("message", handleOAuthMessage);
      if (popupClosedTimerRef.current !== null) {
        window.clearInterval(popupClosedTimerRef.current);
      }
    };
  }, [next, router]);

  if (oauthCode || oauthProviderError) {
    return (
      <ModernLoginSignup>
        <div className="flex w-full items-center justify-center px-4 py-8 sm:px-6">
          <section className="glass-strong w-full max-w-lg rounded-[32px] p-6 text-center sm:p-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
              <Bot size={20} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Completing sign-in…</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Redirecting your OAuth session back into the app.
            </p>
          </section>
        </div>
      </ModernLoginSignup>
    );
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (tab === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const endpoint = tab === "signin" ? "/api/auth/signin" : "/api/auth/signup";
    const body: Record<string, string> = { email, password, next };
    if (tab === "signup" && name) body.name = name;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      if (data.message) {
        setInfo(data.message);
        return;
      }

      router.push(data.redirect ?? next);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const getOAuthUrl = (provider: "github" | "google") => {
    const params = new URLSearchParams({
      provider,
      next,
      popup: "1",
    });

    return `/api/auth/login?${params.toString()}`;
  };

  const handleOAuth = (event: React.MouseEvent<HTMLAnchorElement>, provider: "github" | "google") => {
    if (typeof window === "undefined") return;

    const url = getOAuthUrl(provider);
    const width = 520;
    const height = 720;
    const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
    const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);
    const popupFeatures = [
      `width=${width}`,
      `height=${height}`,
      `left=${Math.round(left)}`,
      `top=${Math.round(top)}`,
      "menubar=no",
      "toolbar=no",
      "location=yes",
      "status=no",
      "resizable=yes",
      "scrollbars=yes",
    ].join(",");
    const popup = window.open("", "prioryxai-oauth", popupFeatures);

    if (!popup || popup.closed) {
      return;
    }

    event.preventDefault();
    oauthPopupRef.current = popup;
    popup.focus();
    popup.document.title = "Opening PrioryxAI sign-in…";
    popup.document.body.innerHTML =
      '<div style="min-height:100vh;display:grid;place-items:center;background:#0c1222;color:white;font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;text-align:center;padding:24px"><div><h1 style="font-size:20px;margin:0 0 8px">Opening sign-in…</h1><p style="margin:0;color:#94a3b8;font-size:14px">Continue in this secure provider window.</p></div></div>';
    popup.location.assign(url);
    setError(null);
    setInfo(`Complete ${provider === "google" ? "Google" : "GitHub"} sign-in in the popup window.`);

    if (popupClosedTimerRef.current !== null) {
      window.clearInterval(popupClosedTimerRef.current);
    }

    popupClosedTimerRef.current = window.setInterval(() => {
      if (!oauthPopupRef.current?.closed) return;
      window.clearInterval(popupClosedTimerRef.current!);
      popupClosedTimerRef.current = null;
      setInfo(null);
    }, 500);
  };

  return (
    <ModernLoginSignup>
      <div className="dark flex w-full items-center justify-center p-2 sm:p-4">
        <section className="w-full max-w-[440px] mx-auto">
          {/* Auth Card */}
          <div className="rounded-[28px] bg-[#0c1222]/95 p-5 sm:p-7 shadow-[0_24px_70px_rgba(0,0,0,0.85)] border border-white/10 backdrop-blur-2xl">
            {/* Brand Header */}
            <div className="flex items-center justify-center mb-4">
              <a href="/" className="flex items-center gap-2.5 group">
                <img
                  src="/logo.png"
                  alt="PrioryxAI"
                  className="h-9 w-9 shrink-0 object-contain drop-shadow-md transition-transform group-hover:scale-105"
                />
                <span className="text-2xl font-black tracking-tight text-white">PrioryxAI</span>
              </a>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/50 p-1 backdrop-blur-md">
              {(["signin", "signup"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTab(t); setError(null); setInfo(null); setConfirmPassword(""); }}
                  className={`rounded-lg py-2 px-3 text-xs sm:text-sm font-bold transition-all ${
                    tab === t
                      ? "!bg-white !text-slate-950 shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t === "signin" ? "Sign in" : "Sign up"}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <div className="mt-3.5 mb-3">
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                    {tab === "signin" ? "Welcome back" : "Create account"}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {tab === "signin"
                      ? "Sign in to access your priority feed & readiness score."
                      : "Start building your career with PrioryxAI."}
                  </p>
                </div>

                {/* OAuth buttons */}
                <div className="space-y-2">
                  <a
                    href={getOAuthUrl("github")}
                    target="prioryxai-oauth"
                    onClick={(event) => handleOAuth(event, "github")}
                    className="group flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/[0.1]"
                  >
                    <span className="flex items-center gap-2.5">
                      <GitBranch size={17} className="text-cyan-400" />
                      Continue with GitHub
                    </span>
                    <ArrowRight size={14} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-white" />
                  </a>
                  <a
                    href={getOAuthUrl("google")}
                    target="prioryxai-oauth"
                    onClick={(event) => handleOAuth(event, "google")}
                    className="group flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/[0.1]"
                  >
                    <span className="flex items-center gap-2.5">
                      <Mail size={17} className="text-rose-400" />
                      Continue with Google
                    </span>
                    <ArrowRight size={14} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-white" />
                  </a>
                </div>

                {/* Divider */}
                <div className="my-3 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">or with email</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                {/* Email / password form */}
                <form onSubmit={handleEmailSubmit} className="space-y-2.5">
                  {tab === "signup" && (
                    <div>
                      <label htmlFor="auth-name" className="mb-1 block text-xs font-semibold text-slate-300">Name (optional)</label>
                      <input
                        id="auth-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Aarav Mehta"
                        autoComplete="name"
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition"
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="auth-email" className="mb-1 block text-xs font-semibold text-slate-300">Email</label>
                    <input
                      id="auth-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@college.edu"
                      autoComplete="email"
                      required
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="auth-password" className="mb-1 block text-xs font-semibold text-slate-300">Password</label>
                    <div className="relative">
                      <input
                        id="auth-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={tab === "signup" ? "Min. 8 characters" : "Your password"}
                        autoComplete={tab === "signup" ? "new-password" : "current-password"}
                        required
                        minLength={tab === "signup" ? 8 : 1}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 pr-10 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide typed characters" : "Show typed characters"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {tab === "signup" && (
                    <div>
                      <label htmlFor="auth-confirm-password" className="mb-1 block text-xs font-semibold text-slate-300">Confirm password</label>
                      <input
                        id="auth-confirm-password"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                        required
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition"
                      />
                    </div>
                  )}

                  {error && (
                    <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400">
                      {error}
                    </p>
                  )}
                  {info && (
                    <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300">
                      {info}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl !bg-white py-2.5 text-xs sm:text-sm font-black !text-slate-950 transition hover:!bg-slate-100 hover:scale-[1.005] active:scale-[0.995] disabled:opacity-50 shadow-[0_4px_16px_rgba(255,255,255,0.2)]"
                  >
                    {loading
                      ? tab === "signin" ? "Signing in…" : "Creating account…"
                      : tab === "signin" ? "Sign In" : "Create Account"}
                  </button>
                </form>

                {tab === "signin" && (
                  <p className="mt-3.5 text-center text-xs text-slate-400">
                    No account?{" "}
                    <button
                      type="button"
                      onClick={() => setTab("signup")}
                      className="font-bold text-white underline-offset-4 hover:underline"
                    >
                      Sign up free
                    </button>
                  </p>
                )}
                {tab === "signup" && (
                  <p className="mt-3.5 text-center text-xs text-slate-400">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setTab("signin")}
                      className="font-bold text-white underline-offset-4 hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </div>
    </ModernLoginSignup>
  );
}

export default function Page() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
