"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Terminal,
  Send,
  CheckCircle2,
  Lock,
  ChevronRight,
  MessageSquare,
  ArrowLeft,
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
  const [terminalLines, setTerminalLines] = useState<string[]>(["$ Welcome to AI Terminal. Type a command..."]);
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
          tool: "foundry.simulateAITerminal",
          input: { command: cmd, projectContext: `${project.title} - ${project.tech_stack.join(", ")}` },
        }),
      });

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
            const data = JSON.parse(line.slice(6));
            if (data.result?.output) {
              setTerminalLines((prev) => [...prev, data.result.output]);
            }
          }
        }
      }
    } catch {
      setTerminalLines((prev) => [...prev, "Error: Command failed"]);
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
          tool: "foundry.verifyPhaseCompletion",
          input: {
            projectId: project.id,
            phaseNumber: project.current_phase,
            submissionText: submission,
          },
        }),
      });

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
          if (line.startsWith("data: ") && line.includes("result")) {
            const data = JSON.parse(line.slice(6));
            if (data.result) setFeedback(data.result);
          }
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: msg }]);

    // Simple AI chat (via OpenAI through the assistant)
    setChatMessages((prev) => [...prev, { role: "assistant", content: "Thinking..." }]);
    // In production, this would call the AI mentor endpoint
    setTimeout(() => {
      setChatMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: `For the ${PHASE_LABELS[(project?.current_phase ?? 1) - 1]} phase, I'd suggest focusing on the core deliverables. ${msg.includes("help") ? "Let me walk you through the key steps..." : "Feel free to ask more specific questions about the project!"}`,
        };
        return updated;
      });
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center gap-4">
        <p className="text-neutral-500">Project not found</p>
        <a href="/career/foundry/dashboard" className="text-indigo-400">← Back to Foundry</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <a href="/career/foundry/dashboard" className="text-neutral-500 hover:text-slate-900">
            <ArrowLeft size={18} />
          </a>
          <div>
            <h1 className="text-lg font-semibold">{project.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              {PHASE_LABELS.map((label, i) => (
                <span
                  key={i}
                  className={`flex items-center gap-1 text-[10px] ${
                    i < project.current_phase - 1
                      ? "text-emerald-400"
                      : i === project.current_phase - 1
                      ? "text-indigo-400 font-semibold"
                      : "text-neutral-600"
                  }`}
                >
                  {i < project.current_phase - 1 ? (
                    <CheckCircle2 size={10} />
                  ) : i === project.current_phase - 1 ? (
                    <ChevronRight size={10} />
                  ) : (
                    <Lock size={8} />
                  )}
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Three-panel layout */}
      <div className="grid grid-cols-12 h-[calc(100vh-73px)]">
        {/* Left: AI Terminal */}
        <div className="col-span-4 border-r border-slate-200 flex flex-col">
          <div className="p-3 border-b border-slate-200 text-xs font-semibold flex items-center gap-2 text-neutral-500">
            <Terminal size={14} /> AI Terminal
          </div>
          <div
            ref={terminalRef}
            className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1 bg-slate-100"
          >
            {terminalLines.map((line, i) => (
              <div key={i} className={line.startsWith("$") ? "text-emerald-400" : "text-neutral-500"}>
                {line}
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 p-2 flex gap-2">
            <input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runCommand()}
              placeholder="Type a command..."
              className="flex-1 bg-transparent text-sm text-slate-900 placeholder-neutral-600 outline-none font-mono"
            />
            <button onClick={runCommand} className="text-indigo-400 hover:text-indigo-300">
              <Send size={14} />
            </button>
          </div>
        </div>

        {/* Center: Phase Content + Submission */}
        <div className="col-span-5 border-r border-slate-200 overflow-y-auto p-6">
          <h2 className="text-lg font-semibold mb-2">
            Phase {project.current_phase}: {PHASE_LABELS[project.current_phase - 1]}
          </h2>
          <p className="text-sm text-neutral-500 mb-6">{project.description}</p>

          <div className="rounded-xl border border-slate-200 bg-white/[0.02] p-4 mb-6">
            <h3 className="text-sm font-semibold mb-2">Tech Stack</h3>
            <div className="flex flex-wrap gap-1">
              {project.tech_stack.map((t) => (
                <span key={t} className="rounded px-2 py-0.5 text-xs border border-slate-200 bg-slate-50 text-neutral-500">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Submission Area */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Submit Phase Deliverable</h3>
            <textarea
              value={submission}
              onChange={(e) => setSubmission(e.target.value)}
              placeholder="Describe what you've built, paste code snippets, or link your work..."
              className="w-full h-40 rounded-lg border border-slate-200 bg-white/[0.03] p-3 text-sm text-slate-900 placeholder-neutral-600 focus:border-indigo-500 focus:outline-none resize-none"
            />
            <button
              onClick={submitPhase}
              disabled={submitting || !submission.trim()}
              className="rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold transition hover:bg-indigo-400 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Submit for Review
            </button>
          </div>

          {/* Feedback */}
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 rounded-xl border p-4 ${
                (feedback.passed as boolean)
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-rose-500/30 bg-rose-500/5"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-sm font-semibold ${(feedback.passed as boolean) ? "text-emerald-400" : "text-rose-400"}`}>
                  {(feedback.passed as boolean) ? "✓ Phase Passed!" : "✗ Not Yet — Try Again"}
                </span>
                <span className="text-xs text-neutral-500">Score: {feedback.score as number}/100</span>
              </div>
              <p className="text-xs text-neutral-500">{feedback.feedback as string}</p>
            </motion.div>
          )}
        </div>

        {/* Right: AI Mentor Chat */}
        <div className="col-span-3 flex flex-col">
          <div className="p-3 border-b border-slate-200 text-xs font-semibold flex items-center gap-2 text-neutral-500">
            <MessageSquare size={14} /> AI Mentor
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-lg p-2.5 text-xs ${
                  msg.role === "user"
                    ? "bg-indigo-500/10 border border-indigo-500/20 ml-4"
                    : "bg-slate-50 border border-slate-200 mr-4"
                }`}
              >
                {msg.content}
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 p-2 flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder="Ask the AI mentor..."
              className="flex-1 bg-transparent text-sm text-slate-900 placeholder-neutral-600 outline-none"
            />
            <button onClick={sendChat} className="text-indigo-400 hover:text-indigo-300">
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
