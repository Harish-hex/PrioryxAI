import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

// Manual Pro activation — break-glass endpoint for payments where auto-activation failed.
// Protected by ADMIN_SECRET header. Never exposed in UI.
//
// Usage:
//   curl -X POST https://your-domain.com/api/admin/activate-pro \
//     -H "x-admin-token: YOUR_ADMIN_SECRET" \
//     -H "Content-Type: application/json" \
//     -d '{"email": "user@example.com"}'
//
// Optional: pass "days" to override the 30-day default.
//   -d '{"email": "user@example.com", "days": 30}'

export async function POST(request: NextRequest) {

const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    console.error('[admin/activate-pro] ADMIN_SECRET env var not set');
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const token = request.headers.get('x-admin-token');
  if (!token) {
    console.warn('[admin/activate-pro] Unauthorized attempt — missing token');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Constant-time comparison to prevent timing attacks
  const tokenBuf = Buffer.from(token);
  const secretBuf = Buffer.from(adminSecret);
  let valid = false;
  try {
    valid = tokenBuf.length === secretBuf.length && crypto.timingSafeEqual(tokenBuf, secretBuf);
  } catch {
    valid = false;
  }
  if (!valid) {
    console.warn('[admin/activate-pro] Unauthorized attempt — bad token');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email: string | undefined = body?.email;
  const days: number = typeof body?.days === 'number' && body.days > 0 ? body.days : 30;

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid "email" field' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const supabase = createServiceClient();

  // Look up user by email
  const { data: user, error: lookupError } = await supabase
    .from('users')
    .select('id, email, pro_status, pro_expires_at')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (lookupError) {
    console.error('[admin/activate-pro] DB lookup error:', lookupError.message);
    return NextResponse.json({ error: 'DB lookup failed', detail: lookupError.message }, { status: 500 });
  }

  if (!user?.id) {
    console.warn(`[admin/activate-pro] No user found for email: ${normalizedEmail}`);
    return NextResponse.json({ error: 'No user found for that email', email: normalizedEmail }, { status: 404 });
  }

  const proExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  const { error: updateError } = await supabase
    .from('users')
    .update({ pro_status: true, pro_expires_at: proExpiresAt })
    .eq('id', user.id);

  if (updateError) {
    console.error('[admin/activate-pro] DB update failed for user', user.id, ':', updateError.message);
    return NextResponse.json({ error: 'DB update failed', detail: updateError.message }, { status: 500 });
  }

  console.log(`[admin/activate-pro] Pro manually activated — user ${user.id} (${normalizedEmail}), ${days} days, expires ${proExpiresAt}`);

  return NextResponse.json({
    activated: true,
    user_id: user.id,
    email: normalizedEmail,
    pro_expires_at: proExpiresAt,
    days,
    was_already_pro: user.pro_status,
    previous_expires_at: user.pro_expires_at,
  });
}
