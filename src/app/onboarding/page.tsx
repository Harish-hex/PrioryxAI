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

  // If user just returned from GitHub OAuth, jump straight to step 3
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
    // After OAuth completes, come back to onboarding at step 3
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
      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error ?? "Failed to parse timetable");
        return;
      }

      const count = data.tasks?.length ?? 0;
      if (count === 0) {
        setUploadResult("No exam or assignment dates found. You can try another image.");
      } else {
        setUploadResult(
          `${count} task${count === 1 ? "" : "s"} extracted. Your feed is being populated.`
        );
      }
    } catch {
      setUploadError("Network error uploading timetable.");
    } finally {
      setUploading(false);
    }
  }

  async function handleFinish() {
    setFinishing(true);
    // Fire-and-forget GitHub sync and Internshala sync; feed page will show them as they arrive
    fetch("/api/sync/github", { method: "POST" }).catch(() => {});
    fetch("/api/jobs/sync", { method: "POST" }).catch(() => {});
    router.push("/feed");
    router.refresh();
  }

  return (
    <main className="app-background min-h-screen px-4 py-8 text-neutral-100 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-lg border border-volt/20 bg-volt/10 px-3 py-1.5 text-sm text-volt">
          <Sparkles size={15} />
          First-time setup
        </div>

        <h1 className="mt-5 text-3xl font-semibold text-white sm:text-4xl">
          Let&apos;s set up your workspace.
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-400">
          Three quick steps. DeadlineOS will pull your deadlines, rank them, and watch for
          internship openings automatically.
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
              className="glass-strong mt-6 rounded-lg p-5 sm:p-7"
            >
              <h2 className="text-xl font-semibold text-white">Step 1 — The basics</h2>
              <p className="mt-1 text-sm text-neutral-400">
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
                  <p className="rounded-lg border border-signal/25 bg-signal/10 px-4 py-2 text-sm text-signal">
                    {step1Error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={savingStep1}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.02] disabled:opacity-50"
                >
                  {savingStep1 ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ArrowRight size={16} />
                  )}
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
              className="glass-strong mt-6 rounded-lg p-5 sm:p-7"
            >
              <h2 className="text-xl font-semibold text-white">Step 2 — Connect GitHub</h2>
              <p className="mt-1 text-sm text-neutral-400">
                DeadlineOS uses your repos, languages, and activity streak to rank tasks and
                match you with Internshala openings automatically.
              </p>

              <div className="mt-5 rounded-lg border border-white/10 bg-black/25 p-5">
                <div className="flex items-center gap-3">
                  <GitBranch size={18} className="text-volt" />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {profile?.github_username
                        ? `Connected: @${profile.github_username}`
                        : "Authorize GitHub"}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {profile?.github_username
                        ? "You can continue to the next step."
                        : "Read-only access. We never push or modify your repos."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {profile?.github_username ? (
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.02]"
                  >
                    Continue <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleGithubConnect}
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.02]"
                  >
                    <GitBranch size={16} /> Connect GitHub
                  </button>
                )}

                <button
                  type="button"
                  onClick={skipGithub}
                  className="text-sm text-neutral-500 underline-offset-4 hover:text-neutral-300 hover:underline"
                >
                  Skip for now
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="ml-auto text-sm text-neutral-500 hover:text-neutral-300"
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
              className="glass-strong mt-6 rounded-lg p-5 sm:p-7"
            >
              <h2 className="text-xl font-semibold text-white">Step 3 — Add your schedule</h2>
              <p className="mt-1 text-sm text-neutral-400">
                Upload a photo of your printed timetable, whiteboard schedule, or any image
                with exam dates. DeadlineOS extracts every date and adds it to your feed.
              </p>

              <div className="mt-5 space-y-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-white/15 bg-black/25 px-4 py-4 text-sm text-neutral-300 transition hover:border-white/25 hover:bg-black/35">
                  <ImagePlus size={18} className="shrink-0 text-volt" />
                  <span className="flex-1 min-w-0 truncate">
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
                  <p className="rounded-lg border border-signal/25 bg-signal/10 px-4 py-2 text-sm text-signal">
                    {uploadError}
                  </p>
                )}
                {uploadResult && (
                  <p className="flex items-center gap-2 rounded-lg border border-mint/25 bg-mint/10 px-4 py-2 text-sm text-mint">
                    <CheckCircle2 size={15} />
                    {uploadResult}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleTimetableUpload}
                  disabled={!timetableFile || uploading}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.1] disabled:opacity-40"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Parsing image…
                    </>
                  ) : (
                    <>
                      <CalendarDays size={15} /> Extract dates from image
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={finishing}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.02] disabled:opacity-50"
                >
                  {finishing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  {finishing ? "Opening your feed…" : "Finish & open feed"}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="ml-auto text-sm text-neutral-500 hover:text-neutral-300"
                >
                  Back
                </button>
              </div>

              <p className="mt-4 text-xs text-neutral-500">
                No image handy? You can add tasks later from your feed — DeadlineOS will nudge
                you when something important is missing.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function StepIndicator({ current }: { current: Step }) {
  const labels: Record<Step, string> = {
    1: "Basics",
    2: "GitHub",
    3: "Schedule",
  };
  return (
    <div className="mt-6 flex items-center gap-2">
      {([1, 2, 3] as Step[]).map((n, i) => {
        const active = current === n;
        const done = current > n;
        return (
          <div key={n} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                active
                  ? "bg-volt text-black"
                  : done
                    ? "bg-mint text-black"
                    : "bg-white/10 text-neutral-500"
              }`}
            >
              {done ? <CheckCircle2 size={14} /> : n}
            </div>
            <span className={`text-xs ${active ? "text-white" : "text-neutral-500"}`}>
              {labels[n]}
            </span>
            {i < 2 && <div className="mx-1 h-px w-8 bg-white/10" />}
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-neutral-400">{label}</label>
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
