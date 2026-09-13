import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { openai, sanitize } from '@/lib/openai';
import { redis, withFallback } from '@/lib/redis';

export const runtime = 'nodejs';

const CACHE_TTL = 6 * 60 * 60; // 6 hours — ideas don't need to change every visit

export interface ProjectIdea {
  title: string;
  description: string;
  techStack: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimate: string;
  whyItMatters: string;
  githubTopics: string[];
}

function buildFallbackIdeas(skills: string[]): ProjectIdea[] {
  const primary = skills[0]?.toLowerCase() ?? '';

  const ideas: ProjectIdea[] = [
    {
      title: 'Personal Task Manager with Auth',
      description: 'A full-stack CRUD app where users can sign up, log in, and manage their own task lists.',
      techStack: ['React', 'Node.js', 'PostgreSQL', 'JWT'],
      difficulty: 'Beginner',
      estimate: '2–3 weeks',
      whyItMatters: 'Demonstrates full-stack ownership — auth, database, and a working UI — in one deployable project.',
      githubTopics: ['react', 'nodejs', 'crud', 'authentication'],
    },
    {
      title: 'GitHub Profile Analyzer',
      description: 'Fetches a GitHub user\'s repos via API and visualizes their language breakdown, streak, and top projects.',
      techStack: ['React', 'GitHub API', 'Chart.js'],
      difficulty: 'Intermediate',
      estimate: '2 weeks',
      whyItMatters: 'Shows API integration, data visualization, and the ability to build developer tools — all impressive to recruiters.',
      githubTopics: ['github-api', 'data-visualization', 'react'],
    },
    {
      title: 'Real-time Chat App',
      description: 'A minimal chat application with rooms, live message delivery, and a clean UI.',
      techStack: ['React', 'Socket.io', 'Node.js', 'MongoDB'],
      difficulty: 'Intermediate',
      estimate: '3 weeks',
      whyItMatters: 'WebSockets and real-time systems are common in interviews. A working demo proves you can build beyond REST APIs.',
      githubTopics: ['websockets', 'real-time', 'chat', 'nodejs'],
    },
  ];

  // Bias first idea toward primary skill if detectable
  if (primary.includes('python') || primary.includes('ml') || primary.includes('data')) {
    ideas[0] = {
      title: 'ML Price Predictor with API',
      description: 'Train a regression model on a public dataset and expose predictions via a Flask REST API.',
      techStack: ['Python', 'scikit-learn', 'Flask', 'Pandas'],
      difficulty: 'Beginner',
      estimate: '2 weeks',
      whyItMatters: 'End-to-end ML deployment — from data to API — is exactly what data science internship teams look for.',
      githubTopics: ['machine-learning', 'python', 'flask', 'scikit-learn'],
    };
  }

  return ideas;
}

function parseIdeas(raw: string | null | undefined): ProjectIdea[] | null {
  if (!raw) return null;
  const cleaned = raw.replace(/```json|```/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return null;
    return parsed.slice(0, 3).filter(
      (p: any) => p.title && p.description && Array.isArray(p.techStack)
    );
  } catch {
    return null;
  }
}

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cacheKey = `project-ideas:${user.id}`;
  const cached = await withFallback(() => redis.get(cacheKey), null);
  if (cached) return NextResponse.json(cached);

  const [{ data: profile }, { data: github }] = await Promise.all([
    supabase.from('users').select('subjects, semester').eq('id', user.id).single(),
    supabase.from('github_cache').select('languages').eq('user_id', user.id).single(),
  ]);

  const subjects: string[] = profile?.subjects ?? [];
  const languages = Object.keys(github?.languages ?? {}).slice(0, 5);
  const seen = new Set<string>();
  const allSkills = [...subjects, ...languages].filter((s) => {
    if (seen.has(s)) return false;
    seen.add(s);
    return true;
  }).slice(0, 6);

  if (!process.env.OPENAI_API_KEY || allSkills.length === 0) {
    const fallback = { ideas: buildFallbackIdeas(allSkills) };
    await withFallback(() => redis.set(cacheKey, fallback, { ex: CACHE_TTL }), undefined);
    return NextResponse.json(fallback);
  }

  try {
    // Bounded so a stalled OpenAI request can't block the dashboard panel
    // indefinitely — falls through to the static fallback ideas below instead.
    const response = await Promise.race([
      openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Suggest exactly 3 portfolio projects for a student. Return a JSON array of 3 objects with these exact keys:
- title: string (project name, under 60 chars)
- description: string (what it does, under 120 chars)
- techStack: string[] (3–5 technologies, short names only)
- difficulty: "Beginner" | "Intermediate" | "Advanced"
- estimate: string (e.g. "2–3 weeks")
- whyItMatters: string (why recruiters care, under 150 chars)
- githubTopics: string[] (3–4 lowercase GitHub topic tags)

Rules:
- Project 1: Beginner (2–3 weeks), buildable solo, deployable demo
- Project 2: Intermediate (3–4 weeks), shows depth in a key skill
- Project 3: Advanced (4–6 weeks), impressive for senior internships
- All 3 must directly match the student's skills
- No generic "todo app" unless it has a unique twist tied to their skills
- Each must produce something visible on GitHub with a live demo URL`,
        },
        {
          role: 'user',
          content: `Student skills: ${allSkills.join(', ')}\nSemester: ${profile?.semester ?? 'unknown'}`,
        },
      ],
        max_tokens: 900,
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('OpenAI timeout')), 5000)),
    ]);

    const ideas = parseIdeas(response.choices[0]?.message?.content);
    if (!ideas || ideas.length === 0) {
      const fallback = { ideas: buildFallbackIdeas(allSkills) };
      await withFallback(() => redis.set(cacheKey, fallback, { ex: CACHE_TTL }), undefined);
      return NextResponse.json(fallback);
    }

    // Sanitize all string fields
    const safe = ideas.map((idea) => ({
      title: sanitize(idea.title),
      description: sanitize(idea.description),
      techStack: idea.techStack.map((t: string) => sanitize(t)).filter(Boolean),
      difficulty: ['Beginner', 'Intermediate', 'Advanced'].includes(idea.difficulty)
        ? idea.difficulty
        : 'Beginner',
      estimate: sanitize(idea.estimate) || '2–3 weeks',
      whyItMatters: sanitize(idea.whyItMatters),
      githubTopics: (idea.githubTopics ?? []).map((t: string) => sanitize(t)).filter(Boolean),
    }));

    const result = { ideas: safe };
    await withFallback(() => redis.set(cacheKey, result, { ex: CACHE_TTL }), undefined);
    return NextResponse.json(result);
  } catch {
    const fallback = { ideas: buildFallbackIdeas(allSkills) };
    return NextResponse.json(fallback);
  }
}
