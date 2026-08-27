"use client";

/**
 * Phase 4 — Readiness Score Card
 *
 * Primary hero on the dashboard. Shows:
 *   - Score (0-100) large + delta indicator
 *   - LLM explanation (2 sentences)
 *   - 3 ranked next actions (tappable → mark task done)
 *   - Small sparkline of score history (recharts)
 *
 * Fetches from /api/readiness-score on mount.
 * No props required — self-contained data fetching.
 */

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Lock,
  Share2,
  Download,
  Copy,
  Check,
  X,
  ExternalLink,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface ComponentScore {
  name: string;
  raw: number;
  weight: number;
  weighted: number;
  explanation: string;
}

interface ScoreHistory {
  computed_at: string;
  score: number;
}

interface ScoreData {
  score: number;
  delta_from_last: number | null;
  score_version: number;
  computed_at: string;
  breakdown: Record<string, ComponentScore>;
  explanation?: {
    summary: string;
    next_actions: [string, string, string];
    cached: boolean;
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400">
        <Minus size={11} /> No change
      </span>
    );
  }
  const positive = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
        positive
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
          : "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400"
      }`}
    >
      {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {positive ? "+" : ""}
      {delta} this session
    </span>
  );
}

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;

  const color =
    score >= 70
      ? "#10b981" // emerald
      : score >= 45
      ? "#f59e0b" // amber
      : "#ef4444"; // red

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={10}
        fill="none"
        stroke="currentColor"
        className="text-slate-200 dark:text-white/10"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={10}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - filled}
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
}

function BreakdownBar({ components }: { components: Record<string, ComponentScore> }) {
  const sorted = Object.entries(components).sort(([, a], [, b]) => a.raw - b.raw);
  return (
    <div className="space-y-2">
      {sorted.map(([key, c]) => (
        <div key={key}>
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {c.name}
            </span>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
              {c.raw}/100
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                c.raw >= 70
                  ? "bg-emerald-500"
                  : c.raw >= 45
                  ? "bg-amber-400"
                  : "bg-rose-500"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${c.raw}%` }}
              transition={{ duration: 0.6, delay: 0.1 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SparklineChart({ history }: { history: ScoreHistory[] }) {
  if (history.length < 2) return null;
  const data = history.map((h) => ({
    date: new Date(h.computed_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    score: h.score,
  }));

  return (
    <div className="h-[60px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="score"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
          />
          <Tooltip
            contentStyle={{
              background: "#1e293b",
              border: "none",
              borderRadius: 8,
              fontSize: 11,
              color: "#e2e8f0",
            }}
            labelStyle={{ color: "#94a3b8" }}
            formatter={(v) => [`${Number(v ?? 0)}/100`, "Score"]}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

interface ReadinessScoreCardProps {
  isPro?: boolean;
  onOpenPricing?: () => void;
  onCompleteTask?: (id: string) => void;
}

export function ReadinessScoreCard({
  isPro = false,
  onOpenPricing = () => {},
  onCompleteTask,
}: ReadinessScoreCardProps) {
  const [data, setData] = useState<ScoreData | null>(null);
  const [history, setHistory] = useState<ScoreHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [completedActions, setCompletedActions] = useState<Set<number>>(new Set());
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [includeName, setIncludeName] = useState(true);
  const [includeCollege, setIncludeCollege] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchScore = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/readiness-score");
      if (!res.ok) throw new Error("failed");
      const json = await res.json() as ScoreData;
      setData(json);

      // Fetch history for sparkline
      const histRes = await fetch("/api/readiness-score/history");
      if (histRes.ok) {
        const histJson = await histRes.json() as { history: ScoreHistory[] };
        setHistory(histJson.history ?? []);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchScore();
  }, [fetchScore]);

  const score = data?.score ?? 0;
  const scoreColor =
    score >= 70 ? "text-emerald-600 dark:text-emerald-400"
    : score >= 45 ? "text-amber-600 dark:text-amber-400"
    : "text-rose-600 dark:text-rose-400";

  if (loading) {
    return (
      <div className="neu-card rounded-[32px] p-6 sm:p-8 flex items-center justify-center h-48">
        <Loader2 className="animate-spin text-slate-400" size={28} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="neu-card rounded-[32px] p-6 sm:p-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Could not load readiness score.{" "}
        <button className="underline font-semibold" onClick={() => fetchScore()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="neu-card rounded-[32px] p-6 sm:p-8"
    >
      {/* ── Header Row ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-400">
            Placement Readiness Score
          </p>
          <div className="mt-2 flex items-end gap-3 flex-wrap">
            {/* Score ring + number side by side */}
            <div className="relative">
              <ScoreRing score={score} size={100} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-black tabular-nums ${scoreColor}`}>
                  {score}
                </span>
              </div>
            </div>
            <div className="pb-1 space-y-1.5">
              <DeltaBadge delta={data.delta_from_last} />
              {/* Sparkline (inline if history exists) */}
              {history.length >= 2 && (
                <div className="w-[120px]">
                  <SparklineChart history={history} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions: Share + Refresh + Breakdown toggle */}
        <div className="flex items-center gap-2 self-start flex-wrap">
          <button
            onClick={() => setIsShareOpen(true)}
            className="neu-btn inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-500/20"
          >
            <Share2 size={13} />
            Share
          </button>
          <button
            title="Recompute score"
            onClick={() => fetchScore(true)}
            disabled={refreshing}
            className="neu-btn rounded-xl p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowBreakdown((v) => !v)}
            className="neu-btn rounded-xl px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300"
          >
            {showBreakdown ? "Hide" : "Breakdown"}
          </button>
        </div>
      </div>

      {/* ── LLM Explanation ─────────────────────────────────────────────── */}
      {data.explanation && (
        <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300 max-w-2xl">
          {data.explanation.summary}
        </p>
      )}

      {/* ── Breakdown bars (collapsible) ──────────────────────────────── */}
      <AnimatePresence>
        {showBreakdown && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-5 pt-5 border-t border-slate-200/60 dark:border-white/10">
              <BreakdownBar components={data.breakdown} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top 3 Next Actions ────────────────────────────────────────── */}
      {data.explanation?.next_actions && (
        <div className="mt-5 pt-5 border-t border-slate-200/60 dark:border-white/10 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-400">
            Highest-leverage next actions
          </p>
          {data.explanation.next_actions.map((action, i) => {
            const done = completedActions.has(i);
            return (
              <motion.div
                key={i}
                layout
                className={`flex items-start gap-3 rounded-[20px] px-4 py-3 transition cursor-pointer select-none ${
                  done
                    ? "neu-inset opacity-50"
                    : "neu-raised-sm hover:neu-card"
                }`}
                onClick={() => {
                  if (!isPro && i > 0) { onOpenPricing(); return; }
                  setCompletedActions((prev) => {
                    const next = new Set(prev);
                    if (next.has(i)) next.delete(i);
                    else next.add(i);
                    return next;
                  });
                  if (onCompleteTask && !done) {
                    // Optimistic: trigger parent recompute on first action
                  }
                }}
              >
                <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  done
                    ? "border-emerald-500 bg-emerald-500"
                    : "border-slate-300 dark:border-white/20"
                }`}>
                  {done && <CheckCircle2 size={12} className="text-white" />}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mr-2">
                    #{i + 1}
                  </span>
                  <span className={`text-sm font-medium ${done ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-200"}`}>
                    {action}
                  </span>
                </div>
                {!isPro && i > 0 ? (
                  <Lock size={13} className="text-slate-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 flex-shrink-0 mt-0.5" />
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <p className="mt-3 text-[10px] text-slate-400 dark:text-slate-600">
        Score v{data.score_version} · Last computed {new Date(data.computed_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
      </p>

      {/* ── Share Score Card Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {isShareOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="neu-card rounded-[28px] max-w-2xl w-full p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsShareOpen(false)}
                className="absolute top-5 right-5 neu-btn p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Share2 size={18} />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                    Share Your Readiness Score
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Verified deterministic placement readiness benchmark
                  </p>
                </div>
              </div>

              {/* Live Preview of Generated Card */}
              <div className="mt-5 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-950 aspect-[1200/630] relative shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/readiness-score/card?score=${score}&delta=${data.delta_from_last ?? 0}&includeName=${includeName}&includeCollege=${includeCollege}&t=${Date.now()}`}
                  alt="Readiness Score Card Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Privacy Toggles */}
              <div className="mt-4 flex flex-wrap gap-4 items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeName}
                    onChange={(e) => setIncludeName(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Include my name
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeCollege}
                    onChange={(e) => setIncludeCollege(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Include my college
                </label>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  disabled={downloading}
                  onClick={async () => {
                    setDownloading(true);
                    try {
                      const imageUrl = `/api/readiness-score/card?score=${score}&delta=${data.delta_from_last ?? 0}&includeName=${includeName}&includeCollege=${includeCollege}`;
                      const res = await fetch(imageUrl);
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `prioryx-readiness-score-${score}.png`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);

                      // Track download share
                      fetch("/api/readiness-score/share", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ platform: "download" }),
                      }).catch(() => {});
                    } catch (e) {
                      console.error("Failed to download image", e);
                    } finally {
                      setDownloading(false);
                    }
                  }}
                  className="flex-1 neu-btn inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                >
                  <Download size={15} />
                  {downloading ? "Generating PNG..." : "Download Image (PNG)"}
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const shareUrl = `${window.location.origin}/api/readiness-score/card?score=${score}&includeName=${includeName}&includeCollege=${includeCollege}`;
                    try {
                      await navigator.clipboard.writeText(shareUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);

                      fetch("/api/readiness-score/share", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ platform: "copy_link" }),
                      }).catch(() => {});
                    } catch {}
                  }}
                  className="neu-btn inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200"
                >
                  {copiedLink ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                  {copiedLink ? "Copied!" : "Copy Link"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const text = `I just benchmarked my Placement Readiness Score on @PrioryxAI: ${score}/100! Check your score at prioryx.ai`;
                    const url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
                    window.open(url, "_blank");

                    fetch("/api/readiness-score/share", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ platform: "linkedin" }),
                    }).catch(() => {});
                  }}
                  className="neu-btn inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-blue-600 dark:text-blue-400"
                >
                  <ExternalLink size={15} />
                  LinkedIn
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const text = `My PrioryxAI Placement Readiness Score is ${score}/100! Check yours: https://prioryx.ai`;
                    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                    window.open(url, "_blank");

                    fetch("/api/readiness-score/share", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ platform: "whatsapp" }),
                    }).catch(() => {});
                  }}
                  className="neu-btn inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-emerald-600 dark:text-emerald-400"
                >
                  <ExternalLink size={15} />
                  WhatsApp
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
