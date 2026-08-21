import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { openai, sanitize } from '@/lib/openai';
import { checkRateLimit, redis, assistantRatelimit, midnightISTttl } from '@/lib/redis';
import { assistantRateLimiter, getClientIp } from '@/lib/rate-limiter';
import { getUserMemoryContext, extractAndUpsertMemory } from '@/lib/memory/user-memory';

export const runtime = 'nodejs';

const FREE_MESSAGE_LIMIT = 3;

// Canned fallback responses based on student profile context
function getCannedResponse(userMessage: string, context: {
  studentProfile: string;
  tasks: Array<{ type: string; title: string; due_at: string | null }>;
  semester: number;
  cgpa: number | null;
  subjects: string[];
  healthScore: number;
  hasGitHub: boolean;
}): string {
  const msg = userMessage.toLowerCase();

  // Task-specific fallbacks
  if (msg.includes('plan') || msg.includes('schedule') || msg.includes('prioritize') || msg.includes('what should i do')) {
    if (context.tasks.length > 0) {
      const topTask = context.tasks[0];
      return `Focus on: ${topTask.type.toUpperCase()} — "${topTask.title}"${topTask.due_at ? ` (due ${new Date(topTask.due_at).toLocaleDateString('en-IN')})` : ''}. Block 90 min now. Next: ${context.tasks[1]?.title ?? 'nothing urgent'}.`;
    }
    return 'No tasks in feed. Add a task from the dashboard, then ask again for a concrete plan.';
  }

  // Exam-specific fallbacks
  if (msg.includes('exam') || msg.includes('test') || msg.includes('study')) {
    return `Study plan for exams: 1) List all exam topics from syllabus. 2) Rank by weight × weakness. 3) Do 3 Pomodoros (25/5) on top topic today. 4) Active recall — no re-reading. 5) Solve 5 past-paper questions.`;
  }

  // Project/career fallbacks
  if (msg.includes('project') || msg.includes('resume') || msg.includes('job') || msg.includes('internship')) {
    if (context.hasGitHub) {
      return `Your GitHub shows activity. Pick ONE project, finish a shippable feature this week, add a 3-line README + demo link, then put it on your resume. That beats 5 half-done repos.`;
    }
    return `Start a tiny project this weekend: clone a tutorial, change 3 things, deploy to Vercel. Add to GitHub with a real README. One shipped project > ten tutorials.`;
  }

  // Coding/DSA fallbacks
  if (msg.includes('leetcode') || msg.includes('coding') || msg.includes('dsa') || msg.includes('algorithm')) {
    return `DSA routine: 1 Easy + 2 Medium daily. Pattern focus this week: sliding window / two pointers. Use NeetCode 150. Track in a sheet. Rating comes from consistency, not intensity.`;
  }

  // General motivation/productivity fallbacks
  if (msg.includes('motivat') || msg.includes('focus') || msg.includes('procrastinat') || msg.includes('burnout') || msg.includes('tired')) {
    return `Low motivation = unclear next step. Break the task until the first step takes <5 min. Do that step only. Momentum beats motivation.`;
  }

  // Profile-aware generic fallback
  const profileHints: Record<string, string> = {
    no_foundation: 'Pick ONE thing: resume, GitHub, or LeetCode. Do 30 min daily. Ignore everything else until that habit sticks.',
    academics_first: 'Semester priority: attend lectures, finish assignments, hit 7+ CGPA. Side projects wait. Foundation > flash.',
    skills_no_projects: 'You have skills. Ship one project this week. Tutorial → modify → deploy → README. That\'s the portfolio.',
    job_ready: 'Apply to 5 roles daily. Tailor resume per JD. LeetCode 2 mediums/day. Mock interview weekly. Consistency closes offers.',
  };

  return profileHints[context.studentProfile] || 'Ask me about: today\'s plan, exam prep, project ideas, LeetCode routine, or job applications. Be specific.';
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Global per-IP + per-user rate limit (in-memory LRU) — fail open on error to avoid lockouts
  const ip = getClientIp(request);
  try {
    const ipRl = assistantRateLimiter.check(`ip:${ip}`);
    if (!ipRl.success) {
      return NextResponse.json(
        { error: 'Too many requests from this network. Try again in a minute.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((ipRl.reset - Date.now()) / 1000)) } }
      );
    }
  } catch {}

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

  // Free user daily message limit (resets at midnight IST) — atomic increment
  const msgCountKey = `msg_count:${user.id}`;
  if (!isPro) {
    // Atomically increment and get new count; TTL resets at midnight IST
    // If Redis fails, fail closed (block) to prevent abuse
    let count: number;
    try {
      count = await redis.incr(msgCountKey);
      if (count === 1) {
        // First request today — set TTL to midnight IST
        await redis.expire(msgCountKey, midnightISTttl());
      }
    } catch {
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Try again shortly.' },
        { status: 503 }
      );
    }
    if (count > FREE_MESSAGE_LIMIT) {
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

  // Fetch persistent user memory (non-blocking — empty string on failure)
  const memoryContext = await getUserMemoryContext(user.id, 8);

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
- You have persistent memory about this student from past sessions. Use it to personalise your advice.

${context}${memoryContext}`,
      // memoryContext is injected above — contains persisted facts from past sessions
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

  // Build context for potential fallback
  const fallbackContext = {
    studentProfile,
    tasks: tasks ?? [],
    semester,
    cgpa,
    subjects,
    healthScore,
    hasGitHub: repos.length > 0,
  };

  // Stream response with fallback
  const encoder = new TextEncoder();

  async function* streamWithFallback() {
    let fullResponse = '';

    try {
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        max_tokens: 800,
        stream: true,
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? '';
        if (text) {
          fullResponse += text;
          yield encoder.encode(text);
        }
      }
    } catch (err) {
      console.error('[assistant] OpenAI error, using fallback:', err);
      fullResponse = getCannedResponse(userMessage, fallbackContext);
      yield encoder.encode(fullResponse);
    }

    // Save assistant reply (counter already incremented atomically at start)
    if (user?.id) {
      await supabase.from('assistant_messages').insert({
        user_id: user.id,
        role: 'assistant',
        content: fullResponse,
      });

      // Phase 5: Extract and persist memory facts (fire-and-forget — never blocks response)
      const sessionText = `User: ${userMessage}\nAssistant: ${fullResponse}`;
      extractAndUpsertMemory(user.id, sessionText).catch(() => {});
    }
  }

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamWithFallback()) {
          controller.enqueue(chunk);
        }
      } catch (err) {
        console.error('[assistant] Stream error:', err);
        // Final safety net
        const fallback = getCannedResponse(userMessage, fallbackContext);
        controller.enqueue(encoder.encode(fallback));
        await supabase.from('assistant_messages').insert({
          user_id: user.id,
          role: 'assistant',
          content: fallback,
        });
      }
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
