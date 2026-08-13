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

interface ProfilePayload {
  username: string;
  name: string | null;
  github_username: string | null;
  college: string | null;
  semester: number | null;
  subjects: string[] | null;
}

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
      await fetch("/api/admin/migrate", { method: "POST" }).catch(() => null);
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
      <div className="mx-auto w-full max-w-2xl">
        {/* Brand mark */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <Sparkles size={16} />
          </div>
          <span className="text-sm font-semibold text-slate-950">PrioryxAI</span>
        </div>

        <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600">
          <Sparkles size={13} />
          First-time setup
        </div>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Let&apos;s set up your workspace.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
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
              className="glass-strong mt-6 rounded-[28px] p-5 sm:p-7"
            >
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">Step 1 — The basics</h2>
              <p className="mt-1 text-sm text-slate-500">
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
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">Step 2 — Connect GitHub</h2>
              <p className="mt-1 text-sm text-slate-500">
                PrioryxAI uses your repos, languages, and activity streak to rank tasks and match you with Internshala openings automatically.
              </p>

              <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <GitBranch size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {profile?.github_username
                        ? `Connected: @${profile.github_username}`
                        : "Authorize GitHub"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
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
                  className="text-sm text-slate-500 underline-offset-4 hover:text-slate-800 hover:underline"
                >
                  Skip for now
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="ml-auto text-sm text-slate-400 hover:text-slate-700"
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
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">Step 3 — Add your schedule</h2>
              <p className="mt-1 text-sm text-slate-500">
                Upload a photo of your printed timetable, whiteboard schedule, or any image with exam dates. PrioryxAI extracts every date and adds it to your feed.
              </p>

              <div className="mt-5 space-y-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600 transition hover:border-slate-400 hover:bg-white">
                  <ImagePlus size={18} className="shrink-0 text-slate-400" />
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
                  className="ml-auto text-sm text-slate-400 hover:text-slate-700"
                >
                  Back
                </button>
              </div>

              <p className="mt-4 text-xs text-slate-400">
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
    <div className="mt-7 flex items-center gap-2">
      {([1, 2, 3] as Step[]).map((n, i) => {
        const active = current === n;
        const done = current > n;
        return (
          <div key={n} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition ${
                active
                  ? "bg-slate-950 text-white"
                  : done
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {done ? <CheckCircle2 size={14} /> : n}
            </div>
            <span className={`text-xs font-medium ${active ? "text-slate-950" : "text-slate-400"}`}>
              {labels[n]}
            </span>
            {i < 2 && <div className="mx-1 h-px w-8 bg-slate-200" />}
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-500">{label}</label>
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
