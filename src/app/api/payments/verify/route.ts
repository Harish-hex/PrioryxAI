import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

// Verify Razorpay payment link redirect signature:
// HMAC-SHA256(payment_link_id|reference_id|status|payment_id, key_secret)
function verifyRedirectSignature(
  paymentLinkId: string,
  referenceId: string,
  status: string,
  paymentId: string,
  signature: string,
): boolean {
  const message = `${paymentLinkId}|${referenceId}|${status}|${paymentId}`;
  console.log('[payments/verify] constructing signature for message:', message);
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(message)
    .digest('hex');
  console.log('[payments/verify] signature lengths — received:', signature.length, 'expected:', expected.length);
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch (e) {
    console.error('[payments/verify] timingSafeEqual threw (likely length mismatch):', (e as Error).message);
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    console.error('[payments/verify] RAZORPAY_KEY_SECRET not set — cannot verify redirect signature');
    return NextResponse.json({ error: 'Payment verification not configured', code: 'no_secret' }, { status: 503 });
  }

  // Caller must be authenticated
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user) {
    console.error('[payments/verify] No authenticated user — authError:', authError?.message);
    return NextResponse.json({ error: 'Unauthorized', code: 'no_session' }, { status: 401 });
  }

  console.log('[payments/verify] verifying payment for user:', user.id, 'email:', user.email);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'bad_json' }, { status: 400 });
  }

  const {
    razorpay_payment_id: paymentId,
    razorpay_payment_link_id: paymentLinkId,
    razorpay_payment_link_reference_id: referenceId,
    razorpay_payment_link_status: status,
    razorpay_signature: signature,
  } = body;

  const missing = ['razorpay_payment_id', 'razorpay_payment_link_id', 'razorpay_payment_link_reference_id', 'razorpay_payment_link_status', 'razorpay_signature']
    .filter(k => !body[k]);

  if (missing.length) {
    console.error('[payments/verify] Missing params:', missing.join(', '));
    return NextResponse.json({ error: 'Missing payment params', code: 'missing_params', missing }, { status: 400 });
  }

  if (status !== 'paid') {
    console.warn('[payments/verify] Payment status is not "paid":', status);
    return NextResponse.json({ error: 'Payment not completed', code: 'not_paid', status }, { status: 400 });
  }

  const valid = verifyRedirectSignature(paymentLinkId, referenceId, status, paymentId, signature);
  if (!valid) {
    console.error('[payments/verify] Signature mismatch — payment:', paymentId, 'link:', paymentLinkId);
    return NextResponse.json({ error: 'Invalid signature', code: 'signature_mismatch' }, { status: 401 });
  }

  // Signature is valid — activate Pro for 30 days
  const proExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const service = createServiceClient();
  const { error: dbError } = await service
    .from('users')
    .update({ pro_status: true, pro_expires_at: proExpiresAt })
    .eq('id', user.id);

  if (dbError) {
    console.error('[payments/verify] DB update failed for user', user.id, ':', dbError.message, dbError.code);
    return NextResponse.json({ error: 'Activation failed', code: 'db_error' }, { status: 500 });
  }

  console.log(`[payments/verify] Pro activated — user ${user.id} (${user.email}), payment ${paymentId}, expires ${proExpiresAt}`);
  return NextResponse.json({ activated: true });
}
