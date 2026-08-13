import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Razorpay from 'razorpay';

export const runtime = 'nodejs';

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET || !process.env.RAZORPAY_PLAN_ID) {
    console.error('[payments/subscribe] Missing Razorpay env vars');
    return NextResponse.json({ error: 'Payments not configured' }, { status: 503 });
  }

  // Instantiate inside handler so missing env vars don't crash at build time
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.prioryxai.in';
    const subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID!,
      customer_notify: 1,
      total_count: 12, // 12 months
      notes: {
        user_id: user.id,
        email: user.email ?? '',
      },
      // Redirect user back to the app after payment so we can show
      // an activation message and refresh their pro status.
      callback_url: `${appUrl}/feed?payment=success`,
    } as any);

    // Store initial subscription record (non-fatal if subscriptions table doesn't exist yet)
    await supabase.from('subscriptions').upsert(
      {
        user_id: user.id,
        razorpay_subscription_id: subscription.id,
        status: 'created',
      },
      { onConflict: 'user_id' }
    ).then(({ error }) => {
      if (error) console.warn('[payments/subscribe] subscriptions upsert failed (table may not exist):', error.message);
    });

    return NextResponse.json({
      subscription_id: subscription.id,
      short_url: (subscription as any).short_url ?? null,
    });
  } catch (err: any) {
    console.error('[payments/subscribe]', err);
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}
