// Placement Copilot — Full Career Analysis SSE Endpoint
// Streams progress through 5 stages: Resume → Coding → Projects → Jobs → Roadmap
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runFullCareerAnalysis } from '@/lib/mcp/orchestrator';
import { createSSEStream, sseResponse } from '@/lib/mcp/stream';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    rawResumeText?: string;
    leetcodeUsername?: string;
    hackerrankUsername?: string;
    targetRoles?: string[];
    targetCompanies?: string[];
    timeline?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { stream, emit, close } = createSSEStream();

  // Run the full analysis pipeline in background
  (async () => {
    try {
      const result = await runFullCareerAnalysis(user.id, emit, body);

      // Store the full analysis in Supabase
      if (result.resumeAnalysis) {
        await supabase.from('user_resumes').upsert({
          user_id: user.id,
          skill_entities: result.resumeAnalysis.skills as unknown as Record<string, unknown>,
          swot: result.resumeAnalysis.swot as unknown as Record<string, unknown>,
          ats_score: result.resumeAnalysis.atsScore,
        });
      }

      emit({
        event: 'tool_result',
        data: { stage: 'final', result: { success: true } },
      });
    } catch (err) {
      emit({
        event: 'tool_error',
        data: { error: (err as Error).message },
      });
    } finally {
      close();
    }
  })();

  return sseResponse(stream);
}