// Resume Agent — parse, extract, SWOT analysis, STAR format, ATS scoring
import type {
  AgentModule,
  ToolResult,
  SkillEntity,
  SWOTAnalysis,
} from '../types';
import { createClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai';

// ─── Skill taxonomy for matching ───
const SKILL_CATEGORIES: Record<string, string[]> = {
  language: ['javascript','typescript','python','java','c++','c','go','rust','ruby','php','swift','kotlin','r','scala','sql','html','css','dart','bash','perl','lua','matlab','haskell','elixir'],
  framework: ['react','angular','vue','next.js','express','django','flask','spring','rails','laravel','fastapi','svelte','nuxt','nest.js','gatsby','remix','astro','tailwind','bootstrap','material-ui','shadcn'],
  database: ['postgresql','mysql','mongodb','redis','elasticsearch','dynamodb','firebase','supabase','sqlite','cassandra','neo4j','cockroachdb','planetscale','prisma','drizzle'],
  devops: ['docker','kubernetes','aws','gcp','azure','terraform','ci/cd','github actions','jenkins','nginx','linux','git','vercel','netlify','railway','heroku'],
  ai_ml: ['machine learning','deep learning','tensorflow','pytorch','scikit-learn','nlp','computer vision','openai','langchain','hugging face','pandas','numpy','opencv','keras','transformers'],
  mobile: ['react native','flutter','swift','kotlin','ios','android','expo','capacitor'],
  soft_skill: ['leadership','communication','teamwork','problem solving','agile','scrum','project management','mentoring','public speaking'],
};

function categorizeSkill(skill: string): string {
  const lower = skill.toLowerCase();
  for (const [category, skills] of Object.entries(SKILL_CATEGORIES)) {
    if (skills.some((s) => lower.includes(s) || s.includes(lower))) {
      return category;
    }
  }
  return 'other';
}

async function parseResumeToJSON(
  input: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  const rawText = input.rawText as string;
  if (!rawText || rawText.trim().length < 50) {
    return { success: false, data: null, error: 'Resume text too short or empty' };
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a resume parser. Extract structured data from the resume text. Return ONLY raw JSON, no markdown, no backticks, no explanation.`,
      },
      { 
        role: 'user', 
        content: `Parse this resume and return JSON with EXACTLY this structure:
{
  "name": string,
  "email": string | null,
  "phone": string | null,
  "skills": string[],
  "experience": [{ "company": string, "role": string, "duration": string, "description": string }],
  "education": [{ "institution": string, "degree": string, "year": string, "cgpa": string | null }],
  "projects": [{ "name": string, "tech_stack": string[], "description": string }],
  "certifications": string[],
  "languages": string[],
  "summary": string | null
}

Resume text:
${rawText.slice(0, 8000)}

Rules:
- Return ONLY the JSON object, nothing else
- All arrays can be empty [] if not found
- Do not add fields not listed above`
      },
    ],
    max_tokens: 2000,
  });

  const rawContent = completion.choices[0]?.message?.content ?? '';
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    const cleaned = rawContent
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error('[Resume] JSON parse failed. Raw:', rawContent);
      return { success: false, data: null, error: 'AI returned malformed response. Please try again.' };
    }
  }

  return { success: true, data: { userId, parsed } };
}

// Extract via vision is now handled in file-processor.ts



async function extractSkillEntities(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const rawText = input.rawText as string;
  const parsedSkills = (input.parsedSkills as string[]) ?? [];

  // Combine parsed skills with taxonomy matching from raw text
  const foundSkills: SkillEntity[] = [];
  const allKnownSkills = Object.values(SKILL_CATEGORIES).flat();
  const lowerText = rawText.toLowerCase();

  for (const skill of allKnownSkills) {
    if (lowerText.includes(skill)) {
      const inSkillsList = parsedSkills.some(
        (s) => s.toLowerCase().includes(skill)
      );
      const proficiency = inSkillsList ? 50 : 25; // higher if explicitly listed
      foundSkills.push({
        name: skill,
        category: categorizeSkill(skill),
        proficiency,
        evidence: inSkillsList ? 'skills section' : 'mentioned in text',
      });
    }
  }

  // Add any parsed skills not yet found
  for (const skill of parsedSkills) {
    if (!foundSkills.some((f) => f.name.toLowerCase() === skill.toLowerCase())) {
      foundSkills.push({
        name: skill,
        category: categorizeSkill(skill),
        proficiency: 50,
        evidence: 'skills section',
      });
    }
  }

  return { success: true, data: { skills: foundSkills, count: foundSkills.length } };
}

async function computeSWOTAnalysis(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const skills = input.skills as SkillEntity[];
  const targetRoles = (input.targetRoles as string[]) ?? ['Software Engineer'];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a career strategist. Given a student's skills and target roles, produce a SWOT analysis. Return JSON: { strengths: [{title, description, relatedSkills: [], priority: "high"|"medium"|"low"}], weaknesses: [...], opportunities: [...], threats: [...] }. Strengths = verified/strong skills. Weaknesses = missing critical skills for target roles. Opportunities = market-demanded skills close to current level. Threats = skills becoming obsolete.`,
      },
      {
        role: 'user',
        content: `Skills: ${JSON.stringify(skills)}\nTarget roles: ${targetRoles.join(', ')}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1500,
  });

  const swot = JSON.parse(completion.choices[0]?.message?.content ?? '{}') as SWOTAnalysis;
  return { success: true, data: { swot } };
}

async function scoreResumeAgainstJD(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const skills = input.skills as SkillEntity[];
  const jobDescription = input.jobDescription as string;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Score how well a candidate's skills match a job description. Return JSON: { atsScore: number (0-100), matchedSkills: string[], missingSkills: string[], suggestions: string[] }`,
      },
      {
        role: 'user',
        content: `Candidate skills: ${JSON.stringify(skills.map((s) => s.name))}\n\nJob Description:\n${jobDescription}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 800,
  });

  const result = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  return { success: true, data: result };
}

async function identifySkillGaps(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const skills = input.skills as SkillEntity[];
  const targetRoles = (input.targetRoles as string[]) ?? ['Software Engineer'];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Identify skill gaps for a student targeting specific roles. Return JSON: { gaps: [{ skill: string, importance: "critical"|"important"|"nice_to_have", currentLevel: number, requiredLevel: number, learningPath: string }] }`,
      },
      {
        role: 'user',
        content: `Current skills: ${JSON.stringify(skills.map((s) => ({ name: s.name, proficiency: s.proficiency })))}\nTarget roles: ${targetRoles.join(', ')}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1000,
  });

  const result = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  return { success: true, data: result };
}

async function generateSTARBullets(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const projectTitle = input.projectTitle as string;
  const projectDescription = input.projectDescription as string;
  const techStack = input.techStack as string[];
  const phaseResults = input.phaseResults as string;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Generate STAR-format resume bullets for a verified project. Return JSON: { bullets: [{ situation: string, task: string, action: string, result: string, combined: string }] }. Each bullet should be concise (1-2 lines for combined) and include metrics where possible.`,
      },
      {
        role: 'user',
        content: `Project: ${projectTitle}\nDescription: ${projectDescription}\nTech: ${techStack.join(', ')}\nResults: ${phaseResults}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 800,
  });

  const result = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  return { success: true, data: result };
}

async function buildVerifiedResumePDF(
  input: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  // Fetch all verified projects for the user
  const supabase = createClient();
  const { data: projects } = await supabase
    .from('user_projects')
    .select('title, description, tech_stack, phases')
    .eq('user_id', userId)
    .eq('verified', true);

  const { data: profile } = await supabase
    .from('users')
    .select('name, email, college, semester, target_roles')
    .eq('id', userId)
    .single();

  const { data: resume } = await supabase
    .from('user_resumes')
    .select('skill_entities, ats_score')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return {
    success: true,
    data: {
      profile: profile as Record<string, unknown>,
      verifiedProjects: projects ?? [],
      skills: resume?.skill_entities ?? [],
      atsScore: resume?.ats_score ?? 0,
    },
  };
}

async function rankResumeStrengths(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const skills = input.skills as SkillEntity[];
  const sorted = [...skills].sort((a, b) => b.proficiency - a.proficiency);
  const topStrengths = sorted.slice(0, 10);
  return {
    success: true,
    data: { topStrengths, totalSkills: skills.length },
  };
}

async function autodraftFromProfile(
  _input: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  const supabase = createClient();
  const [profileRes, resumeRes, lcProfileRes, githubRes, projectsRes] = await Promise.allSettled([
    supabase.from('users').select('name, display_name, college, semester, target_companies, target_roles, stream').eq('id', userId).maybeSingle(),
    supabase.from('user_resumes').select('skill_entities, swot, parsed_data').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('leetcode_profiles').select('leetcode_username, placement_readiness_score').eq('user_id', userId).maybeSingle(),
    supabase.from('github_cache').select('repos, languages, health_score').eq('user_id', userId).maybeSingle(),
    supabase.from('user_projects').select('title, tech_stack, completion_pct, verified').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
  ]);

  const profile = profileRes.status === 'fulfilled' ? profileRes.value.data : null;
  const resume = resumeRes.status === 'fulfilled' ? resumeRes.value.data : null;
  const lcProfile = lcProfileRes.status === 'fulfilled' ? lcProfileRes.value.data : null;
  const github = githubRes.status === 'fulfilled' ? githubRes.value.data : null;
  const projects = projectsRes.status === 'fulfilled' ? (projectsRes.value.data ?? []) : [];

  const skills = (resume?.skill_entities as { skills?: string[] } | null)?.skills ?? [];
  const repos = (github?.repos as Array<{ name?: string; description?: string; language?: string }>) ?? [];

  const contextForLLM = {
    name: profile?.name ?? profile?.display_name ?? 'Student',
    college: profile?.college,
    semester: profile?.semester,
    targetRoles: profile?.target_roles ?? ['Software Engineer'],
    skills: skills.slice(0, 25),
    lcScore: (lcProfile as { placement_readiness_score?: number } | null)?.placement_readiness_score,
    githubLanguages: Object.keys((github?.languages as Record<string, number>) ?? {}).slice(0, 8),
    githubHealthScore: github?.health_score,
    topRepos: repos.slice(0, 6),
    projects: projects.slice(0, 5),
  };

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    max_tokens: 2500,
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content: `You are an expert resume writer. Generate an ATS-optimized resume draft in JSON:
{
  "summary": "3-line professional summary",
  "skills": { "languages": [], "frameworks": [], "tools": [], "concepts": [] },
  "projects": [{ "title": "", "techStack": [], "bullets": [] }],
  "githubHighlights": [],
  "dsaSection": "",
  "improvementTips": []
}`,
      },
      {
        role: 'user',
        content: `Candidate Context:\n${JSON.stringify(contextForLLM, null, 2)}`,
      },
    ],
  });

  const parsed = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  return { success: true, data: { draft: parsed } };
}

export const resumeAgent: AgentModule = {
  name: 'Resume Agent',
  prefix: 'resume',
  tools: [
    { name: 'parseResumeToJSON', description: 'Parse raw resume text into structured JSON', inputSchema: { type: 'object', properties: { rawText: { type: 'string' } }, required: ['rawText'] }, handler: parseResumeToJSON },
    { name: 'extractSkillEntities', description: 'Extract and categorize skill entities from resume', inputSchema: { type: 'object', properties: { rawText: { type: 'string' }, parsedSkills: { type: 'array' } } }, handler: extractSkillEntities },
    { name: 'computeSWOTAnalysis', description: 'Generate SWOT analysis from skills and target roles', inputSchema: { type: 'object', properties: { skills: { type: 'array' }, targetRoles: { type: 'array' } } }, handler: computeSWOTAnalysis },
    { name: 'scoreResumeAgainstJD', description: 'Score resume skills against a job description', inputSchema: { type: 'object', properties: { skills: { type: 'array' }, jobDescription: { type: 'string' } } }, handler: scoreResumeAgainstJD },
    { name: 'identifySkillGaps', description: 'Identify critical skill gaps for target roles', inputSchema: { type: 'object', properties: { skills: { type: 'array' }, targetRoles: { type: 'array' } } }, handler: identifySkillGaps },
    { name: 'generateSTARBullets', description: 'Generate STAR-format resume bullets from verified projects', inputSchema: { type: 'object', properties: { projectTitle: { type: 'string' }, projectDescription: { type: 'string' }, techStack: { type: 'array' }, phaseResults: { type: 'string' } } }, handler: generateSTARBullets },
    { name: 'buildVerifiedResumePDF', description: 'Build resume data from verified projects for PDF export', inputSchema: {}, handler: buildVerifiedResumePDF },
    { name: 'rankResumeStrengths', description: 'Rank skills by proficiency to highlight top strengths', inputSchema: { type: 'object', properties: { skills: { type: 'array' } } }, handler: rankResumeStrengths },
    { name: 'autodraftFromProfile', description: 'Draft ATS-optimised resume bullets and portfolio summary from user profile data', inputSchema: { type: 'object', properties: {} }, handler: autodraftFromProfile },
  ],
};
