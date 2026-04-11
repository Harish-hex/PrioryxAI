import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// Called once after signup — sets college, semester, subjects, github_username
// After this completes, frontend redirects to /feed and triggers /api/sync/github
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { college, semester, subjects, github_username } = body;

  // Validate required fields
  if (!college || typeof college !== 'string') {
    return NextResponse.json({ error: 'college is required' }, { status: 400 });
  }

  const semesterNum = Number(semester);
  if (!Number.isInteger(semesterNum) || semesterNum < 1 || semesterNum > 12) {
    return NextResponse.json({ error: 'semester must be an integer between 1 and 12' }, { status: 400 });
  }

  if (!Array.isArray(subjects) || subjects.length === 0) {
    return NextResponse.json({ error: 'subjects must be a non-empty array' }, { status: 400 });
  }

  const cleanSubjects = (subjects as any[])
    .filter(s => typeof s === 'string' && s.trim())
    .slice(0, 10)
    .map(s => String(s).trim().slice(0, 100));

  const updates: Record<string, unknown> = {
    college: String(college).slice(0, 200),
    semester: semesterNum,
    subjects: cleanSubjects,
    last_active_at: new Date().toISOString(),
  };

  // If provided, set github_username (for Google OAuth users connecting GitHub)
  if (github_username && typeof github_username === 'string') {
    const clean = github_username.trim().replace(/^@/, '');
    if (/^[a-zA-Z0-9-]{1,39}$/.test(clean)) {
      updates.github_username = clean;
    }
  }

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id);

  if (error) {
    console.error('[user/onboard]', error);
    return NextResponse.json({ error: 'Failed to save onboarding data' }, { status: 500 });
  }

  return NextResponse.json({ success: true, onboarded: true });
}
