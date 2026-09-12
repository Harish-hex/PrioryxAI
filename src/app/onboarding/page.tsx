"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  GitBranch,
  ImagePlus,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import WavesBackground from "@/components/ui/waves-background";

interface ProfilePayload {
  username: string;
  name: string | null;
  github_username: string | null;
  college: string | null;
  semester: number | null;
  subjects: string[] | null;
  stream: string | null;
}

const STREAM_OPTIONS = [
  { value: "ai-engineer", label: "AI Engineer" },
  { value: "frontend", label: "Frontend Developer" },
  { value: "backend", label: "Backend Developer" },
  { value: "python", label: "Python / Data" },
  { value: "other", label: "Other / Not sure yet" },
];

type Step = 1 | 2 | 3;

function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialStep: Step = searchParams.get("step") === "3" ? 3 : 1;

  const [step, setStep] = useState<Step>(initialStep);
  const [profile, setProfile] = useState<ProfilePayload | null>(null);

  // Step 1 state
  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [semester, setSemester] = useState("");
  const [subjects, setSubjects] = useState("");
  const [stream, setStream] = useState("");
  const [savingStep1, setSavingStep1] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);

  // Step 3 state
  const [timetableFile, setTimetableFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        const p = data.profile as ProfilePayload | undefined;
        if (!p) return;
        setProfile(p);
        setName(p.name ?? "");
        setCollege(p.college ?? "");
        setSemester(p.semester ? String(p.semester) : "");
        setSubjects(p.subjects?.join(", ") ?? "");
        setStream(p.stream ?? "");
      })
      .catch(() => {});
  }, []);

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setSavingStep1(true);
    setStep1Error(null);

    const subjectList = subjects
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || undefined,
          college,
          semester: semester ? Number(semester) : undefined,
          subjects: subjectList.length ? subjectList : undefined,
          stream: stream || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setStep1Error(body.error ?? "Failed to save profile");
        return;
      }
      setStep(2);
    } catch {
      setStep1Error("Network error. Try again.");
    } finally {
      setSavingStep1(false);
    }
  }

  function handleGithubConnect() {
    const next = encodeURIComponent("/onboarding?step=3");
    window.location.href = `/api/auth/login?provider=github&next=${next}`;
  }

  function skipGithub() {
    setStep(3);
  }

  async function handleTimetableUpload() {
    if (!timetableFile) return;
    setUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const form = new FormData();
      form.append("file", timetableFile);
      const res = await fetch("/api/ingest/vision", { method: "POST", body: form });
      const text = await res.text();
      let data: any = null;
      if (text) {
        try { data = JSON.parse(text); } catch { data = null; }
      }

      if (!res.ok) {
        setUploadError(data?.error ?? "Failed to parse timetable");
        return;
      }

      const count = data?.tasks?.length ?? 0;
      setUploadResult(
        count === 0
          ? "No exam or assignment dates found. You can try another image."
          : `${count} task${count === 1 ? "" : "s"} extracted. Your feed is being populated.`
      );
    } catch {
      setUploadError("Network error uploading timetable.");
    } finally {
      setUploading(false);
    }
  }

  async function handleFinish() {
    setFinishing(true);
    fetch("/api/sync/github", { method: "POST" }).catch(() => {});
    fetch("/api/jobs/sync", { method: "POST" }).catch(() => {});
    router.push("/feed");
    router.refresh();
  }

  return (
    <main className="app-background flex min-h-screen flex-col px-4 py-8 sm:px-6">
      <WavesBackground />
      <div className="mx-auto w-full max-w-2xl">
        {/* Brand mark & Progress pill */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="PrioryxAI"
              className="h-9 w-9 shrink-0 object-contain drop-shadow-md"
            />
            <div className="flex flex-col">
              <span
                className="text-base font-extrabold tracking-tight !text-black leading-none"
                style={{ color: "#000000" }}
              >
                PrioryxAI
              </span>
              <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 mt-0.5">
                Student Career OS
              </span>
            </div>
          </div>

          <div className="neu-pill inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
            <span>Step {step} of 3</span>
          </div>
        </div>

        {/* Hero Headline & Subtitle */}
        <div className="mt-8">
          <div className="inline-flex items-center gap-1.5 rounded-full neu-pill px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
            <Sparkles size={13} className="text-cyan-500" />
            <span>First-time setup</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            Let&apos;s set up your{" "}
            <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
              workspace.
            </span>
          </h1>
          <p className="mt-2.5 text-sm sm:text-base font-bold leading-relaxed text-slate-950 dark:text-white max-w-xl drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
            Three quick steps. <span className="font-extrabold !text-black" style={{ color: "#000000" }}>PrioryxAI</span> will pull your deadlines, rank them, and watch for internship openings automatically.
          </p>
        </div>

        <StepIndicator current={step} />

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="glass-strong mt-6 rounded-[28px] p-5 sm:p-7"
            >
              <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">Step 1 — The basics</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Helps the AI rank tasks for your semester and subjects.
              </p>

              <form onSubmit={handleStep1} className="mt-5 space-y-4">
                <Field label="Display name">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-base"
                    placeholder="Your name"
                  />
                </Field>

                <Field label="College or university">
                  <input
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="input-base"
                    placeholder="e.g. Anna University"
                    required
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Semester">
                    <input
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="input-base"
                      type="number"
                      min="1"
                      max="12"
                      placeholder="e.g. 6"
                      required
                    />
                  </Field>
                </div>

                <Field label="Subjects / skills (comma-separated)">
                  <input
                    value={subjects}
                    onChange={(e) => setSubjects(e.target.value)}
                    className="input-base"
                    placeholder="e.g. DBMS, React, Node.js, Python"
                    required
                  />
                </Field>

                <Field label="Stream / career track">
                  <select
                    value={stream}
                    onChange={(e) => setStream(e.target.value)}
                    className="input-base"
                  >
                    <option value="">Select a stream…</option>
                    {STREAM_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                    Unlocks a personalized learning roadmap in the sidebar.
                  </p>
                </Field>

                {step1Error && (
                  <p className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                    {step1Error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={savingStep1}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {savingStep1 ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  {savingStep1 ? "Saving…" : "Continue"}
                </button>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="glass-strong mt-6 rounded-[28px] p-5 sm:p-7"
            >
              <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">Step 2 — Connect GitHub</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                PrioryxAI uses your repos, languages, and activity streak to rank tasks and match you with Internshala openings automatically.
              </p>

              <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200">
                    <GitBranch size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                      {profile?.github_username
                        ? `Connected: @${profile.github_username}`
                        : "Authorize GitHub"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {profile?.github_username
                        ? "You can continue to the next step."
                        : "Read-only access. We never push or modify your repos."}
                    </p>
                  </div>
                  {profile?.github_username && (
                    <CheckCircle2 size={18} className="ml-auto shrink-0 text-emerald-500" />
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {profile?.github_username ? (
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Continue <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleGithubConnect}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <GitBranch size={16} /> Connect GitHub
                  </button>
                )}

                <button
                  type="button"
                  onClick={skipGithub}
                  className="text-sm text-slate-500 underline-offset-4 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:underline"
                >
                  Skip for now
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="ml-auto text-sm text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  Back
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="glass-strong mt-6 rounded-[28px] p-5 sm:p-7"
            >
              <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">Step 3 — Add your schedule</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Upload a photo of your printed timetable, whiteboard schedule, or any image with exam dates. PrioryxAI extracts every date and adds it to your feed.
              </p>

              <div className="mt-5 space-y-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600 transition hover:border-slate-400 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/25 dark:hover:bg-white/10">
                  <ImagePlus size={18} className="shrink-0 text-slate-400 dark:text-slate-500" />
                  <span className="min-w-0 flex-1 truncate">
                    {timetableFile ? timetableFile.name : "Choose JPG, PNG, WebP, or HEIC — up to 5 MB"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic"
                    className="hidden"
                    onChange={(e) => {
                      setTimetableFile(e.target.files?.[0] ?? null);
                      setUploadResult(null);
                      setUploadError(null);
                    }}
                  />
                </label>

                {uploadError && (
                  <p className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                    {uploadError}
                  </p>
                )}
                {uploadResult && (
                  <p className="flex items-center gap-2 rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
                    <CheckCircle2 size={15} />
                    {uploadResult}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleTimetableUpload}
                  disabled={!timetableFile || uploading}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40"
                >
                  {uploading ? (
                    <><Loader2 size={15} className="animate-spin" /> Parsing image…</>
                  ) : (
                    <><CalendarDays size={15} /> Extract dates from image</>
                  )}
                </button>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={finishing}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {finishing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {finishing ? "Opening your feed…" : "Finish & open feed"}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="ml-auto text-sm text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  Back
                </button>
              </div>

              <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
                No image handy? You can add tasks later from your feed — PrioryxAI will nudge you when something important is missing.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function StepIndicator({ current }: { current: Step }) {
  const steps: { num: Step; title: string; desc: string }[] = [
    { num: 1, title: "The Basics", desc: "Profile & stream" },
    { num: 2, title: "Connect GitHub", desc: "Repo analysis" },
    { num: 3, title: "Schedule", desc: "Timetable & dates" },
  ];

  const progressPercent = current === 1 ? 33 : current === 2 ? 66 : 100;

  return (
    <div className="mt-7 space-y-3">
      {/* Animated smooth progress bar track */}
      <div className="relative h-2 w-full overflow-hidden rounded-full neu-inset p-0.5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 shadow-sm transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 3 Step Cards in a responsive grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {steps.map(({ num, title, desc }) => {
          const active = current === num;
          const done = current > num;
          return (
            <div
              key={num}
              className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 rounded-2xl p-2.5 sm:p-3 transition-all duration-200 ${
                active
                  ? "neu-card ring-2 ring-cyan-500/50 -translate-y-0.5 shadow-md"
                  : done
                    ? "neu-pill"
                    : "neu-inset"
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black transition-all ${
                  active
                    ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/35"
                    : done
                      ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                      : "neu-pill text-slate-700 dark:text-slate-300 font-black"
                }`}
              >
                {done ? <CheckCircle2 size={16} className="stroke-[2.5]" /> : num}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs font-bold truncate ${
                    active
                      ? "text-slate-950 dark:text-white"
                      : done
                        ? "text-emerald-700 dark:text-emerald-300 font-extrabold"
                        : "text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {title}
                </p>
                <p
                  className={`hidden sm:block text-[10px] font-semibold truncate ${
                    active
                      ? "text-cyan-600 dark:text-cyan-400"
                      : done
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {active ? "In progress" : done ? "Completed" : desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-500 dark:text-slate-400">{label}</label>
      {children}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <OnboardingFlow />
    </Suspense>
  );
}
