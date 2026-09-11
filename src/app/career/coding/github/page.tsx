'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Zap, Target, TrendingUp, AlertTriangle,
  CheckCircle2, Clock, ExternalLink, RefreshCw, Award,
  Code2, ChevronRight, Loader2, Flame, Terminal, Check, Copy
} from 'lucide-react';
import { GitHubLogo } from '@/components/icons/github-logo';

interface ProjectScore {
  repoName: string; repoUrl: string; totalScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  dimensions: { documentation: number; codeQuality: number; activity: number; completeness: number; careerValue: number };
  weaknesses: { title: string; description: string; fix: string; priority: string; effort: string; estimatedMinutes: number; aiSuggestedCommands?: string }[];
  strengths: string[];
  primaryLanguage: string | null;
  careerRelevance: { resumeWorthy: boolean; interviewTopics: string[] };
}

interface PriorityAction {
  id: string; repoName: string; repoUrl: string;
  actionTitle: string; actionDescription: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  effort: 'quick_win' | 'half_day' | 'full_day' | 'multi_day';
  estimatedMinutes: number; impactScore: number;
  completed: boolean; aiSuggestedCommands?: string;
}

interface IntelligenceReport {
  totalRepos: number; portfolioScore: number;
  profileStrengths: string[]; profileWeaknesses: string[];
  topProjects: ProjectScore[]; weakestProjects: ProjectScore[];
  priorityActions: PriorityAction[];
  careerReadiness: { resumeReadyProjects: string[]; languageDiversity: string[]; estimatedProfileStrength: string };
  commitPatterns: { totalCommitsLast90Days: number; averageCommitsPerWeek: number; longestStreak: number; currentStreak: number; consistencyScore: number };
  isStale?: boolean;
}

const gradeColor: Record<string, string> = {
  A: 'bg-emerald-500 text-white ring-emerald-500/25', B: 'bg-cyan-500 text-white ring-cyan-500/25',
  C: 'bg-amber-500 text-white ring-amber-500/25', D: 'bg-orange-500 text-white ring-orange-500/25',
  F: 'bg-rose-500 text-white ring-rose-500/25'
};

const priorityColor: Record<string, string> = {
  CRITICAL: 'text-rose-700 dark:text-rose-400 border-rose-500/30',
  HIGH: 'text-orange-700 dark:text-orange-400 border-orange-500/30',
  MEDIUM: 'text-amber-700 dark:text-amber-400 border-amber-500/30',
  LOW: 'text-slate-700 dark:text-slate-400 border-slate-500/30',
};

const effortLabel: Record<string, string> = {
  quick_win: '<30 min', half_day: '2–4 hrs',
  full_day: '1 day', multi_day: '2+ days'
};

function ScoreRing({ score }: { score: number }) {
  const r = 56; const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? '#10b981' : score >= 50 ? '#06b6d4' : '#f59e0b';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="relative flex items-center justify-center"
    >
      <svg width={140} height={140} className="-rotate-90">
        <circle cx={70} cy={70} r={r} fill="none" stroke="currentColor" className="text-slate-200/80 dark:text-white/10" strokeWidth={10} />
        <circle cx={70} cy={70} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`0 ${circ}`} strokeLinecap="round">
          <animate attributeName="stroke-dasharray" from={`0 ${circ}`} to={`${dash} ${circ}`} dur="1s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" />
        </circle>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-black text-slate-950 dark:text-white">{score}</span>
        <span className="text-xs text-slate-400 font-medium">/ 100</span>
      </div>
    </motion.div>
  );
}

function DimBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 20) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
        <span>{label}</span><span className="font-semibold">{value}/20</span>
      </div>
      <div className="neu-inset h-2 rounded-full overflow-hidden p-0.5">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }}
          className={`h-full rounded-full ${pct >= 70 ? 'bg-emerald-500' : pct >= 45 ? 'bg-cyan-500' : 'bg-rose-500'}`} />
      </div>
    </div>
  );
}

export default function GitHubIntelligencePage() {
  const [report, setReport] = useState<IntelligenceReport | null>(null);
  const [actions, setActions] = useState<PriorityAction[]>([]);
  const [analysing, setAnalysing] = useState(false);
  const [progress, setProgress] = useState('');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);
  const [showCommands, setShowCommands] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadActions = useCallback(async (forceRefresh = false) => {
    const res = await fetch(`/api/github/analyse${forceRefresh ? '?refresh=1' : ''}`);
    if (res.ok) {
      const d = await res.json();
      if (!d.notAnalysed) {
        setReport(d);
        setActions(d.priorityActions ?? []);
      } else {
        setReport(null);
        setActions([]);
      }
    }
  }, []);

  useEffect(() => { loadActions(); }, [loadActions]);

  const runAnalysis = async () => {
    setAnalysing(true);
    setProgress('Starting...');
    setAnalysisError(null);
    let sawError = false;
    try {
      const res = await fetch('/api/github/analyse', { method: 'POST' });
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let currentEvent = 'message';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            try {
              const d = JSON.parse(line.slice(6));
              if (currentEvent === 'error') {
                sawError = true;
                setAnalysisError(d.message || 'GitHub sync failed. Please try again.');
              } else {
                if (d.message) setProgress(d.message);
                if (d.report) { setReport(d.report); setActions(d.report.priorityActions ?? []); }
              }
            } catch { /* ignore */ }
          }
        }
      }
    } catch (e) {
      console.error('[GitHub Intelligence]', e);
      sawError = true;
      setAnalysisError('GitHub sync failed. Please try again.');
    } finally {
      setAnalysing(false);
      if (!sawError) loadActions();
    }
  };

  const toggleComplete = async (id: string, current: boolean) => {
    await fetch('/api/github/actions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, completed: !current }),
    });
    setActions(prev => prev.map(a => a.id === id ? { ...a, completed: !current } : a));
  };

  const copyCommand = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const pending = actions.filter(a => !a.completed);
  const completed = actions.filter(a => a.completed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="neu-card rounded-[28px] p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
              <img src="/logo.png" alt="PrioryxAI" className="h-4 w-4 shrink-0 object-contain" />
              <span>AI Career Guidance</span>
            </div>
            <h1 className="mt-1.5 flex items-center gap-2.5 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              <GitHubLogo size={26} className="shrink-0" />
              GitHub Intelligence
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Automated portfolio scoring, repository dimension audits, and recruiter-readiness action plan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {report?.isStale && (
              <button
                onClick={() => loadActions(true)}
                disabled={analysing}
                className="neu-btn inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold text-amber-700 dark:text-amber-400 disabled:opacity-50"
              >
                <AlertTriangle size={15} />
                <span>Clear Cache</span>
              </button>
            )}
            <button
              onClick={runAnalysis}
              disabled={analysing}
              className="neu-btn inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              {analysing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              <span>{analysing ? progress : (report ? 'Re-analyse Portfolio' : 'Analyse Portfolio')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sync/analysis error */}
      {analysisError && !analysing && (
        <div className="rounded-2xl border border-dashed border-rose-500/30 bg-rose-500/5 p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">Sync failed</p>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{analysisError}</p>
          </div>
          <button
            onClick={runAnalysis}
            className="neu-btn shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-400"
          >
            <RefreshCw size={13} />
            <span>Try again</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!report && !analysing && (
        <div className="neu-card rounded-[28px] p-10 md:p-14 text-center space-y-4 max-w-xl mx-auto">
          <div className="neu-pill-inset h-16 w-16 rounded-2xl flex items-center justify-center text-cyan-500 mx-auto">
            <GitHubLogo size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">No GitHub analysis yet</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Click &quot;Analyse Portfolio&quot; to audit all your public repositories, score documentation and code completeness, and generate fix prompts.
          </p>
          <div className="pt-2">
            <button
              onClick={runAnalysis}
              className="neu-btn inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              <Zap size={15} />
              <span>Start Analysis</span>
            </button>
          </div>
        </div>
      )}

      {/* Portfolio Health Hero Card */}
      {report && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="neu-card rounded-[28px] p-6 sm:p-8 space-y-6"
        >
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex flex-col items-center shrink-0">
              <ScoreRing score={report.portfolioScore} />
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Portfolio Score</p>
              <span className="neu-pill mt-1 rounded-full px-3 py-0.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 capitalize">
                {report.careerReadiness.estimatedProfileStrength} Profile
              </span>
            </div>

            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
              {[
                { label: 'Repositories', value: report.totalRepos },
                { label: 'Resume-Ready', value: report.careerReadiness.resumeReadyProjects.length },
                { label: 'Day Streak', value: report.commitPatterns.currentStreak },
                { label: '90d Commits', value: report.commitPatterns.totalCommitsLast90Days },
                { label: 'Languages', value: report.careerReadiness.languageDiversity.length },
                { label: 'Pending Fixes', value: pending.length },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.35 }}
                  className="neu-inset rounded-2xl p-4 text-center transition hover:-translate-y-0.5"
                >
                  <p className="text-2xl font-black text-slate-950 dark:text-white">{stat.value}</p>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Diagnostic Strengths & Gaps */}
          {(report.profileStrengths.length > 0 || report.profileWeaknesses.length > 0) && (
            <div className="grid md:grid-cols-2 gap-4 pt-2">
              {report.profileStrengths.length > 0 && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Portfolio Strengths
                  </p>
                  {report.profileStrengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <CheckCircle2 size={13} className="shrink-0 text-emerald-500 mt-0.5" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}

              {report.profileWeaknesses.length > 0 && (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                    Critical Gaps Detected
                  </p>
                  {report.profileWeaknesses.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <AlertTriangle size={13} className="shrink-0 text-rose-500 mt-0.5" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Priority Actions Plan */}
      {actions.length > 0 && (
        <section className="neu-card rounded-[28px] p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-cyan-500" />
              <h2 className="text-base font-bold text-slate-950 dark:text-white">Priority Action Plan</h2>
            </div>
            <span className="neu-pill rounded-full px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              {pending.length} pending · {completed.length} resolved
            </span>
          </div>

          <div className="space-y-3">
            {actions.map((act, i) => (
              <motion.div
                key={act.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.03, duration: 0.3 }}
                className={`neu-inset rounded-2xl p-4 transition hover:-translate-y-0.5 ${act.completed ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleComplete(act.id, act.completed)}
                    className={`mt-0.5 h-5 w-5 rounded-lg flex items-center justify-center transition ${
                      act.completed ? 'bg-emerald-500 text-white' : 'border border-slate-400 hover:border-cyan-500'
                    }`}
                  >
                    {act.completed && <Check size={13} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`neu-pill rounded-full px-2 py-0.5 text-[10px] font-bold border ${priorityColor[act.priority]}`}>
                        {act.priority}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {effortLabel[act.effort]} ({act.estimatedMinutes}m)
                      </span>
                      <span className="text-[11px] font-bold text-slate-900 dark:text-white">
                        {act.repoName}
                      </span>
                    </div>

                    <h3 className={`text-sm font-bold mt-1 text-slate-950 dark:text-white ${act.completed ? 'line-through' : ''}`}>
                      {act.actionTitle}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {act.actionDescription}
                    </p>

                    {act.aiSuggestedCommands && (
                      <div className="mt-3">
                        <button
                          onClick={() => setShowCommands(showCommands === act.id ? null : act.id)}
                          className="neu-btn inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold text-cyan-600 dark:text-cyan-400"
                        >
                          <Terminal size={12} />
                          <span>{showCommands === act.id ? 'Hide CLI Commands' : 'View Fix Commands'}</span>
                        </button>

                        {showCommands === act.id && (
                          <div className="neu-card rounded-xl p-3 mt-2 flex items-center justify-between font-mono text-xs text-cyan-600 dark:text-cyan-400 gap-2">
                            <code className="truncate min-w-0 flex-1">{act.aiSuggestedCommands}</code>
                            <button
                              onClick={() => copyCommand(act.aiSuggestedCommands!, act.id)}
                              className="neu-btn p-1.5 rounded-lg text-slate-600 dark:text-slate-300 ml-2"
                            >
                              {copiedId === act.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Project Dimension Audit Cards */}
      {report && report.topProjects.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Code2 size={18} className="text-indigo-500" />
            <h2 className="text-base font-bold text-slate-950 dark:text-white">Repository Health Scores</h2>
          </div>

          <div className="grid gap-3">
            {report.topProjects.map((proj, i) => (
              <motion.div
                key={proj.repoName}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.35 }}
                className="neu-card rounded-[24px] overflow-hidden transition hover:-translate-y-0.5"
              >
                <button
                  onClick={() => setExpandedRepo(expandedRepo === proj.repoName ? null : proj.repoName)}
                  className="w-full flex items-center gap-4 p-4 sm:p-5 text-left transition hover:bg-slate-500/5"
                >
                  <span className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ring-4 ${gradeColor[proj.grade]}`}>
                    {proj.grade}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-slate-950 dark:text-white truncate">{proj.repoName}</h3>
                    <p className="text-xs text-slate-400">{proj.primaryLanguage ?? 'Codebase'} · Score {proj.totalScore}/100</p>
                  </div>
                  {proj.careerRelevance?.resumeWorthy && (
                    <span className="neu-pill shrink-0 text-xs text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full font-bold">
                      Resume Ready
                    </span>
                  )}
                  <a
                    href={proj.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="neu-btn shrink-0 p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                    <ExternalLink size={14} />
                  </a>
                  <ChevronRight size={16} className={`shrink-0 text-slate-400 transition-transform ${expandedRepo === proj.repoName ? 'rotate-90' : ''}`} />
                </button>

                <AnimatePresence>
                  {expandedRepo === proj.repoName && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-5 pb-5 pt-2 border-t border-slate-200/60 dark:border-white/10 space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                        <div className="neu-inset rounded-2xl p-4 space-y-2.5">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Score Breakdown</p>
                          {proj.dimensions && Object.entries(proj.dimensions).map(([k, v]) => (
                            <DimBar key={k} label={k.replace(/([A-Z])/g, ' $1').trim()} value={v as number} />
                          ))}
                        </div>

                        <div className="space-y-3">
                          {proj.weaknesses && proj.weaknesses.length > 0 && (
                            <div className="neu-inset rounded-2xl p-4 space-y-2">
                              <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Actionable Fixes</p>
                              {proj.weaknesses.slice(0, 3).map((w, i) => (
                                <div key={i} className="text-xs text-slate-700 dark:text-slate-300">
                                  <p className="font-bold">{w.title}</p>
                                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{w.fix}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
