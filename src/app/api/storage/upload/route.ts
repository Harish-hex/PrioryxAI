import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, createClient } from '@/lib/supabase/server';

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const path = formData.get('path') as string;

    if (!file || !bucket || !path) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure the path starts with the user's ID for security
    if (!path.startsWith(user.id + '/')) {
      return NextResponse.json({ error: 'Invalid upload path' }, { status: 403 });
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
        contentType: file.type || 'application/octet-stream',
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
