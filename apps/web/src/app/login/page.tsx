"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Bot, Eye, EyeOff, Lock, Mail, User, ChevronLeft } from "lucide-react";
import Link from "next/link";
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

  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const [tab, setTab] = useState<"signin" | "signup">(initialMode);
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
          <section className="w-full max-w-md rounded-[32px] p-6 text-center sm:p-8 bg-[#0a0c10]/90 border border-white/10 backdrop-blur-2xl shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950">
              <Bot size={22} />
            </div>
            <h1 className="text-2xl font-serif text-white">Completing sign-in…</h1>
            <p className="mt-3 text-xs sm:text-sm leading-6 text-slate-400">
              Redirecting your session back into PrioryxAI.
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
        if (data.noAccount) {
          setTab("signup");
          setInfo("No account found for this email — let's create one.");
          setError(null);
          return;
        }
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
      <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center px-4 py-12">
        {/* Back to Home link */}
        <Link
          href="/"
          className="absolute top-6 left-6 flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} />
          <span>Back to Home</span>
        </Link>

        <div className="relative w-full max-w-lg mx-auto text-center">
          {/* Ambient Glass Light Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-gradient-to-br from-cyan-500/15 via-white/[0.08] to-violet-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

          {/* Main Serif Heading (exact match to image) */}
          <motion.h1
            key={tab}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-4xl sm:text-5xl md:text-[58px] font-serif text-white tracking-tight leading-tight mb-3 font-normal"
          >
            {tab === "signup" ? "Get started with Us" : "Welcome back to Us"}
          </motion.h1>

          {/* Subheading */}
          <p className="text-slate-400 text-sm sm:text-[15px] font-medium mb-6">
            Continue with
          </p>

          {/* Social OAuth pill buttons */}
          <div className="flex items-center justify-center gap-3.5 mb-7">
            {/* Google Pill */}
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              className="px-6 py-2.5 sm:px-7 sm:py-3 rounded-full bg-gradient-to-b from-white/[0.16] to-white/[0.06] hover:from-white/[0.24] hover:to-white/[0.12] border border-white/30 hover:border-white/50 text-white text-sm sm:text-base font-medium flex items-center gap-2.5 shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.45),0_8px_24px_rgba(0,0,0,0.35)] hover:shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.6),0_0_24px_rgba(255,255,255,0.2)] transition-all active:scale-95 cursor-pointer backdrop-blur-2xl"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Google</span>
            </button>

            {/* GitHub Pill */}
            <button
              type="button"
              onClick={() => handleOAuth("github")}
              className="px-6 py-2.5 sm:px-7 sm:py-3 rounded-full bg-gradient-to-b from-white/[0.16] to-white/[0.06] hover:from-white/[0.24] hover:to-white/[0.12] border border-white/30 hover:border-white/50 text-white text-sm sm:text-base font-medium flex items-center gap-2.5 shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.45),0_8px_24px_rgba(0,0,0,0.35)] hover:shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.6),0_0_24px_rgba(255,255,255,0.2)] transition-all active:scale-95 cursor-pointer backdrop-blur-2xl"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0 text-white">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.699-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              <span>GitHub</span>
            </button>
          </div>

          {/* Subtle OR Divider Line */}
          <div className="relative w-full max-w-[430px] mx-auto flex items-center justify-center my-6">
            <div className="w-full border-t border-white/15" />
            <span className="absolute px-4 bg-transparent text-[11px] font-bold text-slate-400 uppercase tracking-widest backdrop-blur-md">
              OR
            </span>
          </div>

          {/* Form with Capsule Pill Input Fields (Apple Liquid Glassmorphism) */}
          <form onSubmit={handleEmailSubmit} className="space-y-3.5 max-w-[430px] mx-auto text-left">
            {tab === "signup" && (
              <div className="group flex items-center gap-3.5 w-full rounded-full bg-gradient-to-b from-white/[0.14] to-white/[0.05] hover:from-white/[0.20] hover:to-white/[0.09] border border-white/25 hover:border-white/45 px-5 py-3.5 text-white backdrop-blur-2xl shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(0,0,0,0.3),0_8px_24px_rgba(0,0,0,0.3)] focus-within:from-white/[0.24] focus-within:to-white/[0.12] focus-within:border-white/70 focus-within:ring-2 focus-within:ring-white/20 focus-within:shadow-[inset_0_1.5px_1.5px_rgba(255,255,255,0.6),0_0_24px_rgba(255,255,255,0.2),0_12px_32px_rgba(0,0,0,0.4)] transition-all duration-200">
                <User size={19} className="text-slate-300 group-focus-within:text-white group-hover:text-white transition-colors shrink-0" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name (optional)"
                  autoComplete="name"
                  className="bg-transparent text-white placeholder:text-slate-300/60 text-sm sm:text-[15px] outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 border-none shadow-none w-full font-medium tracking-normal"
                />
              </div>
            )}

            {/* Email Capsule Pill Input */}
            <div className="group flex items-center gap-3.5 w-full rounded-full bg-gradient-to-b from-white/[0.14] to-white/[0.05] hover:from-white/[0.20] hover:to-white/[0.09] border border-white/25 hover:border-white/45 px-5 py-3.5 text-white backdrop-blur-2xl shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(0,0,0,0.3),0_8px_24px_rgba(0,0,0,0.3)] focus-within:from-white/[0.24] focus-within:to-white/[0.12] focus-within:border-white/70 focus-within:ring-2 focus-within:ring-white/20 focus-within:shadow-[inset_0_1.5px_1.5px_rgba(255,255,255,0.6),0_0_24px_rgba(255,255,255,0.2),0_12px_32px_rgba(0,0,0,0.4)] transition-all duration-200">
              <Mail size={19} className="text-slate-300 group-focus-within:text-white group-hover:text-white transition-colors shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                autoComplete="email"
                required
                className="bg-transparent text-white placeholder:text-slate-300/60 text-sm sm:text-[15px] outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 border-none shadow-none w-full font-medium tracking-normal"
              />
            </div>

            {/* Password Capsule Pill Input */}
            <div className="group flex items-center gap-3.5 w-full rounded-full bg-gradient-to-b from-white/[0.14] to-white/[0.05] hover:from-white/[0.20] hover:to-white/[0.09] border border-white/25 hover:border-white/45 px-5 py-3.5 text-white backdrop-blur-2xl shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(0,0,0,0.3),0_8px_24px_rgba(0,0,0,0.3)] focus-within:from-white/[0.24] focus-within:to-white/[0.12] focus-within:border-white/70 focus-within:ring-2 focus-within:ring-white/20 focus-within:shadow-[inset_0_1.5px_1.5px_rgba(255,255,255,0.6),0_0_24px_rgba(255,255,255,0.2),0_12px_32px_rgba(0,0,0,0.4)] transition-all duration-200">
              <Lock size={19} className="text-slate-300 group-focus-within:text-white group-hover:text-white transition-colors shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === "signup" ? "Create Password (min. 8 chars)" : "Password"}
                autoComplete={tab === "signup" ? "new-password" : "current-password"}
                required
                minLength={tab === "signup" ? 8 : 1}
                className="bg-transparent text-white placeholder:text-slate-300/60 text-sm sm:text-[15px] outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 border-none shadow-none w-full font-medium tracking-normal"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-slate-300 hover:text-white transition-colors shrink-0 p-0.5 rounded-full hover:bg-white/10"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {tab === "signup" && (
              <div className="group flex items-center gap-3.5 w-full rounded-full bg-gradient-to-b from-white/[0.14] to-white/[0.05] hover:from-white/[0.20] hover:to-white/[0.09] border border-white/25 hover:border-white/45 px-5 py-3.5 text-white backdrop-blur-2xl shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(0,0,0,0.3),0_8px_24px_rgba(0,0,0,0.3)] focus-within:from-white/[0.24] focus-within:to-white/[0.12] focus-within:border-white/70 focus-within:ring-2 focus-within:ring-white/20 focus-within:shadow-[inset_0_1.5px_1.5px_rgba(255,255,255,0.6),0_0_24px_rgba(255,255,255,0.2),0_12px_32px_rgba(0,0,0,0.4)] transition-all duration-200">
                <Lock size={19} className="text-slate-300 group-focus-within:text-white group-hover:text-white transition-colors shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  autoComplete="new-password"
                  required
                  className="bg-transparent text-white placeholder:text-slate-300/60 text-sm sm:text-[15px] outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 border-none shadow-none w-full font-medium tracking-normal"
                />
              </div>
            )}

            {error && (
              <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-medium text-red-300 text-center">
                {error}
              </p>
            )}
            {info && (
              <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-medium text-emerald-300 text-center">
                {info}
              </p>
            )}

            {/* Pill Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-white hover:bg-slate-100 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-slate-950 transition-all active:scale-98 disabled:opacity-50 shadow-xl cursor-pointer"
            >
              <span>
                {loading
                  ? tab === "signin"
                    ? "Signing in…"
                    : "Creating account…"
                  : tab === "signin"
                    ? "Sign In"
                    : "Get Started"}
              </span>
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Switch Mode Footer */}
          <div className="mt-8 text-sm text-slate-400 font-medium">
            {tab === "signup" ? (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setTab("signin");
                    setError(null);
                    setInfo(null);
                  }}
                  className="text-white font-bold hover:underline cursor-pointer ml-1"
                >
                  Sign in
                </button>
              </p>
            ) : (
              <p>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setTab("signup");
                    setError(null);
                    setInfo(null);
                  }}
                  className="text-white font-bold hover:underline cursor-pointer ml-1"
                >
                  Sign up free
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </ModernLoginSignup>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LoginForm />
    </Suspense>
  );
}
