"use client";

import { ArrowDownToLine, CalendarCheck, CheckCircle2, FileText, GitBranch, Loader2, Lock, LogOut, Save, Shield, Sparkles, Upload, User } from "lucide-react";
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [semester, setSemester] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [subjects, setSubjects] = useState("");
  const [githubUsername, setGithubUsername] = useState("");

  const [timetableFile, setTimetableFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [generatingResume, setGeneratingResume] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const PRO_VISION_LIMIT = 10;
  const visionRemaining = isPro ? Math.max(0, PRO_VISION_LIMIT - visionUsedToday) : null;

  useEffect(() => {
    fetch("/api/admin/migrate", { method: "POST" }).catch(() => {});

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

  async function readJsonSafely(response: Response) {
    const text = await response.text();
    if (!text) return null;
    try { return JSON.parse(text); } catch { return null; }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    const subjectsArr = subjects.split(",").map((s) => s.trim()).filter(Boolean);
    const trimmedGithubUsername = githubUsername.replace(/^@/, "").trim();
    const trimmedCgpa = cgpa.trim();

    if (trimmedCgpa !== "" && Number.isNaN(Number(trimmedCgpa))) {
      setError("CGPA must be a number between 0 and 10.");
      setSaving(false);
      return;
    }

    const body: Record<string, unknown> = {
      name: name.trim() || null,
      college: college.trim() || null,
      semester: semester ? parseInt(semester, 10) : null,
      cgpa: trimmedCgpa === "" ? null : parseFloat(trimmedCgpa),
      subjects: subjectsArr,
      github_username: trimmedGithubUsername || null,
    };

    try {
      await fetch("/api/admin/migrate", { method: "POST" }).catch(() => null);
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await readJsonSafely(res);

      if (!res.ok) { setError(data?.error ?? "Failed to save"); return; }

      const nextProfile = data?.profile as UserProfile | undefined;
      if (nextProfile) {
        setProfile(nextProfile);
        setName(nextProfile.name ?? "");
        setCollege(nextProfile.college ?? "");
        setSemester(nextProfile.semester != null ? String(nextProfile.semester) : "");
        setCgpa(nextProfile.cgpa != null ? String(nextProfile.cgpa) : "");
        setSubjects(nextProfile.subjects?.join(", ") ?? "");
        setGithubUsername(nextProfile.github_username ?? "");
      }

      if (trimmedGithubUsername) {
        fetch("/api/sync/github", { method: "POST" }).catch(() => {});
      }

      setSuccessMessage(trimmedGithubUsername ? "Profile saved. GitHub sync triggered in the background." : "Profile saved.");
      setTimeout(() => setSuccessMessage(null), 3000);
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
      await fetch("/api/admin/migrate", { method: "POST" }).catch(() => null);
      const res = await fetch("/api/ingest/vision", { method: "POST", body: form });
      const data = await readJsonSafely(res);

      if (!res.ok) {
        setUploadError(data?.error ?? "Failed to parse document. Try a clearer image or different file.");
        return;
      }

      const tasks: ExtractedTask[] = data?.tasks ?? [];
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
        if (res.status === 403 && data.upgrade) { onOpenPricing(); return; }
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
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      {/* Left — profile form */}
      <section className="space-y-6">
        <div className="glass-strong rounded-[28px] p-5 sm:rounded-[32px] sm:p-8">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Workspace preferences</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-[15px]">
            Keep your profile accurate so the feed, job matching, and recruiter profile stay meaningful.
          </p>

          <form onSubmit={handleSave} className="mt-8 space-y-5">
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
              <Field label="Semester (1–12)" icon={Shield}>
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
              <p className="rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}
            {successMessage && (
              <p className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        </div>

        {/* Timetable upload */}
        <div className="glass rounded-[28px] p-5 sm:p-6">
          <h3 className="text-xl font-semibold tracking-tight text-slate-950">Upload timetable or exam schedule</h3>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Upload a photo, PDF, or Word doc of your timetable — weekly, semester, or full-year.
            PrioryxAI extracts every exam, assignment deadline, and lab date automatically.
          </p>

          <div className="mt-5 space-y-3">
            <label className="flex cursor-pointer items-center gap-3 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600 transition hover:border-slate-400 hover:bg-white">
              {timetableFile ? (
                <FileText size={18} className="shrink-0 text-slate-500" />
              ) : (
                <Upload size={18} className="shrink-0 text-slate-400" />
              )}
              <span className="min-w-0 flex-1 truncate">
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
              <p className="rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {uploadError}
              </p>
            )}
            {uploadResult && (
              <p className="flex items-center gap-2 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 size={15} />
                {uploadResult}
              </p>
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTimetableUpload}
                disabled={!timetableFile || uploading}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40"
              >
                {uploading ? (
                  <><Loader2 size={15} className="animate-spin" /> Extracting schedule…</>
                ) : (
                  <><CalendarCheck size={15} /> Extract schedule</>
                )}
              </button>
              {isPro && visionRemaining !== null && (
                <span className="text-xs font-medium text-emerald-600">
                  {visionRemaining} of {PRO_VISION_LIMIT} uploads remaining today
                </span>
              )}
            </div>

            {extractedTasks && extractedTasks.length > 0 && (
              <div className="mt-2 overflow-hidden rounded-[22px] border border-slate-200 bg-white">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <CalendarCheck size={15} className="text-emerald-500" />
                    {extractedTasks.length} item{extractedTasks.length === 1 ? "" : "s"} extracted
                  </span>
                  <button
                    type="button"
                    onClick={onNavigateToDashboard}
                    className="text-xs font-medium text-slate-600 underline-offset-2 hover:underline"
                  >
                    View in feed →
                  </button>
                </div>
                <ul className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">
                  {extractedTasks.map((task, i) => {
                    const typeIcon = task.type === "exam" ? "📝" : task.type === "assignment" ? "📋" : "📌";
                    const dateStr = task.due_at
                      ? new Date(task.due_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                      : null;
                    return (
                      <li key={task.id ?? i} className="flex items-start gap-3 px-4 py-3">
                        <span className="mt-0.5 shrink-0 text-base">{typeIcon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium leading-snug text-slate-950">{task.title}</p>
                            {dateStr && (
                              <span className="shrink-0 tabular-nums text-xs text-slate-500">{dateStr}</span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                            {task.subject && (
                              <span className="text-xs text-slate-500">{task.subject}</span>
                            )}
                            {task.weightage != null && (
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-600">
                                {task.weightage}%
                              </span>
                            )}
                          </div>
                          {task.notes && (
                            <p className="mt-1 text-xs leading-5 text-slate-500">{task.notes}</p>
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
      <aside className="space-y-6">
        {profile && (
          <div className="glass rounded-[28px] p-5">
            <h3 className="text-xl font-semibold tracking-tight text-slate-950">Account</h3>
            <div className="mt-5 space-y-3">
              <Row label="Username" value={`@${profile.username}`} />
              <Row label="Plan" value={isPro ? "Pro" : "Free"} highlight={isPro} />
              {profile.pro_expires_at && isPro && (
                <Row label="Renews" value={new Date(profile.pro_expires_at).toLocaleDateString()} />
              )}
            </div>

            <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <GitBranch size={16} className="text-slate-500" />
                <h4 className="text-sm font-semibold text-slate-950">
                  {profile.github_username ? `Connected: @${profile.github_username}` : "Connect GitHub"}
                </h4>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {profile.github_username
                  ? "PrioryxAI uses your repos, languages, and streak to rank tasks and match internships automatically."
                  : "Connect GitHub to auto-sync your repos, streak, and get matched Internshala openings — no manual input needed."}
              </p>
              <button
                type="button"
                onClick={handleGithubOAuth}
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                {profile.github_username ? "Reconnect GitHub" : "Connect GitHub via OAuth"}
              </button>
            </div>
          </div>
        )}

        {isPro ? (
          <div className="glass rounded-[28px] p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <ArrowDownToLine size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-semibold tracking-tight text-slate-950">Generate Resume</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Turn your GitHub repos, languages, and completed tasks into a recruiter-ready PDF — in seconds.
                </p>
              </div>
            </div>
            {resumeError && (
              <p className="mt-4 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {resumeError}
              </p>
            )}
            <button
              type="button"
              onClick={handleGenerateResume}
              disabled={generatingResume}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {generatingResume ? (
                <><Loader2 size={15} className="animate-spin" /> Generating resume…</>
              ) : (
                <><ArrowDownToLine size={15} /> Download resume.pdf</>
              )}
            </button>
          </div>
        ) : (
          <div className="glass rounded-[28px] p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-500">
                <Lock size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-semibold tracking-tight text-slate-950">AI-generated Resume</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  PrioryxAI reads your GitHub repos, languages, and completed tasks to write a recruiter-ready PDF — no templates.
                </p>
              </div>
            </div>
            <ul className="mt-5 space-y-2 text-xs text-slate-500">
              {["Your top repos → project bullets", "GitHub languages → skills section", "Completed tasks → achievements", "Downloaded as resume.pdf instantly"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onOpenPricing}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Sparkles size={15} /> Unlock — Upgrade to Pro
            </button>
          </div>
        )}

        {!isPro && (
          <div className="glass rounded-[28px] p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Sparkles size={16} />
              Pro automation
            </div>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">Let the calendar do the heavy lifting</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Automatically place deadlines around classes, lab slots, and practice time without making the schedule feel crowded.
            </p>
            <button
              type="button"
              onClick={onOpenPricing}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Upgrade
            </button>
          </div>
        )}

        <div className="glass rounded-[28px] p-5">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
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
      <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-500">
        <Icon size={14} />
        {label}
      </label>
      {children}
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-emerald-700" : "text-slate-950"}`}>{value}</span>
    </div>
  );
}
