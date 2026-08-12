import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 20

export const runtime = 'nodejs';

export async function POST() {
  const supabase = createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}
