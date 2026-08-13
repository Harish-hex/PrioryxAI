import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { extractWithAI, parseAIJson } from '@/lib/file-processor';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SWOT_SYSTEM = `You are a career coach. Return ONLY raw JSON. No markdown.`

function buildSwotPrompt(
  name: string,
  skills: string[],
  stream: string,
  companies: string[]
): string {
  return `Analyse this student profile and return a SWOT analysis as JSON:

Name: ${name}
Stream: ${stream}
Target companies: ${companies.join(', ') || 'top tech companies'}
Skills: ${skills.join(', ')}

Return JSON:
{
  "strengths": ["3-5 specific strengths based on their skills"],
  "weaknesses": ["3-5 specific gaps compared to ${stream} job requirements"],
  "opportunities": ["2-3 career opportunities they can pursue"],
  "threats": ["2-3 risks in current job market"],
  "critical_gaps": ["top 3 skills they MUST learn for ${companies[0] ?? 'top companies'}"],
  "recommended_skills": ["5 skills to learn next, prioritised"]
}

Return raw JSON only.`
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log('\n[resume/process] ════════════════════════════════');
  
  // Auth check
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { storagePath?: string; userId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { storagePath } = body;
  if (!storagePath) {
    return NextResponse.json({ error: 'storagePath is required' }, { status: 400 });
  }

  console.log('[resume/process] Downloading from storage:', storagePath);

  // Download file from Supabase Storage using service role (bypasses RLS)
  const serviceClient = createServiceClient();
  const { data: fileBlob, error: downloadError } = await serviceClient.storage
    .from('resumes')
    .download(storagePath);

  if (downloadError || !fileBlob) {
    console.error('[resume/process] Storage download error:', downloadError);
    return NextResponse.json({ error: 'Failed to download resume from storage' }, { status: 500 });
  }

  // Convert Blob to base64
  const arrayBuffer = await fileBlob.arrayBuffer();
  
  // Determine MIME type from path extension
  const ext = storagePath.split('.').pop()?.toLowerCase() ?? 'pdf';
  const mimeMap: Record<string, string> = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  const mimeType = mimeMap[ext] ?? 'application/pdf';

  // ── Process file using file-processor.ts ────────────────
  const { readFile } = await import('@/lib/file-processor');
  const fileResult = await readFile(Buffer.from(arrayBuffer), mimeType, storagePath);
  
  if (!fileResult.success) {
    return NextResponse.json({ error: fileResult.error }, { status: 422 });
  }

  const SYSTEM_PROMPT = `You are an expert resume parser. Extract ALL information from the resume. Return ONLY raw JSON. No markdown. No backticks.`;
  const USER_PROMPT = `Extract ALL data from this resume as JSON. Return ONLY valid JSON with no markdown, no code fences.

Schema:
{
  "name": "Full Name or null",
  "email": "email or null",
  "phone": "phone or null",
  "location": "city or null",
  "linkedin": "url or null",
  "github": "url or null",
  "summary": "summary text or null",
  "skills": ["Python", "React", "Node.js", "etc"],
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "duration": "Jun 2024 - Present",
      "description": "What they did"
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "B.Tech Computer Science",
      "year": "2022-2026",
      "cgpa": "8.5 or null"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "What it does",
      "tech_stack": ["React", "Node.js"]
    }
  ],
  "certifications": ["cert1", "cert2"],
  "achievements": ["achievement1"],
  "languages": ["English", "Tamil"]
}

CRITICAL RULES:
- "skills" MUST include ALL technical terms found anywhere in the resume:
  programming languages, frameworks, libraries, tools, databases, platforms
- Extract from EVERY section: skills section, project tech stacks,
  experience descriptions, certifications
- Never return empty skills array if ANY technical term exists
- Return raw JSON only — no markdown, no code fences`;

  const aiResult = await extractWithAI(fileResult, SYSTEM_PROMPT, USER_PROMPT, 3000);

  if (!aiResult.success) {
    console.error('[resume/process] OpenAI extraction failed:', aiResult.error);
    return NextResponse.json({ error: aiResult.error }, { status: 500 });
  }

  const parsedResult = parseAIJson<any>(aiResult.content);
  if (!parsedResult.success) {
    console.error('[resume/process] Failed to parse JSON:', aiResult.content.slice(0, 300));
    return NextResponse.json({ error: 'AI could not parse the resume. Try a clearer PDF or image.' }, { status: 422 });
  }

  const resumeData = parsedResult.data;

  // ── Normalise and enhance skills ────────────────────────
  let skills: string[] = [];

  if (Array.isArray(resumeData.skills)) {
    skills = resumeData.skills.flat().map((s: any) => String(s).trim()).filter((s: string) => s.length > 1 && s !== 'null');
  }

  const projectSkills = (resumeData.projects ?? [])
    .flatMap((p: any) => p.tech_stack ?? [])
    .map((s: any) => String(s).trim())
    .filter((s: string) => s.length > 1);

  const certSkills = (resumeData.certifications ?? [])
    .flatMap((cert: string) => {
      const techMap: Record<string, string[]> = {
        'aws': ['AWS', 'Cloud'], 'google': ['GCP'], 'azure': ['Azure'],
        'tensorflow': ['TensorFlow', 'ML'], 'pytorch': ['PyTorch'],
        'react': ['React'], 'node': ['Node.js']
      };
      const lower = String(cert).toLowerCase();
      return Object.entries(techMap)
        .filter(([key]) => lower.includes(key))
        .flatMap(([, vals]) => vals);
    });

  const allSkills = Array.from(new Set([...skills, ...projectSkills, ...certSkills])).sort();
  resumeData.skills = allSkills;

  console.log('[resume/process] Extracted skills count:', allSkills.length);

  // ── Get user profile for context ────────────────────────
  const { data: profile } = await serviceClient
    .from('users')
    .select('stream, target_companies, display_name')
    .eq('id', user.id)
    .maybeSingle();

  const stream = profile?.stream ?? 'Software Engineering';
  const targetCompanies = profile?.target_companies ?? [];

  // ── Generate SWOT analysis ──────────────────────────────
  console.log('[resume/process] Generating SWOT...');
  let swotData = { strengths: [], weaknesses: [], opportunities: [], threats: [], critical_gaps: [], recommended_skills: [] };

  const swotReadResult = {
    method: 'text_extraction' as const,
    rawText: buildSwotPrompt(resumeData.name ?? 'Student', allSkills, stream, targetCompanies),
    success: true
  };

  const swotAI = await extractWithAI(swotReadResult, SWOT_SYSTEM, '', 800);

  if (swotAI.success) {
    const swotParsed = parseAIJson<any>(swotAI.content);
    if (swotParsed.success && swotParsed.data) {
      swotData = swotParsed.data;
    }
  }

  // ── SAVE TO SUPABASE ─────────────────
  const { data: existingRow } = await serviceClient
    .from('user_resumes')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  const resumePayload = {
    user_id: user.id,
    raw_text: fileResult.rawText?.slice(0, 50000) || '',
    skill_entities: {
      skills: allSkills,
      certifications: resumeData.certifications ?? [],
      projects: resumeData.projects ?? [],
      education: resumeData.education ?? [],
      experience: resumeData.experience ?? []
    },
    swot: swotData,
    parsed_data: resumeData,
    extraction_method: fileResult.method,
    updated_at: new Date().toISOString()
  };

  let savedId: string | null = null;

  if (existingRow) {
    const { data: updated, error: updateErr } = await serviceClient
      .from('user_resumes')
      .update(resumePayload)
      .eq('user_id', user.id)
      .select('id')
      .single();
    if (!updateErr && updated) savedId = updated.id;
  } else {
    const { data: inserted, error: insertErr } = await serviceClient
      .from('user_resumes')
      .insert({ ...resumePayload, created_at: new Date().toISOString() })
      .select('id')
      .single();
    if (!insertErr && inserted) savedId = inserted.id;
  }

  if (savedId) {
    await serviceClient
      .from('users')
      .update({ resume_uploaded: true, resume_uploaded_at: new Date().toISOString() })
      .eq('id', user.id);
  }

  console.log(`[resume/process] Total time: ${Date.now() - startTime}ms. Saved: ${!!savedId}`);

  return NextResponse.json({
    success: true,
    saved: !!savedId,
    data: resumeData,
    swot: swotData,
    extractionMethod: fileResult.method,
    skillsFound: allSkills.length,
    resumeId: savedId
  });
}
