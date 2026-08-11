const pdfParse = require('pdf-parse');
import mammoth from 'mammoth'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export type FileProcessResult = {
  method: 'text_extraction' | 'vision_pdf' | 'vision_image' | 'docx_text'
  rawText: string          // extracted text (empty string if vision-only)
  base64?: string          // only set for vision path
  mimeType?: string        // only set for vision path
  pageCount?: number       // for PDFs
  success: boolean
  error?: string
}

/**
 * Step 1: Read the file and extract its content.
 * Returns rawText for text-based files, or base64+mimeType for images/scanned PDFs.
 * Never throws — always returns a result object.
 */
export async function readFile(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<FileProcessResult> {

  console.log(`[FileProcessor] Reading file: ${filename}, type: ${mimeType}, size: ${buffer.length} bytes`)

  // ── IMAGE FILES (jpeg, png, webp, gif) ───────────────────────
  if (mimeType.startsWith('image/')) {
    console.log('[FileProcessor] Path: image → vision')
    const base64 = buffer.toString('base64')
    return {
      method: 'vision_image',
      rawText: '',
      base64,
      mimeType,
      success: true
    }
  }

  // ── WORD DOCUMENTS (.docx) ────────────────────────────────────
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      || filename.endsWith('.docx')) {
    console.log('[FileProcessor] Path: docx → mammoth text extraction')
    try {
      const result = await mammoth.extractRawText({ buffer })
      const text = result.value.trim()
      console.log(`[FileProcessor] DOCX extracted: ${text.length} chars`)
      if (text.length < 50) {
        return {
          method: 'docx_text',
          rawText: '',
          success: false,
          error: 'Word document appears empty or unreadable'
        }
      }
      return { method: 'docx_text', rawText: text, success: true }
    } catch (e) {
      console.error('[FileProcessor] mammoth error:', e)
      return {
        method: 'docx_text',
        rawText: '',
        success: false,
        error: `Could not read Word document: ${String(e)}`
      }
    }
  }

  // ── PDF FILES ─────────────────────────────────────────────────
  if (mimeType === 'application/pdf' || filename.endsWith('.pdf')) {
    
    // LAYER 1: Try text extraction with pdf-parse
    console.log('[FileProcessor] PDF Layer 1: trying pdf-parse text extraction')
    try {
      const parsed = await pdfParse(buffer, {
        // Disable font loading (causes errors in some envs)
        max: 5  // max 5 pages to keep it fast
      })
      const text = parsed.text?.trim() ?? ''
      const pageCount = parsed.numpages ?? 1
      
      console.log(`[FileProcessor] pdf-parse result: ${text.length} chars, ${pageCount} pages`)
      
      if (text.length >= 100) {
        // Good — text-based PDF
        console.log('[FileProcessor] PDF Layer 1 SUCCESS: sufficient text extracted')
        return {
          method: 'text_extraction',
          rawText: text,
          pageCount,
          success: true
        }
      }
      
      // Text too short — likely scanned PDF
      console.log(`[FileProcessor] PDF Layer 1: text too short (${text.length} chars), falling back to vision`)
    } catch (e) {
      // pdf-parse can throw on encrypted or malformed PDFs
      console.warn('[FileProcessor] pdf-parse threw:', String(e))
      console.log('[FileProcessor] Falling back to vision layer')
    }

    // LAYER 2: Send raw PDF as base64 to GPT-4o vision
    // GPT-4o natively reads PDFs — no canvas, no image conversion needed
    console.log('[FileProcessor] PDF Layer 2: sending PDF directly to GPT-4o vision')
    const base64 = buffer.toString('base64')
    return {
      method: 'vision_pdf',
      rawText: '',
      base64,
      mimeType: 'application/pdf',
      success: true
    }
  }

  // ── UNSUPPORTED FILE TYPE ─────────────────────────────────────
  return {
    method: 'text_extraction',
    rawText: '',
    success: false,
    error: `Unsupported file type: ${mimeType}. Please upload PDF, Word doc, JPG, or PNG.`
  }
}

/**
 * Step 2: Send extracted content to OpenAI for analysis.
 * Handles both text and vision paths transparently.
 */
export async function extractWithAI(
  fileResult: FileProcessResult,
  systemPrompt: string,
  userPromptPrefix: string,
  maxTokens: number = 2000
): Promise<{ success: boolean; content: string; error?: string }> {

  console.log(`[FileProcessor] AI extraction via method: ${fileResult.method}`)

  try {
    let response: OpenAI.Chat.ChatCompletion

    if (fileResult.method === 'text_extraction' || fileResult.method === 'docx_text') {
      // TEXT PATH: send extracted text as a message
      response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `${userPromptPrefix}\n\n${fileResult.rawText.slice(0, 12000)}`
          }
        ]
      })
    } else {
      // VISION PATH: send image or PDF as base64
      // Works for: vision_image, vision_pdf
      const imageUrl = fileResult.method === 'vision_pdf'
        ? `data:application/pdf;base64,${fileResult.base64}`
        : `data:${fileResult.mimeType};base64,${fileResult.base64}`

      response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: maxTokens,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `${systemPrompt}\n\n${userPromptPrefix}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high'  // use high detail for documents
                }
              }
            ]
          }
        ]
      })
    }

    const rawContent = response.choices[0]?.message?.content ?? ''
    console.log(`[FileProcessor] AI response length: ${rawContent.length} chars`)
    console.log(`[FileProcessor] AI response preview: ${rawContent.slice(0, 200)}`)

    if (!rawContent) {
      return { success: false, content: '', error: 'AI returned empty response' }
    }

    return { success: true, content: rawContent }

  } catch (e) {
    console.error('[FileProcessor] OpenAI call failed:', e)
    return {
      success: false,
      content: '',
      error: `AI analysis failed: ${String(e)}`
    }
  }
}

/**
 * Step 3: Parse JSON from AI response.
 * Handles responses wrapped in markdown code blocks.
 */
export function parseAIJson<T>(rawContent: string): { success: boolean; data?: T; error?: string } {
  // Try direct parse
  try {
    const data = JSON.parse(rawContent) as T
    return { success: true, data }
  } catch {
    // Strip markdown code fences
    const stripped = rawContent
      .replace(/^```json\s*/m, '')
      .replace(/^```\s*/m, '')
      .replace(/```\s*$/m, '')
      .trim()

    try {
      const data = JSON.parse(stripped) as T
      return { success: true, data }
    } catch {
      // Try to find JSON object/array in the response
      const jsonMatch = rawContent.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)?.[0]
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch) as T
          return { success: true, data }
        } catch {
          // fall through
        }
      }

      console.error('[FileProcessor] JSON parse failed. Raw content:', rawContent.slice(0, 500))
      return {
        success: false,
        error: 'AI response was not valid JSON. Raw: ' + rawContent.slice(0, 200)
      }
    }
  }
}

/**
 * Helper: parse multipart form data and return file buffer + metadata.
 * Handles the formData() crash safely.
 */
export async function parseUploadedFile(req: Request): Promise<{
  buffer: Buffer
  mimeType: string
  filename: string
  error?: string
} | { error: string }> {
  
  let formData: FormData
  try {
    formData = await req.formData()
  } catch (e) {
    console.error('[FileProcessor] formData() failed:', e)
    return { error: 'Could not parse uploaded file. Make sure you are sending multipart/form-data.' }
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return { error: 'No file field found in form data. Expected field name: "file"' }
  }

  console.log(`[FileProcessor] Received file: ${file.name}, size: ${file.size}, type: ${file.type}`)

  // File size check (4.5MB max for Vercel Serverless Functions)
  if (file.size > 4.5 * 1024 * 1024) {
    return { error: 'File too large. Maximum size is 4.5MB.' }
  }

  // Validate file type
  const allowed = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'
  ]
  const mimeType = file.type || 'application/octet-stream'
  
  // Also check extension if MIME type is wrong
  const ext = file.name.split('.').pop()?.toLowerCase()
  const validExt = ['pdf', 'docx', 'jpg', 'jpeg', 'png', 'webp', 'gif']
  
  if (!allowed.includes(mimeType) && !validExt.includes(ext ?? '')) {
    return { error: `Invalid file type: ${mimeType}. Allowed: PDF, DOCX, JPG, PNG, WEBP` }
  }

  // Determine correct MIME type from extension if browser sent wrong type
  const correctedMime = mimeType !== 'application/octet-stream'
    ? mimeType
    : ext === 'pdf' ? 'application/pdf'
    : ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
    : ext === 'png' ? 'image/png'
    : mimeType

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return {
    buffer,
    mimeType: correctedMime,
    filename: file.name
  }
}
