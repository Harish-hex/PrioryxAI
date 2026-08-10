// Foundry Agent — 9-project generation, 6-phase system, AI terminal, phase gates
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
  const skills = input.skills as SkillEntity[];
  const swot = input.swot as SWOTAnalysis;
  const targetRoles = (input.targetRoles as string[]) ?? ['Software Engineer'];

  const weaknesses = swot.weaknesses.map((w) => w.title).join(', ');
  const opportunities = swot.opportunities.map((o) => o.title).join(', ');
  const existingSkills = skills.map((s) => s.name).join(', ');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a senior engineering mentor. Generate exactly 9 personalized projects for a student to address their skill gaps and strengthen opportunities. Return JSON: { projects: [{ title, description, techStack: string[], skillGapsAddressed: string[], difficulty: "foundation"|"intermediate"|"advanced", estimatedHours: number, successCriteria: string[] }] }. Rules: exactly 3 foundation + 3 intermediate + 3 advanced projects. Each project must target specific skill gaps from the SWOT analysis. Projects should be progressively challenging and portfolio-worthy.`,
      },
      {
        role: 'user',
        content: `Existing skills: ${existingSkills}\nWeaknesses to address: ${weaknesses}\nOpportunities: ${opportunities}\nTarget roles: ${targetRoles.join(', ')}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 3000,
  });

  const rawContent = completion.choices[0]?.message?.content ?? '{ "projects": [] }';
  let result: any;
  try {
    result = JSON.parse(rawContent);
  } catch (e) {
    const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      result = JSON.parse(cleaned);
    } catch (e) {
      console.error('[Foundry] JSON parse failed', rawContent);
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

  // Store projects in Supabase
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
      completion_pct: 0,
    });
    if (error) {
      console.error('[Foundry] Insert project error:', error);
    }
  }

  return { success: true, data: { projects, count: projects.length } };
}

async function createProjectPhaseGate(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const projectTitle = input.projectTitle as string;
  const phaseNumber = input.phaseNumber as number;
  const phaseName = PHASE_NAMES[phaseNumber - 1] ?? 'Unknown';
  const techStack = input.techStack as string[];

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
  const projectId = input.projectId as string;
  const phaseNumber = input.phaseNumber as number;
  const submissionText = input.submissionText as string;

  const supabase = createClient();
  const { data: project } = await supabase
    .from('user_projects')
    .select('title, tech_stack, phases, current_phase')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (!project) {
    return { success: false, data: null, error: 'Project not found' };
  }
  if (project.current_phase !== phaseNumber) {
    return { success: false, data: null, error: `Phase ${phaseNumber} is not the current active phase` };
  }

  const phaseName = PHASE_NAMES[phaseNumber - 1] ?? 'Unknown';

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a strict project reviewer. Evaluate a student's phase submission. Return JSON: { passed: boolean, score: number (0-100), feedback: string, strengths: string[], improvements: string[] }. A submission passes if score >= 60. Be specific and constructive in feedback.`,
      },
      {
        role: 'user',
        content: `Project: ${project.title}\nPhase ${phaseNumber} (${phaseName})\nTech: ${(project.tech_stack as string[]).join(', ')}\n\nSubmission:\n${submissionText}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1000,
  });

  const result = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  const passed = result.passed === true && (result.score ?? 0) >= 60;

  // Store submission
  await supabase.from('phase_submissions').insert({
    project_id: projectId,
    user_id: userId,
    phase_number: phaseNumber,
    submission_text: submissionText,
    ai_feedback: result.feedback ?? '',
    score: result.score ?? 0,
    passed,
  });

  // If passed, advance to next phase
  if (passed) {
    const phases = project.phases as ProjectPhase[];
    phases[phaseNumber - 1] = { ...phases[phaseNumber - 1], status: 'passed', score: result.score };
    if (phaseNumber < 6) {
      phases[phaseNumber] = { ...phases[phaseNumber], status: 'active' };
    }
    const completionPct = Math.round((phaseNumber / 6) * 100);
    const verified = phaseNumber === 6;

    await supabase
      .from('user_projects')
      .update({
        phases,
        current_phase: Math.min(phaseNumber + 1, 6),
        completion_pct: completionPct,
        verified,
      })
      .eq('id', projectId);
  }

  return { success: true, data: { ...result, passed } };
}

async function simulateAITerminal(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const command = input.command as string;
  const projectContext = input.projectContext as string;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are simulating a developer terminal for a student project. Given a command, respond with realistic terminal output. If the command is correct, show success output. If wrong, show the error and explain what went wrong. Format: plain text terminal output, no markdown. Keep responses under 20 lines.`,
      },
      {
        role: 'user',
        content: `Project context: ${projectContext}\nCommand: $ ${command}`,
      },
    ],
    max_tokens: 500,
  });

  return {
    success: true,
    data: {
      command,
      output: completion.choices[0]?.message?.content ?? 'Command not recognized',
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

  // Check if current phase has been passed
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
    .select('id, title, difficulty, current_phase, completion_pct, verified')
    .eq('user_id', userId)
    .order('created_at');

  return { success: true, data: { projects: projects ?? [] } };
}

async function generateProjectRubric(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const projectTitle = input.projectTitle as string;
  const phaseNumber = input.phaseNumber as number;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Generate a detailed grading rubric for a project phase. Return JSON: { rubric: [{ criterion: string, weight: number, levels: { excellent: string, good: string, needs_work: string, missing: string } }] }`,
      },
      {
        role: 'user',
        content: `Project: ${projectTitle}\nPhase: ${phaseNumber} (${PHASE_NAMES[phaseNumber - 1]})`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1000,
  });

  const result = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  return { success: true, data: result };
}

async function scoreSubmission(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const submissionText = input.submissionText as string;
  const rubric = input.rubric as Record<string, unknown>;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Score a submission against the given rubric. Return JSON: { totalScore: number, breakdown: [{ criterion: string, score: number, level: string, comment: string }], overallFeedback: string }`,
      },
      {
        role: 'user',
        content: `Rubric: ${JSON.stringify(rubric)}\n\nSubmission:\n${submissionText}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 800,
  });

  const result = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  return { success: true, data: result };
}

export const foundryAgent: AgentModule = {
  name: 'Foundry Agent',
  prefix: 'foundry',
  tools: [
    { name: 'generate9TailoredProjects', description: 'Generate 9 projects (3 per difficulty) from SWOT gaps', inputSchema: { type: 'object', properties: { skills: { type: 'array' }, swot: { type: 'object' }, targetRoles: { type: 'array' } } }, handler: generate9TailoredProjects },
    { name: 'createProjectPhaseGate', description: 'Generate phase gate instructions and rubric', inputSchema: { type: 'object', properties: { projectTitle: { type: 'string' }, phaseNumber: { type: 'number' }, techStack: { type: 'array' } } }, handler: createProjectPhaseGate },
    { name: 'verifyPhaseCompletion', description: 'AI-verify a phase submission and advance if passing', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, phaseNumber: { type: 'number' }, submissionText: { type: 'string' } } }, handler: verifyPhaseCompletion },
    { name: 'simulateAITerminal', description: 'Simulate terminal command execution with AI', inputSchema: { type: 'object', properties: { command: { type: 'string' }, projectContext: { type: 'string' } } }, handler: simulateAITerminal },
    { name: 'unlockNextPhase', description: 'Unlock the next project phase after passing gate', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } } }, handler: unlockNextPhase },
    { name: 'trackProjectProgress', description: 'Get progress summary for all user projects', inputSchema: {}, handler: trackProjectProgress },
    { name: 'generateProjectRubric', description: 'Generate grading rubric for a phase', inputSchema: { type: 'object', properties: { projectTitle: { type: 'string' }, phaseNumber: { type: 'number' } } }, handler: generateProjectRubric },
    { name: 'scoreSubmission', description: 'Score a submission against a rubric', inputSchema: { type: 'object', properties: { submissionText: { type: 'string' }, rubric: { type: 'object' } } }, handler: scoreSubmission },
  ],
};
