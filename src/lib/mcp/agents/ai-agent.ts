// AI Agent — orchestration, roadmap, mock interviews, peer matching, feedback
import type { AgentModule, ToolResult, PeerMatch } from '../types';
import { createClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai';

async function runMultiAgentOrchestration(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  // This is a meta-tool that describes the orchestration pipeline
  const agentSequence = input.agentSequence as string[] ?? [
    'resume.parseResumeToJSON',
    'resume.extractSkillEntities',
    'resume.computeSWOTAnalysis',
    'research.fetchLeetCodeProfile',
    'research.computePlacementReadinessScore',
    'foundry.generate9TailoredProjects',
    'market.fetchLiveJobListings',
    'ai.generatePersonalizedRoadmap',
  ];

  return {
    success: true,
    data: {
      pipeline: agentSequence,
      status: 'ready',
      message: 'Use the orchestrator to run this pipeline with SSE streaming',
    },
  };
}

async function generatePersonalizedRoadmap(
  input: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  const skills = input.skills as string[];
  const weakTopics = input.weakTopics as string[];
  const targetRoles = (input.targetRoles as string[]) ?? ['Software Engineer'];
  const timeline = (input.timeline as string) ?? '12 weeks';

  const supabase = createClient();
  const { data: projects } = await supabase
    .from('user_projects')
    .select('title, difficulty, current_phase, completion_pct')
    .eq('user_id', userId);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Create a detailed week-by-week career roadmap for a student. Return JSON: { roadmap: { totalWeeks: number, weeklyPlan: [{ week: number, theme: string, tasks: [{ type: "project"|"coding"|"learning"|"networking", description: string, estimatedHours: number }], milestone: string }] } }`,
      },
      {
        role: 'user',
        content: `Skills: ${skills.join(', ')}\nWeak coding topics: ${weakTopics.join(', ')}\nTarget roles: ${targetRoles.join(', ')}\nTimeline: ${timeline}\nActive projects: ${JSON.stringify(projects ?? [])}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 3000,
  });

  const result = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  return { success: true, data: result };
}

async function conductMockInterview(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const targetRole = (input.targetRole as string) ?? 'Software Engineer';
  const round = (input.round as string) ?? 'technical';
  const topic = (input.topic as string) ?? 'data structures';

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a senior interviewer at a top tech company conducting a ${round} interview for ${targetRole}. Generate an interview question focused on ${topic}. Return JSON: { question: string, expectedApproach: string, followUps: string[], difficulty: "easy"|"medium"|"hard", timeLimit: number (minutes), hints: string[] }`,
      },
      {
        role: 'user',
        content: `Generate a ${round} interview question on ${topic} for ${targetRole} role`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 800,
  });

  const result = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  return { success: true, data: result };
}

async function evaluateAnswerQuality(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const question = input.question as string;
  const answer = input.answer as string;
  const expectedApproach = input.expectedApproach as string;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Evaluate an interview answer. Return JSON: { score: number (0-100), verdict: "strong_hire"|"hire"|"lean_hire"|"lean_no"|"no_hire", feedback: string, strengths: string[], improvements: string[], timeComplexity: string, spaceComplexity: string }`,
      },
      {
        role: 'user',
        content: `Question: ${question}\nExpected approach: ${expectedApproach}\n\nStudent's answer:\n${answer}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1000,
  });

  const result = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  return { success: true, data: result };
}

async function generateFeedbackReport(
  input: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  const supabase = createClient();

  const [{ data: projects }, { data: codingProfile }, { data: resume }] = await Promise.all([
    supabase.from('user_projects').select('title, completion_pct, verified').eq('user_id', userId),
    supabase.from('coding_profiles').select('placement_readiness_score, weak_topics').eq('user_id', userId).single(),
    supabase.from('user_resumes').select('ats_score').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single(),
  ]);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Generate a comprehensive weekly progress report for a student. Return JSON: { report: { overallScore: number, highlights: string[], areasForImprovement: string[], nextWeekPriorities: string[], motivationalNote: string } }`,
      },
      {
        role: 'user',
        content: `Projects: ${JSON.stringify(projects ?? [])}\nPlacement score: ${codingProfile?.placement_readiness_score ?? 0}\nWeak topics: ${JSON.stringify(codingProfile?.weak_topics ?? [])}\nATS score: ${resume?.ats_score ?? 0}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1000,
  });

  const result = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  return { success: true, data: result };
}

async function matchPeerCollaborators(
  _input: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  const supabase = createClient();
  const { createServiceClient } = await import('@/lib/supabase/server');
  const supabaseAdmin = createServiceClient();

  // Get current user's profile
  const { data: userProfile } = await supabase
    .from('users')
    .select('name, avatar_url, target_roles, target_companies, college')
    .eq('id', userId)
    .single();

  const { data: userCoding } = await supabase
    .from('coding_profiles')
    .select('placement_readiness_score')
    .eq('user_id', userId)
    .single();

  const { data: userResume } = await supabase
    .from('user_resumes')
    .select('skill_entities')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const userScore = userCoding?.placement_readiness_score ?? 0;

  // Find active users with intersecting roles (bypassing RLS so we can see other users)
  const { data: activeUsers } = await supabaseAdmin
    .from('users')
    .select('id, name, avatar_url, target_roles, college, last_active_at')
    .neq('id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch explicit peer connections
  const { data: connections } = await supabaseAdmin
    .from('peer_connections')
    .select('user_a, user_b')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`);
  
  const connectedPeerIds = new Set(
    (connections || []).map((c) => (c.user_a === userId ? c.user_b : c.user_a))
  );

  // Fetch connected peer profiles if they are not in activeUsers
  const missingConnectedIds = Array.from(connectedPeerIds).filter(
    (id) => !activeUsers?.some((u) => u.id === id)
  );
  
  let connectedUsers: any[] = [];
  if (missingConnectedIds.length > 0) {
    const { data: extraUsers } = await supabaseAdmin
      .from('users')
      .select('id, name, avatar_url, target_roles, college, last_active_at')
      .in('id', missingConnectedIds);
    if (extraUsers) connectedUsers = extraUsers;
  }

  const allAvailableUsers = [...(activeUsers || []), ...connectedUsers];

  // Filter peers that have overlapping target roles or similar readiness scores, OR are explicitly connected
  let peerCandidates = allAvailableUsers.filter((u: any) => {
    if (connectedPeerIds.has(u.id)) return true;
    const roles = u.target_roles as string[] || [];
    const myRoles = userProfile?.target_roles as string[] || [];
    const hasOverlap = roles.some(r => myRoles.includes(r));
    return hasOverlap;
  });

  if (peerCandidates.length === 0 && allAvailableUsers.length > 0) {
    // If no strict role overlap, fallback to latest active users
    peerCandidates = allAvailableUsers.slice(0, 5);
  }

  if (peerCandidates.length === 0) {
    // No strict peers found, fallback to Open Rooms
    return { 
      success: true, 
      data: { 
        matches: [], 
        fallbackMode: true, 
        message: 'No exact peers online right now. Defaulting to Open Rooms.' 
      } 
    };
  }

  const peerIds = peerCandidates.map((p: any) => p.id);
  const { data: peerCoding } = await supabase
    .from('coding_profiles')
    .select('user_id, placement_readiness_score')
    .in('user_id', peerIds);

  const peerProfiles = peerCandidates;

  const userSkills = ((userResume?.skill_entities ?? []) as Array<{ name: string }>).map((s) => s.name);

  const matches: PeerMatch[] = (peerProfiles ?? []).map((peer) => {
    const peerScore = peerCoding?.find((p) => p.user_id === peer.id)?.placement_readiness_score ?? 50;
    const commonRoles = ((peer.target_roles as string[]) ?? []).filter(
      (r: string) => ((userProfile?.target_roles as string[]) ?? []).includes(r)
    );

    return {
      userId: peer.id as string,
      name: (peer.name as string) ?? 'Anonymous',
      avatar: (peer.avatar_url as string) ?? '',
      matchScore: Math.round(100 - Math.abs(userScore - peerScore)),
      commonSkills: [],
      complementarySkills: [],
      whyMatch: connectedPeerIds.has(peer.id as string) 
        ? 'Directly connected via invite code.'
        : commonRoles.length > 0
        ? `Same target role: ${commonRoles.join(', ')}. Similar placement score.`
        : `Similar placement readiness (${peerScore}/100).`,
      placementScore: peerScore,
    };
  });

  return { success: true, data: { matches: matches.sort((a, b) => b.matchScore - a.matchScore) } };
}

async function facilitateRealTimeSession(
  input: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  const peerId = input.peerId as string;
  const sessionType = (input.sessionType as string) ?? 'pair_programming';
  const projectId = input.projectId as string | undefined;

  const supabase = createClient();
  const { data: session, error } = await supabase
    .from('collab_sessions')
    .insert({
      creator_id: userId,
      peer_id: peerId,
      session_type: sessionType,
      project_id: projectId ?? null,
      status: 'active',
    })
    .select()
    .single();

  if (error) return { success: false, data: null, error: error.message };

  return {
    success: true,
    data: {
      sessionId: session.id,
      roomUrl: `/career/collab/room/${session.id}`,
    },
  };
}

async function chatWithAssistant(
  input: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  const message = String(input.message || input.query || input.prompt || '').trim();
  const context = (input.context as Record<string, unknown>) ?? {};
  const history = (input.history as Array<{ role: string; content: string }>) ?? [];

  if (!message) {
    return { success: false, data: null, error: 'Message is required' };
  }

  const supabase = createClient();
  let userContext = '';
  if (userId) {
    const { data: user } = await supabase.from('users').select('target_roles, target_companies, college, semester').eq('id', userId).maybeSingle();
    if (user) {
      userContext = `Student Profile: ${user.college || 'Engineering'}, Sem ${user.semester || 1}, Targets: ${(user.target_roles || []).join(', ')}`;
    }
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are PrioryxAI — the intelligent Deadline & Career Operating System copilot. You help engineering students conquer deadlines, master DSA, build portfolio-grade projects, and ace tech placements. Be concise, strategic, motivating, and actionable. ${userContext}`,
      },
      ...history.slice(-8).map((h) => ({
        role: (h.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: h.content,
      })),
      {
        role: 'user',
        content: `Context: ${JSON.stringify(context)}\nUser message: ${message}`,
      },
    ],
    max_tokens: 1200,
  });

  const reply = completion.choices[0]?.message?.content ?? 'I am here to help you stay ahead of your deadlines and placement goals.';
  return { success: true, data: { reply } };
}

async function analyzeCodeSnippet(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const code = String(input.code || '');
  const language = String(input.language || 'typescript');
  const task = String(input.task || 'Review code for performance, edge cases, and best practices');

  if (!code || code.trim().length < 5) {
    return { success: false, data: null, error: 'Code snippet too short' };
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a senior tech lead. Analyze the given code snippet. Return JSON: { timeComplexity: string, spaceComplexity: string, score: number (0-100), issues: string[], suggestions: string[], refactoredCode: string }`,
      },
      {
        role: 'user',
        content: `Language: ${language}\nTask: ${task}\n\nCode:\n${code}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1500,
  });

  const result = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  return { success: true, data: result };
}

export const aiAgent: AgentModule = {
  name: 'AI Agent',
  prefix: 'ai',
  tools: [
    { name: 'runMultiAgentOrchestration', description: 'Define the multi-agent pipeline for full career analysis', inputSchema: { type: 'object', properties: { agentSequence: { type: 'array' } } }, handler: runMultiAgentOrchestration },
    { name: 'generatePersonalizedRoadmap', description: 'Generate a week-by-week career roadmap', inputSchema: { type: 'object', properties: { skills: { type: 'array' }, weakTopics: { type: 'array' }, targetRoles: { type: 'array' }, timeline: { type: 'string' } } }, handler: generatePersonalizedRoadmap },
    { name: 'conductMockInterview', description: 'Generate a mock interview question', inputSchema: { type: 'object', properties: { targetRole: { type: 'string' }, round: { type: 'string' }, topic: { type: 'string' } } }, handler: conductMockInterview },
    { name: 'evaluateAnswerQuality', description: 'Evaluate a mock interview answer', inputSchema: { type: 'object', properties: { question: { type: 'string' }, answer: { type: 'string' }, expectedApproach: { type: 'string' } } }, handler: evaluateAnswerQuality },
    { name: 'generateFeedbackReport', description: 'Generate weekly progress and feedback report', inputSchema: {}, handler: generateFeedbackReport },
    { name: 'matchPeerCollaborators', description: 'Find peer collaborators by skill and score proximity', inputSchema: {}, handler: matchPeerCollaborators },
    { name: 'facilitateRealTimeSession', description: 'Create a real-time collaboration session', inputSchema: { type: 'object', properties: { peerId: { type: 'string' }, sessionType: { type: 'string' }, projectId: { type: 'string' } } }, handler: facilitateRealTimeSession },
    { name: 'chatWithAssistant', description: 'Conversational assistant for placement & productivity guidance', inputSchema: { type: 'object', properties: { message: { type: 'string' }, context: { type: 'object' } }, required: ['message'] }, handler: chatWithAssistant },
    { name: 'chat', description: 'Alias for chatWithAssistant', inputSchema: { type: 'object', properties: { message: { type: 'string' } } }, handler: chatWithAssistant },
    { name: 'analyzeCodeSnippet', description: 'Analyze code for time/space complexity and bugs', inputSchema: { type: 'object', properties: { code: { type: 'string' }, language: { type: 'string' } }, required: ['code'] }, handler: analyzeCodeSnippet },
  ],
};


