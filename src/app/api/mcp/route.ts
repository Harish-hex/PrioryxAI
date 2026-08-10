// MCP SSE API Route — streams tool calls from all 6 agents
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeTool, listTools } from '@/lib/mcp/registry';
import { createSSEStream, sseResponse } from '@/lib/mcp/stream';

export const runtime = 'nodejs';
export const maxDuration = 60;

// GET /api/mcp — list available tools
export async function GET() {
  const tools = listTools();
  return NextResponse.json({ tools, count: tools.length });
}

// POST /api/mcp — execute a tool call with SSE streaming
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json() as {
    tool: string;
    input?: Record<string, unknown>;
  };

  if (!body.tool) {
    return NextResponse.json({ error: 'Missing tool name' }, { status: 400 });
  }

  const { stream, emit, close } = createSSEStream();

  // Run tool execution asynchronously while streaming
  (async () => {
    emit({
      event: 'tool_start',
      data: { tool: body.tool, timestamp: Date.now() },
    });

    const { agent, result } = await executeTool(
      body.tool,
      body.input ?? {},
      user.id
    );

    if (result.success) {
      emit({
        event: 'tool_result',
        data: {
          tool: body.tool,
          agent,
          result: result.data ?? {},
          timestamp: Date.now(),
        },
      });
    } else {
      emit({
        event: 'tool_error',
        data: {
          tool: body.tool,
          agent,
          error: result.error ?? 'Unknown error',
          timestamp: Date.now(),
        },
      });
    }

    close();
  })();

  return sseResponse(stream);
}
