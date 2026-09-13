import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runAgenticOrchestration } from '@/lib/mcp/agentic-orchestrator';
import { SSEEvent } from '@/lib/mcp/types';

export const runtime = 'nodejs';
export const maxDuration = 120; // Commits analysis and LLM call can take up to 2 mins

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { repo_name, github_username } = body;

    if (!repo_name) {
      return NextResponse.json({ error: 'repo_name is required' }, { status: 400 });
    }
    
    let ghUser = github_username;
    if (!ghUser) {
      // Fetch github username if not provided
      const { data: profile } = await supabase.from('users').select('github_username').eq('id', user.id).single();
      if (!profile?.github_username) {
        return NextResponse.json({ error: 'GitHub username not found in profile' }, { status: 400 });
      }
      ghUser = profile.github_username;
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const emit = (event: SSEEvent) => {
          const payload = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        };

        try {
          const prompt = `Analyze my GitHub repository commits. The repo_name is "${repo_name}" and github_username is "${ghUser}". Use the github.analyzeRepositoryCommits tool to fetch the commits, evaluate their quality, and save the analysis.`;
          await runAgenticOrchestration(user.id, prompt, emit);
        } catch (error: any) {
          emit({ event: 'tool_error', data: { error: error.message } });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('[github/analyze]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
