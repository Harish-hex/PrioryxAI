"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Bot, Briefcase, Check, Eye, EyeOff, GitBranch, Gem, ImagePlus, Lock, Mail, Sparkles, Target } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

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
    if (!oauthCode && !oauthProviderError) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    window.location.replace(`/api/auth/callback?${params.toString()}`);
  }, [oauthCode, oauthProviderError, searchParams]);

  if (oauthCode || oauthProviderError) {
    return (
      <main className="app-background flex min-h-screen items-center justify-center px-4 py-8 text-neutral-100 sm:px-6">
        <section className="glass w-full max-w-lg rounded-lg p-6 text-center sm:p-8">
          <p className="text-sm font-semibold tracking-wide text-volt">PrioryxAI</p>
          <h1 className="mt-4 text-2xl font-semibold text-white">Completing sign-in…</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-400">
            Redirecting your OAuth session back into the app.
          </p>
        </section>
      </main>
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
        // e.g. "Check your email to confirm…"
        setInfo(data.message);
        return;
      }

      // Successful signin → redirect
      router.push(data.redirect ?? next);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-background flex min-h-screen items-center justify-center px-4 py-8 text-neutral-100 sm:px-6">
      <section className="grid w-full max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_460px]">
        {/* Left panel */}
        <div className="glass-strong flex flex-col rounded-lg p-6 sm:p-8">
          {/* Brand */}
          <a href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg accent-border p-px">
              <div className="flex h-full w-full items-center justify-center rounded-[5px] bg-black text-white">
                <Gem size={15} />
              </div>
            </div>
            <span className="text-sm font-semibold text-volt">PrioryxAI</span>
          </a>

          {/* Headline */}
          <h1 className="mt-6 text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Your academic &amp; career<br />command center.
          </h1>
          <p className="mt-3 text-sm leading-7 text-neutral-400">
            Connect GitHub, upload your timetable, and let AI rank your highest-leverage move — exam, internship, or project — in one feed.
          </p>

          {/* Feature list */}
          <div className="mt-8 space-y-4">
            {[
              {
                icon: Sparkles,
                color: "text-volt border-volt/20 bg-volt/10",
                title: "AI-ranked priority feed",
                desc: "Every deadline scored by urgency × career impact. Always know what to do next.",
              },
              {
                icon: GitBranch,
                color: "text-mint border-mint/20 bg-mint/10",
                title: "GitHub sync & health score",
                desc: "Streak, languages, top repos — synced automatically and shown to recruiters.",
              },
              {
                icon: ImagePlus,
                color: "text-aura border-aura/20 bg-aura/10",
                title: "Timetable scanner",
                desc: "Photograph your printed schedule. GPT-4o Vision extracts every exam date instantly.",
              },
              {
                icon: Briefcase,
                color: "text-volt border-volt/20 bg-volt/10",
                title: "Matched internship openings",
                desc: "Live Internshala listings matched to your skills, with stipend and apply deadline.",
              },
              {
                icon: Bot,
                color: "text-mint border-mint/20 bg-mint/10",
                title: "Context-aware AI assistant",
                desc: "Knows your deadlines, GitHub, and load. Ask it to plan your day in one message.",
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className={`mt-0.5 shrink-0 rounded-lg border p-1.5 ${color}`}>
                  <Icon size={14} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-neutral-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust strip */}
          <div className="mt-auto pt-8">
            <div className="flex flex-wrap items-center gap-4 border-t border-white/[0.07] pt-5">
              {[
                { icon: Lock, label: "SSL secured" },
                { icon: Check, label: "Razorpay payments" },
                { icon: Target, label: "Free to start" },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <Icon size={12} className="text-neutral-600" /> {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="glass rounded-lg p-5 sm:p-6">
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-black/35 p-1">
            {(["signin", "signup"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setError(null); setInfo(null); setConfirmPassword(""); }}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  tab === t
                    ? "bg-white text-black"
                    : "text-neutral-400 hover:bg-white/[0.06] hover:text-white"
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
              <h2 className="mt-6 text-2xl font-semibold text-white">
                {tab === "signin" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="mt-1 text-sm text-neutral-400">
                {tab === "signin"
                  ? "Sign in with your email or a provider below."
                  : "Start with email or use GitHub / Google."}
              </p>

              {/* OAuth buttons */}
              <div className="mt-5 space-y-2">
                <a
                  href={`/api/auth/login?provider=github&next=${encodeURIComponent(next)}`}
                  className="group flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.1]"
                >
                  <span className="flex items-center gap-3">
                    <GitBranch size={18} />
                    Continue with GitHub
                  </span>
                  <ArrowRight size={16} className="text-neutral-500 transition group-hover:text-white" />
                </a>
                <a
                  href={`/api/auth/login?provider=google&next=${encodeURIComponent(next)}`}
                  className="group flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.1]"
                >
                  <span className="flex items-center gap-3">
                    <Mail size={18} />
                    Continue with Google
                  </span>
                  <ArrowRight size={16} className="text-neutral-500 transition group-hover:text-white" />
                </a>
              </div>

              {/* Divider */}
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-neutral-500">or with email</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              {/* Email / password form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                {tab === "signup" && (
                  <div>
                    <label className="mb-1.5 block text-xs text-neutral-400">Name (optional)</label>
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
                  <label className="mb-1.5 block text-xs text-neutral-400">Email</label>
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
                  <label className="mb-1.5 block text-xs text-neutral-400">Password</label>
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {tab === "signup" && (
                  <div>
                    <label className="mb-1.5 block text-xs text-neutral-400">Confirm password</label>
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
                  <p className="rounded-lg border border-signal/25 bg-signal/10 px-3 py-2.5 text-sm text-signal">
                    {error}
                  </p>
                )}
                {info && (
                  <p className="rounded-lg border border-mint/25 bg-mint/10 px-3 py-2.5 text-sm text-mint">
                    {info}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-white py-3 text-sm font-semibold text-black transition hover:scale-[1.01] hover:bg-neutral-100 disabled:opacity-50"
                >
                  {loading
                    ? tab === "signin" ? "Signing in…" : "Creating account…"
                    : tab === "signin" ? "Sign in" : "Create account"}
                </button>
              </form>

              {tab === "signin" && (
                <p className="mt-4 text-center text-xs text-neutral-500">
                  No account?{" "}
                  <button
                    type="button"
                    onClick={() => setTab("signup")}
                    className="text-volt underline-offset-2 hover:underline"
                  >
                    Sign up free
                  </button>
                </p>
              )}
              {tab === "signup" && (
                <p className="mt-4 text-center text-xs text-neutral-500">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setTab("signin")}
                    className="text-volt underline-offset-2 hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
