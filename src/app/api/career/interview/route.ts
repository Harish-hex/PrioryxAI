/**
 * Mock Interview API — Phase 4
 *
 * Routes:
 *   POST /api/career/interview        — Start session OR submit answer
 *   GET  /api/career/interview?sessionId=... — Fetch session transcript
 *
 * Delegates to ai.conductMockInterview and ai.evaluateAnswerQuality
 * via the existing MCP registry (executeTool). No LLM calls directly here.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeTool } from '@/lib/mcp/registry';
import { checkRateLimit, assistantRatelimit } from '@/lib/redis';

export const runtime = 'nodejs';
export const maxDuration = 30;

/** GET — fetch a session transcript */
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionId = request.nextUrl.searchParams.get('sessionId');

  if (sessionId) {
    // Fetch specific session
    const { data: session, error } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id) // RLS: users can only access their own sessions
      .single();

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json(session);
  }

  // List recent sessions
  const { data: sessions } = await supabase
    .from('interview_sessions')
    .select('id, target_role, round, topic, created_at, status, score')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return NextResponse.json({ sessions: sessions ?? [] });
}

/** POST — start a session or evaluate an answer */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Reuse the assistant rate limiter (10/min per user)
  const rl = await checkRateLimit(assistantRatelimit, `interview:${user.id}`);
  if (rl.blocked) {
    return NextResponse.json(
      { error: rl.reason === 'redis_error' ? 'Service temporarily unavailable.' : 'Too many requests.' },
      { status: rl.reason === 'redis_error' ? 503 : 429 }
    );
  }

  const body = await request.json();
  const action: string = body.action ?? 'start';

  // ── START SESSION: generate a question ──────────────────────────────
  if (action === 'start') {
    const targetRole: string = body.targetRole ?? 'Software Engineer';
    const round: string = body.round ?? 'technical';
    const topic: string = body.topic ?? 'data structures';

    const { result } = await executeTool(
      'ai.conductMockInterview',
      { targetRole, round, topic },
      user.id
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Failed to generate question' }, { status: 500 });
    }

    const questionData = result.data as {
      question: string;
      expectedApproach: string;
      followUps: string[];
      difficulty: string;
      timeLimit: number;
      hints: string[];
    };

    // Persist session
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .insert({
        user_id: user.id,
        target_role: targetRole,
        round,
        topic,
        status: 'active',
        question: questionData.question,
        expected_approach: questionData.expectedApproach,
        follow_ups: questionData.followUps,
        hints: questionData.hints,
        difficulty: questionData.difficulty,
        time_limit_minutes: questionData.timeLimit,
        transcript: [],
      })
      .select('id')
      .single();

    if (sessionError) {
      console.error('[InterviewAPI] Failed to persist session:', sessionError.message);
      // Still return the question even if DB write fails
      return NextResponse.json({
        ...questionData,
        sessionId: null,
        warning: 'Session not saved — DB error.',
      });
    }

    return NextResponse.json({ ...questionData, sessionId: session.id });
  }

  // ── EVALUATE ANSWER ──────────────────────────────────────────────────
  if (action === 'evaluate') {
    const { sessionId, answer } = body as { sessionId: string; answer: string };

    if (!sessionId || !answer) {
      return NextResponse.json({ error: 'sessionId and answer are required' }, { status: 400 });
    }

    // Fetch session to get question + expected approach
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .select('question, expected_approach, user_id, transcript')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session || session.user_id !== user.id) {
      return NextResponse.json({ error: 'Session not found or unauthorised' }, { status: 404 });
    }

    const { result } = await executeTool(
      'ai.evaluateAnswerQuality',
      {
        question: session.question,
        answer,
        expectedApproach: session.expected_approach,
      },
      user.id
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Evaluation failed' }, { status: 500 });
    }

    const evaluation = result.data as {
      score: number;
      verdict: string;
      feedback: string;
      strengths: string[];
      improvements: string[];
      timeComplexity: string;
      spaceComplexity: string;
    };

    // Append to transcript and update session status
    const updatedTranscript = [
      ...((session.transcript as Array<Record<string, unknown>>) ?? []),
      { role: 'user', content: answer, timestamp: new Date().toISOString() },
      {
        role: 'evaluation',
        content: evaluation.feedback,
        score: evaluation.score,
        verdict: evaluation.verdict,
        timestamp: new Date().toISOString(),
      },
    ];

    await supabase
      .from('interview_sessions')
      .update({
        status: 'completed',
        score: evaluation.score,
        verdict: evaluation.verdict,
        transcript: updatedTranscript,
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    return NextResponse.json(evaluation);
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
