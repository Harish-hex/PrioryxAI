import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { runGitHubIntelligence } from '@/lib/github/analyser';

export const runtime = 'nodejs';
export const maxDuration = 60;

// GET — returns cached report from DB (no re-analysis)
export async function GET(_req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(_req.url);
  const refresh = url.searchParams.get('refresh') === '1';

  // 1. Try to read a cached report from github_intelligence_reports
  const serviceClient = createServiceClient();
  if (!refresh) {
    const { data: cached } = await serviceClient
      .from('github_intelligence_reports')
      .select('report, generated_at')
      .eq('user_id', user.id)
      .single();

    if (cached?.report) {
      console.log('[GitHub Intel] Returning cached report from DB');
      const generatedAt = new Date(cached.generated_at as string);
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      return NextResponse.json({
        ...(cached.report as object),
        cachedAt: cached.generated_at,
        isStale: generatedAt < twoHoursAgo,
      });
    }
  }

  // 2. Fall back: check if any per-repo data exists in github_analysis
  const { data: analysis } = await serviceClient
    .from('github_analysis')
    .select('repo_name, total_score, grade')
    .eq('user_id', user.id)
    .limit(1);

  if (analysis && analysis.length > 0) {
    // Some analysis exists but no consolidated report — signal to trigger refresh
    return NextResponse.json({ notAnalysed: true, hasPartialData: true });
  }

  // 3. No data at all — prompt user to run analysis
  return NextResponse.json({ notAnalysed: true, hasPartialData: false });
}

// POST — runs full analysis AND saves consolidated report to DB
export async function POST(_req: NextRequest) {
  const encoder = new TextEncoder();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const serviceClient = createServiceClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('github_username')
    .eq('id', user.id)
    .single();

  const githubUsername = profile?.github_username
    ?? user.user_metadata?.user_name
    ?? user.user_metadata?.preferred_username;

  if (!githubUsername) {
    return new Response(JSON.stringify({ error: 'GitHub username not found. Please connect GitHub in Settings.' }), { status: 400 });
  }
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode('event: ' + event + '\ndata: ' + JSON.stringify(data) + '\n\n')
        );
      };

      try {
        emit('progress', { message: 'Starting GitHub analysis...' });

        const report = await runGitHubIntelligence(user.id, (msg) => {
          emit('progress', { message: msg });
        });

        // Persist consolidated report to github_intelligence_reports table
        emit('progress', { message: 'Saving report to database...' });
        const { error: saveError } = await serviceClient
          .from('github_intelligence_reports')
          .upsert({
            user_id: user.id,
            github_username: report.username,
            report: report as unknown as Record<string, unknown>,
            portfolio_score: report.portfolioScore,
            profile_strength: report.careerReadiness.estimatedProfileStrength,
            total_repos: report.totalRepos,
            generated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (saveError) {
          console.error('[GitHub Intel] Failed to save report:', saveError);
          // Continue — don't fail the whole request
        } else {
          console.log('[GitHub Intel] Report saved to Supabase successfully');
        }

        emit('result', { report });
      } catch (err) {
        console.error('[GitHub Analyse API]', err);
        emit('error', { message: String(err) });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}
