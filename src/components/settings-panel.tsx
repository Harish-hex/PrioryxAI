"use client";

import { GitBranch, ImagePlus, Loader2, LogOut, Save, Shield, User, CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface UserProfile {
  name: string | null;
  username: string;
  college: string | null;
  semester: number | null;
  subjects: string[] | null;
  github_username: string | null;
  pro_status: boolean;
  pro_expires_at: string | null;
}

interface SettingsPanelProps {
  onOpenPricing: () => void;
}

export function SettingsPanel({ onOpenPricing }: SettingsPanelProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [semester, setSemester] = useState("");
  const [subjects, setSubjects] = useState("");
  const [githubUsername, setGithubUsername] = useState("");

  // Timetable upload state
  const [timetableFile, setTimetableFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setUploadResult("No exam or assignment dates found in the image. Try a clearer photo.");
      } else {
        setUploadResult(`${count} task${count === 1 ? "" : "s"} added to your feed from the timetable.`);
        setTimetableFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch {
      setUploadError("Network error uploading timetable.");
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

            <div className="grid gap-4 sm:grid-cols-2">
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

        {/* Timetable / schedule image upload */}
        <div className="glass rounded-lg p-5">
          <h3 className="text-lg font-semibold text-white">Upload timetable or exam schedule</h3>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Photograph your printed timetable, a whiteboard schedule, or any image with exam/assignment dates.
            DeadlineOS will extract all dates and add them to your feed automatically — no typing needed.
          </p>

          <div className="mt-4 space-y-3">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-white/15 bg-black/25 px-4 py-4 text-sm text-neutral-300 transition hover:border-white/25 hover:bg-black/35">
              <ImagePlus size={18} className="shrink-0 text-volt" />
              <span className="flex-1 min-w-0 truncate">
                {timetableFile ? timetableFile.name : "Choose JPG, PNG, WebP, or HEIC — up to 5 MB"}
              </span>
              <input
                ref={fileInputRef}
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
              <p className="rounded-lg border border-mint/25 bg-mint/10 px-4 py-2 text-sm text-mint flex items-center gap-2">
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
                <><Loader2 size={15} className="animate-spin" /> Parsing image…</>
              ) : (
                <><ImagePlus size={15} /> Extract dates from image</>
              )}
            </button>
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
              <Row label="Plan" value={profile.pro_status ? "Pro" : "Free"} highlight={profile.pro_status} />
              {profile.pro_expires_at && (
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
                  ? "DeadlineOS uses your repos, languages, and streak to rank tasks and match internships automatically."
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

        {!profile?.pro_status && (
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
                Upgrade
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
