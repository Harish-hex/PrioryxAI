"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Bot, Eye, EyeOff, GitBranch, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import ModernLoginSignup from "@/components/ui/modern-login-signup";

const ERROR_COPY: Record<string, string> = {
  oauth_failed: "OAuth sign-in could not be started. Please try again.",
  no_code: "The provider did not return an auth code.",
  auth_failed: "We could not finish signing you in. Please try again.",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/feed";
  const urlError = searchParams.get("error");
  const oauthCode = searchParams.get("code");
  const oauthProviderError = searchParams.get("error_description")
    ? "auth_failed"
    : searchParams.get("error_code")
      ? "auth_failed"
      : null;

  const [tab, setTab] = useState<"signin" | "signup">("signin");
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

  useEffect(() => {
    if (!oauthCode && !oauthProviderError) return;
    const params = new URLSearchParams(searchParams.toString());
    window.location.replace(`/api/auth/callback?${params.toString()}`);
  }, [oauthCode, oauthProviderError, searchParams]);

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

  const handleOAuth = (provider: "github" | "google") => {
    const url = `/api/auth/login?provider=${provider}&next=${encodeURIComponent(next)}`;
    if (typeof window !== "undefined" && window.self !== window.top) {
      window.open(url, "_blank");
    } else {
      window.location.href = url;
    }
  };

  return (
    <ModernLoginSignup>
      <div className="flex w-full items-center justify-center px-4 py-8 sm:px-6">
        <section className="w-full max-w-md mx-auto">
          {/* Auth Card */}
          <div className="glass-strong rounded-[32px] p-6 sm:p-8 shadow-2xl">
            {/* Brand Header */}
            <div className="flex items-center justify-center mb-6">
              <a href="/" className="flex items-center gap-2.5">
                <img
                  src="/logo.png"
                  alt="PrioryxAI"
                  className="h-10 w-10 shrink-0 object-contain drop-shadow-sm"
                />
                <span className="text-base font-bold tracking-tight text-slate-950 dark:text-white">PrioryxAI</span>
              </a>
            </div>
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-slate-200 bg-slate-100 p-1">
            {(["signin", "signup"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setError(null); setInfo(null); setConfirmPassword(""); }}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  tab === t
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
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
              <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-950">
                {tab === "signin" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {tab === "signin"
                  ? "Sign in with your email or a provider below."
                  : "Start with email or use GitHub / Google."}
              </p>

              {/* OAuth buttons */}
              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={() => handleOAuth("github")}
                  className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span className="flex items-center gap-3">
                    <GitBranch size={18} className="text-slate-500" />
                    Continue with GitHub
                  </span>
                  <ArrowRight size={15} className="text-slate-400 transition group-hover:text-slate-700" />
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuth("google")}
                  className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span className="flex items-center gap-3">
                    <Mail size={18} className="text-slate-500" />
                    Continue with Google
                  </span>
                  <ArrowRight size={15} className="text-slate-400 transition group-hover:text-slate-700" />
                </button>
              </div>

              {/* Divider */}
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs text-slate-400">or with email</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Email / password form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                {tab === "signup" && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-500">Name (optional)</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Aarav Mehta"
                      autoComplete="name"
                      className="input-base"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@college.edu"
                    autoComplete="email"
                    required
                    className="input-base"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={tab === "signup" ? "Min. 8 characters" : "Your password"}
                      autoComplete={tab === "signup" ? "new-password" : "current-password"}
                      required
                      minLength={tab === "signup" ? 8 : 1}
                      className="input-base pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {tab === "signup" && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-500">Confirm password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      required
                      className="input-base"
                    />
                  </div>
                )}

                {error && (
                  <p className="rounded-[18px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
                    {error}
                  </p>
                )}
                {info && (
                  <p className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
                    {info}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {loading
                    ? tab === "signin" ? "Signing in…" : "Creating account…"
                    : tab === "signin" ? "Sign in" : "Create account"}
                </button>
              </form>

              {tab === "signin" && (
                <p className="mt-4 text-center text-xs text-slate-500">
                  No account?{" "}
                  <button
                    type="button"
                    onClick={() => setTab("signup")}
                    className="font-semibold text-slate-800 underline-offset-2 hover:underline"
                  >
                    Sign up free
                  </button>
                </p>
              )}
              {tab === "signup" && (
                <p className="mt-4 text-center text-xs text-slate-500">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setTab("signin")}
                    className="font-semibold text-slate-800 underline-offset-2 hover:underline"
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
