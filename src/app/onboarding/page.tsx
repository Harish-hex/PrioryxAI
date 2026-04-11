"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ImagePlus, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ProfilePayload {
  username: string;
  github_username: string | null;
  college: string | null;
  semester: number | null;
  subjects: string[] | null;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [college, setCollege] = useState("");
  const [semester, setSemester] = useState("");
  const [subjects, setSubjects] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [examDates, setExamDates] = useState("");
  const [starterTasks, setStarterTasks] = useState("");
  const [timetableFile, setTimetableFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((response) => response.json())
      .then((data) => {
        const profile = data.profile as ProfilePayload | undefined;
        if (!profile) return;
        setCollege(profile.college ?? "");
        setSemester(profile.semester ? String(profile.semester) : "");
        setSubjects(profile.subjects?.join(", ") ?? "");
        setGithubUsername(profile.github_username ?? "");
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setStatus("Saving your profile...");

    const subjectList = subjects
      .split(",")
      .map((subject) => subject.trim())
      .filter(Boolean);

    try {
      const onboardRes = await fetch("/api/user/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          college,
          semester: Number(semester),
          subjects: subjectList,
          github_username: githubUsername,
        }),
      });

      if (!onboardRes.ok) {
        const body = await onboardRes.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save onboarding data");
      }

      if (timetableFile) {
        setStatus("Parsing your timetable...");
        const form = new FormData();
        form.append("file", timetableFile);
        const visionRes = await fetch("/api/ingest/vision", {
          method: "POST",
          body: form,
        });
        if (!visionRes.ok) {
          const body = await visionRes.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to parse timetable image");
        }
      }

      const taskEntries = [examDates, starterTasks]
        .join("\n")
        .split("\n")
        .map((task) => task.trim())
        .filter(Boolean);

      if (taskEntries.length > 0) {
        setStatus("Adding your starter tasks...");
        await Promise.all(
          taskEntries.map(async (task) => {
            const taskRes = await fetch("/api/ingest/manual", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: task }),
            });
            if (!taskRes.ok) {
              const body = await taskRes.json().catch(() => ({}));
              throw new Error(body.error ?? "Failed to add starter tasks");
            }
          })
        );
      }

      if (githubUsername.trim()) {
        setStatus("Syncing GitHub activity...");
        await fetch("/api/sync/github", { method: "POST" });
      }

      if (subjectList.length > 0) {
        setStatus("Checking Internshala openings for your skill profile...");
        await fetch("/api/jobs/sync", { method: "POST" });
      }

      setStatus("Your workspace is ready.");
      router.push("/feed");
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong during onboarding.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-background min-h-screen px-4 py-8 text-neutral-100 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="glass-strong rounded-lg p-5 sm:p-7">
          <div className="inline-flex items-center gap-2 rounded-lg border border-volt/20 bg-volt/10 px-3 py-1.5 text-sm text-volt">
            <Sparkles size={15} />
            First-time setup
          </div>

          <h1 className="mt-5 text-3xl font-semibold text-white sm:text-4xl">
            Build your live DeadlineOS workspace.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-400">
            Add your exam dates, GitHub context, and skill signals so the feed always has a meaningful next
            step, can inspect your public repos automatically, and can watch for internship openings.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Field label="College or university">
              <input
                value={college}
                onChange={(event) => setCollege(event.target.value)}
                className="input-base"
                placeholder="e.g. Anna University"
                required
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Semester">
                <input
                  value={semester}
                  onChange={(event) => setSemester(event.target.value)}
                  className="input-base"
                  type="number"
                  min="1"
                  max="12"
                  placeholder="e.g. 6"
                  required
                />
              </Field>

              <Field label="GitHub username">
                <input
                  value={githubUsername}
                  onChange={(event) => setGithubUsername(event.target.value)}
                  className="input-base"
                  placeholder="e.g. octocat"
                />
              </Field>
            </div>

            <Field label="Subjects / skills (comma-separated)">
              <input
                value={subjects}
                onChange={(event) => setSubjects(event.target.value)}
                className="input-base"
                placeholder="e.g. DBMS, React, Node.js, Python"
                required
              />
            </Field>

            <Field label="Upcoming exam dates or academic deadlines (one per line)">
              <textarea
                value={examDates}
                onChange={(event) => setExamDates(event.target.value)}
                className="input-base min-h-28"
                placeholder={"OS exam on 18 April at 9 AM\nCN lab viva on 22 April\nDBMS assignment due 25 April 11:59 PM"}
              />
            </Field>

            <Field label="Other tasks to seed your feed (one per line)">
              <textarea
                value={starterTasks}
                onChange={(event) => setStarterTasks(event.target.value)}
                className="input-base min-h-32"
                placeholder={"Submit CN lab report tomorrow night\nRevise OS unit 4 before Friday quiz"}
              />
            </Field>

            <Field label="Timetable or exam schedule image (optional)">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-white/15 bg-black/25 px-4 py-4 text-sm text-neutral-300 transition hover:border-white/25 hover:bg-black/35">
                <ImagePlus size={18} className="text-volt" />
                <span className="flex-1">
                  {timetableFile ? timetableFile.name : "Upload a JPG, PNG, WebP, or HEIC file"}
                </span>
                <input
                  className="hidden"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  onChange={(event) => setTimetableFile(event.target.files?.[0] ?? null)}
                />
              </label>
            </Field>

            {error && (
              <p className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            )}
            {status && !error && (
              <p className="rounded-lg border border-mint/20 bg-mint/10 px-4 py-3 text-sm text-mint">
                {status}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {loading ? "Setting things up..." : "Finish onboarding"}
            </button>
          </form>
        </section>

        <aside className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-lg p-5"
          >
            <h2 className="text-lg font-semibold text-white">What happens next</h2>
            <div className="mt-4 space-y-3 text-sm text-neutral-400">
              <Step text="Your dashboard will always surface the next highest-leverage step." />
              <Step text="Exam dates immediately improve ranking and urgency signals." />
              <Step text="Synced GitHub repos let DeadlineOS infer your next best project move automatically." />
              <Step text="GitHub plus skills help DeadlineOS watch for internship openings." />
            </div>
          </motion.div>
        </aside>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm text-neutral-400">{label}</label>
      {children}
    </div>
  );
}

function Step({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 px-4 py-3">
      <p>{text}</p>
    </div>
  );
}
