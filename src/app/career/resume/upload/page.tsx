'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  FileText, Upload, Loader2, CheckCircle, AlertCircle,
  RefreshCw, User, Code, Briefcase, GraduationCap, X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ResumeData {
  name?: string | null
  email?: string | null
  phone?: string | null
  location?: string | null
  summary?: string | null
  skills?: string[]
  experience?: Array<{
    company: string; role: string; duration: string; description: string
  }>
  education?: Array<{
    institution: string; degree: string; year: string; cgpa?: string | null
  }>
  projects?: Array<{
    name: string; description: string; tech_stack: string[]
  }>
  certifications?: string[]
}

interface SwotData {
  strengths?: string[]
  weaknesses?: string[]
  opportunities?: string[]
  threats?: string[]
  critical_gaps?: string[]
  recommended_skills?: string[]
}

interface SavedResume {
  id: string
  parsed_data: ResumeData
  skill_entities: { skills: string[]; projects: unknown[] }
  swot: SwotData
  extraction_method: string
  updated_at: string
}

type PageState =
  | { status: 'loading_saved' }
  | { status: 'idle' }
  | { status: 'uploading'; filename: string }
  | { status: 'extracting' }
  | { status: 'success'; data: ResumeData; swot: SwotData; method: string; skillsFound: number; saved: boolean }
  | { status: 'error'; message: string }

export default function ResumeUploadPage() {
  const [state, setState] = useState<PageState>({ status: 'loading_saved' })
  const [dragOver, setDragOver] = useState(false)

  // ── Load saved resume on mount ──────────────────────────────
  useEffect(() => {
    loadSavedResume()
  }, [])

  async function loadSavedResume() {
    setState({ status: 'loading_saved' })
    try {
      const res = await fetch('/api/career/resume/saved')
      if (!res.ok) {
        setState({ status: 'idle' })
        return
      }
      const json = await res.json()
      if (json.resume) {
        const r: SavedResume = json.resume
        const data = r.parsed_data ?? {}
        const skills = r.skill_entities?.skills ?? data.skills ?? []

        setState({
          status: 'success',
          data: { ...data, skills },
          swot: r.swot ?? {},
          method: r.extraction_method ?? 'text_extraction',
          skillsFound: skills.length,
          saved: true
        })
      } else {
        setState({ status: 'idle' })
      }
    } catch (e) {
      console.error('Failed to load saved resume:', e)
      setState({ status: 'idle' })
    }
  }

  // ── Handle file upload ──────────────────────────────────────
  const processFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    const allowed = ['pdf', 'docx', 'jpg', 'jpeg', 'png', 'webp']
    if (!allowed.includes(ext ?? '')) {
      setState({ status: 'error', message: 'Please upload a PDF, Word doc, or image.' })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setState({ status: 'error', message: 'File too large. Max 10MB.' })
      return
    }

    setState({ status: 'uploading', filename: file.name })

    try {
      setState({ status: 'extracting' })
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setState({ status: 'error', message: 'Not authenticated.' })
        return
      }

      // Upload directly to Supabase Storage via our new API route to bypass RLS issues
      const storagePath = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'resumes');
      formData.append('path', storagePath);

      const uploadRes = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData) {
        setState({ status: 'error', message: uploadData?.error || 'Storage upload failed.' })
        return
      }

      // Call process API with just the storage path
      const res = await fetch('/api/resume/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath: uploadData.path, userId: user.id })
      })

      let json: {
        success?: boolean
        error?: string
        data?: ResumeData
        swot?: SwotData
        extractionMethod?: string
        skillsFound?: number
        saved?: boolean
      }

      try {
        json = await res.json()
      } catch {
        setState({
          status: 'error',
          message: `Server error (${res.status}). Please try again.`
        })
        return
      }

      console.log('[Upload Page] API response:', {
        ok: res.ok,
        status: res.status,
        success: json.success,
        skillsFound: json.skillsFound,
        saved: json.saved
      })

      if (!res.ok || !json.success) {
        setState({
          status: 'error',
          message: json.error ?? `Upload failed (${res.status}). Please try again.`
        })
        return
      }

      setState({
        status: 'success',
        data: json.data ?? {},
        swot: json.swot ?? {},
        method: json.extractionMethod ?? 'text_extraction',
        skillsFound: json.skillsFound ?? 0,
        saved: json.saved ?? false
      })

    } catch {
      setState({
        status: 'error',
        message: 'Network error. Check your connection and try again.'
      })
    }
  }, [])

  // ── RENDER ──────────────────────────────────────────────────

  // Loading existing resume
  if (state.status === 'loading_saved') {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <PageHeader />
        <div className="flex items-center justify-center py-20 gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span className="text-muted-foreground text-sm">
            Loading your resume...
          </span>
        </div>
      </div>
    )
  }

  // Upload form (idle)
  if (state.status === 'idle' || state.status === 'error') {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <PageHeader />

        {state.status === 'error' && (
          <div className="mb-4 flex items-start gap-3 p-4 bg-red-50
            dark:bg-red-950/20 border border-red-200 dark:border-red-800
            rounded-xl">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                Upload failed
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">
                {state.message}
              </p>
            </div>
            <button
              onClick={() => setState({ status: 'idle' })}
              className="ml-auto text-red-400 hover:text-red-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-2xl p-12 text-center
            cursor-pointer transition-all duration-200 ${
            dragOver
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 scale-[1.01]'
              : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-900/50'
          }`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault()
            setDragOver(false)
            const file = e.dataTransfer.files[0]
            if (file) processFile(file)
          }}
          onClick={() => document.getElementById('resume-input')?.click()}>

          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30
              rounded-2xl flex items-center justify-center">
              <Upload className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Drop your resume here
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse files
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              PDF, Word (.docx), JPG, PNG · Max 10MB
            </p>
          </div>

          <input
            id="resume-input"
            type="file"
            className="hidden"
            accept=".pdf,.docx,.jpg,.jpeg,.png,.webp"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) processFile(file)
              e.target.value = '' // reset so same file can be re-uploaded
            }}
          />
        </div>

        {/* Tips */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
            For best results:
          </p>
          <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
            <li>• PDF or Word documents extract most accurately</li>
            <li>• Scanned PDFs are supported via AI vision</li>
            <li>• Make sure your skills section is clearly formatted</li>
          </ul>
        </div>
      </div>
    )
  }

  // Uploading / extracting
  if (state.status === 'uploading' || state.status === 'extracting') {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <PageHeader />
        <div className="border-2 rounded-2xl p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">
            {state.status === 'uploading'
              ? `Reading ${state.filename}...`
              : 'AI is analysing your resume...'}
          </p>
          <p className="text-sm text-muted-foreground">
            {state.status === 'uploading'
              ? 'Preparing your file'
              : 'Extracting skills, experience, and building your SWOT analysis (10-20 seconds)'}
          </p>
          {/* Progress indicators */}
          <div className="flex justify-center gap-8 mt-8">
            {['Reading file', 'AI extraction', 'SWOT analysis', 'Saving'].map((step, i) => (
              <div key={step} className="flex flex-col items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full transition-all ${
                  i === 0 ? 'bg-blue-500 scale-125 animate-pulse' :
                  i === 1 && state.status === 'extracting' ? 'bg-blue-500 scale-125 animate-pulse' :
                  'bg-gray-200 dark:bg-gray-700'
                }`} />
                <span className="text-xs text-muted-foreground">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Success — show extracted data
  const { data, swot, method, skillsFound, saved } = state

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-5">
      {/* Success header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30
            rounded-xl flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Resume Extracted</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {skillsFound} skills found ·{' '}
              {method === 'vision_pdf' ? 'AI Vision (scanned PDF)' :
               method === 'vision_image' ? 'AI Vision (image)' :
               method === 'docx_text' ? 'Word document' :
               'Text extraction'} ·{' '}
              {saved
                ? <span className="text-green-600 font-medium">✓ Saved</span>
                : <span className="text-yellow-600">⚠ Not saved</span>
              }
            </p>
          </div>
        </div>
        <button
          onClick={() => setState({ status: 'idle' })}
          className="flex items-center gap-1.5 text-sm text-muted-foreground
            hover:text-foreground border rounded-lg px-3 py-1.5 transition-colors">
          <RefreshCw className="h-3.5 w-3.5" /> Re-upload
        </button>
      </div>

      {/* Profile card */}
      <div className="border rounded-xl p-5 flex items-start gap-4">
        <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl
          flex items-center justify-center flex-shrink-0">
          <User className="h-6 w-6 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold">
            {data.name ?? 'Name not detected'}
          </h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm
            text-muted-foreground">
            {data.email && <span>✉ {data.email}</span>}
            {data.phone && <span>📱 {data.phone}</span>}
            {data.location && <span>📍 {data.location}</span>}
          </div>
          {data.summary && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {data.summary}
            </p>
          )}
        </div>
      </div>

      {/* Skills */}
      {(data.skills?.length ?? 0) > 0 && (
        <div className="border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Code className="h-4 w-4 text-purple-500" />
            <h3 className="font-semibold">
              Skills
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({data.skills!.length} found)
              </span>
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.skills!.map(skill => (
              <span key={skill}
                className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30
                  text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {(data.education?.length ?? 0) > 0 && (
        <div className="border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="h-4 w-4 text-blue-500" />
            <h3 className="font-semibold">Education</h3>
          </div>
          <div className="space-y-3">
            {data.education!.map((edu, i) => (
              <div key={i} className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">{edu.degree}</p>
                  <p className="text-sm text-muted-foreground">
                    {edu.institution}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{edu.year}</p>
                  {edu.cgpa && (
                    <p className="text-xs font-medium text-green-600">
                      CGPA: {edu.cgpa}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {(data.experience?.length ?? 0) > 0 && (
        <div className="border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="h-4 w-4 text-orange-500" />
            <h3 className="font-semibold">Experience</h3>
          </div>
          <div className="space-y-3">
            {data.experience!.map((exp, i) => (
              <div key={i} className="border-l-2 border-orange-200
                dark:border-orange-800 pl-3">
                <p className="text-sm font-medium">{exp.role}</p>
                <p className="text-xs text-muted-foreground">
                  {exp.company} · {exp.duration}
                </p>
                {exp.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {(data.projects?.length ?? 0) > 0 && (
        <div className="border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Code className="h-4 w-4 text-green-500" />
            <h3 className="font-semibold">
              Projects ({data.projects!.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.projects!.map((proj, i) => (
              <div key={i}
                className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-900/50">
                <p className="text-sm font-medium">{proj.name}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {proj.description}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(proj.tech_stack ?? []).slice(0, 4).map(t => (
                    <span key={t}
                      className="text-xs px-1.5 py-0.5 bg-white
                        dark:bg-gray-800 border rounded text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SWOT */}
      {(swot.strengths?.length ?? 0) > 0 && (
        <div className="border rounded-xl p-5">
          <h3 className="font-semibold mb-4">AI SWOT Analysis</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Strengths', items: swot.strengths,
                bg: 'bg-green-50 dark:bg-green-950/20',
                text: 'text-green-700 dark:text-green-300',
                item: 'text-green-600 dark:text-green-400' },
              { label: 'Weaknesses', items: swot.weaknesses,
                bg: 'bg-red-50 dark:bg-red-950/20',
                text: 'text-red-700 dark:text-red-300',
                item: 'text-red-600 dark:text-red-400' },
              { label: 'Opportunities', items: swot.opportunities,
                bg: 'bg-blue-50 dark:bg-blue-950/20',
                text: 'text-blue-700 dark:text-blue-300',
                item: 'text-blue-600 dark:text-blue-400' },
              { label: 'Threats', items: swot.threats,
                bg: 'bg-purple-50 dark:bg-purple-950/20',
                text: 'text-purple-700 dark:text-purple-300',
                item: 'text-purple-600 dark:text-purple-400' },
            ].map(({ label, items, bg, text, item }) => (
              <div key={label} className={`${bg} p-3 rounded-lg`}>
                <p className={`text-xs font-semibold ${text} mb-2`}>{label}</p>
                <ul className="space-y-1">
                  {(items ?? []).slice(0, 3).map((s, i) => (
                    <li key={i} className={`text-xs ${item}`}>• {s}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {(swot.recommended_skills?.length ?? 0) > 0 && (
            <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg">
              <p className="text-xs font-semibold text-indigo-700
                dark:text-indigo-300 mb-2">
                Recommended skills to learn
              </p>
              <div className="flex flex-wrap gap-1.5">
                {swot.recommended_skills!.map(s => (
                  <span key={s}
                    className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40
                      text-indigo-600 dark:text-indigo-300 rounded-full text-xs">
                    + {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CTAs */}
      <div className="border rounded-xl p-5
        bg-gradient-to-r from-blue-50 to-purple-50
        dark:from-blue-950/20 dark:to-purple-950/20">
        <p className="font-medium mb-3">What's next?</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/career/foundry/dashboard"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm
              font-medium hover:bg-blue-600 transition-colors">
            Generate Projects →
          </Link>
          <Link href="/career/market"
            className="px-4 py-2 border rounded-lg text-sm font-medium
              hover:bg-white dark:hover:bg-gray-800 transition-colors">
            Match Jobs →
          </Link>
          <Link href="/priority"
            className="px-4 py-2 border rounded-lg text-sm font-medium
              hover:bg-white dark:hover:bg-gray-800 transition-colors">
            View Priority Plan →
          </Link>
        </div>
      </div>
    </div>
  )
}

function PageHeader() {
  return (
    <div className="flex items-center gap-3 mb-6">
      <FileText className="h-6 w-6 text-blue-500" />
      <div>
        <h1 className="text-2xl font-semibold">Resume Intelligence</h1>
        <p className="text-sm text-muted-foreground">
          Upload your resume to extract skills, generate SWOT analysis,
          and unlock personalised projects
        </p>
      </div>
    </div>
  )
}
