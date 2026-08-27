'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  FileText, Upload, Loader2, CheckCircle, AlertCircle,
  RefreshCw, User, Code, Briefcase, GraduationCap, X,
  Mail, Phone, MapPin, Check, Sparkles, ArrowRight, ShieldCheck, Zap
} from 'lucide-react'

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
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      if (!cancelled) setState({ status: 'idle' });
    }, 3000); // 3s max — show upload UI immediately if query times out or no resume exists

    loadSavedResume(controller.signal).finally(() => {
      if (!cancelled) {
        clearTimeout(timeout);
      }
    });

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [])

  async function loadSavedResume(signal: AbortSignal) {
    setState({ status: 'loading_saved' })
    try {
      const res = await fetch('/api/career/resume/saved', { signal })
      if (!res.ok) {
        if (!signal.aborted) setState({ status: 'idle' })
        return
      }
      const json = await res.json()
      if (json.resume && !signal.aborted) {
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
        if (!signal.aborted) setState({ status: 'idle' })
      }
    } catch {
      if (!signal.aborted) setState({ status: 'idle' })
    }
  }

  // ── Upload & process file ───────────────────────────────────
  const processFile = useCallback(async (file: File) => {
    // Validate
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg', 'image/png', 'image/webp'
    ]
    if (!allowed.includes(file.type) && !file.name.endsWith('.docx')) {
      setState({
        status: 'error',
        message: 'Unsupported format. Upload a PDF, Word doc (.docx), or image.'
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setState({
        status: 'error',
        message: 'File too large. Maximum size is 10MB.'
      })
      return
    }

    setState({ status: 'uploading', filename: file.name })

    try {
      const uploadForm = new FormData()
      uploadForm.append('file', file)

      const timer = setTimeout(() => {
        setState({ status: 'extracting' })
      }, 1200)

      const uploadRes = await fetch('/api/career/resume/upload', {
        method: 'POST',
        body: uploadForm
      })

      clearTimeout(timer)

      if (!uploadRes.ok) {
        let errMsg = 'Upload failed. Please make sure you are logged in.'
        try {
          const err = await uploadRes.json()
          if (err?.error) errMsg = err.error
        } catch {}
        setState({ status: 'error', message: errMsg })
        return
      }

      const json = await uploadRes.json()

      setState({
        status: 'success',
        data: json.data ?? {},
        swot: json.swot ?? {},
        method: json.extractionMethod ?? 'text_extraction',
        skillsFound: json.skillsFound ?? (json.data?.skills?.length ?? 0),
        saved: json.saved ?? false
      })

    } catch (err: any) {
      setState({
        status: 'error',
        message: err?.message || 'Network error. Check your connection and try again.'
      })
    }
  }, [])

  // ── RENDER ──────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="neu-card rounded-[28px] p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
              <img src="/logo.png" alt="PrioryxAI" className="h-4 w-4 shrink-0 object-contain" />
              <span>AI Career Guidance</span>
            </div>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Resume Intelligence
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Extract technical skills, build comprehensive AI SWOT matrices, and unlock personalized career projects.
            </p>
          </div>

          {state.status === 'success' && (
            <button
              onClick={() => setState({ status: 'idle' })}
              className="neu-btn inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shrink-0"
            >
              <RefreshCw className="h-4 w-4" /> Re-upload Resume
            </button>
          )}
        </div>
      </header>

      {/* Loading Saved */}
      {state.status === 'loading_saved' && (
        <div className="neu-card rounded-[28px] p-12 flex flex-col items-center justify-center text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Loading your saved resume profile...</p>
        </div>
      )}

      {/* Upload Form (Idle / Error) */}
      {(state.status === 'idle' || state.status === 'error') && (
        <div className="space-y-6">
          {state.status === 'error' && (
            <div className="neu-card rounded-[24px] border border-rose-200 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-rose-700 dark:text-rose-400">Upload failed</p>
                <p className="text-xs text-rose-600 dark:text-rose-300 mt-0.5">{state.message}</p>
              </div>
              <button onClick={() => setState({ status: 'idle' })} className="text-rose-400 hover:text-rose-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Dropzone */}
          <div
            className={`neu-card rounded-[28px] p-10 md:p-14 text-center cursor-pointer transition-all duration-200 border-2 border-dashed ${
              dragOver
                ? 'border-cyan-500 bg-cyan-500/5 scale-[1.01]'
                : 'border-slate-200/80 dark:border-white/10 hover:border-cyan-400'
            }`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault()
              setDragOver(false)
              const file = e.dataTransfer.files[0]
              if (file) processFile(file)
            }}
            onClick={() => document.getElementById('resume-input')?.click()}
          >
            <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
              <div className="neu-pill-inset h-16 w-16 rounded-2xl flex items-center justify-center text-cyan-500 dark:text-cyan-400">
                <Upload className="h-8 w-8" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  Drop your resume here
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  or click to select file from your device
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-full">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>PDF, DOCX, JPG, PNG (Max 10MB)</span>
              </div>
            </div>

            <input
              id="resume-input"
              type="file"
              className="hidden"
              accept=".pdf,.docx,.jpg,.jpeg,.png,.webp"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) processFile(file)
                e.target.value = ''
              }}
            />
          </div>

          {/* Guide Card */}
          <div className="neu-card rounded-[24px] p-5 grid sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="neu-pill-inset p-2 rounded-xl text-indigo-500 shrink-0 mt-0.5">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Text & Scanned PDFs</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">AI vision parses scanned documents accurately.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="neu-pill-inset p-2 rounded-xl text-emerald-500 shrink-0 mt-0.5">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Skill Matrix Extraction</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Detects languages, libraries, and frameworks.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="neu-pill-inset p-2 rounded-xl text-amber-500 shrink-0 mt-0.5">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Project Foundry Link</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Generates projects to fill detected skill gaps.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Uploading & Extracting Progress */}
      {(state.status === 'uploading' || state.status === 'extracting') && (
        <div className="neu-card rounded-[28px] p-10 md:p-14 text-center space-y-6">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-500 mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {state.status === 'uploading' ? `Uploading ${state.filename}...` : 'AI Intelligence Analyzing Resume...'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              {state.status === 'uploading'
                ? 'Securing file upload to cloud storage'
                : 'Extracting skills, parsing career trajectory, and generating SWOT intelligence matrix.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-4">
            {[
              { title: 'Reading file', active: true },
              { title: 'AI extraction', active: state.status === 'extracting' },
              { title: 'SWOT analysis', active: state.status === 'extracting' },
              { title: 'Saving profile', active: state.status === 'extracting' }
            ].map((step, idx) => (
              <div key={idx} className="neu-inset rounded-2xl p-3 text-center">
                <div className={`h-2 w-2 rounded-full mx-auto mb-2 ${step.active ? 'bg-cyan-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{step.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extracted Resume Intelligence View */}
      {state.status === 'success' && (
        <div className="space-y-6">
          {/* Status Bar */}
          <div className="neu-card rounded-[24px] p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Extraction Complete ({state.skillsFound} skills identified)
              </span>
              <span className="neu-pill rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {state.method === 'vision_pdf' ? 'AI Vision (PDF)' : state.method === 'docx_text' ? 'Word Doc' : 'Text Extraction'}
              </span>
            </div>
            {state.saved && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <Check size={14} /> Profile Saved & Synced
              </span>
            )}
          </div>

          {/* Profile Overview Card */}
          <div className="neu-card rounded-[28px] p-6 sm:p-7">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="neu-pill-inset h-14 w-14 rounded-2xl flex items-center justify-center text-cyan-500 dark:text-cyan-400 shrink-0">
                <User className="h-7 w-7" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                  {state.data.name ?? 'Candidate Profile'}
                </h2>
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {state.data.email && (
                    <span className="inline-flex items-center gap-1.5"><Mail size={13} className="text-slate-400" /> {state.data.email}</span>
                  )}
                  {state.data.phone && (
                    <span className="inline-flex items-center gap-1.5"><Phone size={13} className="text-slate-400" /> {state.data.phone}</span>
                  )}
                  {state.data.location && (
                    <span className="inline-flex items-center gap-1.5"><MapPin size={13} className="text-slate-400" /> {state.data.location}</span>
                  )}
                </div>
                {state.data.summary && (
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 mt-3 pt-3 border-t border-slate-200/60 dark:border-white/10">
                    {state.data.summary}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Skills Matrix Card */}
          {(state.data.skills?.length ?? 0) > 0 && (
            <div className="neu-card rounded-[28px] p-6 sm:p-7">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-indigo-500" />
                  <h3 className="text-base font-bold text-slate-950 dark:text-white">Technical Skills</h3>
                </div>
                <span className="neu-pill rounded-full px-2.5 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {state.data.skills!.length} Detected
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {state.data.skills!.map(skill => (
                  <span key={skill} className="neu-pill rounded-xl px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI SWOT Analysis Matrix */}
          {(state.swot.strengths?.length ?? 0) > 0 && (
            <div className="neu-card rounded-[28px] p-6 sm:p-7 space-y-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyan-500" />
                <h3 className="text-base font-bold text-slate-950 dark:text-white">AI SWOT Matrix</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { label: 'Strengths', items: state.swot.strengths, border: 'border-emerald-500/20 bg-emerald-500/5', titleColor: 'text-emerald-700 dark:text-emerald-400' },
                  { label: 'Weaknesses / Gaps', items: state.swot.weaknesses, border: 'border-rose-500/20 bg-rose-500/5', titleColor: 'text-rose-700 dark:text-rose-400' },
                  { label: 'Opportunities', items: state.swot.opportunities, border: 'border-cyan-500/20 bg-cyan-500/5', titleColor: 'text-cyan-700 dark:text-cyan-400' },
                  { label: 'Threats / Risks', items: state.swot.threats, border: 'border-amber-500/20 bg-amber-500/5', titleColor: 'text-amber-700 dark:text-amber-400' },
                ].map(({ label, items, border, titleColor }) => (
                  <div key={label} className={`rounded-2xl border p-4 ${border}`}>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-2.5 ${titleColor}`}>{label}</p>
                    <ul className="space-y-1.5">
                      {(items ?? []).slice(0, 4).map((s, i) => (
                        <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                          <span className="opacity-50 mt-0.5">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {(state.swot.recommended_skills?.length ?? 0) > 0 && (
                <div className="neu-inset rounded-2xl p-4 mt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
                    Recommended Target Skills to Learn
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {state.swot.recommended_skills!.map(s => (
                      <span key={s} className="neu-pill rounded-full px-3 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                        + {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Education & Experience Dual Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Education */}
            {(state.data.education?.length ?? 0) > 0 && (
              <div className="neu-card rounded-[28px] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="h-5 w-5 text-cyan-500" />
                  <h3 className="text-base font-bold text-slate-950 dark:text-white">Education</h3>
                </div>
                <div className="space-y-3">
                  {state.data.education!.map((edu, i) => (
                    <div key={i} className="neu-inset rounded-2xl p-3.5 flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{edu.degree}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{edu.institution}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{edu.year}</span>
                        {edu.cgpa && (
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">CGPA: {edu.cgpa}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {(state.data.experience?.length ?? 0) > 0 && (
              <div className="neu-card rounded-[28px] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="h-5 w-5 text-amber-500" />
                  <h3 className="text-base font-bold text-slate-950 dark:text-white">Experience</h3>
                </div>
                <div className="space-y-3">
                  {state.data.experience!.map((exp, i) => (
                    <div key={i} className="neu-inset rounded-2xl p-3.5 space-y-1">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{exp.role}</p>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{exp.duration}</span>
                      </div>
                      <p className="text-xs font-medium text-amber-600 dark:text-amber-400">{exp.company}</p>
                      {exp.description && (
                        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2 pt-1">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Pathways CTA Card */}
          <div className="neu-card rounded-[28px] p-6 sm:p-7">
            <h3 className="text-base font-bold text-slate-950 dark:text-white mb-1">Recommended Next Actions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Leverage your parsed skills to generate projects and find matching job openings.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/career/foundry/dashboard"
                className="neu-btn inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
              >
                <span>Generate Projects</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/career/market/jobs"
                className="neu-btn inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 dark:text-white"
              >
                <span>Match Jobs</span>
              </Link>
              <Link
                href="/feed"
                className="neu-btn inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 dark:text-slate-300"
              >
                <span>Back to Dashboard Feed</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
