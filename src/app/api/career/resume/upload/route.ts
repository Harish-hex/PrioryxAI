import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server'
import { readFile, extractWithAI, parseAIJson, parseUploadedFile } from '@/lib/file-processor'

// ── Environment check ─────────────────────────────────────────
const OPENAI_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_KEY) {
  console.error('[Resume API] OPENAI_API_KEY is not set!')
}

// ── AI Prompts ────────────────────────────────────────────────

const RESUME_SYSTEM = `You are an expert resume parser.
Extract ALL information from the resume.
Return ONLY raw JSON. No markdown. No backticks. No explanation.`

const RESUME_PROMPT = `Parse this resume completely.
Return JSON with EXACTLY this structure:

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
- Return raw JSON only — no markdown, no code fences`

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

// ── API Handler ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  console.log('\n[Resume API] ════════════════════════════════')
  console.log('[Resume API] Request received at', new Date().toISOString())

  // ── 1. Auth ────────────────────────────────────────────────
  const user = await getAuthUser()
  if (!user) {
    console.error('[Resume API] No authenticated user')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  console.log('[Resume API] User:', user.id, user.email)

  // ── 2. Parse uploaded file ─────────────────────────────────
  const fileResult = await parseUploadedFile(req)
  if ('error' in fileResult && !('buffer' in fileResult)) {
    console.error('[Resume API] File parse error:', fileResult.error)
    return NextResponse.json({ error: fileResult.error }, { status: 400 })
  }
  const { buffer, mimeType, filename } = fileResult as {
    buffer: Buffer
    mimeType: string
    filename: string
  }
  console.log('[Resume API] File:', filename, '|', mimeType, '|', buffer.length, 'bytes')

  // ── 3. Read file content ────────────────────────────────────
  console.log('[Resume API] Reading file...')
  const readResult = await readFile(buffer, mimeType, filename)
  console.log('[Resume API] Read method:', readResult.method)
  console.log('[Resume API] Text length:', readResult.rawText.length)
  console.log('[Resume API] Read success:', readResult.success)

  if (!readResult.success) {
    return NextResponse.json({ error: readResult.error }, { status: 400 })
  }

  // ── 4. Extract resume data with AI ─────────────────────────
  console.log('[Resume API] Calling AI extraction...')
  const aiResult = await extractWithAI(
    readResult,
    RESUME_SYSTEM,
    RESUME_PROMPT,
    2500
  )
  console.log('[Resume API] AI call success:', aiResult.success)
  if (!aiResult.success) {
    console.error('[Resume API] AI error:', aiResult.error)
  }
  console.log('[Resume API] AI response preview:',
    aiResult.content.slice(0, 150))

  if (!aiResult.success) {
    return NextResponse.json(
      { error: aiResult.error ?? 'AI extraction failed. Please try again.' },
      { status: 500 }
    )
  }

  // ── 5. Parse JSON from AI response ─────────────────────────
  interface ResumeData {
    name?: string | null
    email?: string | null
    phone?: string | null
    location?: string | null
    linkedin?: string | null
    github?: string | null
    summary?: string | null
    skills?: string[]
    experience?: Array<{
      company: string
      role: string
      duration: string
      description: string
    }>
    education?: Array<{
      institution: string
      degree: string
      year: string
      cgpa?: string | null
    }>
    projects?: Array<{
      name: string
      description: string
      tech_stack: string[]
    }>
    certifications?: string[]
    achievements?: string[]
    languages?: string[]
  }

  const parseResult = parseAIJson<ResumeData>(aiResult.content)
  if (!parseResult.success || !parseResult.data) {
    console.error('[Resume API] JSON parse failed')
    console.error('[Resume API] Raw AI response:', aiResult.content.slice(0, 500))
    return NextResponse.json(
      { error: 'Could not parse resume data. Please try again.' },
      { status: 500 }
    )
  }

  let resumeData = parseResult.data
  console.log('[Resume API] Parsed name:', resumeData.name)
  console.log('[Resume API] Raw skills:', resumeData.skills?.length ?? 0)

  // ── 6. Normalise and enhance skills ────────────────────────
  let skills: string[] = []

  // From skills array
  if (Array.isArray(resumeData.skills)) {
    skills = resumeData.skills
      .flat()
      .map(s => String(s).trim())
      .filter(s => s.length > 1 && s !== 'null')
  }

  // From project tech_stacks
  const projectSkills = (resumeData.projects ?? [])
    .flatMap(p => p.tech_stack ?? [])
    .map(s => String(s).trim())
    .filter(s => s.length > 1)

  // From certifications
  const certSkills = (resumeData.certifications ?? [])
    .flatMap(cert => {
      const techMap: Record<string, string[]> = {
        'aws': ['AWS', 'Cloud'], 'google': ['GCP'], 'azure': ['Azure'],
        'tensorflow': ['TensorFlow', 'ML'], 'pytorch': ['PyTorch'],
        'react': ['React'], 'node': ['Node.js']
      }
      const lower = cert.toLowerCase()
      return Object.entries(techMap)
        .filter(([key]) => lower.includes(key))
        .flatMap(([, vals]) => vals)
    })

  // Merge all, deduplicate, sort
  const allSkills = Array.from(new Set([
    ...skills, ...projectSkills, ...certSkills
  ])).sort()

  resumeData.skills = allSkills
  console.log('[Resume API] Final skills count:', allSkills.length)
  console.log('[Resume API] Skills:', allSkills.slice(0, 10))

  // ── 7. Get user profile for context ────────────────────────
  const db = createServiceRoleClient()

  const { data: profile } = await db
    .from('users') // changed from profiles as per original instruction
    .select('stream, target_companies, display_name')
    .eq('id', user.id)
    .maybeSingle()

  const stream = profile?.stream ?? 'Software Engineering'
  const targetCompanies = profile?.target_companies ?? []
  console.log('[Resume API] User stream:', stream)

  // ── 8. Generate SWOT analysis ──────────────────────────────
  console.log('[Resume API] Generating SWOT...')
  interface SwotData {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    threats: string[]
    critical_gaps: string[]
    recommended_skills: string[]
  }

  let swotData: SwotData = {
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: [],
    critical_gaps: [],
    recommended_skills: []
  }

  // Use text path for SWOT (faster, cheaper)
  const swotReadResult = {
    method: 'text_extraction' as const,
    rawText: buildSwotPrompt(
      resumeData.name ?? 'Student',
      allSkills,
      stream,
      targetCompanies
    ),
    success: true
  }

  const swotAI = await extractWithAI(
    swotReadResult,
    SWOT_SYSTEM,
    '',  // prompt is in rawText
    800
  )

  if (swotAI.success) {
    const swotParsed = parseAIJson<SwotData>(swotAI.content)
    if (swotParsed.success && swotParsed.data) {
      swotData = swotParsed.data
      console.log('[Resume API] SWOT generated:',
        swotData.critical_gaps?.length ?? 0, 'gaps')
    }
  }

  // ── 9. SAVE TO SUPABASE (the critical step) ─────────────────

  console.log('[Resume API] === SAVING TO SUPABASE ===')
  console.log('[Resume API] user_id:', user.id)
  console.log('[Resume API] skills to save:', allSkills.length)

  // Step 9a: Check if row exists
  const { data: existingRow, error: checkErr } = await db
    .from('user_resumes')
    .select('id, created_at')
    .eq('user_id', user.id)
    .maybeSingle()

  console.log('[Resume API] Existing row:', existingRow?.id ?? 'NONE')
  if (checkErr) console.error('[Resume API] Check error:', checkErr)

  const resumePayload = {
    user_id: user.id,
    raw_text: readResult.rawText.slice(0, 50000),
    skill_entities: {
      skills: allSkills,
      certifications: resumeData.certifications ?? [],
      projects: resumeData.projects ?? [],
      education: resumeData.education ?? [],
      experience: resumeData.experience ?? []
    },
    swot: swotData,
    parsed_data: resumeData,
    extraction_method: readResult.method,
    updated_at: new Date().toISOString()
  }

  let savedId: string | null = null

  if (existingRow) {
    // UPDATE
    console.log('[Resume API] Updating existing row:', existingRow.id)
    const { data: updated, error: updateErr } = await db
      .from('user_resumes')
      .update(resumePayload)
      .eq('user_id', user.id)
      .select('id')
      .single()

    if (updateErr) {
      console.error('[Resume API] UPDATE FAILED:', updateErr.message)
      console.error('[Resume API] UPDATE error code:', updateErr.code)
      console.error('[Resume API] UPDATE details:', updateErr.details)
    } else {
      savedId = updated.id
      console.log('[Resume API] UPDATE SUCCESS. id:', savedId)
    }
  } else {
    // INSERT
    console.log('[Resume API] Inserting new row...')
    const { data: inserted, error: insertErr } = await db
      .from('user_resumes')
      .insert({ ...resumePayload, created_at: new Date().toISOString() })
      .select('id')
      .single()

    if (insertErr) {
      console.error('[Resume API] INSERT FAILED:', insertErr.message)
      console.error('[Resume API] INSERT error code:', insertErr.code)
      console.error('[Resume API] INSERT details:', insertErr.details)
    } else {
      savedId = inserted.id
      console.log('[Resume API] INSERT SUCCESS. id:', savedId)
    }
  }

  // Step 9b: Update users.resume_uploaded flag
  if (savedId) {
    const { error: profileErr } = await db
      .from('users') // changed from profiles
      .update({
        resume_uploaded: true,
        resume_uploaded_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (profileErr) {
      console.error('[Resume API] Profile flag update failed:', profileErr.message)
    } else {
      console.log('[Resume API] Profile flag set to resume_uploaded=true')
    }
  } else {
    console.error('[Resume API] savedId is null — RESUME NOT SAVED TO DB')
  }

  // ── 10. Verify the save worked ──────────────────────────────
  const { data: verification } = await db
    .from('user_resumes')
    .select('id, user_id, skill_entities, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  console.log('[Resume API] VERIFICATION:',
    verification ? `FOUND (${(verification.skill_entities as { skills?: string[] })?.skills?.length ?? 0} skills)` : 'NOT FOUND IN DB')
  console.log('[Resume API] Total time:', Date.now() - startTime, 'ms')
  console.log('[Resume API] ════════════════════════════════\n')

  return NextResponse.json({
    success: true,
    saved: !!savedId,
    data: resumeData,
    swot: swotData,
    extractionMethod: readResult.method,
    skillsFound: allSkills.length,
    resumeId: savedId
  })
}

