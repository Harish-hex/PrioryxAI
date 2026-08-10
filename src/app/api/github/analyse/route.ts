import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runGitHubIntelligence } from '@/lib/github/analyser';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(_req: NextRequest) {
  const encoder = new TextEncoder();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
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
