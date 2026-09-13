/**
 * Vercel-safe PDF/DOCX text extractors.
 *
 * pdf-parse v2 is ESM-first and exposes a `PDFParse` class — there is no
 * default export and no `lib/pdf-parse.js` entrypoint (both were v1 only).
 * Calling the v1 API silently yields `undefined`, which is why every PDF
 * used to fall through to the vision path.
 *
 * Both helpers are non-throwing: an empty string signals the caller to fall
 * back to GPT-4o vision.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  let parser: { getText: () => Promise<unknown>; destroy: () => Promise<void> } | null = null
  try {
    const { PDFParse } = await import('pdf-parse')

    parser = new PDFParse({ data: new Uint8Array(buffer) }) as any
    const result: any = await parser!.getText()

    // v2 returns { text, total, pages } — older shapes only had `text`.
    const text: string =
      typeof result === 'string'
        ? result
        : result?.text ??
          (Array.isArray(result?.pages)
            ? result.pages.map((p: any) => p?.text ?? '').join('\n')
            : '')

    // v2 injects "-- 3 of 12 --" separators between pages; strip so they
    // don't end up as noise in the extraction prompt.
    return text.replace(/^\s*--\s*\d+\s+of\s+\d+\s*--\s*$/gm, '').trim()
  } catch (e) {
    console.warn('[PDF Parser] pdf-parse failed, will use vision fallback:', String(e))
    return '' // triggers GPT-4o vision path
  } finally {
    // v2 holds onto a worker; not destroying it leaks across warm invocations.
    try {
      await parser?.destroy()
    } catch {}
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
