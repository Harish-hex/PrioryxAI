const REQUIRED_SERVER_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
] as const

const OPTIONAL_VARS = [
  'APIFY_TOKEN',
  'YOUTUBE_API_KEY',
  'ALFA_LEETCODE_API_URL',
  'CODING_PROFILE_SERVICE_URL',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
] as const

export function checkRequiredEnvVars(): void {
  const missing = REQUIRED_SERVER_VARS.filter(
    key => !process.env[key]
  )
  if (missing.length > 0) {
    console.error('❌ MISSING REQUIRED ENV VARS:', missing)
    // Don't throw in production — log and continue
    // But this will cause API failures
  }

  const missingOptional = OPTIONAL_VARS.filter(
    key => !process.env[key]
  )
  if (missingOptional.length > 0) {
    console.warn('⚠️ Missing optional env vars:', missingOptional)
  }
}

export function getEnvVar(key: string, fallback?: string): string {
  const val = process.env[key] ?? fallback
  if (!val) {
    console.error(`[ENV] Missing: ${key}`)
    return ''
  }
  return val
}
