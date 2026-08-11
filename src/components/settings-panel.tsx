"use client";

import { ArrowDownToLine, CalendarCheck, CheckCircle2, FileText, GitBranch, Loader2, Lock, LogOut, Save, Shield, Sparkles, Upload, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TimetableUploader } from "@/components/schedule/TimetableUploader";
import { ExamUploader } from "@/components/schedule/ExamUploader";
import { TimetablePreview } from "@/components/schedule/TimetablePreview";
import { ExamPreview } from "@/components/schedule/ExamPreview";
import { TimetableEntry, ExamEntry } from "@/lib/schedule/extractor";

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
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [hackerrankUsername, setHackerrankUsername] = useState("");
  const [connectingCoding, setConnectingCoding] = useState(false);
  const [codingMessage, setCodingMessage] = useState<{type: "error" | "success", text: string} | null>(null);

  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [examEntries, setExamEntries] = useState<ExamEntry[]>([]);

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

    fetch("/api/schedule/timetable")
      .then((r) => r.json())
      .then((data) => {
        if (data.entries) setTimetableEntries(data.entries);
      })
      .catch(() => {});

    fetch("/api/schedule/exam/saved")
      .then((r) => r.json())
      .then((data) => {
        if (data.entries) setExamEntries(data.entries);
      })
      .catch(() => {});

    // Listen to custom events from uploaders
    const handleTimetableExtracted = ((e: CustomEvent<TimetableEntry[]>) => {
      setTimetableEntries(e.detail);
      onVisionUploaded();
    }) as EventListener;
    
    const handleExamExtracted = ((e: CustomEvent<ExamEntry[]>) => {
      setExamEntries(e.detail);
      onVisionUploaded();
    }) as EventListener;

    window.addEventListener('timetable_extracted', handleTimetableExtracted);
    window.addEventListener('exam_extracted', handleExamExtracted);

    return () => {
      window.removeEventListener('timetable_extracted', handleTimetableExtracted);
      window.removeEventListener('exam_extracted', handleExamExtracted);
    };
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



  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function handleGithubOAuth() {
    window.location.href = "/api/auth/login?provider=github&next=/settings";
  }

  async function handleCodingProfilesConnect() {
    setConnectingCoding(true);
    setCodingMessage(null);
    let successCount = 0;
    try {
      if (leetcodeUsername.trim()) {
        const resL = await fetch("/api/leetcode/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: leetcodeUsername, stream: "SDE", targetCompanies: [] })
        });
        if (resL.ok) successCount++;
      }
      if (hackerrankUsername.trim()) {
        const resH = await fetch("/api/hackerrank/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hackerrank_username: hackerrankUsername, stream: "SDE", targetCompanies: [] })
        });
        if (resH.ok) successCount++;
      }
      if (successCount > 0) {
        setCodingMessage({ type: "success", text: "Successfully connected coding profiles. AI Analysis is running." });
      } else {
        setCodingMessage({ type: "error", text: "Please enter at least one valid username." });
      }
    } catch {
      setCodingMessage({ type: "error", text: "Failed to connect coding profiles." });
    } finally {
      setConnectingCoding(false);
    }
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

        {/* ── SECTION 1: TIMETABLE ── */}
        <div className="glass rounded-[28px] p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-slate-950">Upload Weekly Timetable</h3>
            <p className="text-sm text-slate-500 mt-1 leading-6">
              Upload your weekly class schedule. PrioryxAI will extract every subject, day, and time slot automatically.
            </p>
          </div>

          <TimetableUploader isPro={isPro} visionRemaining={visionRemaining} />
          
          {timetableEntries.length > 0 && (
            <TimetablePreview entries={timetableEntries} onClear={() => setTimetableEntries([])} />
          )}
        </div>

        {/* ── SECTION 2: EXAM SCHEDULE ── */}
        <div className="glass rounded-[28px] p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-slate-950">Upload Exam & Assignment Schedule</h3>
            <p className="text-sm text-slate-500 mt-1 leading-6">
              Upload your exam timetable, assignment deadlines, or lab schedule. All dates are extracted and added to your dashboard calendar.
            </p>
          </div>

          <ExamUploader isPro={isPro} visionRemaining={visionRemaining} />
          
          {examEntries.length > 0 && (
            <ExamPreview entries={examEntries} onClear={() => setExamEntries([])} />
          )}
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

        <div className="glass rounded-[28px] p-5">
          <h3 className="text-xl font-semibold tracking-tight text-slate-950">Coding Profiles</h3>
          <p className="mt-2 text-xs leading-5 text-slate-500 mb-4">
            Connect your competitive programming accounts to track problems and unlock AI study plans.
          </p>
          
          <div className="space-y-4">
            <Field label="LeetCode Username" icon={User}>
              <input
                value={leetcodeUsername}
                onChange={(e) => setLeetcodeUsername(e.target.value)}
                placeholder="e.g. neetcode"
                className="input-base"
              />
            </Field>
            
            <Field label="HackerRank Username" icon={User}>
              <input
                value={hackerrankUsername}
                onChange={(e) => setHackerrankUsername(e.target.value)}
                placeholder="e.g. hruser"
                className="input-base"
              />
            </Field>

            {codingMessage && (
              <p className={`rounded-[18px] border px-4 py-2.5 text-sm ${
                codingMessage.type === "success" 
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700" 
                  : "border-red-200 bg-red-50 text-red-600"
              }`}>
                {codingMessage.text}
              </p>
            )}

            <button
              type="button"
              onClick={handleCodingProfilesConnect}
              disabled={connectingCoding}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {connectingCoding ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {connectingCoding ? "Connecting..." : "Connect Profiles"}
            </button>
          </div>
        </div>

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
