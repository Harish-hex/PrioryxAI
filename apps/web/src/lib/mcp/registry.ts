// MCP Tool Registry — maps tool names to agent handlers with alias support and schema validation
import type { AgentModule, ToolDefinition, ToolResult } from './types';
import { authAgent } from './agents/auth-agent';
import { resumeAgent } from './agents/resume-agent';
import { foundryAgent } from './agents/foundry-agent';
import { marketAgent } from './agents/market-agent';
import { researchAgent } from './agents/research-agent';
import { aiAgent } from './agents/ai-agent';
import { githubAgent } from './agents/github-agent';

const agents: AgentModule[] = [
  authAgent,
  resumeAgent,
  foundryAgent,
  marketAgent,
  researchAgent,
  aiAgent,
  githubAgent,
];

// Build flat lookup: "resume.parseResumeToJSON" → handler
const toolMap = new Map<string, { agent: string; tool: ToolDefinition }>();

for (const agent of agents) {
  for (const tool of agent.tools) {
    const qualifiedName = `${agent.prefix}.${tool.name}`;
    toolMap.set(qualifiedName, { agent: agent.name, tool });
    // Also register without prefix for convenience
    toolMap.set(tool.name, { agent: agent.name, tool });
    // Also register lowercase
    toolMap.set(qualifiedName.toLowerCase(), { agent: agent.name, tool });
    toolMap.set(tool.name.toLowerCase(), { agent: agent.name, tool });
  }
}

// Common aliases mapping
const ALIASES: Record<string, string> = {
  'foundry.verifyphase': 'foundry.verifyPhaseCompletion',
  'verifyphase': 'foundry.verifyPhaseCompletion',
  'verifyphasecompletion': 'foundry.verifyPhaseCompletion',
  'mentorchat': 'foundry.projectMentorChat',
  'foundry.mentorchat': 'foundry.projectMentorChat',
  'ai.mentorchat': 'foundry.projectMentorChat',
  'chat': 'ai.chatWithAssistant',
  'ai.chat': 'ai.chatWithAssistant',
  'assistant': 'ai.chatWithAssistant',
  'searchdocs': 'research.searchWebDocumentation',
  'research.searchdocs': 'research.searchWebDocumentation',
  'searchweb': 'research.searchWebDocumentation',
  'roadmap': 'ai.generatePersonalizedRoadmap',
  'jobs': 'market.fetchLiveJobListings',
  'leetcode': 'research.fetchLeetCodeProfile',
  'github.analyze': 'github.analyzeRepositoryCommits',
  'resume.autodraft': 'resume.autodraftFromProfile',
  'autodraft': 'resume.autodraftFromProfile',
};

export function lookupTool(
  name: string
): { agent: string; tool: ToolDefinition } | undefined {
  if (!name) return undefined;
  const direct = toolMap.get(name) || toolMap.get(name.toLowerCase());
  if (direct) return direct;

  const aliasedName = ALIASES[name.toLowerCase()] || ALIASES[name];
  if (aliasedName) {
    return toolMap.get(aliasedName) || toolMap.get(aliasedName.toLowerCase());
  }

  return undefined;
}

export async function executeTool(
  name: string,
  input: Record<string, unknown> = {},
  userId: string = ''
): Promise<{ agent: string; result: ToolResult }> {
  const entry = lookupTool(name);
  if (!entry) {
    return {
      agent: 'unknown',
      result: {
        success: false,
        data: null,
        error: `Tool '${name}' not found. Available tools: ${listTools().map((t) => t.name).join(', ')}`,
      },
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
        error: `Tool '${name}' execution error: ${(err as Error).message}`,
      },
    };
  }
}

export function listTools(): Array<{
  name: string;
  agent: string;
  description: string;
  inputSchema: Record<string, unknown>;
}> {
  const tools: Array<{
    name: string;
    agent: string;
    description: string;
    inputSchema: Record<string, unknown>;
  }> = [];
  const seen = new Set<string>();

  for (const agent of agents) {
    for (const tool of agent.tools) {
      const qualifiedName = `${agent.prefix}.${tool.name}`;
      if (!seen.has(qualifiedName)) {
        seen.add(qualifiedName);
        tools.push({
          name: qualifiedName,
          agent: agent.name,
          description: tool.description,
          inputSchema: tool.inputSchema || { type: 'object', properties: {} },
        });
      }
    }
  }
  return tools;
}

export { agents };
