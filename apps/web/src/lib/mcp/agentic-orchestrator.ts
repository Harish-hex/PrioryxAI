/**
 * Agentic Orchestrator — Phase 2
 *
 * Implements a real tool-call loop:
 *   model → picks tool call → executeTool → result fed back → repeat
 *
 * Hard cap: 10 iterations. On cap hit, returns best partial result (no error).
 * Streams intermediate reasoning via SSE `agent_reasoning` events.
 *
 * The fake runMultiAgentOrchestration in ai-agent.ts is deprecated (see its comment).
 * This is the real implementation.
 */

import OpenAI from 'openai';
import type { SSEEvent } from './types';
import { executeTool } from './registry';
import { buildOpenAITools } from './tool-adapter';
import { openai } from '@/lib/openai';

export const MAX_ITERATIONS = 10;

export interface AgenticResult {
  finalAnswer: string;
  toolCallHistory: Array<{
    iteration: number;
    toolName: string;
    input: Record<string, unknown>;
    success: boolean;
    resultSummary: string;
  }>;
  iterationsUsed: number;
  cappedEarly: boolean;
}

/**
 * Core agentic loop.
 *
 * @param userId        - Supabase user ID passed through to tool handlers
 * @param userRequest   - Natural language request from user / orchestration trigger
 * @param emit          - SSE emitter (from createSSEStream); can be no-op if streaming not needed
 * @param toolFilter    - Optional: restrict to specific tool names (e.g. career-analysis subset)
 */
export async function runAgenticOrchestration(
  userId: string,
  userRequest: string,
  emit: (event: SSEEvent) => void,
  toolFilter?: string[]
): Promise<AgenticResult> {
  const tools = buildOpenAITools(toolFilter);

  if (tools.length === 0) {
    return {
      finalAnswer: 'No tools available for orchestration.',
      toolCallHistory: [],
      iterationsUsed: 0,
      cappedEarly: false,
    };
  }

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are the PrioryxAI career intelligence engine. You have access to tools for analyzing student profiles, DSA skills, GitHub health, job markets, and project portfolios.

Orchestration rules:
1. Only call tools that are NECESSARY for this specific request. Skip tools when their results are clearly not needed (e.g. if LeetCode score is already strong, skip remedial DSA project suggestions).
2. After each tool result, reason briefly about what you learned and what to call next.
3. When you have enough information to give a final, comprehensive answer, stop calling tools and respond with your final answer.
4. Never call the same tool twice with identical inputs.
5. Emit your reasoning before each tool call (this is shown live to the user).

User profile context: userId=${userId}`,
    },
    {
      role: 'user',
      content: userRequest,
    },
  ];

  const history: AgenticResult['toolCallHistory'] = [];
  let iteration = 0;
  let cappedEarly = false;

  emit({ event: 'progress', data: { stage: 'orchestration', message: 'Starting agent loop...' } });

  while (iteration < MAX_ITERATIONS) {
    iteration++;

    let response: OpenAI.Chat.ChatCompletion;
    try {
      response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        tools,
        tool_choice: 'auto',
        max_tokens: 1500,
        temperature: 0.2,
      });
    } catch (err) {
      console.error(`[AgenticOrchestrator] LLM error at iteration ${iteration}:`, err);
      break;
    }

    const choice = response.choices[0];
    if (!choice) break;

    const assistantMessage = choice.message;
    messages.push(assistantMessage as OpenAI.Chat.ChatCompletionMessageParam);

    // ── Model wants to call a tool ──────────────────────────────────────
    if (choice.finish_reason === 'tool_calls' && assistantMessage.tool_calls?.length) {
      for (const toolCall of assistantMessage.tool_calls) {
        const fn = (toolCall as { function?: { name?: string; arguments?: string } }).function;
        const toolName = fn?.name ?? '';
        let toolInput: Record<string, unknown> = {};

        try {
          toolInput = JSON.parse(fn?.arguments || '{}');
        } catch {
          toolInput = {};
        }

        // Stream agent reasoning before tool execution
        emit({
          event: 'agent_reasoning',
          data: {
            iteration,
            message: `Calling ${toolName}...`,
            toolName,
            input: toolInput,
          },
        });

        emit({
          event: 'tool_start',
          data: { toolName, iteration, input: toolInput },
        });

        // Execute via the real registry
        const { result } = await executeTool(toolName, toolInput, userId);

        const success = result.success;
        const resultSummary = success
          ? JSON.stringify(result.data).slice(0, 300)
          : (result.error ?? 'Tool failed');

        history.push({
          iteration,
          toolName,
          input: toolInput,
          success,
          resultSummary,
        });

        if (success) {
          // Stream reasoning about what was learned
          emit({
            event: 'agent_reasoning',
            data: {
              iteration,
              message: `${toolName} completed. Processing results...`,
              toolName,
              resultPreview: resultSummary,
            },
          });
          emit({
            event: 'tool_result',
            data: { toolName, success: true, iteration, preview: resultSummary },
          });
        } else {
          emit({
            event: 'tool_error',
            data: { toolName, error: result.error, iteration },
          });
        }

        // Feed tool result back into conversation
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: success
            ? JSON.stringify(result.data).slice(0, 4000) // Avoid token overflow
            : JSON.stringify({ error: result.error }),
        } as OpenAI.Chat.ChatCompletionToolMessageParam);
      }

      continue; // Next iteration
    }

    // ── Model produced a final text answer (no more tool calls) ─────────
    if (choice.finish_reason === 'stop' || choice.finish_reason === 'length') {
      const finalAnswer = assistantMessage.content ?? '';
      emit({
        event: 'agent_reasoning',
        data: {
          iteration,
          message: 'Agent completed analysis.',
          finalAnswer: finalAnswer.slice(0, 200),
        },
      });

      return {
        finalAnswer,
        toolCallHistory: history,
        iterationsUsed: iteration,
        cappedEarly: false,
      };
    }

    // Unexpected finish reason — stop loop
    break;
  }

  // ── Hit iteration cap or unexpected stop — return best partial ───────
  if (iteration >= MAX_ITERATIONS) {
    cappedEarly = true;
    console.warn(`[AgenticOrchestrator] Iteration cap (${MAX_ITERATIONS}) hit for userId=${userId}`);
    emit({
      event: 'agent_reasoning',
      data: {
        message: `Reached maximum iterations (${MAX_ITERATIONS}). Returning best partial result.`,
        cappedEarly: true,
      },
    });
  }

  // Extract last model message as partial answer
  const lastModelMsg = [...messages].reverse().find(
    (m) => m.role === 'assistant' && typeof (m as { content?: string }).content === 'string'
  );
  const partialAnswer =
    (lastModelMsg as { content?: string } | undefined)?.content ??
    `Partial analysis complete after ${iteration} steps. See tool results for details.`;

  return {
    finalAnswer: partialAnswer,
    toolCallHistory: history,
    iterationsUsed: iteration,
    cappedEarly,
  };
}
