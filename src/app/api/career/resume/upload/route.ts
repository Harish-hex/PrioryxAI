import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'  // Fixed path based on earlier checks
import { readFile, extractWithAI, parseAIJson, parseUploadedFile } from '@/lib/file-processor'

// Debug: log environment status on module load
console.log('[Resume Module] OPENAI_API_KEY set:', !!process.env.OPENAI_API_KEY)
console.log('[Resume Module] SUPABASE_URL set:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('[Resume Module] SERVICE_KEY set:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)


// ── PROMPTS ────────────────────────────────────────────────────

const RESUME_SYSTEM_PROMPT = `You are an expert resume parser and career analyst.
Extract all information from the resume and return ONLY valid JSON.
No markdown, no backticks, no explanation — raw JSON only.`

const RESUME_USER_PROMPT = `Parse this resume completely and return JSON with EXACTLY
this structure (all fields required, use null or [] if not found):

{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "+91-9999999999",
  "location": "City, Country",
  "linkedin": "linkedin.com/in/username",
  "github": "github.com/username",
  "portfolio": "portfolio-url.com",
  "summary": "Professional summary if present",
  "skills": ["Python", "React", "Node.js", "Machine Learning"],
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "duration": "Jun 2024 - Present",
      "location": "City",
      "description": "What they did there",
      "achievements": ["Achievement 1", "Achievement 2"]
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "B.Tech Computer Science",
      "year": "2022-2026",
      "cgpa": "8.5",
      "location": "City"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "What it does",
      "tech_stack": ["React", "Node.js", "MongoDB"],
      "github_url": "github.com/user/repo",
      "live_url": "deployed-url.com",
      "duration": "Jan 2024 - Mar 2024"
    }
  ],
  "certifications": ["AWS Certified", "Google ML Certificate"],
  "achievements": ["Hackathon winner", "Open source contributor"],
  "languages": ["English", "Tamil", "Hindi"],
  "volunteer": [],
  "publications": []
}

CRITICAL: The "skills" array MUST include ALL of:
- Programming languages (Python, Java, C++, JavaScript, TypeScript, etc.)
- Frameworks (React, Node.js, Django, Spring Boot, Express, FastAPI, etc.)
- Tools (Git, Docker, AWS, Linux, Kubernetes, etc.)
- Databases (MySQL, MongoDB, PostgreSQL, Redis, etc.)
- Libraries (TensorFlow, PyTorch, Pandas, NumPy, scikit-learn, etc.)
- Concepts (Machine Learning, Data Structures, System Design, REST API, etc.)
Extract from skills section AND from project descriptions AND from experience.
NEVER return an empty skills array if any technical terms appear in the resume.

Resume content:`

const SWOT_SYSTEM_PROMPT = `You are a career coach doing SWOT analysis.
Return ONLY valid JSON. No markdown, no backticks.`

function buildSwotPrompt(name: string, skills: string[], stream: string): string {
  return `Do a SWOT analysis for a ${stream} engineering student named ${name}
  with these skills: ${skills.join(', ')}.
  
  Return JSON:
  {
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
    "opportunities": ["opportunity 1", "opportunity 2"],
    "threats": ["threat 1", "threat 2"],
    "critical_gaps": ["gap 1", "gap 2", "gap 3"],
    "recommended_skills": ["skill 1", "skill 2", "skill 3"]
  }`
}

// ── API HANDLER ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  console.log('[Resume API] === Request received ===')

  // 1. Auth check
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('[Resume API] Auth failed:', authError)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  console.log('[Resume API] User authenticated:', user.id)

  // 2. Parse uploaded file
  const fileResult = await parseUploadedFile(req)
  if ('error' in fileResult && !('buffer' in fileResult)) {
    console.error('[Resume API] File parse error:', fileResult.error)
    return NextResponse.json({ error: fileResult.error }, { status: 400 })
  }
  const { buffer, mimeType, filename } = fileResult as {
    buffer: Buffer; mimeType: string; filename: string
  }

  // 3. Read/extract file content
  console.log('[Resume API] Reading file...')
  const readResult = await readFile(buffer, mimeType, filename)
  console.log('[Resume API] Read result:', {
    method: readResult.method,
    textLength: readResult.rawText.length,
    success: readResult.success
  })

  if (!readResult.success) {
    return NextResponse.json({ error: readResult.error }, { status: 400 })
  }

  // 4. Extract resume data with AI
  console.log('[Resume API] Calling AI extraction...')
  const aiResult = await extractWithAI(
    readResult,
    RESUME_SYSTEM_PROMPT,
    RESUME_USER_PROMPT,
    2500
  )
  console.log('[Resume API] AI result success:', aiResult.success)

  if (!aiResult.success) {
    return NextResponse.json(
      { error: aiResult.error ?? 'AI extraction failed. Please try again.' },
      { status: 500 }
    )
  }

  // 5. Parse JSON from AI response
  interface ResumeData {
    name?: string
    email?: string
    skills?: string[]
    experience?: unknown[]
    education?: unknown[]
    projects?: unknown[]
    certifications?: string[]
    languages?: string[]
    [key: string]: unknown
  }
  const parseResult = parseAIJson<ResumeData>(aiResult.content)
  if (!parseResult.success || !parseResult.data) {
    console.error('[Resume API] JSON parse failed:', aiResult.content.slice(0, 300))
    return NextResponse.json(
      { error: 'Could not parse AI response. Please try uploading again.' },
      { status: 500 }
    )
  }

  const resumeData = parseResult.data
  console.log('[Resume API] Parsed resume for:', resumeData.name)
  console.log('[Resume API] Raw skills found:', resumeData.skills?.length ?? 0)

  // ── Skill normalisation (Bug 2A fix) ──
  let skills: string[] = []
  if (Array.isArray(resumeData.skills)) {
    skills = (resumeData.skills as unknown[])
      .flat()
      .map((s: unknown) => String(s).trim())
      .filter((s: string) => s.length > 1 && s !== 'null' && s !== 'undefined')
  } else if (typeof resumeData.skills === 'string') {
    skills = (resumeData.skills as string).split(',').map((s: string) => s.trim()).filter(Boolean)
  }

  // Also extract from tech_stack in projects
  const projectSkills = ((resumeData.projects ?? []) as Array<{ tech_stack?: string[] }>)
    .flatMap((p) => p.tech_stack ?? [])
    .map((s: string) => s.trim())
    .filter(Boolean)

  // Merge + deduplicate
  resumeData.skills = Array.from(new Set([...skills, ...projectSkills]))
  console.log('[Resume API] Final skills count:', resumeData.skills.length)
  console.log('[Resume API] Skills sample:', resumeData.skills.slice(0, 10))

  // 6. Get user's stream for SWOT analysis
  const { data: profile } = await supabase
    .from('users') // Note: In this project, it's typically the 'users' table, not 'profiles'
    .select('stream, target_roles')
    .eq('id', user.id)
    .single()

  const stream = profile?.stream ?? 'Software Engineering'

  // 7. Generate SWOT analysis (separate AI call)
  console.log('[Resume API] Generating SWOT analysis...')
  const swotResult = await extractWithAI(
    { ...readResult, method: 'text_extraction', rawText: '' }, // force text path
    SWOT_SYSTEM_PROMPT,
    buildSwotPrompt(
      resumeData.name ?? 'Student',
      resumeData.skills ?? [],
      stream
    ),
    800
  )

  interface SwotData {
    strengths?: string[]
    weaknesses?: string[]
    opportunities?: string[]
    threats?: string[]
    critical_gaps?: string[]
    recommended_skills?: string[]
  }
  let swotData: SwotData = {
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: [],
    critical_gaps: [],
    recommended_skills: []
  }

  if (swotResult.success) {
    const swotParsed = parseAIJson<SwotData>(swotResult.content)
    if (swotParsed.success && swotParsed.data) {
      swotData = swotParsed.data
    }
  }

  // 8. Store in Supabase
  console.log('[Resume API] Storing in Supabase...')
  console.log('[Resume] About to save to Supabase...')
  console.log('[Resume] user_id:', user.id)
  console.log('[Resume] skills count:', (resumeData.skills ?? []).length)
  console.log('[Resume] has parsed_data:', !!resumeData)

  const db = createServiceClient()

  // First check if row exists:
  const { data: existing, error: checkErr } = await db
    .from('user_resumes')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  console.log('[Resume] Existing row:', existing?.id ?? 'NONE')
  console.log('[Resume] Check error:', checkErr?.message ?? 'none')

  let saveError: unknown = null

  if (existing) {
    // UPDATE existing row
    const { error } = await db
      .from('user_resumes')
      .update({
        raw_text: readResult.rawText.slice(0, 50000),
        skill_entities: {
          skills: resumeData.skills ?? [],
          certifications: resumeData.certifications ?? [],
          projects: resumeData.projects ?? [],
          education: resumeData.education ?? [],
          experience: resumeData.experience ?? []
        },
        swot: swotData,
        parsed_data: resumeData,
        extraction_method: readResult.method,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    saveError = error
    console.log('[Resume] UPDATE result:', error ? `ERROR: ${error.message}` : 'SUCCESS')
  } else {
    // INSERT new row
    const { error } = await db
      .from('user_resumes')
      .insert({
        user_id: user.id,
        raw_text: readResult.rawText.slice(0, 50000),
        skill_entities: {
          skills: resumeData.skills ?? [],
          certifications: resumeData.certifications ?? [],
          projects: resumeData.projects ?? [],
          education: resumeData.education ?? [],
          experience: resumeData.experience ?? []
        },
        swot: swotData,
        parsed_data: resumeData,
        extraction_method: readResult.method,
        created_at: new Date().toISOString()
      })

    saveError = error
    console.log('[Resume] INSERT result:', error ? `ERROR: ${error.message}` : 'SUCCESS')
  }

  // Update profiles table to mark resume as uploaded
  if (!saveError) {
    const { error: profileErr } = await db
      .from('users')
      .update({
        resume_uploaded: true,
        resume_uploaded_at: new Date().toISOString()
      })
      .eq('id', user.id)

    console.log('[Resume] Profile update:', profileErr?.message ?? 'SUCCESS')
  }

  console.log('[Resume API] === Success ===')
  return NextResponse.json({
    success: true,
    data: resumeData,
    swot: swotData,
    extractionMethod: readResult.method,
    skillsFound: resumeData.skills?.length ?? 0
  })
}
