import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('schedule_exams')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: true })

  return NextResponse.json({
    entries: data ?? [],
    institution: data?.[0]?.institution ?? null,
    semester: data?.[0]?.semester ?? null
  })
}
