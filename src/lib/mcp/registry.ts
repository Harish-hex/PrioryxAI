// MCP Tool Registry — maps tool names to agent handlers
import type { AgentModule, ToolDefinition, ToolResult } from './types';
import { authAgent } from './agents/auth-agent';
import { resumeAgent } from './agents/resume-agent';
import { foundryAgent } from './agents/foundry-agent';
import { marketAgent } from './agents/market-agent';
import { researchAgent } from './agents/research-agent';
import { aiAgent } from './agents/ai-agent';

const agents: AgentModule[] = [
  authAgent,
  resumeAgent,
  foundryAgent,
  marketAgent,
  researchAgent,
  aiAgent,
];

// Build flat lookup: "resume.parseResumeToJSON" → handler
const toolMap = new Map<string, { agent: string; tool: ToolDefinition }>();

for (const agent of agents) {
  for (const tool of agent.tools) {
    const qualifiedName = `${agent.prefix}.${tool.name}`;
    toolMap.set(qualifiedName, { agent: agent.name, tool });
    // Also register without prefix for convenience
    toolMap.set(tool.name, { agent: agent.name, tool });
  }
}

export function lookupTool(
  name: string
): { agent: string; tool: ToolDefinition } | undefined {
  return toolMap.get(name);
}

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  userId: string
): Promise<{ agent: string; result: ToolResult }> {
  const entry = lookupTool(name);
  if (!entry) {
    return {
      agent: 'unknown',
      result: { success: false, data: null, error: `Tool '${name}' not found` },
    };
  }

  try {
    const result = await entry.tool.handler(input, userId);
    return { agent: entry.agent, result };
  } catch (err) {
    return {
      agent: entry.agent,
      result: {
        success: false,
        data: null,
        error: `Tool '${name}' failed: ${(err as Error).message}`,
      },
    };
  }
}

export function listTools(): Array<{
  name: string;
  agent: string;
  description: string;
}> {
  const tools: Array<{ name: string; agent: string; description: string }> = [];
  for (const agent of agents) {
    for (const tool of agent.tools) {
      tools.push({
        name: `${agent.prefix}.${tool.name}`,
        agent: agent.name,
        description: tool.description,
      });
    }
  }
  return tools;
}

export { agents };
