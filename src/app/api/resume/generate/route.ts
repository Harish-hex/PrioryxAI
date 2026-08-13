import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { openai, sanitize } from '@/lib/openai';
import { requirePro } from '@/lib/security';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export const runtime = 'nodejs';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a' },
  name: { fontSize: 22, fontWeight: 'bold', marginBottom: 2 },
  contact: { fontSize: 9, color: '#555555', marginBottom: 12 },
  sectionTitle: {
    fontSize: 11, fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: '#cccccc',
    paddingBottom: 2, marginTop: 12, marginBottom: 6,
  },
  bullet: { flexDirection: 'row', marginBottom: 3 },
  dot: { width: 12, color: '#555555' },
  bulletText: { flex: 1 },
  bold: { fontWeight: 'bold' },
  gray: { color: '#666666' },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  skill: { backgroundColor: '#f0f0f0', padding: '2 5', marginRight: 4, marginBottom: 4, fontSize: 9 },
});

interface ResumeData {
  name: string;
  email: string;
  github: string;
  college: string;
  summary: string;
  projects: { title: string; bullet: string; language: string | null }[];
  skills: string[];
  education: string;
  achievements: string[];
}

function buildDocument(data: ResumeData) {
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4' as const, style: styles.page },

      // Header
      React.createElement(Text, { style: styles.name }, data.name),
      React.createElement(
        Text,
        { style: styles.contact },
        `${data.email}  •  github.com/${data.github}  •  ${data.college}`
      ),

      // Summary
      React.createElement(Text, { style: styles.sectionTitle }, 'SUMMARY'),
      React.createElement(Text, null, data.summary),

      // Projects
      React.createElement(Text, { style: styles.sectionTitle }, 'PROJECTS'),
      ...data.projects.map((p, i) =>
        React.createElement(
          View,
          { key: i, style: styles.bullet },
          React.createElement(Text, { style: styles.dot }, '\u2022'),
          React.createElement(
            View,
            { style: styles.bulletText },
            React.createElement(
              Text,
              null,
              React.createElement(Text, { style: styles.bold }, p.title),
              p.language ? React.createElement(Text, { style: styles.gray }, ` (${p.language})`) : null
            ),
            React.createElement(Text, null, p.bullet)
          )
        )
      ),

      // Skills
      React.createElement(Text, { style: styles.sectionTitle }, 'SKILLS'),
      React.createElement(
        View,
        { style: styles.skillRow },
        ...data.skills.map((s, i) =>
          React.createElement(View, { key: i, style: styles.skill },
            React.createElement(Text, null, s)
          )
        )
      ),

      // Education
      React.createElement(Text, { style: styles.sectionTitle }, 'EDUCATION'),
      React.createElement(Text, null, data.education),

      // Achievements (optional)
      ...(data.achievements.length > 0
        ? [
            React.createElement(Text, { style: styles.sectionTitle }, 'ACHIEVEMENTS'),
            ...data.achievements.map((a, i) =>
              React.createElement(
                View,
                { key: i, style: styles.bullet },
                React.createElement(Text, { style: styles.dot }, '\u2022'),
                React.createElement(Text, { style: styles.bulletText }, a)
              )
            ),
          ]
        : [])
    )
  );
}

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await requirePro(user.id);
  } catch {
    return NextResponse.json({ error: 'Pro required', upgrade: true }, { status: 403 });
  }

  const [{ data: userData }, { data: github }, { data: tasks }] = await Promise.all([
    supabase.from('users').select('name, email, github_username, college, semester').eq('id', user.id).single(),
    supabase.from('github_cache').select('repos, languages, streak_days, health_score').eq('user_id', user.id).single(),
    supabase.from('tasks').select('type, title, subject').eq('user_id', user.id).eq('completed', true).limit(10),
  ]);

  if (!userData) return NextResponse.json({ error: 'User data not found' }, { status: 404 });

  const repos: any[] = github?.repos ?? [];
  const languages = Object.keys(github?.languages ?? {}).slice(0, 8);
  const topRepos = repos.slice(0, 4);

  const prompt = `Generate resume content for an Indian engineering student. Return ONLY valid JSON.

Student info:
- Name: ${sanitize(userData.name)}
- College: ${sanitize(userData.college)}
- Semester: ${userData.semester ?? 'unknown'}
- GitHub: ${sanitize(userData.github_username)}
- Top languages: ${languages.join(', ')}
- Streak: ${github?.streak_days ?? 0} days
- Top repos: ${JSON.stringify(topRepos.map((r: any) => ({ name: sanitize(r.name), description: sanitize(r.description), language: sanitize(r.language) })))}
- Completed tasks: ${(tasks ?? []).map((t: any) => sanitize(t.title)).join(', ')}

Return JSON:
{
  "summary": "2-sentence professional summary",
  "projects": [{ "title": "repo name", "bullet": "resume bullet point starting with action verb", "language": "lang or null" }],
  "skills": ["array", "of", "skills"],
  "education": "B.Tech in <branch>, <college> — Semester <N>",
  "achievements": ["optional achievement strings, max 3"]
}`;

  let llmData: any = {};
  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });
    llmData = JSON.parse(res.choices[0].message.content ?? '{}');
  } catch (err) {
    console.error('[resume/generate] LLM error:', err);
    llmData = {
      summary: `${sanitize(userData.name)} is an engineering student at ${sanitize(userData.college)}.`,
      projects: topRepos.map((r: any) => ({ title: r.name, bullet: r.description ?? 'Personal project.', language: r.language })),
      skills: languages,
      education: `B.Tech, ${sanitize(userData.college)}`,
      achievements: [],
    };
  }

  const resumeData: ResumeData = {
    name: userData.name ?? 'Student',
    email: userData.email ?? '',
    github: userData.github_username ?? '',
    college: userData.college ?? '',
    summary: llmData.summary ?? '',
    projects: (llmData.projects ?? []).slice(0, 4),
    skills: llmData.skills ?? languages,
    education: llmData.education ?? `B.Tech, ${userData.college}`,
    achievements: llmData.achievements ?? [],
  };

  try {
    const doc = buildDocument(resumeData);
    const pdfBuffer = await renderToBuffer(doc);
    const uint8 = new Uint8Array(pdfBuffer);

    const filename = `resume_${(userData.github_username ?? 'student').replace(/[^a-z0-9]/gi, '_')}.pdf`;

    return new Response(uint8, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(uint8.byteLength),
      },
    });
  } catch (err) {
    console.error('[resume/generate] PDF render error:', err);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
