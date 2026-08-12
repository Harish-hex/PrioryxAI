import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: { connectionId?: string, action?: 'accept' | 'reject' }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { connectionId, action } = body

    if (!connectionId || !action) {
      return NextResponse.json({ error: 'Missing connectionId or action' }, { status: 400 })
    }

    // First check if the connection exists and belongs to this user (as receiver)
    const { data: conn, error: fetchErr } = await supabase
      .from('peer_connections')
      .select('id, receiver_id, status')
      .eq('id', connectionId)
      .single()

    if (fetchErr || !conn) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    if (conn.receiver_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to modify this connection' }, { status: 403 })
    }

    if (conn.status !== 'pending') {
      return NextResponse.json({ error: 'Connection is not pending' }, { status: 400 })
    }

    if (action === 'accept') {
      const { error: updateErr } = await supabase
        .from('peer_connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId)

      if (updateErr) {
        console.error('[Collab Respond] Update error:', updateErr)
        return NextResponse.json({ error: 'Failed to accept connection' }, { status: 500 })
      }
      
      return NextResponse.json({ success: true, message: 'Connection accepted!' })
    } else if (action === 'reject') {
      const { error: delErr } = await supabase
        .from('peer_connections')
        .delete()
        .eq('id', connectionId)

      if (delErr) {
        console.error('[Collab Respond] Delete error:', delErr)
        return NextResponse.json({ error: 'Failed to reject connection' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Connection rejected.' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('[Collab Respond] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
