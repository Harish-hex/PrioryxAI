/**
 * Tool Adapter — Phase 2
 *
 * Converts the MCP registry's listTools() output into the OpenAI
 * function-calling schema format required by the agentic orchestrator.
 *
 * Registry shape: { name, agent, description, inputSchema }
 * OpenAI shape:   { type: "function", function: { name, description, parameters } }
 *
 * inputSchema is already a JSON Schema object — it just needs wrapping.
 */

import { listTools } from './registry';

export interface OpenAITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

/**
 * Returns the full tool list in OpenAI tools format.
 * Optionally filter to a subset of tool names.
 */
export function buildOpenAITools(filterNames?: string[]): OpenAITool[] {
  const tools = listTools();

  const filtered = filterNames
    ? tools.filter((t) => filterNames.includes(t.name))
    : tools;

  return filtered.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      // Ensure parameters is always a valid JSON Schema object
      parameters:
        t.inputSchema && typeof t.inputSchema === 'object' && !Array.isArray(t.inputSchema)
          ? (t.inputSchema as Record<string, unknown>)
          : { type: 'object', properties: {} },
    },
  }));
}

/**
 * Builds a concise tool manifest for the model's system prompt
 * (fallback when tool_choice is not available or for summarisation).
 */
export function buildToolManifestText(): string {
  const tools = listTools();
  return tools
    .map((t) => `- ${t.name}: ${t.description}`)
    .join('\n');
}
