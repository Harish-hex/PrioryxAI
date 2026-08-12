/**
 * Vercel-safe PDF text extractor.
 * Uses dynamic import to avoid bundling issues.
 * Falls back to empty string (triggers vision fallback).
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import prevents Vercel from failing at build time
    // if pdf-parse has native dependencies
    const pdfParse = (await import('pdf-parse')).default

    const result = await pdfParse(buffer, {
      // Disable test file warnings
      max: 10,
    })

    return result.text?.trim() ?? ''
  } catch (e) {
    console.warn('[PDF Parser] pdf-parse failed, will use vision fallback:', String(e))
    return ''  // triggers GPT-4o vision path
  }
}

/**
 * Vercel-safe DOCX text extractor.
 */
export async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value?.trim() ?? ''
  } catch (e) {
    console.warn('[DOCX Parser] mammoth failed:', String(e))
    return ''
  }
}
