/**
 * MCP Token API — Phase 6
 *
 * POST /api/mcp/token — generate a new MCP API token for the authenticated user
 * GET  /api/mcp/token — check if a token exists (returns masked token)
 * DELETE /api/mcp/token — revoke the token
 *
 * DB: mcp_tokens(id, user_id, token_hash, created_at, revoked)
 * Tokens are currently stored plaintext (for MVP). Production: hash with SHA-256.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createServiceClient();
  const { data: tokenRow } = await admin
    .from('mcp_tokens')
    .select('token_hash, created_at, revoked')
    .eq('user_id', user.id)
    .eq('revoked', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!tokenRow) {
    return NextResponse.json({ hasToken: false });
  }

  // Return masked token — never expose full plaintext
  const masked = tokenRow.token_hash.slice(0, 8) + '••••••••••••••••';
  return NextResponse.json({
    hasToken: true,
    maskedToken: masked,
    createdAt: tokenRow.created_at,
  });
}

export async function POST(_request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createServiceClient();

  // Revoke any existing active tokens before generating a new one
  await admin
    .from('mcp_tokens')
    .update({ revoked: true })
    .eq('user_id', user.id)
    .eq('revoked', false);

  // Generate a new secure token: pryx_ prefix + 32 random bytes hex
  const token = `pryx_${randomBytes(32).toString('hex')}`;

  const { error } = await admin.from('mcp_tokens').insert({
    user_id: user.id,
    token_hash: token, // MVP: store plaintext. TODO: hash with SHA-256 before storing
    revoked: false,
  });

  if (error) {
    console.error('[MCPToken] Insert error:', error.message);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }

  // Return full token once — user must copy it
  return NextResponse.json({
    token,
    note: 'Copy this token — it will not be shown again. Use as: Authorization: Bearer <token>',
    endpoint: '/api/mcp',
    docs: 'Send POST to /api/mcp with Authorization: Bearer <token> and JSON-RPC 2.0 body',
  });
}

export async function DELETE() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createServiceClient();
  await admin
    .from('mcp_tokens')
    .update({ revoked: true })
    .eq('user_id', user.id);

  return NextResponse.json({ revoked: true });
}
