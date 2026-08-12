'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch, Zap, Target, TrendingUp, AlertTriangle,
  CheckCircle2, Clock, ExternalLink, RefreshCw, Award,
  Code2, ChevronRight, Loader2, Flame
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────
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

// ── Helpers ────────────────────────────────────────────────────
const gradeColor: Record<string, string> = {
  A: 'bg-emerald-500 text-white', B: 'bg-blue-500 text-white',
  C: 'bg-amber-500 text-white', D: 'bg-orange-500 text-white', F: 'bg-red-500 text-white'
};

const priorityColor: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
  LOW: 'bg-slate-100 text-slate-600 border-slate-200',
};

const effortLabel: Record<string, string> = {
  quick_win: '⚡ <30 min', half_day: '🕐 2–4 hrs',
  full_day: '📅 1 day', multi_day: '🗓 2+ days'
};

function ScoreRing({ score }: { score: number }) {
  const r = 56; const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center">
      <svg width={140} height={140} className="-rotate-90">
        <circle cx={70} cy={70} r={r} fill="none" stroke="#e2e8f0" strokeWidth={10} />
        <circle cx={70} cy={70} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-black text-slate-900">{score}</span>
        <span className="text-xs text-slate-500 font-medium">/ 100</span>
      </div>
    </div>
  );
}

function DimBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 20) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-600">
        <span>{label}</span><span>{value}/20</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }}
          className={`h-full rounded-full ${pct >= 70 ? 'bg-emerald-500' : pct >= 45 ? 'bg-amber-400' : 'bg-red-400'}`} />
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function GitHubIntelligencePage() {
  const [report, setReport] = useState<IntelligenceReport | null>(null);
  const [actions, setActions] = useState<PriorityAction[]>([]);
  const [analysing, setAnalysing] = useState(false);
  const [progress, setProgress] = useState('');
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);
  const [showCommands, setShowCommands] = useState<string | null>(null);

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
    try {
      const res = await fetch('/api/github/analyse', { method: 'POST' });
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const d = JSON.parse(line.slice(6));
              if (d.message) setProgress(d.message);
              if (d.report) { setReport(d.report); setActions(d.report.priorityActions ?? []); }
            } catch { /* ignore */ }
          }
        }
      }
    } catch (e) {
      console.error('[GitHub Intelligence]', e);
    } finally {
      setAnalysing(false);
      loadActions();
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

  const pending = actions.filter(a => !a.completed);
  const completed = actions.filter(a => a.completed);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <GitBranch className="text-indigo-500" size={32} />
              GitHub Intelligence
            </h1>
            <p className="text-slate-500 mt-1">Project scoring, weakness detection &amp; priority action plan</p>
          </div>
          <div className="flex gap-2">
            {report?.isStale && (
              <button onClick={() => loadActions(true)} disabled={analysing}
                className="flex items-center gap-2 bg-amber-100 text-amber-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-amber-200 transition disabled:opacity-60">
                <AlertTriangle size={16} />
                Data Stale (Clear Cache)
              </button>
            )}
            <button onClick={runAnalysis} disabled={analysing}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-60">
              {analysing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {analysing ? progress : (report ? 'Re-analyse Portfolio' : 'Analyse Portfolio')}
            </button>
          </div>
        </div>

        {/* ── Empty state ── */}
        {!report && !analysing && (
          <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center">
            <GitBranch size={48} className="mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">No analysis yet</h2>
            <p className="text-slate-400 mb-6">Click "Analyse Portfolio" to score your GitHub projects and get a priority action plan.</p>
            <button onClick={runAnalysis}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition">
              Start Analysis
            </button>
          </div>
        )}

        {/* ── Portfolio Score hero ── */}
        {report && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-white p-8 shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex flex-col items-center">
                <ScoreRing score={report.portfolioScore} />
                <p className="mt-3 text-sm font-semibold text-slate-600 uppercase tracking-wide">Portfolio Score</p>
                <span className={`mt-1 text-xs px-3 py-1 rounded-full font-semibold capitalize ${
                  report.careerReadiness.estimatedProfileStrength === 'exceptional' ? 'bg-emerald-100 text-emerald-700' :
                  report.careerReadiness.estimatedProfileStrength === 'strong' ? 'bg-blue-100 text-blue-700' :
                  report.careerReadiness.estimatedProfileStrength === 'solid' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>{report.careerReadiness.estimatedProfileStrength}</span>
              </div>

              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-100 text-center shadow-sm">
                  <div className="text-2xl font-bold text-slate-900">{report.totalRepos}</div>
                  <div className="text-xs text-slate-500 mt-1">Repositories</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-100 text-center shadow-sm">
                  <div className="text-2xl font-bold text-slate-900">{report.careerReadiness.resumeReadyProjects.length}</div>
                  <div className="text-xs text-slate-500 mt-1">Resume-Ready</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-100 text-center shadow-sm">
                  <div className="text-2xl font-bold text-slate-900">{report.commitPatterns.currentStreak}</div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1"><Flame size={11} className="text-orange-400" />Day Streak</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-100 text-center shadow-sm">
                  <div className="text-2xl font-bold text-slate-900">{report.commitPatterns.totalCommitsLast90Days}</div>
                  <div className="text-xs text-slate-500 mt-1">Commits (90d)</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-100 text-center shadow-sm">
                  <div className="text-2xl font-bold text-slate-900">{report.careerReadiness.languageDiversity.length}</div>
                  <div className="text-xs text-slate-500 mt-1">Languages</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-100 text-center shadow-sm">
                  <div className="text-2xl font-bold text-slate-900">{pending.length}</div>
                  <div className="text-xs text-slate-500 mt-1">Pending Fixes</div>
                </div>
              </div>
            </div>

            {/* AI Narrative */}
            {(report.profileStrengths.length > 0 || report.profileWeaknesses.length > 0) && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.profileStrengths.length > 0 && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                    <p className="text-xs font-bold text-emerald-700 mb-2 uppercase tracking-wide">Portfolio Strengths</p>
                    {report.profileStrengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-emerald-800 mt-1">
                        <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-emerald-500" />{s}
                      </div>
                    ))}
                  </div>
                )}
                {report.profileWeaknesses.length > 0 && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <p className="text-xs font-bold text-red-700 mb-2 uppercase tracking-wide">Critical Gaps</p>
                    {report.profileWeaknesses.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-red-800 mt-1">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5 text-red-500" />{w}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Project Score Cards ── */}
        {report && report.topProjects.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Code2 size={18} className="text-indigo-500" /> Project Scores
            </h2>
            <div className="space-y-3">
              {report.topProjects.map((proj) => (
                <motion.div key={proj.repoName} layout
                  className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <button onClick={() => setExpandedRepo(expandedRepo === proj.repoName ? null : proj.repoName)}
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 transition">
                    <span className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${gradeColor[proj.grade]}`}>
                      {proj.grade}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{proj.repoName}</div>
                      <div className="text-xs text-slate-500">{proj.primaryLanguage ?? 'Unknown'} · Score {proj.totalScore}/100</div>
                    </div>
                    {proj.careerRelevance?.resumeWorthy && (
                      <span className="shrink-0 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Resume ✓</span>
                    )}
                    <a href={proj.repoUrl} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="shrink-0 text-slate-400 hover:text-slate-700">
                      <ExternalLink size={14} />
                    </a>
                    <ChevronRight size={16} className={`shrink-0 text-slate-400 transition-transform ${expandedRepo === proj.repoName ? 'rotate-90' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {expandedRepo === proj.repoName && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} className="border-t border-slate-100 px-4 pb-4 pt-3 overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Score Breakdown</p>
                            {proj.dimensions && Object.entries(proj.dimensions).map(([k, v]) => (
                              <DimBar key={k} label={k.replace(/([A-Z])/g, ' $1').trim()} value={v as number} />
                            ))}
                          </div>
                          <div>
                            {proj.strengths.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Strengths</p>
                                {proj.strengths.map((s, i) => (
                                  <div key={i} className="flex items-center gap-2 text-xs text-emerald-700 mt-1">
                                    <CheckCircle2 size={12} className="text-emerald-500" />{s}
                                  </div>
                                ))}
                              </div>
                            )}
                            {proj.weaknesses.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Top Weaknesses</p>
                                {proj.weaknesses.slice(0, 3).map((w, i) => (
                                  <div key={i} className="text-xs text-red-700 bg-red-50 rounded-lg p-2 mt-1.5">
                                    <div className="font-semibold">{w.title}</div>
                                    <div className="text-red-600 mt-0.5">{w.fix}</div>
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

        {/* ── Priority Action Queue ── */}
        {pending.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Target size={18} className="text-indigo-500" />
                Priority Action Queue
                <span className="ml-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{pending.length}</span>
              </h2>
              <span className="text-xs text-slate-400">{completed.length} completed</span>
            </div>

            <div className="space-y-3">
              {pending.map((action, i) => (
                <motion.div key={action.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl border border-slate-200 bg-white p-4 flex items-start gap-4 shadow-sm">
                  <button onClick={() => toggleComplete(action.id, action.completed)}
                    className="shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 border-slate-300 hover:border-indigo-500 transition" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${priorityColor[action.priority]}`}>
                        {action.priority}
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                        {effortLabel[action.effort]}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{action.repoName}</span>
                    </div>
                    <p className="font-semibold text-sm text-slate-900">{action.actionTitle}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{action.actionDescription}</p>

                    {action.aiSuggestedCommands && (
                      <div className="mt-2">
                        <button onClick={() => setShowCommands(showCommands === action.id ? null : action.id)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                          {showCommands === action.id ? 'Hide' : 'Show'} suggested commands →
                        </button>
                        <AnimatePresence>
                          {showCommands === action.id && (
                            <motion.pre initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                              className="mt-1 text-xs bg-slate-900 text-emerald-400 p-3 rounded-lg overflow-auto font-mono">
                              {action.aiSuggestedCommands}
                            </motion.pre>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <span className="text-xs font-bold text-indigo-600">+{action.impactScore} impact</span>
                    <a href={action.repoUrl} target="_blank" rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-700">
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>

            {completed.length > 0 && (
              <div className="mt-6">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-3">Completed</p>
                {completed.map(action => (
                  <div key={action.id} className="flex items-center gap-3 py-2 opacity-50">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span className="text-sm text-slate-600 line-through">{action.actionTitle}</span>
                    <span className="text-xs text-slate-400 font-mono ml-auto">{action.repoName}</span>
                    <button onClick={() => toggleComplete(action.id, action.completed)}
                      className="text-xs text-slate-400 hover:text-slate-600">Undo</button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Language Diversity ── */}
        {report && report.careerReadiness.languageDiversity.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-500" /> Language Diversity
            </h2>
            <div className="flex flex-wrap gap-2">
              {report.careerReadiness.languageDiversity.map(lang => (
                <span key={lang} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium border border-indigo-100">
                  {lang}
                </span>
              ))}
            </div>
            {report.careerReadiness.resumeReadyProjects.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Resume-Ready Projects</p>
                <div className="flex flex-wrap gap-2">
                  {report.careerReadiness.resumeReadyProjects.map(p => (
                    <span key={p} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-100 flex items-center gap-1">
                      <Award size={12} />{p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}
