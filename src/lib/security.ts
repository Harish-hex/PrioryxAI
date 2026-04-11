import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';

export function verifyRazorpaySignature(body: string, sig: string): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export function verifyGitHubSignature(body: string, sig: string): boolean {
  const expected =
    'sha256=' +
    crypto
      .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
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
