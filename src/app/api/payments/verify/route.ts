import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

function verifyRedirectSignature(
  paymentLinkId: string,
  referenceId: string,
  status: string,
  paymentId: string,
  signature: string,
  secret: string,
): boolean {
  const message = `${paymentLinkId}|${referenceId}|${status}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  // Caller must be authenticated — the logged-in session is our trust anchor
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user) {
    console.error('[payments/verify] No authenticated user:', authError?.message);
    return NextResponse.json({ error: 'Unauthorized', code: 'no_session' }, { status: 401 });
  }

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

  // Must have at minimum a payment ID to prove a transaction happened
  if (!paymentId) {
    console.error('[payments/verify] No payment ID in body');
    return NextResponse.json({ error: 'Missing payment ID', code: 'missing_params' }, { status: 400 });
  }

  // status may be null when using a static payment link (Razorpay doesn't always include it).
  // We treat null as paid since: (1) user is authenticated, (2) we have a real payment_id.
  if (status !== null && status !== undefined && status !== 'paid') {
    console.warn('[payments/verify] Payment status is not "paid":', status);
    return NextResponse.json({ error: 'Payment not completed', code: 'not_paid', status }, { status: 400 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const hasRealSecret = keySecret && keySecret !== 'YOUR_SECRET' && keySecret.length > 10;

  if (hasRealSecret && signature && paymentLinkId && referenceId) {
    // Full signature verification when keys are configured
    const valid = verifyRedirectSignature(paymentLinkId, referenceId, status, paymentId, signature, keySecret);
    if (!valid) {
      console.error('[payments/verify] Signature mismatch — payment:', paymentId);
      return NextResponse.json({ error: 'Invalid signature', code: 'signature_mismatch' }, { status: 401 });
    }
    console.log('[payments/verify] Signature verified for payment:', paymentId);
  } else {
    // No real secret configured — MUST verify payment with Razorpay API
    // We cannot trust session alone (security hole: fake payment_id = free Pro)
    if (!keySecret || keySecret === 'YOUR_SECRET' || keySecret.length <= 10) {
      console.error('[payments/verify] RAZORPAY_KEY_SECRET not configured — cannot verify payment. Set RAZORPAY_KEY_SECRET in env.');
      return NextResponse.json({
        error: 'Payment verification not configured. Contact support.',
        code: 'verification_not_configured'
      }, { status: 503 });
    }

    // Verify payment with Razorpay API using key_secret
    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: keySecret,
    });

    try {
      const payment = await razorpay.payments.fetch(paymentId);
      if (payment.status !== 'captured' && payment.status !== 'authorized') {
        console.error('[payments/verify] Payment not captured — status:', payment.status, 'payment:', paymentId);
        return NextResponse.json({ error: 'Payment not completed', code: 'not_captured', status: payment.status }, { status: 400 });
      }
      // Verify payment link ID matches if provided
      const paymentLinkIdFromApi = (payment as any).payment_link_id;
      if (paymentLinkId && paymentLinkIdFromApi !== paymentLinkId) {
        console.error('[payments/verify] Payment link mismatch — expected:', paymentLinkId, 'got:', paymentLinkIdFromApi);
        return NextResponse.json({ error: 'Payment link mismatch', code: 'link_mismatch' }, { status: 400 });
      }
      console.log('[payments/verify] Payment verified via Razorpay API for payment:', paymentId);
    } catch (err: any) {
      console.error('[payments/verify] Razorpay API error:', err.message);
      return NextResponse.json({ error: 'Payment verification failed', code: 'api_error' }, { status: 502 });
    }
  }

  // Activate Pro for 30 days
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
