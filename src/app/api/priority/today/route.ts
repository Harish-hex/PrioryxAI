import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient, getAuthUser } from '@/lib/supabase-server'
import { runPriorityOrchestrator } from '@/lib/priority/orchestrator'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const force = true // Temporarily force true so F5 works

  const db = createServiceRoleClient()

  try {
    const result = await runPriorityOrchestrator(db, user.id, force)
    return NextResponse.json(result)
  } catch (e) {
    console.error('[Priority Today API] Error:', e)
    return NextResponse.json(
      { error: 'Failed to generate plan', tasks: [], plan: null, fromCache: false },
      { status: 500 }
    )
  }
}
