import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyRazorpaySignature } from '@/lib/security';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const sig = request.headers.get('x-razorpay-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.error('[webhook/razorpay] RAZORPAY_WEBHOOK_SECRET env var is not set — cannot verify webhook');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const body = await request.text();

  let isValid = false;
  try {
    isValid = verifyRazorpaySignature(body, sig);
  } catch {
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
  }

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const eventType: string = event?.event ?? '';
  console.log('[webhook/razorpay] event:', eventType);

  // ── Subscription flow (POST /api/payments/subscribe) ─────────────────────
  // user_id is embedded in subscription notes at creation time, so we never
  // need to guess from email alone.
  if (eventType === 'subscription.activated' || eventType === 'subscription.charged') {
    const sub = event?.payload?.subscription?.entity;
    const payment = event?.payload?.payment?.entity;

    const userId: string | undefined = sub?.notes?.user_id;
    const subscriptionId: string | undefined = sub?.id;
    // Razorpay stores cycle end as a Unix timestamp
    const currentEnd: number | undefined = sub?.current_end;

    let resolvedUserId = userId;

    // Fallback: look up by email if notes are absent
    if (!resolvedUserId) {
      const email: string | undefined = sub?.notes?.email ?? payment?.email;
      if (email) {
        const { data: u } = await supabase
          .from('users')
          .select('id')
          .eq('email', email.toLowerCase().trim())
          .maybeSingle();
        resolvedUserId = u?.id;
      }
    }

    if (!resolvedUserId) {
      console.error('[webhook/razorpay] subscription event — could not resolve user. sub:', subscriptionId);
      return NextResponse.json({ received: true });
    }

    const proExpiresAt = currentEnd
      ? new Date(currentEnd * 1000).toISOString()
      : new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString();

    const { error: updateErr } = await supabase
      .from('users')
      .update({ pro_status: true, pro_expires_at: proExpiresAt })
      .eq('id', resolvedUserId);

    if (updateErr) {
      console.error('[webhook/razorpay] Failed to activate Pro:', updateErr);
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
    }

    if (subscriptionId) {
      await supabase
        .from('subscriptions')
        .update({
          status: eventType === 'subscription.activated' ? 'active' : 'charged',
          current_period_end: proExpiresAt,
        })
        .eq('razorpay_subscription_id', subscriptionId);
    }

    console.log(`[webhook/razorpay] Pro activated — user ${resolvedUserId}, expires ${proExpiresAt}`);
    return NextResponse.json({ received: true });
  }

  // ── Subscription cancellation / completion ────────────────────────────────
  if (eventType === 'subscription.cancelled' || eventType === 'subscription.completed') {
    const sub = event?.payload?.subscription?.entity;
    const userId: string | undefined = sub?.notes?.user_id;
    const subscriptionId: string | undefined = sub?.id;

    if (userId) {
      await supabase
        .from('users')
        .update({ pro_status: false, pro_expires_at: new Date().toISOString() })
        .eq('id', userId);

      if (subscriptionId) {
        await supabase
          .from('subscriptions')
          .update({ status: eventType === 'subscription.cancelled' ? 'cancelled' : 'completed' })
          .eq('razorpay_subscription_id', subscriptionId);
      }

      console.log(`[webhook/razorpay] Pro revoked — user ${userId}, event ${eventType}`);
    }

    return NextResponse.json({ received: true });
  }

  // ── Payment Link flow (static NEXT_PUBLIC_RAZORPAY_PAYMENT_LINK) ──────────
  // Kept as fallback for any existing payment link purchases.
  if (eventType === 'payment_link.paid') {
    const payment = event?.payload?.payment?.entity;
    const paymentLink = event?.payload?.payment_link?.entity;
    const email: string | undefined = payment?.email ?? paymentLink?.customer?.email;
    const paymentId: string | undefined = payment?.id;

    if (!email) {
      console.error('[webhook/razorpay] payment_link.paid — missing email');
      return NextResponse.json({ received: true });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!user?.id) {
      console.warn(`[webhook/razorpay] payment_link.paid — no user for email ${normalizedEmail}`);
      return NextResponse.json({ received: true });
    }

    const proExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error: updateError } = await supabase
      .from('users')
      .update({ pro_status: true, pro_expires_at: proExpiresAt })
      .eq('id', user.id);

    if (updateError) {
      console.error('[webhook/razorpay] Failed to activate Pro:', updateError);
      return NextResponse.json({ received: true });
    }

    console.log(`[webhook/razorpay] Pro activated via payment link — ${normalizedEmail} (${paymentId})`);
    return NextResponse.json({ received: true });
  }

  console.log('[webhook/razorpay] unhandled event type:', eventType);
  return NextResponse.json({ received: true });
}
