import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';

export function verifyRazorpaySignature(body: string, sig: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[security] RAZORPAY_WEBHOOK_SECRET not set — failing closed');
    return false;
  }
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function verifyGitHubSignature(body: string, sig: string): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[security] GITHUB_WEBHOOK_SECRET not set — failing closed');
    return false;
  }
  const expected =
    'sha256=' +
    crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function requirePro(userId: string): Promise<void> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('users')
    .select('pro_status, pro_expires_at')
    .eq('id', userId)
    .single();
  if (!data?.pro_status) throw new Error('Pro required');
  if (data.pro_expires_at && new Date(data.pro_expires_at) < new Date()) {
    throw new Error('Pro expired');
  }
}
