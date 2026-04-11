"use client";

import { BellRing, LogOut, Save, Shield, User } from "lucide-react";
import { useEffect, useState } from "react";

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
  const [examDates, setExamDates] = useState("");

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
    if (githubUsername) body.github_username = githubUsername;

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save");
      } else {
        const setupEntries = [examDates]
          .join("\n")
          .split("\n")
          .map((entry) => entry.trim())
          .filter(Boolean);

        for (const entry of setupEntries) {
          const taskRes = await fetch("/api/ingest/manual", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: entry }),
          });
          if (!taskRes.ok) {
            const data = await taskRes.json().catch(() => ({}));
            throw new Error(data.error ?? "Failed to save setup tasks");
          }
        }

        if (githubUsername.trim()) {
          await fetch("/api/sync/github", { method: "POST" });
        }
        if (subjectsArr.length > 0) {
          await fetch("/api/jobs/sync", { method: "POST" });
        }
        setSaved(true);
        setExamDates("");
        setTimeout(() => setSaved(false), 3000);
      }
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

  function handleGithubAuthorize() {
    window.location.href = "/api/auth/login?provider=github&next=/settings";
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="glass-strong rounded-lg p-5 sm:p-6">
        <h2 className="text-2xl font-semibold text-white">Profile settings</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-400">
          Update your profile information. Changes are reflected across the app.
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
              placeholder="e.g. IIT Madras"
              className="input-base"
            />
          </Field>

          <Field label="Semester (1-12)" icon={BellRing}>
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

          <Field label="Subjects (comma-separated)" icon={BellRing}>
            <input
              value={subjects}
              onChange={(e) => setSubjects(e.target.value)}
              placeholder="e.g. DBMS, CN, OS, Compiler Design"
              className="input-base"
            />
          </Field>

          <Field label="GitHub username" icon={Shield}>
            <input
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              placeholder="e.g. octocat"
              className="input-base"
            />
          </Field>

          <Field label="Upcoming exam dates or deadlines" icon={BellRing}>
            <textarea
              value={examDates}
              onChange={(e) => setExamDates(e.target.value)}
              placeholder={"OS exam on 18 April at 9 AM\nDBMS assignment due 25 April 11:59 PM"}
              className="input-base min-h-28"
            />
          </Field>

          {error && (
            <p className="rounded-lg border border-signal/25 bg-signal/10 px-4 py-2 text-sm text-signal">{error}</p>
          )}
          {saved && (
            <p className="rounded-lg border border-mint/25 bg-mint/10 px-4 py-2 text-sm text-mint">Saved!</p>
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
      </section>

      <aside className="space-y-5">
        {profile && (
          <div className="glass rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white">Account</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/25 p-3">
                <span className="text-sm text-neutral-400">Username</span>
                <span className="text-sm font-medium text-white">@{profile.username}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/25 p-3">
                <span className="text-sm text-neutral-400">Plan</span>
                <span className={`text-sm font-medium ${profile.pro_status ? "text-mint" : "text-neutral-300"}`}>
                  {profile.pro_status ? "Pro" : "Free"}
                </span>
              </div>
              {profile.pro_expires_at && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/25 p-3">
                  <span className="text-sm text-neutral-400">Renews</span>
                  <span className="text-sm text-neutral-300">
                    {new Date(profile.pro_expires_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-4 rounded-lg border border-white/10 bg-black/25 p-4">
              <h4 className="text-sm font-semibold text-white">
                {profile.github_username ? "Reconnect GitHub" : "Connect GitHub"}
              </h4>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                Authorize GitHub so DeadlineOS can pull your repos, languages, streak, and profile signals
                directly from your account and infer the next best repo improvement step from your public
                project descriptions.
              </p>
              <button
                type="button"
                onClick={handleGithubAuthorize}
                className="mt-4 w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.1]"
              >
                {profile.github_username ? "Reconnect GitHub access" : "Authorize GitHub"}
              </button>
            </div>
          </div>
        )}

        {!profile?.pro_status && (
          <div className="rounded-lg accent-border p-px">
            <div className="rounded-[7px] bg-black/85 p-4">
              <h3 className="text-lg font-semibold text-white">Upgrade to Pro</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                Unlock unlimited AI planning, auto-scheduling, and recruiter profile optimization for ₹99/month.
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
          <h3 className="text-lg font-semibold text-white">Feed health</h3>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            If your feed starts asking for exam dates or job skills, add them here. GitHub repo direction is
            inferred automatically from your synced public project descriptions.
          </p>
        </div>

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

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm text-neutral-400 mb-2">
        <Icon size={14} />
        {label}
      </label>
      {children}
      <style jsx>{`
        :global(.input-base) {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(0,0,0,0.35);
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: #f5f5f5;
          outline: none;
          transition: border-color 0.15s;
        }
        :global(.input-base:focus) {
          border-color: rgba(40,215,255,0.5);
          box-shadow: 0 0 0 4px rgba(40,215,255,0.08);
        }
        :global(.input-base::placeholder) {
          color: #555;
        }
      `}</style>
    </div>
  );
}
