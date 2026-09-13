import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, createClient } from '@/lib/supabase/server';

export const maxDuration = 60

// This route uploads via the service-role client specifically to bypass RLS,
// so `bucket` must never be taken as an unchecked client-supplied value —
// only the bucket(s) real upload flows in this app actually target.
const ALLOWED_BUCKETS = ['schedules'];
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];
const MAX_FILE_BYTES = 10 * 1024 * 1024; // matches the "up to 10 MB" the UI already promises

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData: any = await req.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const path = formData.get('path') as string;

    if (!file || !bucket || !path) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json({ error: 'Invalid upload destination' }, { status: 403 });
    }

    // Ensure the path starts with the user's ID for security
    if (!path.startsWith(user.id + '/')) {
      return NextResponse.json({ error: 'Invalid upload path' }, { status: 403 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 413 });
    }

    const mimeType = file.type || 'application/octet-stream';
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExt = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'pdf', 'doc', 'docx', 'txt'];
    if (!ALLOWED_MIME_TYPES.includes(mimeType) && !validExt.includes(ext ?? '')) {
      return NextResponse.json({ error: `Invalid file type: ${mimeType}` }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload using service client to bypass RLS
    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient.storage
      .from(bucket)
      .upload(path, buffer, {
        upsert: true,
        contentType: mimeType,
      });

    if (error) {
      console.error('[storage/upload] Upload error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[storage/upload] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
