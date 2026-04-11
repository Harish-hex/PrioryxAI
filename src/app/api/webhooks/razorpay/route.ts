import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyRazorpaySignature } from '@/lib/security';

export const runtime = 'nodejs';

// Razorpay Subscription webhook handler
// Activates pro_status when subscription.activated or subscription.charged events are received
export async function POST(request: NextRequest) {
  const sig = request.headers.get('x-razorpay-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
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

  const eventType: string = event?.event ?? '';
  console.log('[webhooks/razorpay] Received event:', eventType);

  // Handle subscription activation (first payment) and recurring charges
  if (eventType === 'subscription.activated' || eventType === 'subscription.charged') {
    const subscriptionEntity = event?.payload?.subscription?.entity;
    const paymentEntity = event?.payload?.payment?.entity;

    // Extract user info from subscription notes (set during subscription creation)
    // Fall back to payment entity email if notes are missing
    const userId: string | undefined = subscriptionEntity?.notes?.user_id;
    const emailFromNotes: string | undefined = subscriptionEntity?.notes?.email;
    const emailFromPayment: string | undefined = paymentEntity?.email;
    const email = emailFromNotes ?? emailFromPayment;
    const subscriptionId: string | undefined = subscriptionEntity?.id;
    const currentPeriodEnd: number | undefined = subscriptionEntity?.current_end;

    const supabase = createServiceClient();

    let resolvedUserId: string | undefined = userId;

    // If we don't have userId from notes, look up by email
    if (!resolvedUserId && email) {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
      resolvedUserId = userData?.id;
    }

    if (!resolvedUserId) {
      console.error('[webhooks/razorpay] Could not resolve user for event. email:', email, 'userId:', userId);
      return NextResponse.json({ received: true });
    }

    // Calculate expiry: use Razorpay's current_end timestamp or default to 32 days from now
    const proExpiresAt = currentPeriodEnd
      ? new Date(currentPeriodEnd * 1000).toISOString()
      : new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString();

    // Activate pro status for the user
    const { error: updateError } = await supabase
      .from('users')
      .update({ pro_status: true, pro_expires_at: proExpiresAt })
      .eq('id', resolvedUserId);

    if (updateError) {
      console.error('[webhooks/razorpay] Failed to update pro_status:', updateError);
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
    }

    // Update subscription record status
    if (subscriptionId) {
      await supabase
        .from('subscriptions')
        .update({
          status: eventType === 'subscription.activated' ? 'active' : 'charged',
          current_period_end: proExpiresAt,
        })
        .eq('razorpay_subscription_id', subscriptionId);
    }

    console.log('[webhooks/razorpay] Pro activated for user:', resolvedUserId, 'expires:', proExpiresAt);
  } else if (eventType === 'subscription.cancelled' || eventType === 'subscription.completed') {
    // Handle cancellation/completion — revoke pro status
    const subscriptionEntity = event?.payload?.subscription?.entity;
    const userId: string | undefined = subscriptionEntity?.notes?.user_id;
    const subscriptionId: string | undefined = subscriptionEntity?.id;

    if (userId) {
      const supabase = createServiceClient();
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

      console.log('[webhooks/razorpay] Pro revoked for user:', userId, 'event:', eventType);
    }
  } else {
    console.log('[webhooks/razorpay] Unhandled event type:', eventType);
  }

  return NextResponse.json({ received: true });
}
