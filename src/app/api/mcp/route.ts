// MCP Server & Tool Execution Route — supports SSE streaming, JSON, and standard MCP JSON-RPC 2.0
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/supabase-server';
import { executeTool, listTools, lookupTool } from '@/lib/mcp/registry';
import { createSSEStream, sseResponse } from '@/lib/mcp/stream';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MCP_PROTOCOL_VERSION = '2024-11-05';
const SERVER_INFO = {
  name: 'PrioryxAI Multi-Agent MCP Server',
  version: '1.0.0',
};

// GET /api/mcp — list available tools and server capabilities
export async function GET() {
  const tools = listTools();
  return NextResponse.json({
    jsonrpc: '2.0',
    protocolVersion: MCP_PROTOCOL_VERSION,
    serverInfo: SERVER_INFO,
    capabilities: {
      tools: {
        listChanged: false,
      },
      logging: {},
    },
    tools,
    count: tools.length,
  });
}

// POST /api/mcp — handles tool execution (SSE, JSON, or JSON-RPC 2.0)
export async function POST(request: NextRequest) {
  let user: { id: string; email?: string } | null = null;

  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      user = { id: data.user.id, email: data.user.email };
    } else {
      const serverUser = await getAuthUser();
      if (serverUser) user = { id: serverUser.id, email: serverUser.email };
    }
  } catch {}

  // Fallback guest user ID for anonymous tool exploration if session is not active
  const effectiveUserId = user?.id || 'guest_user';

  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // ── 1. Handle JSON-RPC 2.0 Standard MCP Protocol ──
  if (body.jsonrpc === '2.0') {
    const requestId = body.id ?? null;

    if (body.method === 'initialize') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id: requestId,
        result: {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO,
        },
      });
    }

    if (body.method === 'tools/list') {
      const tools = listTools().map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      }));
      return NextResponse.json({
        jsonrpc: '2.0',
        id: requestId,
        result: { tools },
      });
    }

    if (body.method === 'tools/call') {
      const toolName = body.params?.name;
      const toolArguments = body.params?.arguments || {};

      if (!toolName) {
        return NextResponse.json({
          jsonrpc: '2.0',
          id: requestId,
          error: { code: -32602, message: 'Missing tool name in params' },
        });
      }

      const { agent, result } = await executeTool(toolName, toolArguments, effectiveUserId);
      if (!result.success) {
        return NextResponse.json({
          jsonrpc: '2.0',
          id: requestId,
          result: {
            content: [
              {
                type: 'text',
                text: `[${agent}] Error: ${result.error || 'Unknown error'}`,
              },
            ],
            isError: true,
          },
        });
      }

      return NextResponse.json({
        jsonrpc: '2.0',
        id: requestId,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
          agent,
          isError: false,
        },
      });
    }

    return NextResponse.json({
      jsonrpc: '2.0',
      id: requestId,
      error: { code: -32601, message: `Method '${body.method}' not implemented` },
    });
  }

  // ── 2. Handle Direct Tool Execution ──
  const toolName = String(body.tool || body.name || '');
  const toolInput = (body.input || body.arguments || body.params || {}) as Record<string, unknown>;

  if (!toolName) {
    return NextResponse.json({ error: 'Missing tool name (e.g. { "tool": "resume.parseResumeToJSON" })' }, { status: 400 });
  }

  // If client explicitly requested non-streaming JSON (stream === false or accept is application/json)
  const isStreamExplicit = body.stream === true;
  const isStreamDisabled = body.stream === false;
  const acceptHeader = request.headers.get('accept') || '';
  const wantsSSE = isStreamExplicit || (acceptHeader.includes('text/event-stream') && !isStreamDisabled);

  if (!wantsSSE) {
    const { agent, result } = await executeTool(toolName, toolInput, effectiveUserId);
    return NextResponse.json({
      success: result.success,
      agent,
      tool: toolName,
      result: result.data,
      error: result.error,
      timestamp: Date.now(),
    }, {
      status: result.success ? 200 : 400,
    });
  }

  // ── 3. Handle SSE Streaming Tool Execution ──
  const { stream, emit, close } = createSSEStream();

  (async () => {
    try {
      emit({
        event: 'tool_start',
        data: { tool: toolName, timestamp: Date.now() },
      });

      const { agent, result } = await executeTool(toolName, toolInput, effectiveUserId);

      if (result.success) {
        emit({
          event: 'tool_result',
          data: {
            tool: toolName,
            agent,
            result: result.data ?? {},
            timestamp: Date.now(),
          },
        });
      } else {
        emit({
          event: 'tool_error',
          data: {
            tool: toolName,
            agent,
            error: result.error ?? 'Unknown error',
            timestamp: Date.now(),
          },
        });
      }
    } catch (err) {
      emit({
        event: 'tool_error',
        data: {
          tool: toolName,
          error: (err as Error).message,
          timestamp: Date.now(),
        },
      });
    } finally {
      close();
    }
  })();

  return sseResponse(stream);
}
