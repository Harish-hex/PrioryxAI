import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { openai, sanitize } from '@/lib/openai';
import { withFallback, checkRateLimit, redis, assistantRatelimit, midnightISTttl } from '@/lib/redis';

export const runtime = 'nodejs';

const FREE_MESSAGE_LIMIT = 20;


export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Per-minute rate limit (all users) — fail closed: block if Redis is unreachable
  const rl = await checkRateLimit(assistantRatelimit, user.id);
  if (rl.blocked) {
    const msg = rl.reason === 'redis_error'
      ? 'Service temporarily unavailable. Try again shortly.'
      : 'Too many requests. Wait a moment.';
    return NextResponse.json({ error: msg }, { status: rl.reason === 'redis_error' ? 503 : 429 });
  }

  // Check pro status
  const { data: userData } = await supabase
    .from('users')
    .select('pro_status, pro_expires_at, college, semester, subjects, cgpa')
    .eq('id', user.id)
    .single();

  const isPro =
    userData?.pro_status &&
    (!userData.pro_expires_at || new Date(userData.pro_expires_at) > new Date());

  // Free user daily message limit (resets at midnight IST)
  const msgCountKey = `msg_count:${user.id}`;
  if (!isPro) {
    const count = await withFallback(() => redis.get<number>(msgCountKey), 0);
    if ((count ?? 0) >= FREE_MESSAGE_LIMIT) {
      return NextResponse.json(
        { error: 'Free message limit reached', upgrade: true },
        { status: 403 }
      );
    }
  }

  const body = await request.json();
  const userMessage: string = sanitize(body.message);

  if (!userMessage) {
    return NextResponse.json({ error: 'No message provided' }, { status: 400 });
  }

  // Fetch context: top 5 feed items + github health + repos
  const [{ data: tasks }, { data: github }] = await Promise.all([
    supabase
      .from('tasks')
      .select('type, title, due_at')
      .eq('user_id', user.id)
      .eq('completed', false)
      .order('due_at', { ascending: true })
      .limit(5),
    supabase.from('github_cache').select('health_score, last_commit_at, languages, repos').eq('user_id', user.id).single(),
  ]);

  // Classify student profile for richer AI context
  const subjects: string[] = userData?.subjects ?? [];
  const cgpa: number | null = userData?.cgpa ?? null;
  const repos: any[] = github?.repos ?? [];
  const healthScore: number = github?.health_score ?? 0;
  const semester: number = userData?.semester ?? 0;
  const languages: Record<string, number> = github?.languages ?? {};
  const reposWithDescription = repos.filter((r: any) => r.description?.trim());
  const hasBacklog = cgpa !== null && cgpa < 5.0;

  let studentProfile: string;
  if (hasBacklog && subjects.length < 3 && healthScore < 20) {
    studentProfile = 'no_foundation';
  } else if (
    healthScore >= 50 &&
    subjects.length >= 3 &&
    repos.length >= 2 &&
    reposWithDescription.length >= 1
  ) {
    studentProfile = 'job_ready';
  } else if (
    (subjects.length > 0 || Object.keys(languages).length > 0) &&
    (repos.length < 2 || reposWithDescription.length === 0)
  ) {
    studentProfile = 'skills_no_projects';
  } else if (semester >= 3 && subjects.length < 3 && repos.length < 2) {
    studentProfile = 'academics_first';
  } else {
    studentProfile = 'no_foundation';
  }

  const today = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
  const context = `Today: ${today}
Semester: ${sanitize(userData?.semester?.toString())}
College: ${sanitize(userData?.college)}
Student profile: ${studentProfile}
Academic level: Semester ${semester}, CGPA ${cgpa != null ? cgpa : 'not set'}, ${subjects.length} tracked subject(s): ${subjects.slice(0, 5).join(', ') || 'none'}

Top priorities:
${(tasks ?? []).map(t =>
  `- [${t.type.toUpperCase()}] ${sanitize(t.title)} — due ${t.due_at ? new Date(t.due_at).toLocaleDateString('en-IN') : 'no deadline'}`
).join('\n') || '- No tasks yet'}

GitHub health: ${healthScore || 'not connected'}
Last commit: ${github?.last_commit_at ?? 'unknown'}
Top languages: ${Object.keys(languages).slice(0, 3).join(', ') || 'unknown'}
GitHub repos: ${repos.length} total (${reposWithDescription.length} with descriptions)`;

  // Load last 10 messages for context
  const { data: history } = await supabase
    .from('assistant_messages')
    .select('role, content')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const messages = [
    {
      role: 'system' as const,
      content: `You are a blunt, high-performance strategist embedded inside PrioryxAI. Your only job is to give the user the single highest-leverage action they can take right now.

Non-negotiable rules:
- Lead with the answer. Never open with "Great question", affirmations, or preamble of any kind.
- Be specific — not vague. "Study for 2 hours" is useless. "Spend 45 min on dynamic programming — cover coin change and knapsack using NeetCode's DP playlist, then solve 2 LeetCode mediums" is useful.
- No filler words, no hedging, no "it depends". Pick the best path and commit to it.
- If the user's plan is wrong or inefficient, say so directly and explain why in one sentence.
- When giving a schedule: exact time blocks, exact topics, exact outputs. No approximations.
- Offer one recommendation, not three options. The user needs a decision, not a menu.
- Keep responses under 250 words unless a detailed breakdown genuinely requires more. Shorter is almost always better.
- You have live context on this user's tasks, deadlines, and GitHub activity. Reference it when relevant — don't ask for information you already have.

${context}`,
    },
    ...(history ?? []).reverse().flatMap((m: any) => {
      if (!['user', 'assistant'].includes(m.role)) return [];
      return [{ role: m.role as 'user' | 'assistant', content: String(m.content) }];
    }),
    { role: 'user' as const, content: userMessage },
  ];

  // Save user message
  await supabase.from('assistant_messages').insert({
    user_id: user.id,
    role: 'user',
    content: userMessage,
  });

  // Stream response
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    max_tokens: 800,
    stream: true,
  });

  const encoder = new TextEncoder();
  let fullResponse = '';

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? '';
        if (text) {
          fullResponse += text;
          controller.enqueue(encoder.encode(text));
        }
      }

      // Save assistant reply and increment message count after stream completes
      await Promise.all([
        supabase.from('assistant_messages').insert({
          user_id: user.id,
          role: 'assistant',
          content: fullResponse,
        }),
        withFallback(async () => {
          const current = (await redis.get<number>(msgCountKey)) ?? 0;
          await redis.set(msgCountKey, current + 1, { ex: midnightISTttl() });
        }, undefined),
      ]);

      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
