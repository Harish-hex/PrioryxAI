import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const maxDuration = 60;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
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
  const base64 = Buffer.from(arrayBuffer).toString('base64');

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

  console.log('[resume/process] Sending to GPT-4o vision, mime:', mimeType, 'size:', arrayBuffer.byteLength);

  // Send to OpenAI GPT-4o vision for extraction
  let parsedData: any = null;
  try {
    const result = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
                detail: 'high',
              },
            },
            {
              type: 'text',
              text: `Extract ALL data from this resume as JSON. Return ONLY valid JSON with no markdown, no code fences.

Schema:
{
  "name": string,
  "email": string,
  "phone": string,
  "linkedin": string,
  "github": string,
  "skills": string[],
  "languages": string[],
  "projects": [{ "name": string, "tech": string[], "description": string }],
  "experience": [{ "company": string, "role": string, "duration": string, "points": string[] }],
  "education": [{ "degree": string, "institution": string, "year": string, "gpa": string }],
  "certifications": string[],
  "achievements": string[]
}

Extract EVERY skill, language, and technology you can find. Be thorough.`,
            },
          ],
        },
      ],
      max_tokens: 3000,
    });

    const rawContent = result.choices[0]?.message?.content ?? '';
    console.log('[resume/process] GPT-4o response length:', rawContent.length);

    // Parse JSON — strip markdown fences if present
    const cleaned = rawContent
      .replace(/^```json\s*/m, '')
      .replace(/^```\s*/m, '')
      .replace(/```\s*$/m, '')
      .trim();

    try {
      parsedData = JSON.parse(cleaned);
    } catch {
      // Try to find JSON object in response
      const jsonMatch = rawContent.match(/(\{[\s\S]*\})/)?.[0];
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch);
      } else {
        console.error('[resume/process] Failed to parse JSON:', rawContent.slice(0, 300));
        return NextResponse.json({ error: 'AI could not parse the resume. Try a clearer PDF or image.' }, { status: 422 });
      }
    }
  } catch (aiErr: any) {
    console.error('[resume/process] OpenAI error:', aiErr);
    return NextResponse.json({ error: 'AI extraction failed: ' + (aiErr.message ?? 'unknown') }, { status: 500 });
  }

  console.log('[resume/process] Extracted skills:', parsedData?.skills?.length ?? 0);

  // Upsert to user_resumes — conflict on user_id to always update
  const { error: upsertError } = await serviceClient
    .from('user_resumes')
    .upsert(
      {
        user_id: user.id,
        storage_path: storagePath,
        extracted_data: parsedData,
        // Also populate parsed_data for backwards compat with existing code
        parsed_data: parsedData,
        // Populate skill_entities for any code that reads that column
        skill_entities: { skills: parsedData?.skills ?? [] },
        uploaded_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (upsertError) {
    console.error('[resume/process] DB upsert error:', upsertError);
    // Don't fail — return data even if save fails
  }

  // Also mark resume_uploaded on the users table
  await serviceClient
    .from('users')
    .update({ resume_uploaded: true })
    .eq('id', user.id)
    .then(res => res, () => {});

  console.log('[resume/process] Success for user:', user.id);

  return NextResponse.json({
    success: true,
    extractedData: parsedData,
    skillsCount: parsedData?.skills?.length ?? 0,
    message: `Resume processed: ${parsedData?.skills?.length ?? 0} skills extracted`,
  });
}
