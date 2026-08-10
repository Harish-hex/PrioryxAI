// Job Applications API Route
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: applications } = await supabase
    .from('job_applications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ applications: applications ?? [] });
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    id: string;
    status: string;
    notes?: string;
  };

  const updates: Record<string, unknown> = { status: body.status };
  if (body.status === 'applied') updates.applied_at = new Date().toISOString();
  if (body.notes) updates.notes = body.notes;

  const { error } = await supabase
    .from('job_applications')
    .update(updates)
    .eq('id', body.id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
