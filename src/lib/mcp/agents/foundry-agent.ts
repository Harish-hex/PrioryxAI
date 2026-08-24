// Foundry Agent — 9-project generation, 6-phase system, AI terminal, phase gates, and mentor chat
import type {
  AgentModule,
  ToolResult,
  SkillEntity,
  SWOTAnalysis,
  GeneratedProject,
  ProjectPhase,
} from '../types';
import { createClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai';

const PHASE_NAMES = ['Conceptualize', 'Design', 'Build', 'Test', 'Deploy', 'Review'] as const;

async function generate9TailoredProjects(
  input: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  const skills = (input.skills as (SkillEntity | string)[]) ?? [];
  const swot = (input.swot as SWOTAnalysis) ?? { strengths: [], weaknesses: [], opportunities: [], threats: [] };
  const targetRoles = (input.targetRoles as string[]) ?? ['Software Engineer'];
  const codingContext = input.codingContext as {
    leetcode?: { totalSolved: number; easySolved: number; mediumSolved: number; hardSolved: number; contestRating: number; contestsAttended: number; weakTopics: string[] };
    hackerrank?: { totalScore: number; skills: Record<string, number> };
    placementReadiness?: number;
  } | undefined;
  const githubContext = input.githubContext as {
    healthScore?: number;
    languages?: Record<string, number>;
    reposCount?: number;
    reposWithDesc?: number;
    lastCommit?: string | null;
  } | null | undefined;
  const academicContext = input.academicContext as {
    semester?: number;
    cgpa?: number | null;
    college?: string | null;
    subjects?: string[];
  } | undefined;

  const weaknesses = (swot.weaknesses ?? []).map((w: any) => (typeof w === 'string' ? w : w.title || '')).filter(Boolean).join(', ');
  const opportunities = (swot.opportunities ?? []).map((o: any) => (typeof o === 'string' ? o : o.title || '')).filter(Boolean).join(', ');
  const existingSkills = skills.map((s) => (typeof s === 'string' ? s : s.name)).join(', ');

  const codingSummary = codingContext ? `
LeetCode: ${codingContext.leetcode?.totalSolved ?? 0} solved, Rating: ${codingContext.leetcode?.contestRating ?? 0}
Weak coding topics: ${(codingContext.leetcode?.weakTopics ?? []).join(', ') || 'none'}
Placement readiness: ${codingContext.placementReadiness ?? 0}/100` : 'No coding profile connected';

  const githubSummary = githubContext ? `
GitHub: Health ${githubContext.healthScore ?? 0}/100, ${githubContext.reposCount ?? 0} repos
Top languages: ${Object.entries(githubContext.languages ?? {}).slice(0, 5).map(([k, v]) => `${k}:${v}`).join(', ') || 'none'}
Last commit: ${githubContext.lastCommit || 'never'}` : 'GitHub not connected';

  const academicSummary = academicContext ? `
Semester: ${academicContext.semester ?? 0}, CGPA: ${academicContext.cgpa ?? 'not set'}, College: ${academicContext.college ?? 'not set'}
Subjects: ${(academicContext.subjects ?? []).join(', ') || 'none'}` : '';

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a senior engineering mentor. Generate exactly 9 personalized projects for a student to address their skill gaps and strengthen opportunities. Return JSON: { projects: [{ title: string, description: string, techStack: string[], skillGapsAddressed: string[], difficulty: "foundation"|"intermediate"|"advanced", estimatedHours: number, successCriteria: string[] }] }. Rules: exactly 3 foundation + 3 intermediate + 3 advanced projects. Each project must target specific skill gaps from the SWOT analysis. Projects should be progressively challenging and portfolio-worthy.`,
      },
      {
        role: 'user',
        content: `Existing skills: ${existingSkills || 'JavaScript, Python'}\nWeaknesses to address: ${weaknesses || 'System Design, Databases'}\nOpportunities: ${opportunities || 'Cloud Architecture, Full Stack'}\nTarget roles: ${targetRoles.join(', ')}\n${codingSummary}\n${githubSummary}\n${academicSummary}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 3000,
  });

  const rawContent = completion.choices[0]?.message?.content ?? '{ "projects": [] }';
  let result: any;
  try {
    result = JSON.parse(rawContent);
  } catch {
    const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      result = JSON.parse(cleaned);
    } catch (e) {
      console.error('[Foundry] JSON parse failed', rawContent, e);
      result = { projects: [] };
    }
  }

  const projects: GeneratedProject[] = (result.projects ?? []).map(
    (p: Omit<GeneratedProject, 'phases'>) => ({
      ...p,
      phases: PHASE_NAMES.map((name, i) => ({
        number: i + 1,
        name,
        status: i === 0 ? 'active' : 'locked',
        instructions: '',
        deliverable: '',
        score: 0,
      })) as ProjectPhase[],
    })
  );

  // Store projects in Supabase if user exists
  if (userId) {
    const supabase = createClient();
    for (const project of projects) {
      const { error } = await supabase.from('user_projects').insert({
        user_id: userId,
        title: project.title,
        description: project.description,
        tech_stack: project.techStack,
        skill_gaps_addressed: project.skillGapsAddressed,
        difficulty: project.difficulty,
        phases: project.phases,
        current_phase: 1,
      });
      if (error) {
        console.error('[Foundry] Insert project error:', error.message);
      }
    }
  }

  return { success: true, data: { projects, count: projects.length } };
}

async function createProjectPhaseGate(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const projectTitle = String(input.projectTitle || input.title || 'Full Stack App');
  const phaseNumber = Number(input.phaseNumber || input.phase || 1);
  const phaseName = PHASE_NAMES[phaseNumber - 1] ?? 'Build';
  const techStack = (input.techStack as string[]) ?? ['React', 'Node.js', 'PostgreSQL'];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Generate phase gate instructions for a project phase. Return JSON: { instructions: string (markdown), deliverable: string, rubric: [{ criterion: string, maxScore: number, description: string }], passingScore: number }`,
      },
      {
        role: 'user',
        content: `Project: ${projectTitle}\nPhase ${phaseNumber}: ${phaseName}\nTech stack: ${techStack.join(', ')}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1200,
  });

  const gate = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  return { success: true, data: { phaseNumber, phaseName, ...gate } };
}

async function verifyPhaseCompletion(
  input: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  const projectId = String(input.projectId || '');
  const phaseNumber = Number(input.phaseNumber || input.phase || 1);
  const submissionText = String(input.submissionText || input.submission || input.code || '');
  const context = String(input.context || '');

  if (!submissionText || submissionText.trim().length < 5) {
    return { success: false, data: null, error: 'Submission content is too short to evaluate.' };
  }

  const supabase = createClient();
  let projectTitle = 'Software Engineering Project';
  let projectTech: string[] = ['React', 'TypeScript', 'Node.js'];
  let currentPhase = phaseNumber;
  let phases: ProjectPhase[] = [];

  if (projectId && userId) {
    const { data: project } = await supabase
      .from('user_projects')
      .select('title, tech_stack, phases, current_phase')
      .eq('id', projectId)
      .eq('user_id', userId)
      .maybeSingle();

    if (project) {
      projectTitle = project.title;
      projectTech = project.tech_stack as string[];
      currentPhase = project.current_phase;
      phases = project.phases as ProjectPhase[];

      // Phase gate: don't let a submission for a later phase jump ahead of
      // where the project actually is — earlier phases must pass first.
      if (phaseNumber > currentPhase) {
        return {
          success: false,
          data: null,
          error: `Phase ${phaseNumber} is locked. Complete phase ${currentPhase} first.`,
        };
      }
    }
  }

  const phaseName = PHASE_NAMES[phaseNumber - 1] ?? 'Phase ' + phaseNumber;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a strict technical mentor and code reviewer. Evaluate a student's phase submission. Return JSON: { passed: boolean, score: number (0-100), feedback: string, strengths: string[], improvements: string[] }. Passing score is >= 60. Give concrete, actionable engineering guidance.`,
      },
      {
        role: 'user',
        content: `Project: ${projectTitle} (${context})\nPhase ${phaseNumber} (${phaseName})\nTech: ${projectTech.join(', ')}\n\nStudent's Submission:\n${submissionText}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1000,
  });

  const result = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  const score = Number(result.score ?? 75);
  const passed = result.passed === true && score >= 60;

  // Persist submission if database is accessible
  if (projectId && userId) {
    try {
      await supabase.from('phase_submissions').insert({
        project_id: projectId,
        user_id: userId,
        phase_number: phaseNumber,
        submission_text: submissionText,
        ai_feedback: result.feedback ?? '',
        score,
        passed,
      });

      if (passed && phases.length > 0) {
        phases[phaseNumber - 1] = { ...phases[phaseNumber - 1], status: 'passed', score };
        if (phaseNumber < 6 && phases[phaseNumber]) {
          phases[phaseNumber] = { ...phases[phaseNumber], status: 'active' };
        }
        const verified = phaseNumber === 6;
        await supabase
          .from('user_projects')
          .update({
            phases,
            current_phase: Math.min(phaseNumber + 1, 6),
            verified,
          })
          .eq('id', projectId);
      }
    } catch (dbErr) {
      console.warn('[Foundry] Database update non-fatal error:', (dbErr as Error).message);
    }
  }

  return {
    success: true,
    data: {
      passed,
      score,
      feedback: result.feedback || 'Well done! Phase requirements fulfilled.',
      strengths: result.strengths || [],
      improvements: result.improvements || [],
      phaseNumber,
      nextPhaseUnlocked: passed && phaseNumber < 6 ? phaseNumber + 1 : null,
    },
  };
}

async function simulateAITerminal(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const command = String(input.command || '').trim();
  const projectContext = String(input.projectContext || 'Modern Web Application');

  if (!command) {
    return { success: true, data: { command: '', output: 'Please enter a command.' } };
  }

  // Handle common built-in commands instantly
  if (command === 'help') {
    return {
      success: true,
      data: {
        command,
        output: `Available commands:
  npm test          - Run automated test suite
  npm run build     - Compile and bundle application
  git status        - Check working tree status
  git commit -m     - Commit staged changes
  docker build      - Build container image
  curl localhost    - Test running service
  clear             - Reset terminal output`,
      },
    };
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an interactive Linux / Node terminal simulator inside a student's project workspace. Respond ONLY with realistic, raw terminal output (ANSI styling or plain text, under 20 lines). No explanations outside the terminal output. If command is valid (npm, git, curl, python, docker, ls, cat, etc.), simulate realistic execution. If invalid, return standard bash error.`,
      },
      {
        role: 'user',
        content: `Workspace Context: ${projectContext}\nCommand: $ ${command}`,
      },
    ],
    max_tokens: 500,
  });

  return {
    success: true,
    data: {
      command,
      output: completion.choices[0]?.message?.content ?? 'Command execution completed.',
    },
  };
}

async function projectMentorChat(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const message = String(input.message || input.query || input.prompt || '');
  const projectTitle = String(input.projectTitle || 'Project');
  const phaseName = String(input.phaseName || 'Current Phase');
  const techStack = (input.techStack as string[]) ?? [];
  const history = (input.history as Array<{ role: string; content: string }>) ?? [];

  if (!message) {
    return { success: false, data: null, error: 'Empty message' };
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are the PrioryxAI Project Mentor. You are pairing with a student building "${projectTitle}" (Tech Stack: ${techStack.join(', ')}). They are currently in phase "${phaseName}". Help them architect, debug, write clean code, and pass phase gates. Be concise, practical, and provide concrete code snippets when appropriate. Format responses in clean Markdown.`,
      },
      ...history.slice(-6).map((h) => ({
        role: (h.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: h.content,
      })),
      {
        role: 'user',
        content: message,
      },
    ],
    max_tokens: 1200,
  });

  return {
    success: true,
    data: {
      reply: completion.choices[0]?.message?.content ?? 'How can I assist you with your project today?',
    },
  };
}

async function unlockNextPhase(
  input: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  const projectId = input.projectId as string;
  const supabase = createClient();

  const { data: project } = await supabase
    .from('user_projects')
    .select('current_phase, phases')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (!project) return { success: false, data: null, error: 'Project not found' };

  const phases = project.phases as ProjectPhase[];
  const current = project.current_phase as number;

  if (phases[current - 1]?.status !== 'passed') {
    return { success: false, data: null, error: 'Current phase must be passed before unlocking next' };
  }

  if (current >= 6) {
    return { success: true, data: { message: 'All phases completed', verified: true } };
  }

  phases[current] = { ...phases[current], status: 'active' };
  await supabase
    .from('user_projects')
    .update({ phases, current_phase: current + 1 })
    .eq('id', projectId);

  return { success: true, data: { unlockedPhase: current + 1 } };
}

async function trackProjectProgress(
  _input: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  const supabase = createClient();
  const { data: projects } = await supabase
    .from('user_projects')
    .select('id, title, difficulty, current_phase, verified, phases')
    .eq('user_id', userId)
    .order('created_at');

  return { success: true, data: { projects: projects ?? [] } };
}

export const foundryAgent: AgentModule = {
  name: 'Foundry Agent',
  prefix: 'foundry',
  tools: [
    { name: 'generate9TailoredProjects', description: 'Generate 9 projects (3 per difficulty) from SWOT gaps', inputSchema: { type: 'object', properties: { skills: { type: 'array' }, swot: { type: 'object' }, targetRoles: { type: 'array' } } }, handler: generate9TailoredProjects },
    { name: 'createProjectPhaseGate', description: 'Generate phase gate instructions and rubric', inputSchema: { type: 'object', properties: { projectTitle: { type: 'string' }, phaseNumber: { type: 'number' }, techStack: { type: 'array' } } }, handler: createProjectPhaseGate },
    { name: 'verifyPhaseCompletion', description: 'AI-verify a phase submission and advance if passing', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, phaseNumber: { type: 'number' }, submissionText: { type: 'string' } } }, handler: verifyPhaseCompletion },
    { name: 'verifyPhase', description: 'Alias for verifyPhaseCompletion with flexible parameter names', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, phase: { type: 'number' }, submission: { type: 'string' } } }, handler: verifyPhaseCompletion },
    { name: 'simulateAITerminal', description: 'Simulate terminal command execution with AI', inputSchema: { type: 'object', properties: { command: { type: 'string' }, projectContext: { type: 'string' } } }, handler: simulateAITerminal },
    { name: 'projectMentorChat', description: 'Interactive AI Mentor chat for project guidance and debugging', inputSchema: { type: 'object', properties: { message: { type: 'string' }, projectTitle: { type: 'string' }, phaseName: { type: 'string' } } }, handler: projectMentorChat },
    { name: 'mentorChat', description: 'Alias for projectMentorChat', inputSchema: { type: 'object', properties: { message: { type: 'string' } } }, handler: projectMentorChat },
    { name: 'unlockNextPhase', description: 'Unlock the next project phase after passing gate', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } } }, handler: unlockNextPhase },
    { name: 'trackProjectProgress', description: 'Get progress summary for all user projects', inputSchema: {}, handler: trackProjectProgress },
  ],
};
