"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  GitBranch,
  ImagePlus,
  Loader2,
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
        {/* Brand mark */}
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="PrioryxAI"
            className="h-9 w-9 shrink-0 object-contain drop-shadow-sm"
          />
          <span className="text-base font-extrabold text-slate-950 dark:text-white tracking-tight">PrioryxAI</span>
        </div>

        <div className="mt-7 inline-flex items-center rounded-full border border-slate-400/80 bg-white/95 px-3.5 py-1.5 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950 dark:border-white/20 dark:bg-slate-900/90 dark:text-white shadow-sm">
          First-time setup
        </div>

        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
          Let&apos;s set up your workspace.
        </h1>
        <p className="mt-3 text-sm leading-6 font-semibold text-slate-800 dark:text-slate-200">
          Three quick steps. PrioryxAI will pull your deadlines, rank them, and watch for internship openings automatically.
        </p>

        <StepIndicator current={step} />

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="glass-strong mt-6 rounded-[28px] p-5 sm:p-7 shadow-xl border border-slate-300 dark:border-white/15"
            >
              <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">Step 1 — The basics</h2>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                Helps the AI rank tasks for your semester and subjects.
              </p>

              <form onSubmit={handleStep1} className="mt-5 space-y-4">
                <Field label="Display name">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-base text-slate-950 dark:text-white font-semibold placeholder:text-slate-500 dark:placeholder:text-slate-400"
                    placeholder="Your name"
                  />
                </Field>

                <Field label="College or university">
                  <input
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="input-base text-slate-950 dark:text-white font-semibold placeholder:text-slate-500 dark:placeholder:text-slate-400"
                    placeholder="e.g. Anna University"
                    required
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Semester">
                    <input
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="input-base text-slate-950 dark:text-white font-semibold placeholder:text-slate-500 dark:placeholder:text-slate-400"
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
                    className="input-base text-slate-950 dark:text-white font-semibold placeholder:text-slate-500 dark:placeholder:text-slate-400"
                    placeholder="e.g. DBMS, React, Node.js, Python"
                    required
                  />
                </Field>

                <Field label="Stream / career track">
                  <select
                    value={stream}
                    onChange={(e) => setStream(e.target.value)}
                    className="input-base text-slate-950 dark:text-white font-semibold cursor-pointer"
                  >
                    <option value="" className="text-slate-900 dark:text-white dark:bg-slate-900">Select a stream…</option>
                    {STREAM_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="text-slate-900 dark:text-white dark:bg-slate-900">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Unlocks a personalized learning roadmap in the sidebar.
                  </p>
                </Field>

                {step1Error && (
                  <p className="rounded-[18px] border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700">
                    {step1Error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={savingStep1}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-md"
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
              className="glass-strong mt-6 rounded-[28px] p-5 sm:p-7 shadow-xl border border-slate-300 dark:border-white/15"
            >
              <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">Step 2 — Connect GitHub</h2>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                PrioryxAI uses your repos, languages, and activity streak to rank tasks and match you with Internshala openings automatically.
              </p>

              <div className="mt-5 rounded-[22px] border border-slate-300 bg-white/90 p-5 dark:border-white/15 dark:bg-white/5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-sm">
                    <GitBranch size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-950 dark:text-white">
                      {profile?.github_username
                        ? `Connected: @${profile.github_username}`
                        : "Authorize GitHub"}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {profile?.github_username
                        ? "You can continue to the next step."
                        : "Read-only access. We never push or modify your repos."}
                    </p>
                  </div>
                  {profile?.github_username && (
                    <CheckCircle2 size={18} className="ml-auto shrink-0 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {profile?.github_username ? (
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-md"
                  >
                    Continue <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleGithubConnect}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-md"
                  >
                    <GitBranch size={16} /> Connect GitHub
                  </button>
                )}

                <button
                  type="button"
                  onClick={skipGithub}
                  className="text-sm font-bold text-slate-900 underline underline-offset-4 hover:text-black dark:text-slate-100 dark:hover:text-white"
                >
                  Skip for now
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="ml-auto text-sm font-bold text-slate-800 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white"
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
              className="glass-strong mt-6 rounded-[28px] p-5 sm:p-7 shadow-xl border border-slate-300 dark:border-white/15"
            >
              <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">Step 3 — Add your schedule</h2>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                Upload a photo of your printed timetable, whiteboard schedule, or any image with exam dates. PrioryxAI extracts every date and adds it to your feed.
              </p>

              <div className="mt-5 space-y-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-[22px] border-2 border-dashed border-slate-400 bg-white/90 px-4 py-4 text-sm font-bold text-slate-950 transition hover:border-slate-500 hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:border-white/30 shadow-sm">
                  <ImagePlus size={20} className="shrink-0 text-slate-950 dark:text-white" />
                  <span className="min-w-0 flex-1 truncate font-semibold">
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
                  <p className="rounded-[18px] border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700">
                    {uploadError}
                  </p>
                )}
                {uploadResult && (
                  <p className="flex items-center gap-2 rounded-[18px] border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800">
                    <CheckCircle2 size={16} />
                    {uploadResult}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleTimetableUpload}
                  disabled={!timetableFile || uploading}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-40 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 shadow-sm"
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
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-md"
                >
                  {finishing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {finishing ? "Opening your feed…" : "Finish & open feed"}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="ml-auto text-sm font-bold text-slate-800 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white"
                >
                  Back
                </button>
              </div>

              <p className="mt-4 text-xs font-semibold text-slate-800 dark:text-slate-200">
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
  const labels: Record<Step, string> = { 1: "Basics", 2: "GitHub", 3: "Schedule" };
  return (
    <div className="mt-7 flex items-center gap-2.5">
      {([1, 2, 3] as Step[]).map((n, i) => {
        const active = current === n;
        const done = current > n;
        return (
          <div key={n} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all ${
                active
                  ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-md ring-2 ring-slate-950/20 dark:ring-white/20"
                  : done
                    ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-sm"
                    : "border-2 border-slate-500/80 bg-white/95 text-slate-950 dark:border-white/30 dark:bg-slate-800 dark:text-white"
              }`}
            >
              {done ? <CheckCircle2 size={16} className="stroke-[2.5]" /> : n}
            </div>
            <span
              className={`text-xs font-bold tracking-tight ${
                active
                  ? "text-slate-950 dark:text-white"
                  : done
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-slate-900 dark:text-slate-100"
              }`}
            >
              {labels[n]}
            </span>
            {i < 2 && <div className="mx-1 h-0.5 w-8 bg-slate-400 dark:bg-white/30" />}
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-slate-950 dark:text-white">{label}</label>
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
