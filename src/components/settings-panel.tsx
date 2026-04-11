"use client";

import { ArrowDownToLine, BookOpen, CalendarCheck, CalendarDays, CheckCircle2, FileText, GitBranch, ImagePlus, Loader2, Lock, LogOut, Save, Shield, Sparkles, Upload, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface UserProfile {
  name: string | null;
  username: string;
  college: string | null;
  semester: number | null;
  subjects: string[] | null;
  cgpa: number | null;
  github_username: string | null;
  pro_status: boolean;
  pro_expires_at: string | null;
}

interface ExtractedTask {
  id: string;
  type: string;
  title: string;
  subject: string | null;
  due_at: string | null;
  weightage: number | null;
  notes: string | null;
}

interface SettingsPanelProps {
  onOpenPricing: () => void;
  isPro: boolean;
  visionUsedToday: number;
  onVisionUploaded: () => void;
  onNavigateToDashboard: () => void;
}

export function SettingsPanel({ onOpenPricing, isPro, visionUsedToday, onVisionUploaded, onNavigateToDashboard }: SettingsPanelProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [semester, setSemester] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [subjects, setSubjects] = useState("");
  const [githubUsername, setGithubUsername] = useState("");

  // Timetable upload state
  const [timetableFile, setTimetableFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resume generation state
  const [generatingResume, setGeneratingResume] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const FREE_VISION_LIMIT = 1;
  const PRO_VISION_LIMIT = 10;
  const visionLimit = isPro ? PRO_VISION_LIMIT : FREE_VISION_LIMIT;
  const visionRemaining = Math.max(0, visionLimit - visionUsedToday);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          const p = data.profile as UserProfile;
          setProfile(p);
          setName(p.name ?? "");
          setCollege(p.college ?? "");
          setSemester(p.semester ? String(p.semester) : "");
          setCgpa(p.cgpa != null ? String(p.cgpa) : "");
          setSubjects(p.subjects?.join(", ") ?? "");
          setGithubUsername(p.github_username ?? "");
        }
      })
      .catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const subjectsArr = subjects
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const body: Record<string, unknown> = {};
    if (name) body.name = name;
    if (college) body.college = college;
    if (semester) body.semester = parseInt(semester, 10);
    if (cgpa !== "") body.cgpa = cgpa === "" ? null : parseFloat(cgpa);
    if (subjectsArr.length) body.subjects = subjectsArr;
    if (githubUsername) body.github_username = githubUsername.replace(/^@/, "").trim();

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save");
        return;
      }

      // Re-sync GitHub and jobs whenever profile is saved with a GitHub username
      const github = githubUsername.replace(/^@/, "").trim();
      if (github) {
        fetch("/api/sync/github", { method: "POST" }).catch(() => {});
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message ?? "Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleTimetableUpload() {
    if (!timetableFile) return;
    setUploading(true);
    setUploadError(null);
    setUploadResult(null);
    setExtractedTasks(null);

    if (timetableFile.size > 10 * 1024 * 1024) {
      setUploadError("File too large. Max 10 MB.");
      setUploading(false);
      return;
    }

    try {
      const form = new FormData();
      form.append("file", timetableFile);
      const res = await fetch("/api/ingest/vision", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error ?? "Failed to parse document. Try a clearer image or different file.");
        return;
      }

      const tasks: ExtractedTask[] = data.tasks ?? [];
      onVisionUploaded();

      if (tasks.length === 0) {
        setUploadResult("No exam or assignment dates found. Try a clearer image or a different format.");
      } else {
        const sorted = [...tasks].sort((a, b) => {
          if (!a.due_at) return 1;
          if (!b.due_at) return -1;
          return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
        });
        setExtractedTasks(sorted);
        setUploadResult(`${tasks.length} item${tasks.length === 1 ? "" : "s"} extracted and added to your feed.`);
        setTimetableFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch {
      setUploadError("Network error uploading document.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function handleGithubOAuth() {
    window.location.href = "/api/auth/login?provider=github&next=/settings";
  }

  async function handleGenerateResume() {
    setGeneratingResume(true);
    setResumeError(null);

    try {
      const res = await fetch("/api/resume/generate", { method: "POST" });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403 && data.upgrade) {
          onOpenPricing();
          return;
        }
        setResumeError(data.error ?? "Failed to generate resume.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "resume.pdf";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setResumeError("Network error generating resume.");
    } finally {
      setGeneratingResume(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      {/* Left — profile form */}
      <section className="space-y-5">
        <div className="glass-strong rounded-lg p-5 sm:p-6">
          <h2 className="text-2xl font-semibold text-white">Profile settings</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Keep your profile accurate so the feed, job matching, and recruiter profile stay meaningful.
          </p>

          <form onSubmit={handleSave} className="mt-6 space-y-4">
            <Field label="Display name" icon={User}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="input-base"
              />
            </Field>

            <Field label="College / University" icon={Shield}>
              <input
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. Anna University"
                className="input-base"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Semester (1-12)" icon={Shield}>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  placeholder="e.g. 6"
                  className="input-base"
                />
              </Field>

              <Field label="CGPA (0–10)" icon={Shield}>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  placeholder="e.g. 8.4"
                  className="input-base"
                />
              </Field>

              <Field label="GitHub username" icon={GitBranch}>
                <input
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="e.g. octocat"
                  className="input-base"
                />
              </Field>
            </div>

            <Field label="Subjects / skills (comma-separated)" icon={Shield}>
              <input
                value={subjects}
                onChange={(e) => setSubjects(e.target.value)}
                placeholder="e.g. DBMS, CN, OS, React, Python"
                className="input-base"
              />
            </Field>

            {error && (
              <p className="rounded-lg border border-signal/25 bg-signal/10 px-4 py-2 text-sm text-signal">
                {error}
              </p>
            )}
            {saved && (
              <p className="rounded-lg border border-mint/25 bg-mint/10 px-4 py-2 text-sm text-mint">
                Saved! GitHub sync triggered in background.
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.02] disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        </div>

        {/* Timetable / schedule upload */}
        <div className="glass rounded-lg p-5">
          <h3 className="text-lg font-semibold text-white">Upload timetable or exam schedule</h3>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Upload a photo, PDF, or Word doc of your timetable — weekly, semester, or full-year.
            PrioryxAI extracts every exam, assignment deadline, and lab date automatically.
          </p>

          <div className="mt-4 space-y-3">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-white/15 bg-black/25 px-4 py-4 text-sm text-neutral-300 transition hover:border-white/25 hover:bg-black/35">
              {timetableFile ? (
                <FileText size={18} className="shrink-0 text-volt" />
              ) : (
                <Upload size={18} className="shrink-0 text-volt" />
              )}
              <span className="flex-1 min-w-0 truncate">
                {timetableFile ? timetableFile.name : "Choose JPG, PNG, WebP, HEIC, PDF, or DOC — up to 10 MB"}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                className="hidden"
                onChange={(e) => {
                  setTimetableFile(e.target.files?.[0] ?? null);
                  setUploadResult(null);
                  setUploadError(null);
                  setExtractedTasks(null);
                }}
              />
            </label>

            {uploadError && (
              <p className="rounded-lg border border-signal/25 bg-signal/10 px-4 py-2 text-sm text-signal">
                {uploadError}
              </p>
            )}
            {uploadResult && (
              <p className="rounded-lg border border-mint/25 bg-mint/10 px-4 py-2 text-sm text-mint flex items-center gap-2">
                <CheckCircle2 size={15} />
                {uploadResult}
              </p>
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTimetableUpload}
                disabled={!timetableFile || uploading || visionRemaining === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.1] disabled:opacity-40"
              >
                {uploading ? (
                  <><Loader2 size={15} className="animate-spin" /> Extracting schedule…</>
                ) : (
                  <><CalendarCheck size={15} /> Extract schedule</>
                )}
              </button>
              {isPro ? (
                <span className="text-xs text-mint">
                  {visionRemaining} of {PRO_VISION_LIMIT} uploads remaining today
                </span>
              ) : visionRemaining > 0 ? (
                <span className="text-xs text-neutral-500">
                  {visionRemaining} of {FREE_VISION_LIMIT} remaining today
                </span>
              ) : null}
            </div>

            {/* Vision limit reached — upgrade card for free users */}
            {!isPro && visionRemaining === 0 && (
              <div className="rounded-lg border border-aura/20 bg-aura/5 p-4">
                <p className="text-sm font-semibold text-white">Daily upload limit reached</p>
                <p className="mt-1 text-xs leading-5 text-neutral-400">
                  Free plan: 1 upload/day. Pro includes 10/day — scan every handout, lab sheet, and timetable without limits.
                </p>
                <button
                  type="button"
                  onClick={onOpenPricing}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black transition hover:scale-[1.02]"
                >
                  <Sparkles size={12} /> Upgrade to Pro — ₹99/month
                </button>
              </div>
            )}

            {/* Extracted schedule list */}
            {extractedTasks && extractedTasks.length > 0 && (
              <div className="mt-2 rounded-lg border border-white/10 bg-black/30 overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10">
                  <span className="text-sm font-semibold text-white flex items-center gap-2">
                    <CalendarCheck size={15} className="text-mint" />
                    {extractedTasks.length} item{extractedTasks.length === 1 ? "" : "s"} extracted
                  </span>
                  <button
                    type="button"
                    onClick={onNavigateToDashboard}
                    className="text-xs text-volt hover:underline underline-offset-2"
                  >
                    View in feed →
                  </button>
                </div>
                <ul className="divide-y divide-white/[0.06] max-h-[420px] overflow-y-auto">
                  {extractedTasks.map((task, i) => {
                    const typeIcon = task.type === "exam" ? "📝" : task.type === "assignment" ? "📋" : "📌";
                    const dateStr = task.due_at
                      ? new Date(task.due_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                      : null;
                    return (
                      <li key={task.id ?? i} className="flex items-start gap-3 px-4 py-3">
                        <span className="text-base mt-0.5 shrink-0">{typeIcon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-white leading-snug">{task.title}</p>
                            {dateStr && (
                              <span className="text-xs text-neutral-400 shrink-0 tabular-nums">{dateStr}</span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                            {task.subject && (
                              <span className="text-xs text-neutral-500">{task.subject}</span>
                            )}
                            {task.weightage != null && (
                              <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-neutral-300">
                                {task.weightage}%
                              </span>
                            )}
                          </div>
                          {task.notes && (
                            <p className="mt-1 text-xs leading-5 text-neutral-500">{task.notes}</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Right sidebar */}
      <aside className="space-y-5">
        {profile && (
          <div className="glass rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white">Account</h3>
            <div className="mt-4 space-y-3">
              <Row label="Username" value={`@${profile.username}`} />
              <Row label="Plan" value={isPro ? "Pro" : "Free"} highlight={isPro} />
              {profile.pro_expires_at && isPro && (
                <Row label="Renews" value={new Date(profile.pro_expires_at).toLocaleDateString()} />
              )}
            </div>

            {/* GitHub OAuth connect */}
            <div className="mt-4 rounded-lg border border-white/10 bg-black/25 p-4">
              <div className="flex items-center gap-2">
                <GitBranch size={16} className="text-neutral-400" />
                <h4 className="text-sm font-semibold text-white">
                  {profile.github_username ? `Connected: @${profile.github_username}` : "Connect GitHub"}
                </h4>
              </div>
              <p className="mt-2 text-xs leading-5 text-neutral-500">
                {profile.github_username
                  ? "PrioryxAI uses your repos, languages, and streak to rank tasks and match internships automatically."
                  : "Connect GitHub to auto-sync your repos, streak, and get matched Internshala openings — no manual input needed."}
              </p>
              <button
                type="button"
                onClick={handleGithubOAuth}
                className="mt-3 w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.1]"
              >
                {profile.github_username ? "Reconnect GitHub" : "Connect GitHub via OAuth"}
              </button>
            </div>
          </div>
        )}

        {isPro ? (
          <div className="glass rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg border border-mint/20 bg-mint/10 p-2 text-mint">
                <ArrowDownToLine size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-white">Generate Resume</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  Turn your GitHub repos, languages, completed tasks, and profile into a recruiter-ready PDF — in seconds.
                </p>
              </div>
            </div>
            {resumeError && (
              <p className="mt-4 rounded-lg border border-signal/25 bg-signal/10 px-4 py-2 text-sm text-signal">
                {resumeError}
              </p>
            )}
            <button
              type="button"
              onClick={handleGenerateResume}
              disabled={generatingResume}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-mint/20 bg-mint/10 px-4 py-3 text-sm font-semibold text-mint transition hover:bg-mint/15 disabled:opacity-60"
            >
              {generatingResume ? (
                <><Loader2 size={15} className="animate-spin" /> Generating resume…</>
              ) : (
                <><ArrowDownToLine size={15} /> Download resume.pdf</>
              )}
            </button>
          </div>
        ) : (
          <div className="rounded-lg accent-border p-px">
            <div className="rounded-[7px] bg-black/85 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg border border-white/10 bg-white/[0.06] p-2 text-neutral-400">
                  <Lock size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-white">AI-generated Resume</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-400">
                    PrioryxAI reads your GitHub repos, languages, and completed tasks to write a recruiter-ready PDF — no templates, no manual formatting.
                  </p>
                </div>
              </div>
              <ul className="mt-4 space-y-1.5 text-xs text-neutral-500">
                {["Your top repos → project bullets", "GitHub languages → skills section", "Completed tasks → achievements", "Downloaded as resume.pdf instantly"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-neutral-600 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={onOpenPricing}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
              >
                <Sparkles size={15} /> Unlock — Upgrade to Pro
              </button>
            </div>
          </div>
        )}

        {!isPro && (
          <div className="rounded-lg accent-border p-px">
            <div className="rounded-[7px] bg-black/85 p-4">
              <h3 className="text-lg font-semibold text-white">Upgrade to Pro</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                Unlimited AI planning, auto-scheduling, and recruiter profile optimization — ₹99/month.
              </p>
              <button
                type="button"
                onClick={onOpenPricing}
                className="mt-4 w-full rounded-lg bg-white px-3 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.02]"
              >
                <span className="inline-flex items-center gap-2">
                  <Sparkles size={15} />
                  Upgrade
                </span>
              </button>
            </div>
          </div>
        )}

        <div className="glass rounded-lg p-4">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg border border-signal/20 bg-signal/10 px-4 py-3 text-sm font-semibold text-signal transition hover:bg-signal/20"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: any; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-2 text-sm text-neutral-400">
        <Icon size={14} />
        {label}
      </label>
      {children}
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/25 p-3">
      <span className="text-sm text-neutral-400">{label}</span>
      <span className={`text-sm font-medium ${highlight ? "text-mint" : "text-white"}`}>{value}</span>
    </div>
  );
}
