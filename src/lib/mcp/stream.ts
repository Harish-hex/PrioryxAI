// SSE streaming utility for MCP tool calls
// Emits events: tool_start, tool_result, tool_error, progress, done

import type { SSEEvent } from './types';

export function createSSEStream(): {
  stream: ReadableStream<Uint8Array>;
  emit: (event: SSEEvent) => void;
  close: () => void;
} {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      controller = ctrl;
    },
  });

  function emit(event: SSEEvent): void {
    if (!controller) return;
    const payload = `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
    controller.enqueue(encoder.encode(payload));
  }

  function close(): void {
    if (!controller) return;
    emit({ event: 'done', data: { message: 'Stream complete' } });
    controller.close();
    controller = null;
  }

  return { stream, emit, close };
}

export function sseResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
