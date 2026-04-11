import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyRazorpaySignature } from '@/lib/security';

export const runtime = 'nodejs';

// Razorpay sends payment events here — update pro_status on confirmed payment
export async function POST(request: NextRequest) {
  const sig = request.headers.get('x-razorpay-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const body = await request.text();

  // Verify HMAC signature before trusting any payload data
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
  const subscription = event?.payload?.subscription?.entity;
  const subscriptionId: string | undefined = subscription?.id;

  if (!subscriptionId) {
    // Unknown event shape — ack and move on
    return NextResponse.json({ received: true });
  }

  if (eventType === 'subscription.activated' || eventType === 'subscription.charged') {
    // Fetch user from subscriptions table
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('razorpay_subscription_id', subscriptionId)
      .single();

    if (sub?.user_id) {
      const expiresAt = subscription?.current_end
        ? new Date(subscription.current_end * 1000).toISOString()
        : null;

      await Promise.all([
        supabase
          .from('users')
          .update({ pro_status: true, pro_expires_at: expiresAt })
          .eq('id', sub.user_id),

        supabase
          .from('subscriptions')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('razorpay_subscription_id', subscriptionId),
      ]);
    }
  } else if (
    eventType === 'subscription.cancelled' ||
    eventType === 'subscription.expired' ||
    eventType === 'subscription.halted'
  ) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('razorpay_subscription_id', subscriptionId)
      .single();

    if (sub?.user_id) {
      await Promise.all([
        supabase
          .from('users')
          .update({ pro_status: false })
          .eq('id', sub.user_id),

        supabase
          .from('subscriptions')
          .update({ status: eventType.replace('subscription.', ''), updated_at: new Date().toISOString() })
          .eq('razorpay_subscription_id', subscriptionId),
      ]);
    }
  }

  return NextResponse.json({ received: true });
}
