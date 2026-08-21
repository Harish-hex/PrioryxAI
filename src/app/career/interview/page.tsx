'use client';

/**
 * Mock Interview Page — Phase 4
 *
 * Full session flow: Setup → Question → Answer → Evaluation → Next/Finish
 * Calls /api/career/interview via fetch.
 */

import { useState } from 'react';
import { Bot, ChevronRight, Clock, Lightbulb, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

type SessionPhase = 'setup' | 'question' | 'answering' | 'evaluating' | 'result';

interface QuestionData {
  sessionId: string | null;
  question: string;
  expectedApproach: string;
  followUps: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  hints: string[];
}

interface EvaluationData {
  score: number;
  verdict: string;
  feedback: string;
  strengths: string[];
  improvements: string[];
  timeComplexity: string;
  spaceComplexity: string;
}

const ROUNDS = [
  { value: 'technical', label: 'Technical / DSA' },
  { value: 'system_design', label: 'System Design' },
  { value: 'behavioral', label: 'Behavioural (HR)' },
  { value: 'coding', label: 'Live Coding' },
];

const TOPICS: Record<string, string[]> = {
  technical: ['Arrays & Strings', 'Dynamic Programming', 'Graphs', 'Trees', 'Sliding Window', 'Binary Search', 'Backtracking'],
  system_design: ['URL Shortener', 'Chat System', 'Rate Limiter', 'Distributed Cache', 'Feed System', 'Search Engine'],
  behavioral: ['Leadership', 'Conflict Resolution', 'Failures & Learnings', 'Teamwork', 'Prioritisation'],
  coding: ['Two Pointers', 'Recursion', 'Hash Maps', 'Stacks & Queues', 'Bit Manipulation'],
};

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-red-400',
};

const VERDICT_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  strong_hire: { icon: <CheckCircle className="w-5 h-5" />, color: 'text-green-400', label: 'Strong Hire' },
  hire: { icon: <CheckCircle className="w-5 h-5" />, color: 'text-green-400', label: 'Hire' },
  lean_hire: { icon: <AlertCircle className="w-5 h-5" />, color: 'text-yellow-400', label: 'Lean Hire' },
  lean_no: { icon: <AlertCircle className="w-5 h-5" />, color: 'text-orange-400', label: 'Lean No Hire' },
  no_hire: { icon: <XCircle className="w-5 h-5" />, color: 'text-red-400', label: 'No Hire' },
};

export default function MockInterviewPage() {
  const [phase, setPhase] = useState<SessionPhase>('setup');
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [round, setRound] = useState('technical');
  const [topic, setTopic] = useState('Dynamic Programming');
  const [showHints, setShowHints] = useState(false);

  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/career/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', targetRole, round, topic }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to start interview');
      }
      const data: QuestionData = await res.json();
      setQuestionData(data);
      setPhase('question');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEvaluate() {
    if (!questionData?.sessionId || !answer.trim()) return;
    setLoading(true);
    setPhase('evaluating');
    setError(null);
    try {
      const res = await fetch('/api/career/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate',
          sessionId: questionData.sessionId,
          answer: answer.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Evaluation failed');
      }
      const data: EvaluationData = await res.json();
      setEvaluation(data);
      setPhase('result');
    } catch (err) {
      setError((err as Error).message);
      setPhase('answering');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setPhase('setup');
    setQuestionData(null);
    setAnswer('');
    setEvaluation(null);
    setShowHints(false);
    setError(null);
  }

  const verdictCfg = evaluation ? (VERDICT_CONFIG[evaluation.verdict] ?? VERDICT_CONFIG['lean_hire']) : null;

  return (
    <div className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
          <Bot className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">AI Mock Interview</h1>
          <p className="text-sm text-slate-400">Simulated technical + HR rounds with instant evaluation</p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ── SETUP PHASE ───────────────────────────────────────── */}
      {phase === 'setup' && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
            <label className="block text-sm font-medium text-slate-300 mb-2">Target Role</label>
            <input
              className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Software Engineer, Data Analyst..."
            />
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
            <label className="block text-sm font-medium text-slate-300 mb-3">Interview Round</label>
            <div className="grid grid-cols-2 gap-2">
              {ROUNDS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => {
                    setRound(r.value);
                    setTopic(TOPICS[r.value]?.[0] ?? '');
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    round === r.value
                      ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                      : 'bg-white/[0.03] border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
            <label className="block text-sm font-medium text-slate-300 mb-3">Topic Focus</label>
            <div className="flex flex-wrap gap-2">
              {(TOPICS[round] ?? []).map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    topic === t
                      ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                      : 'bg-white/[0.03] border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Start Interview
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* ── QUESTION PHASE ───────────────────────────────────── */}
      {(phase === 'question' || phase === 'answering') && questionData && (
        <div className="space-y-5">
          {/* Question card */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold uppercase tracking-wide ${DIFFICULTY_COLOR[questionData.difficulty] ?? 'text-slate-400'}`}>
                  {questionData.difficulty}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 text-xs">{topic}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                <Clock className="w-3.5 h-3.5" />
                {questionData.timeLimit} min
              </div>
            </div>
            <p className="text-slate-100 text-base leading-relaxed font-medium">
              {questionData.question}
            </p>
          </div>

          {/* Hints (toggleable) */}
          {questionData.hints?.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <button
                onClick={() => setShowHints((v) => !v)}
                className="flex items-center gap-2 text-amber-400 text-sm font-medium"
              >
                <Lightbulb className="w-4 h-4" />
                {showHints ? 'Hide hints' : `Show hints (${questionData.hints.length})`}
              </button>
              {showHints && (
                <ul className="mt-3 space-y-1.5">
                  {questionData.hints.map((h, i) => (
                    <li key={i} className="text-amber-300/80 text-sm pl-4 border-l border-amber-500/30">
                      {h}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Answer area */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">Your Answer</label>
            <textarea
              rows={10}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={
                round === 'technical' || round === 'coding'
                  ? 'Explain your approach first, then write pseudocode or actual code...'
                  : 'Type your answer here...'
              }
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-slate-100 text-sm font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-violet-500/40 min-h-[180px]"
            />
            <div className="flex gap-3">
              <button
                onClick={handleEvaluate}
                disabled={!answer.trim() || loading}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Submit Answer'}
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-400 hover:text-slate-200 text-sm transition-all"
              >
                Quit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EVALUATING PHASE ─────────────────────────────────── */}
      {phase === 'evaluating' && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-violet-400" />
          <p className="text-sm">Evaluating your answer...</p>
        </div>
      )}

      {/* ── RESULT PHASE ─────────────────────────────────────── */}
      {phase === 'result' && evaluation && verdictCfg && (
        <div className="space-y-5">
          {/* Score + Verdict */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
            <div className="text-5xl font-bold text-slate-100 mb-2">{evaluation.score}<span className="text-xl text-slate-500">/100</span></div>
            <div className={`flex items-center justify-center gap-2 font-semibold ${verdictCfg.color}`}>
              {verdictCfg.icon}
              {verdictCfg.label}
            </div>
          </div>

          {/* Feedback */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Feedback</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{evaluation.feedback}</p>
          </div>

          {/* Complexity */}
          {(evaluation.timeComplexity || evaluation.spaceComplexity) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                <div className="text-xs text-slate-500 mb-1">Time Complexity</div>
                <div className="text-violet-300 font-mono text-sm font-semibold">{evaluation.timeComplexity || '—'}</div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                <div className="text-xs text-slate-500 mb-1">Space Complexity</div>
                <div className="text-violet-300 font-mono text-sm font-semibold">{evaluation.spaceComplexity || '—'}</div>
              </div>
            </div>
          )}

          {/* Strengths & Improvements */}
          <div className="grid gap-3 sm:grid-cols-2">
            {evaluation.strengths?.length > 0 && (
              <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                <h4 className="text-xs font-semibold text-green-400 mb-2 uppercase tracking-wide">Strengths</h4>
                <ul className="space-y-1.5">
                  {evaluation.strengths.map((s, i) => (
                    <li key={i} className="text-green-300/80 text-xs flex items-start gap-1.5">
                      <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {evaluation.improvements?.length > 0 && (
              <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                <h4 className="text-xs font-semibold text-orange-400 mb-2 uppercase tracking-wide">Improve</h4>
                <ul className="space-y-1.5">
                  {evaluation.improvements.map((imp, i) => (
                    <li key={i} className="text-orange-300/80 text-xs flex items-start gap-1.5">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {imp}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleReset}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              New Interview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
