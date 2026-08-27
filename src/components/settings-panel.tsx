"use client";

import { motion } from "framer-motion";
import { AlertCircle, ArrowDownToLine, Calendar, CalendarCheck, CheckCircle2, ChevronDown, FileText, GitBranch, Loader2, Lock, LogOut, Moon, Save, Shield, Sun, Upload, User, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

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
  id?: string;
  type?: string;
  title: string;
  subject?: string | null;
  subject_name?: string | null;
  due_at?: string | null;
  date?: string | null;
  weightage?: number | null;
  notes?: string | null;
}

interface ExtractedClassSlot {
  day: string;
  subject: string;
  startTime?: string | null;
  endTime?: string | null;
  time?: string | null;
  location?: string | null;
  type?: string;
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

  // 1. Weekly Class Timetable Upload State
  const [classFile, setClassFile] = useState<File | null>(null);
  const [classUploading, setClassUploading] = useState(false);
  const [classResult, setClassResult] = useState<string | null>(null);
  const [classError, setClassError] = useState<string | null>(null);
  const [extractedClasses, setExtractedClasses] = useState<ExtractedClassSlot[] | null>(null);
  const [classWorksOpen, setClassWorksOpen] = useState(false);
  const [classDragActive, setClassDragActive] = useState(false);
  const classInputRef = useRef<HTMLInputElement>(null);

  // 2. Exam & Assignment Schedule Upload State
  const [examFile, setExamFile] = useState<File | null>(null);
  const [examUploading, setExamUploading] = useState(false);
  const [examResult, setExamResult] = useState<string | null>(null);
  const [examError, setExamError] = useState<string | null>(null);
  const [extractedExams, setExtractedExams] = useState<ExtractedTask[] | null>(null);
  const [examWorksOpen, setExamWorksOpen] = useState(false);
  const [examDragActive, setExamDragActive] = useState(false);
  const examInputRef = useRef<HTMLInputElement>(null);

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
        if (data?.entries?.length) setExtractedClasses(data.entries);
      })
      .catch(() => {});

    fetch("/api/schedule/exam")
      .then((r) => r.json())
      .then((data) => {
        if (data?.entries?.length) setExtractedExams(data.entries);
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

  // 1. Handle Class Timetable Upload
  async function handleClassTimetableUpload() {
    if (!classFile) return;
    setClassUploading(true);
    setClassError(null);
    setClassResult(null);
    setExtractedClasses(null);

    if (classFile.size > 10 * 1024 * 1024) {
      setClassError("File too large. Max 10 MB.");
      setClassUploading(false);
      return;
    }

    try {
      const form = new FormData();
      form.append("file", classFile);
      const res = await fetch("/api/schedule/timetable", { method: "POST", body: form });
      const data = await readJsonSafely(res);

      if (!res.ok) {
        setClassError(data?.error ?? "Failed to parse class timetable. Try a clearer image or PDF.");
        return;
      }

      const entries: ExtractedClassSlot[] = data?.entries ?? [];
      onVisionUploaded();

      if (entries.length === 0) {
        setClassResult("No class slots found. Try a clearer image or a different format.");
      } else {
        setExtractedClasses(entries);
        setClassResult(`Successfully extracted ${entries.length} weekly class slot${entries.length === 1 ? "" : "s"}.`);
        setClassFile(null);
        if (classInputRef.current) classInputRef.current.value = "";
      }
    } catch {
      setClassError("Network error uploading class timetable.");
    } finally {
      setClassUploading(false);
    }
  }

  // 2. Handle Exam & Assignment Schedule Upload
  async function handleExamScheduleUpload() {
    if (!examFile) return;
    setExamUploading(true);
    setExamError(null);
    setExamResult(null);
    setExtractedExams(null);

    if (examFile.size > 10 * 1024 * 1024) {
      setExamError("File too large. Max 10 MB.");
      setExamUploading(false);
      return;
    }

    try {
      const form = new FormData();
      form.append("file", examFile);
      const res = await fetch("/api/schedule/exam", { method: "POST", body: form });
      const data = await readJsonSafely(res);

      if (!res.ok) {
        // Fallback to ingest/vision
        const fallbackRes = await fetch("/api/ingest/vision", { method: "POST", body: form });
        const fallbackData = await readJsonSafely(fallbackRes);
        if (fallbackRes.ok && fallbackData?.tasks?.length) {
          const tasks: ExtractedTask[] = fallbackData.tasks;
          setExtractedExams(tasks);
          setExamResult(`${tasks.length} exam & deadline item${tasks.length === 1 ? "" : "s"} extracted and added to your feed.`);
          setExamFile(null);
          if (examInputRef.current) examInputRef.current.value = "";
          onVisionUploaded();
          return;
        }

        setExamError(data?.error ?? fallbackData?.error ?? "Failed to extract exams. Try a clearer document or format.");
        return;
      }

      const entries: ExtractedTask[] = data?.entries ?? [];
      onVisionUploaded();

      if (entries.length === 0) {
        setExamResult("No exam or assignment dates found. Try a clearer image or format.");
      } else {
        setExtractedExams(entries);
        setExamResult(`Successfully extracted ${entries.length} exam deadline${entries.length === 1 ? "" : "s"} and added them to your dashboard.`);
        setExamFile(null);
        if (examInputRef.current) examInputRef.current.value = "";
      }
    } catch {
      setExamError("Network error uploading exam schedule.");
    } finally {
      setExamUploading(false);
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
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${profile?.name ? profile.name.replace(/\s+/g, "_") : "Student"}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setResumeError("Network error generating resume.");
    } finally {
      setGeneratingResume(false);
    }
  }

  const handleClassDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setClassDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setClassFile(file);
      setClassResult(null);
      setClassError(null);
      setExtractedClasses(null);
    }
  }, []);

  const handleExamDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setExamDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setExamFile(file);
      setExamResult(null);
      setExamError(null);
      setExtractedExams(null);
    }
  }, []);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      {/* Main column */}
      <section className="space-y-6">
        {/* Profile form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="neu-card rounded-[28px] p-5 sm:p-7"
        >
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Academic profile</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Tell PrioryxAI what you study so it can prioritize the right coursework and exams.
          </p>

          <form onSubmit={handleSave} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Full name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priyan Sharma"
                  className="neu-inset mt-1.5 w-full rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-volt dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">College / University</label>
                <input
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. Amrita Vishwa Vidyapeetham"
                  className="neu-inset mt-1.5 w-full rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-volt dark:text-white"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Semester</label>
                <input
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  placeholder="e.g. 5"
                  type="number"
                  min="1"
                  max="12"
                  className="neu-inset mt-1.5 w-full rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-volt dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">CGPA (0 – 10)</label>
                <input
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  placeholder="e.g. 8.4"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  className="neu-inset mt-1.5 w-full rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-volt dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Subjects / Course Codes (comma-separated)</label>
              <input
                value={subjects}
                onChange={(e) => setSubjects(e.target.value)}
                placeholder="e.g. 19CSE301 DBMS, 19CSE302 OS, 19MAT201 Linear Algebra"
                className="neu-inset mt-1.5 w-full rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">GitHub username</label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-slate-400">@</span>
                <input
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="octocat"
                  className="neu-inset w-full rounded-2xl py-3 pl-8 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-volt dark:text-white"
                />
              </div>
            </div>

            {error && (
              <p className="neu-inset flex items-center gap-2 rounded-[22px] px-4 py-3 text-sm font-semibold text-rose-600 dark:text-rose-400">
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </p>
            )}
            {successMessage && (
              <p className="neu-inset flex items-center gap-2 rounded-[22px] px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={15} />
                {successMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="neu-btn inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8edf4] disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 dark:focus-visible:ring-offset-[#172030]"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        </motion.div>

        {/* ── CARD 1: Upload Weekly Timetable (Class Timetable) ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
          className="neu-card rounded-[28px] p-5 sm:p-7"
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-cyan-600 dark:text-cyan-400">
            <Calendar size={15} /> Class Schedule
          </div>
          <h3 className="mt-1.5 text-xl font-bold tracking-tight text-slate-950 dark:text-white">
            Upload Weekly Timetable
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Upload your weekly class schedule. PrioryxAI will extract every subject, day, and time slot automatically.
          </p>

          <div className="mt-5 space-y-3">
            <label
              onDragOver={(e) => { e.preventDefault(); setClassDragActive(true); }}
              onDragLeave={() => setClassDragActive(false)}
              onDrop={handleClassDrop}
              className={`flex cursor-pointer items-center gap-3 rounded-[22px] border-2 border-dashed px-4 py-4 text-sm font-medium transition-all focus-within:ring-2 focus-within:ring-volt ${
                classDragActive
                  ? "border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:border-cyan-400 dark:text-cyan-300"
                  : classFile
                  ? "neu-inset border-transparent text-slate-700 dark:text-slate-200"
                  : "neu-inset border-transparent text-slate-700 hover:border-slate-300 dark:text-slate-200 dark:hover:border-white/20"
              }`}
            >
              {classFile ? (
                <FileText size={18} className="shrink-0 text-cyan-600 dark:text-cyan-400" />
              ) : (
                <Upload size={18} className={`shrink-0 ${classDragActive ? "text-cyan-500" : "text-slate-400 dark:text-slate-500"}`} />
              )}
              <span className="min-w-0 flex-1 truncate">
                {classDragActive
                  ? "Drop your timetable here…"
                  : classFile
                  ? classFile.name
                  : "Choose or drag JPG, PNG, WebP, HEIC, PDF, or DOC — up to 10 MB"}
              </span>
              {classFile && !classUploading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setClassFile(null);
                    setClassResult(null);
                    setClassError(null);
                    if (classInputRef.current) classInputRef.current.value = "";
                  }}
                  aria-label="Remove selected file"
                  className="shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-black/5 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
              <input
                ref={classInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                className="sr-only"
                onChange={(e) => {
                  setClassFile(e.target.files?.[0] ?? null);
                  setClassResult(null);
                  setClassError(null);
                  setExtractedClasses(null);
                }}
              />
            </label>

            {classError && (
              <p className="neu-inset flex items-center gap-2 rounded-[22px] px-4 py-3 text-sm font-semibold text-rose-600 dark:text-rose-400">
                <AlertCircle size={15} className="shrink-0" />
                {classError}
              </p>
            )}
            {classResult && (
              <p className="neu-inset flex items-center gap-2 rounded-[22px] px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={15} />
                {classResult}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleClassTimetableUpload}
                disabled={!classFile || classUploading}
                className="neu-btn inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold text-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt dark:text-slate-200 disabled:opacity-40"
              >
                {classUploading ? (
                  <><Loader2 size={15} className="animate-spin" /> Extracting timetable…</>
                ) : (
                  <><Calendar size={15} /> Extract Timetable</>
                )}
              </button>

              <button
                type="button"
                onClick={() => setClassWorksOpen(!classWorksOpen)}
                className="inline-flex items-center gap-1.5 rounded-md text-xs font-bold text-slate-500 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt dark:text-slate-400 dark:hover:text-slate-200"
              >
                <span>What works best?</span>
                <ChevronDown size={13} className={`transition-transform duration-200 ${classWorksOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            {classWorksOpen && (
              <div className="neu-inset rounded-[20px] p-3.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400 space-y-1">
                <p>• <strong>Photos of printed or written class schedules:</strong> Ensure good lighting and readable text.</p>
                <p>• <strong>PDF or DOC exports:</strong> Directly exported from your college / university LMS portal.</p>
                <p>• <strong>Spreadsheet screenshots:</strong> Clean tables with days as columns/rows and time slots.</p>
              </div>
            )}

            {extractedClasses && extractedClasses.length > 0 && (
              <div className="neu-card mt-3 overflow-hidden rounded-[24px]">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200/60 dark:border-white/10 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-950 dark:text-white">
                    <CheckCircle2 size={15} className="text-emerald-500" />
                    {extractedClasses.length} weekly class slot{extractedClasses.length === 1 ? "" : "s"} extracted
                  </span>
                </div>
                <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-200/60 dark:divide-white/10">
                  {extractedClasses.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5 text-xs">
                      <div>
                        <span className="font-bold text-slate-950 dark:text-white">{item.subject}</span>
                        <span className="ml-2 neu-pill rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{item.day}</span>
                      </div>
                      <span className="font-mono text-slate-500 dark:text-slate-400">{item.startTime || item.time} - {item.endTime || ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── CARD 2: Upload Exam & Assignment Schedule ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
          className="neu-card rounded-[28px] p-5 sm:p-7"
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-purple-600 dark:text-purple-400">
            <CalendarCheck size={15} /> Exam & Deadlines
          </div>
          <h3 className="mt-1.5 text-xl font-bold tracking-tight text-slate-950 dark:text-white">
            Upload Exam & Assignment Schedule
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Upload your exam timetable, assignment deadlines, or lab schedule. All dates are extracted and added to your dashboard calendar.
          </p>

          <div className="mt-5 space-y-3">
            <label
              onDragOver={(e) => { e.preventDefault(); setExamDragActive(true); }}
              onDragLeave={() => setExamDragActive(false)}
              onDrop={handleExamDrop}
              className={`flex cursor-pointer items-center gap-3 rounded-[22px] border-2 border-dashed px-4 py-4 text-sm font-medium transition-all focus-within:ring-2 focus-within:ring-volt ${
                examDragActive
                  ? "border-purple-500 bg-purple-500/10 text-purple-700 dark:border-purple-400 dark:text-purple-300"
                  : "neu-inset border-transparent text-slate-700 hover:border-slate-300 dark:text-slate-200 dark:hover:border-white/20"
              }`}
            >
              {examFile ? (
                <FileText size={18} className="shrink-0 text-purple-600 dark:text-purple-400" />
              ) : (
                <Upload size={18} className={`shrink-0 ${examDragActive ? "text-purple-500" : "text-slate-400 dark:text-slate-500"}`} />
              )}
              <span className="min-w-0 flex-1 truncate">
                {examDragActive
                  ? "Drop your exam schedule here…"
                  : examFile
                  ? examFile.name
                  : "Choose or drag JPG, PNG, WebP, HEIC, PDF, or DOC — up to 10 MB"}
              </span>
              {examFile && !examUploading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setExamFile(null);
                    setExamResult(null);
                    setExamError(null);
                    if (examInputRef.current) examInputRef.current.value = "";
                  }}
                  aria-label="Remove selected file"
                  className="shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-black/5 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
              <input
                ref={examInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                className="sr-only"
                onChange={(e) => {
                  setExamFile(e.target.files?.[0] ?? null);
                  setExamResult(null);
                  setExamError(null);
                  setExtractedExams(null);
                }}
              />
            </label>

            {examError && (
              <p className="neu-inset flex items-center gap-2 rounded-[22px] px-4 py-3 text-sm font-semibold text-rose-600 dark:text-rose-400">
                <AlertCircle size={15} className="shrink-0" />
                {examError}
              </p>
            )}
            {examResult && (
              <p className="neu-inset flex items-center gap-2 rounded-[22px] px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={15} />
                {examResult}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleExamScheduleUpload}
                disabled={!examFile || examUploading}
                className="neu-btn inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold text-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt dark:text-slate-200 disabled:opacity-40"
              >
                {examUploading ? (
                  <><Loader2 size={15} className="animate-spin" /> Extracting exams…</>
                ) : (
                  <><CalendarCheck size={15} /> Extract Exam Schedule</>
                )}
              </button>

              <button
                type="button"
                onClick={() => setExamWorksOpen(!examWorksOpen)}
                className="inline-flex items-center gap-1.5 rounded-md text-xs font-bold text-slate-500 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt dark:text-slate-400 dark:hover:text-slate-200"
              >
                <span>What works best?</span>
                <ChevronDown size={13} className={`transition-transform duration-200 ${examWorksOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            {examWorksOpen && (
              <div className="neu-inset rounded-[20px] p-3.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400 space-y-1">
                <p>• <strong>Mid-term, End-sem & Internal circulars:</strong> Official exam schedule notices and hall tickets.</p>
                <p>• <strong>Assignment & Project deadlines:</strong> Course syllabus or assignment handouts with due dates.</p>
                <p>• <strong>Academic Calendars:</strong> Full semester / yearly university calendars (Amrita, VIT, Anna Univ, etc.).</p>
              </div>
            )}

            {extractedExams && extractedExams.length > 0 && (
              <div className="neu-card mt-3 overflow-hidden rounded-[24px]">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200/60 dark:border-white/10 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-950 dark:text-white">
                    <CalendarCheck size={15} className="text-emerald-500" />
                    {extractedExams.length} item{extractedExams.length === 1 ? "" : "s"} extracted
                  </span>
                  <button
                    type="button"
                    onClick={onNavigateToDashboard}
                    className="text-xs font-bold text-purple-600 dark:text-purple-400 underline-offset-2 hover:underline"
                  >
                    View in feed →
                  </button>
                </div>
                <ul className="max-h-[420px] divide-y divide-slate-200/60 dark:divide-white/10 overflow-y-auto">
                  {extractedExams.map((task, i) => {
                    const dateStr = task.due_at || (task as any).date
                      ? new Date(task.due_at || (task as any).date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                      : null;
                    return (
                      <li key={task.id ?? i} className="flex items-start gap-3 px-4 py-3">
                        <span className="mt-0.5 shrink-0 text-slate-500 dark:text-slate-400">
                          <FileText size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold leading-snug text-slate-950 dark:text-white">{task.title}</p>
                            {dateStr && (
                              <span className="shrink-0 tabular-nums text-xs font-semibold text-purple-600 dark:text-purple-400">{dateStr}</span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                            {(task.subject || (task as any).subject_name) && (
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{task.subject || (task as any).subject_name}</span>
                            )}
                            {task.weightage != null && (
                              <span className="neu-pill rounded-full px-2 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {task.weightage}%
                              </span>
                            )}
                          </div>
                          {task.notes && (
                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{task.notes}</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Right sidebar */}
      <motion.aside
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
        className="space-y-6"
      >
        {profile && (
          <div className="neu-card rounded-[28px] p-5 sm:p-6">
            <h3 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">Account</h3>
            <div className="mt-5 space-y-3">
              <Row label="Username" value={`@${profile.username}`} />
              <Row label="Plan" value={isPro ? "Pro" : "Free"} highlight={isPro} />
              {profile.pro_expires_at && isPro && (
                <Row label="Renews" value={new Date(profile.pro_expires_at).toLocaleDateString()} />
              )}
            </div>

            <div className="neu-raised-sm mt-5 rounded-[22px] p-4">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-slate-500 dark:text-slate-400" />
                <span className="text-xs font-bold text-slate-950 dark:text-white">Data & Privacy</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                Your syllabus and tasks are stored privately. Only you can view your schedule data.
              </p>
            </div>
          </div>
        )}

        {/* GitHub connect card */}
        <div className="neu-card rounded-[28px] p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <GitBranch size={16} className="text-slate-500 dark:text-slate-400" />
            <h3 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">GitHub integration</h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Link your GitHub account to sync repo health, public commits, and unlock your recruiter-ready profile cards.
          </p>
          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={handleGithubOAuth}
              className="neu-btn flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8edf4] dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 dark:focus-visible:ring-offset-[#172030]"
            >
              <GitBranch size={16} />
              {profile?.github_username ? "Reconnect with GitHub" : "Connect with GitHub"}
            </button>
            {profile?.github_username && (
              <p className="text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                Linked as <span className="font-bold text-slate-900 dark:text-white">@{profile.github_username}</span>
              </p>
            )}
          </div>
        </div>

        {/* Resume Generation card */}
        <div className="neu-card rounded-[28px] p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <ArrowDownToLine size={16} className="text-slate-500 dark:text-slate-400" />
            <h3 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">Export Resume</h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Generate an ATS-optimized, 1-page PDF resume directly from your profile, coursework, and GitHub projects.
          </p>
          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={handleGenerateResume}
              disabled={generatingResume}
              className="neu-btn flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8edf4] disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 dark:focus-visible:ring-offset-[#172030]"
            >
              {generatingResume ? (
                <><Loader2 size={16} className="animate-spin" /> Generating PDF…</>
              ) : !isPro ? (
                <><Lock size={15} /> Export PDF Resume <span className="neu-pill rounded px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">PRO</span></>
              ) : (
                <><ArrowDownToLine size={16} /> Download PDF Resume</>
              )}
            </button>
            {resumeError && (
              <p className="neu-inset flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                <AlertCircle size={13} className="shrink-0" />
                {resumeError}
              </p>
            )}
          </div>
        </div>

        {/* Sign out */}
        <div className="neu-card rounded-[28px] p-5 sm:p-6">
          <button
            type="button"
            onClick={handleSignOut}
            className="neu-btn flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-500/10 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8edf4] dark:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300 dark:focus-visible:ring-offset-[#172030]"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </motion.aside>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1 text-sm">
      <span className="font-semibold text-slate-500 dark:text-slate-400">{label}</span>
      <span
        className={`truncate font-bold ${
          highlight
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-slate-950 dark:text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
