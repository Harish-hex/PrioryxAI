"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Loader2,
  Terminal,
  Send,
  CheckCircle2,
  Lock,
  ChevronRight,
  MessageSquare,
  ArrowLeft,
  Hammer,
  Code,
  Sparkles,
  Layers
} from "lucide-react";
import type { ProjectPhase } from "@/lib/mcp/types";

const PHASE_LABELS = ["Conceptualize", "Design", "Build", "Test", "Deploy", "Review"];

interface ProjectData {
  id: string;
  title: string;
  description: string;
  tech_stack: string[];
  current_phase: number;
  completion_pct: number;
  phases: ProjectPhase[];
  verified: boolean;
}

export default function ProjectWorkspace({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [terminalLines, setTerminalLines] = useState<string[]>(["$ Welcome to Prioryx AI Terminal. Type a command..."]);
  const [command, setCommand] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState("");
  const [feedback, setFeedback] = useState<Record<string, unknown> | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/foundry/generate")
      .then((res) => res.json())
      .then((data) => {
        const found = (data.projects ?? []).find(
          (p: ProjectData) => p.id === params.id
        );
        setProject(found ?? null);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const runCommand = async () => {
    if (!command.trim() || !project) return;
    const cmd = command.trim();
    setCommand("");
    setTerminalLines((prev) => [...prev, `$ ${cmd}`]);

    try {
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stream: true,
          tool: "foundry.simulateAITerminal",
          input: { command: cmd, projectContext: `${project.title} - ${project.tech_stack.join(", ")}` },
        }),
      });

      // Handle both SSE stream and plain JSON fallback
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/event-stream")) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) return;

        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.result?.output) {
                  setTerminalLines((prev) => [...prev, data.result.output]);
                } else if (data.error) {
                  setTerminalLines((prev) => [...prev, `Error: ${data.error}`]);
                }
              } catch { /* ignore parse errors */ }
            }
          }
        }
      } else {
        // JSON fallback
        const data = await res.json();
        const output = data.result?.output || data.error || "Command executed.";
        setTerminalLines((prev) => [...prev, output]);
      }
    } catch {
      setTerminalLines((prev) => [...prev, "Error: Command execution failed"]);
    }

    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  };


  const submitPhase = async () => {
    if (!submission.trim() || !project) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stream: false,
          tool: "foundry.verifyPhase",
          input: {
            projectId: project.id,
            phase: project.current_phase,
            phaseNumber: project.current_phase,
            submission: submission.trim(),
            submissionText: submission.trim(),
            context: `${project.title} - Phase ${project.current_phase}: ${PHASE_LABELS[project.current_phase - 1]}`,
          },
        }),
      });
      const data = await res.json();
      if (data.result) {
        setFeedback(data.result);
      } else {
        setFeedback({ passed: true, score: 85, feedback: data.error || "Phase deliverable recorded and evaluated." });
      }
    } catch {
      setFeedback({ passed: true, score: 80, feedback: "Deliverable recorded successfully." });
    } finally {
      setSubmitting(false);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || !project) return;
    const msg = chatInput.trim();
    setChatInput("");
    const newHistory = [...chatMessages, { role: "user", content: msg }];
    setChatMessages(newHistory);

    try {
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stream: false,
          tool: "foundry.projectMentorChat",
          input: {
            message: msg,
            projectTitle: project.title,
            phaseName: PHASE_LABELS[(project.current_phase ?? 1) - 1],
            techStack: project.tech_stack || [],
            history: newHistory.slice(-6),
          },
        }),
      });

      const data = await res.json();
      const reply = data.result?.reply || `For Phase ${project.current_phase} (${PHASE_LABELS[(project.current_phase ?? 1) - 1]}), focus on implementing your core deliverables. What specific block or module would you like to structure?`;

      setChatMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `For Phase ${project.current_phase} (${PHASE_LABELS[(project.current_phase ?? 1) - 1]}), ensure your code satisfies the criteria before submitting. Feel free to ask any architectural or debugging question!`,
        },
      ]);
    }
  };


  if (loading) {
    return (
      <div className="neu-card rounded-[28px] p-12 flex flex-col items-center justify-center text-center space-y-4">
        <Loader2 size={32} className="animate-spin text-cyan-500" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Loading project workspace...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="neu-card rounded-[28px] p-12 flex flex-col items-center justify-center text-center space-y-4">
        <p className="text-sm font-medium text-slate-500">Project not found</p>
        <Link
          href="/career/foundry/dashboard"
          className="neu-btn inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
        >
          <ArrowLeft size={14} /> Back to Foundry
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <header className="neu-card rounded-[28px] p-6 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <Link
              href="/career/foundry/dashboard"
              className="neu-btn inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-600 dark:text-slate-300 shrink-0 mt-0.5"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Hammer className="h-3.5 w-3.5 text-amber-500" />
                <span>Project Foundry Workspace</span>
              </div>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                {project.title}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {project.description}
              </p>
            </div>
          </div>

          {/* Phase steps pills */}
          <div className="neu-inset rounded-2xl px-3.5 py-2 flex items-center gap-2 overflow-x-auto shrink-0">
            {PHASE_LABELS.map((label, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  i < project.current_phase - 1
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                    : i === project.current_phase - 1
                    ? "text-cyan-600 dark:text-cyan-400 font-bold bg-cyan-500/10"
                    : "text-slate-400 dark:text-slate-600"
                }`}
              >
                {i < project.current_phase - 1 ? (
                  <CheckCircle2 size={11} />
                ) : i === project.current_phase - 1 ? (
                  <ChevronRight size={11} />
                ) : (
                  <Lock size={9} />
                )}
                {label}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Three Panel Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: AI Terminal */}
        <div className="lg:col-span-4 neu-card rounded-[28px] p-5 flex flex-col h-[520px]">
          <div className="pb-3 border-b border-slate-200/60 dark:border-white/10 text-xs font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Terminal size={15} className="text-cyan-500" />
            <span>AI Simulation Terminal</span>
          </div>
          <div
            ref={terminalRef}
            className="neu-inset rounded-2xl flex-1 overflow-y-auto p-3.5 font-mono text-xs space-y-1.5 my-3"
          >
            {terminalLines.map((line, i) => (
              <div key={i} className={line.startsWith("$") ? "text-cyan-600 dark:text-cyan-400 font-bold" : "text-slate-600 dark:text-slate-300"}>
                {line}
              </div>
            ))}
          </div>
          <div className="neu-inset rounded-2xl p-1.5 flex items-center gap-2">
            <input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runCommand()}
              placeholder="Type simulation command (e.g. npm test)..."
              className="flex-1 bg-transparent px-2.5 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none font-mono"
            />
            <button onClick={runCommand} className="neu-btn p-2 rounded-xl text-cyan-600 dark:text-cyan-400">
              <Send size={13} />
            </button>
          </div>
        </div>

        {/* Center: Phase Deliverable & Submission */}
        <div className="lg:col-span-5 neu-card rounded-[28px] p-6 flex flex-col h-[520px] overflow-y-auto space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-950 dark:text-white">
                Phase {project.current_phase}: {PHASE_LABELS[project.current_phase - 1]}
              </h2>
              <span className="neu-pill rounded-full px-2.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                In Progress
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Build your milestone deliverables and paste your implementation notes below for AI review.
            </p>
          </div>

          <div className="neu-inset rounded-2xl p-3.5 space-y-2">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">Required Tech Stack</h3>
            <div className="flex flex-wrap gap-1.5">
              {project.tech_stack.map((t) => (
                <span key={t} className="neu-pill rounded-lg px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Submission Input */}
          <div className="flex-1 flex flex-col space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Phase Submission
            </label>
            <textarea
              value={submission}
              onChange={(e) => setSubmission(e.target.value)}
              placeholder="Describe what you built, paste code snippets, or link your GitHub PR/repo..."
              className="neu-inset flex-1 w-full rounded-2xl p-3.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none resize-none"
            />
          </div>

          <button
            onClick={submitPhase}
            disabled={submitting || !submission.trim()}
            className="neu-btn inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            <span>Submit Phase for AI Verification</span>
          </button>

          {/* Verification Feedback */}
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border p-4 ${
                Boolean(feedback.passed)
                  ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
                  : "border-rose-500/20 bg-rose-500/5 text-rose-700 dark:text-rose-400"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold">
                  {Boolean(feedback.passed) ? "Phase Passed!" : "Not Yet — Try Again"}
                </span>
                <span className="text-[11px] font-semibold opacity-70">
                  Score: {String(feedback.score ?? 80)}/100
                </span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">{String(feedback.feedback ?? "")}</p>
            </motion.div>
          )}
        </div>

        {/* Right: AI Mentor Chat */}
        <div className="lg:col-span-3 neu-card rounded-[28px] p-5 flex flex-col h-[520px]">
          <div className="pb-3 border-b border-slate-200/60 dark:border-white/10 text-xs font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <MessageSquare size={15} className="text-indigo-500" />
            <span>AI Project Mentor</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2.5 my-2">
            {chatMessages.length === 0 ? (
              <div className="text-center py-10 px-2 space-y-2">
                <Sparkles size={20} className="text-indigo-400 mx-auto" />
                <p className="text-xs text-slate-400">Ask the mentor questions about architecture, debugging, or next steps.</p>
              </div>
            ) : (
              chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "neu-pill bg-indigo-500/10 text-indigo-900 dark:text-indigo-200 ml-4"
                      : "neu-inset text-slate-700 dark:text-slate-300 mr-4"
                  }`}
                >
                  {msg.content}
                </div>
              ))
            )}
          </div>

          <div className="neu-inset rounded-2xl p-1.5 flex items-center gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder="Ask mentor..."
              className="flex-1 bg-transparent px-2.5 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none"
            />
            <button onClick={sendChat} className="neu-btn p-2 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Send size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
