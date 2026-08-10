'use client'

import { useState, useCallback, useEffect } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, User,
         Code, Briefcase, GraduationCap, Award, X } from 'lucide-react'

// Types
interface ResumeData {
  name?: string
  email?: string
  phone?: string
  location?: string
  linkedin?: string
  github?: string
  summary?: string
  skills?: string[]
  experience?: Array<{ company: string; role: string; duration: string; description: string }>
  education?: Array<{ institution: string; degree: string; year: string; cgpa?: string }>
  projects?: Array<{ name: string; description: string; tech_stack: string[] }>
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

type UploadState =
  | { status: 'idle' }
  | { status: 'reading'; filename: string }
  | { status: 'extracting'; method: string }
  | { status: 'success'; data: ResumeData; swot: SwotData; method: string; skillsFound: number }
  | { status: 'error'; message: string }

export default function ResumeUploadPage() {
  const [state, setState] = useState<UploadState>({ status: 'idle' })
  const [dragOver, setDragOver] = useState(false)
  const [isLoadingSaved, setIsLoadingSaved] = useState(true)

  useEffect(() => {
    async function loadSavedResume() {
      try {
        const res = await fetch('/api/career/resume/saved')
        if (res.ok) {
          const json = await res.json()
          if (json.data) {
            setState({
              status: 'success',
              data: json.data.parsed_data,
              swot: json.data.swot ?? {},
              method: json.data.extraction_method ?? 'text_extraction',
              skillsFound: json.data.skill_entities?.skills?.length ?? 0
            })
          }
        }
      } catch (e) {
        console.error('Failed to load saved resume:', e)
      } finally {
        setIsLoadingSaved(false)
      }
    }
    loadSavedResume()
  }, [])

  const processFile = useCallback(async (file: File) => {
    setState({ status: 'reading', filename: file.name })

    const formData = new FormData()
    formData.append('file', file)

    try {
      setState({ status: 'extracting', method: 'Analysing resume...' })

      const res = await fetch('/api/career/resume/upload', {
        method: 'POST',
        body: formData
        // Do NOT set Content-Type header — let browser set it with boundary
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        setState({
          status: 'error',
          message: json.error ?? `Server error (${res.status}). Please try again.`
        })
        return
      }

      setState({
        status: 'success',
        data: json.data,
        swot: json.swot ?? {},
        method: json.extractionMethod ?? 'text_extraction',
        skillsFound: json.skillsFound ?? 0
      })

    } catch (e) {
      setState({
        status: 'error',
        message: 'Network error. Please check your connection and try again.'
      })
    }
  }, [])

  const handleFileSelect = useCallback((file: File) => {
    const allowed = ['application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg', 'image/png', 'image/webp']
    const ext = file.name.split('.').pop()?.toLowerCase()
    const validExts = ['pdf', 'docx', 'jpg', 'jpeg', 'png', 'webp']

    if (!allowed.includes(file.type) && !validExts.includes(ext ?? '')) {
      setState({ status: 'error', message: 'Please upload a PDF, Word document, or image.' })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setState({ status: 'error', message: 'File too large. Maximum size is 10MB.' })
      return
    }
    processFile(file)
  }, [processFile])

  // ── IDLE STATE ──────────────────────────────────────────────
  if (isLoadingSaved) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (state.status === 'idle') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-6 w-6 text-blue-500" />
          <h1 className="text-2xl font-semibold">Resume Intelligence</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Upload your resume to extract skills, generate SWOT analysis,
          and unlock personalised projects.
        </p>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
            transition-colors duration-200
            ${dragOver
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
            }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const file = e.dataTransfer.files[0]
            if (file) handleFileSelect(file)
          }}
          onClick={() => document.getElementById('resume-file-input')?.click()}
        >
          <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            Drop your resume here
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Supports: PDF, Word (.docx), JPG, PNG · Max 10MB
          </p>
          <input
            id="resume-file-input"
            type="file"
            className="hidden"
            accept=".pdf,.docx,.jpg,.jpeg,.png,.webp"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
          />
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
            For best results:
          </p>
          <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
            <li>• PDF or Word documents extract most accurately</li>
            <li>• If uploading a photo, ensure text is clearly visible</li>
            <li>• Scanned PDFs are also supported</li>
          </ul>
        </div>
      </div>
    )
  }

  // ── LOADING STATES ───────────────────────────────────────────
  if (state.status === 'reading' || state.status === 'extracting') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-8">
          <FileText className="h-6 w-6 text-blue-500" />
          <h1 className="text-2xl font-semibold">Resume Intelligence</h1>
        </div>

        <div className="border rounded-xl p-10 text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
          <div>
            <p className="font-medium text-lg">
              {state.status === 'reading'
                ? `Reading ${state.filename}...`
                : 'Extracting information...'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {state.status === 'reading'
                ? 'Preparing your file'
                : 'AI is analysing your resume — this takes 10-20 seconds'}
            </p>
          </div>
          {/* Progress steps */}
          <div className="flex justify-center gap-6 pt-4">
            {['Reading file', 'AI extraction', 'SWOT analysis', 'Saving'].map((step, i) => (
              <div key={step} className="flex flex-col items-center gap-1">
                <div className={`h-2 w-2 rounded-full ${
                  i === 0 ? 'bg-blue-500 animate-pulse' :
                  i === 1 && state.status === 'extracting' ? 'bg-blue-500 animate-pulse' :
                  'bg-gray-200'
                }`} />
                <span className="text-xs text-muted-foreground">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── ERROR STATE ──────────────────────────────────────────────
  if (state.status === 'error') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-8">
          <FileText className="h-6 w-6 text-blue-500" />
          <h1 className="text-2xl font-semibold">Resume Intelligence</h1>
        </div>

        <div className="border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <p className="font-medium text-red-600 dark:text-red-400 text-lg">
            Upload failed
          </p>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            {state.message}
          </p>
          <button
            onClick={() => setState({ status: 'idle' })}
            className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-lg
              hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  // ── SUCCESS STATE — SHOW EXTRACTED DATA ──────────────────────
  const { data, swot, method, skillsFound } = state

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-500" />
          <div>
            <h1 className="text-2xl font-semibold">Resume Extracted</h1>
            <p className="text-sm text-muted-foreground">
              Found {skillsFound} skills · via {
                method === 'vision_pdf' ? 'AI Vision (scanned PDF)' :
                method === 'vision_image' ? 'AI Vision (image)' :
                method === 'docx_text' ? 'Word document' :
                'Text extraction'
              }
            </p>
          </div>
        </div>
        <button
          onClick={() => setState({ status: 'idle' })}
          className="text-sm text-muted-foreground hover:text-foreground
            flex items-center gap-1 border rounded-lg px-3 py-1.5"
        >
          <X className="h-4 w-4" /> Upload new
        </button>
      </div>

      {/* 0 Skills Warning */}
      {skillsFound === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-400">No skills detected</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-500 mt-1">
              We couldn't extract any explicit technical or soft skills from your resume. This will impact your Job Market matches. Ensure your resume has a clear "Skills" section, or that it is a properly readable PDF.
            </p>
          </div>
        </div>
      )}

      {/* Profile card */}
      <div className="border rounded-xl p-6 flex items-start gap-4">
        <div className="h-14 w-14 bg-blue-100 dark:bg-blue-900 rounded-full
          flex items-center justify-center flex-shrink-0">
          <User className="h-7 w-7 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold">{data.name ?? 'Name not found'}</h2>
          <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
            {data.email && <span>✉ {data.email}</span>}
            {data.phone && <span>📱 {data.phone}</span>}
            {data.location && <span>📍 {data.location}</span>}
          </div>
          <div className="flex gap-3 mt-2">
            {data.linkedin && (
              <a href={data.linkedin} target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline">LinkedIn →</a>
            )}
            {data.github && (
              <a href={data.github} target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline">GitHub →</a>
            )}
          </div>
          {data.summary && (
            <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
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
            <h3 className="font-semibold">Skills ({data.skills!.length} found)</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.skills!.map(skill => (
              <span key={skill}
                className="px-2.5 py-1 bg-purple-600 text-white
                  rounded-full text-xs font-medium shadow-sm">
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
                  <p className="font-medium text-sm">{edu.degree}</p>
                  <p className="text-sm text-muted-foreground">{edu.institution}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{edu.year}</p>
                  {edu.cgpa && (
                    <p className="text-xs font-medium text-green-600">CGPA: {edu.cgpa}</p>
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
            <Briefcase className="h-4 w-4 text-amber-700 dark:text-amber-400" />
            <h3 className="font-semibold">Experience</h3>
          </div>
          <div className="space-y-4">
            {data.experience!.map((exp, i) => (
              <div key={i} className="border-l-2 border-amber-200 dark:border-amber-800 pl-3">
                <p className="font-medium text-sm">{exp.role}</p>
                <p className="text-sm text-muted-foreground">{exp.company} · {exp.duration}</p>
                {exp.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
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
            <h3 className="font-semibold">Projects ({data.projects!.length})</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.projects!.map((proj, i) => (
              <div key={i} className="border rounded-lg p-3">
                <p className="font-medium text-sm">{proj.name}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {proj.description}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {proj.tech_stack?.slice(0, 4).map(t => (
                    <span key={t}
                      className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800
                        rounded text-xs text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SWOT Analysis */}
      {(swot.strengths?.length ?? 0) > 0 && (
        <div className="border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-4 w-4 text-yellow-500" />
            <h3 className="font-semibold">AI SWOT Analysis</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Strengths', items: swot.strengths, styles: { bg: 'bg-green-50 dark:bg-green-950/20', heading: 'text-green-700 dark:text-green-300', text: 'text-green-600 dark:text-green-400' } },
              { label: 'Weaknesses', items: swot.weaknesses, styles: { bg: 'bg-red-50 dark:bg-red-950/20', heading: 'text-red-700 dark:text-red-300', text: 'text-red-600 dark:text-red-400' } },
              { label: 'Opportunities', items: swot.opportunities, styles: { bg: 'bg-blue-50 dark:bg-blue-950/20', heading: 'text-blue-700 dark:text-blue-300', text: 'text-blue-600 dark:text-blue-400' } },
              { label: 'Threats', items: swot.threats, styles: { bg: 'bg-purple-50 dark:bg-purple-950/20', heading: 'text-purple-700 dark:text-purple-300', text: 'text-purple-600 dark:text-purple-400' } },
            ].map(({ label, items, styles }) => (
              <div key={label}
                className={`p-3 rounded-lg ${styles.bg}`}>
                <p className={`text-xs font-semibold ${styles.heading} mb-2`}>{label}</p>
                <ul className="space-y-1">
                  {(items ?? []).slice(0, 3).map((item, i) => (
                    <li key={i}
                      className={`text-xs ${styles.text}`}>
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
