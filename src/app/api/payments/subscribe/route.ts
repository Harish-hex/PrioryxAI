import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Razorpay from 'razorpay';

export const runtime = 'nodejs';

export async function POST() {
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID!,
      customer_notify: 1,
      total_count: 12, // 12 months
      notes: {
        user_id: user.id,
        email: user.email ?? '',
      },
    });

    // Store initial subscription record
    await supabase.from('subscriptions').upsert(
      {
        user_id: user.id,
        razorpay_subscription_id: subscription.id,
        status: 'created',
      },
      { onConflict: 'user_id' }
    );

    return NextResponse.json({
      subscription_id: subscription.id,
      short_url: (subscription as any).short_url ?? null,
    });
  } catch (err: any) {
    console.error('[payments/subscribe]', err);
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}
