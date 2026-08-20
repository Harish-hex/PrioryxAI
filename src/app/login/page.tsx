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
        <section className="w-full max-w-[580px] mx-auto">
          {/* Auth Card */}
          <div className="rounded-[36px] bg-[#111927]/90 p-8 sm:p-12 shadow-[0_24px_70px_rgba(0,0,0,0.7)] border border-white/10 backdrop-blur-xl">
            {/* Brand Header */}
            <div className="flex items-center justify-center mb-8">
              <a href="/" className="flex items-center gap-3.5 group">
                <img
                  src="/logo.png"
                  alt="PrioryxAI"
                  className="h-14 w-14 shrink-0 object-contain drop-shadow-md transition-transform group-hover:scale-105"
                />
                <span className="text-3xl font-extrabold tracking-tight text-white">PrioryxAI</span>
              </a>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/50 p-1.5 backdrop-blur-md">
              {(["signin", "signup"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTab(t); setError(null); setInfo(null); setConfirmPassword(""); }}
                  className={`rounded-xl py-3.5 px-4 text-base font-bold transition-all ${
                    tab === t
                      ? "!bg-white !text-slate-950 shadow-lg"
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
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="mt-8 text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                  {tab === "signin" ? "Welcome back" : "Create your account"}
                </h2>
                <p className="mt-2 text-base text-slate-300">
                  {tab === "signin"
                    ? "Sign in with your email or a provider below."
                    : "Start with email or use GitHub / Google."}
                </p>

                {/* OAuth buttons */}
                <div className="mt-7 space-y-3.5">
                  <button
                    type="button"
                    onClick={() => handleOAuth("github")}
                    className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-4 text-base font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.12]"
                  >
                    <span className="flex items-center gap-3.5">
                      <GitBranch size={22} className="text-cyan-400" />
                      Continue with GitHub
                    </span>
                    <ArrowRight size={18} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-white" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOAuth("google")}
                    className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-4 text-base font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.12]"
                  >
                    <span className="flex items-center gap-3.5">
                      <Mail size={22} className="text-rose-400" />
                      Continue with Google
                    </span>
                    <ArrowRight size={18} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-white" />
                  </button>
                </div>

                {/* Divider */}
                <div className="my-7 flex items-center gap-4">
                  <div className="h-px flex-1 bg-white/15" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">or with email</span>
                  <div className="h-px flex-1 bg-white/15" />
                </div>

                {/* Email / password form */}
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  {tab === "signup" && (
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-200">Name (optional)</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Aarav Mehta"
                        autoComplete="name"
                        className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3.5 text-base text-white placeholder-slate-500 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition"
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-200">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@college.edu"
                      autoComplete="email"
                      required
                      className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3.5 text-base text-white placeholder-slate-500 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-200">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={tab === "signup" ? "Min. 8 characters" : "Your password"}
                        autoComplete={tab === "signup" ? "new-password" : "current-password"}
                        required
                        minLength={tab === "signup" ? 8 : 1}
                        className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3.5 pr-12 text-base text-white placeholder-slate-500 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {tab === "signup" && (
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-200">Confirm password</label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        autoComplete="new-password"
                        required
                        className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3.5 text-base text-white placeholder-slate-500 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition"
                      />
                    </div>
                  )}

                  {error && (
                    <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">
                      {error}
                    </p>
                  )}
                  {info && (
                    <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300">
                      {info}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl !bg-white py-4 text-base font-extrabold !text-slate-950 transition hover:!bg-slate-100 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 shadow-[0_4px_20px_rgba(255,255,255,0.2)]"
                  >
                    {loading
                      ? tab === "signin" ? "Signing in…" : "Creating account…"
                      : tab === "signin" ? "Sign In" : "Create Account"}
                  </button>
                </form>

                {tab === "signin" && (
                  <p className="mt-6 text-center text-sm text-slate-400">
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
                  <p className="mt-6 text-center text-sm text-slate-400">
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
