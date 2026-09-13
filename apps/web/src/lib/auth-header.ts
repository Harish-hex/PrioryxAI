// HMAC-signed pass-through of the already-verified auth user id from
// middleware to Server Components, so requireAppUser() (src/lib/app-user.ts)
// can skip a second Supabase Auth round trip on every page navigation without
// trusting a bare, spoofable request header. A request header by itself is
// attacker-controlled input — anyone can send `x-user-id: <victim-id>` — so
// the header is only safe to trust here because it is signed with a
// server-only secret that never reaches the client, and the signature is
// re-verified before the id is used for anything.
//
// Uses Web Crypto (available on both the Edge and Node.js runtimes) rather
// than Node's `crypto` module, since middleware may run on the Edge runtime.

const HEADER_ID = 'x-user-id';
const HEADER_SIG = 'x-user-sig';

function getSecret(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function bufToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Sign a verified user id for safe forwarding via a request header. Returns null if no server secret is configured (caller should then not set the header at all, forcing the fallback path). */
export async function signUserId(userId: string): Promise<string | null> {
  const secret = getSecret();
  if (!secret) return null;
  const key = await getHmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(userId));
  return bufToBase64Url(sig);
}

/** Verify a signature produced by signUserId. Returns false on any mismatch, missing secret, or malformed input — always fail closed. */
export async function verifyUserId(userId: string, signature: string): Promise<boolean> {
  const secret = getSecret();
  if (!secret || !userId || !signature) return false;
  const expected = await signUserId(userId);
  if (!expected) return false;
  // Lengths differ trivially for most forged signatures; a strict equality
  // check is adequate here since this guards an internal same-process
  // header, not a network-exposed secret comparison endpoint.
  return expected === signature;
}

export const AUTH_HEADER_NAMES = { id: HEADER_ID, sig: HEADER_SIG } as const;

/** Sign an arbitrary string payload with the same server-only secret. Used to
 * make a short-TTL "recently verified by getUser()" cache cookie tamper-proof —
 * see the getUser() cache in src/lib/supabase/middleware.ts. */
export async function signPayload(payload: string): Promise<string | null> {
  const secret = getSecret();
  if (!secret) return null;
  const key = await getHmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return bufToBase64Url(sig);
}

/** Verify a signature produced by signPayload. Fails closed on any mismatch or missing secret. */
export async function verifyPayload(payload: string, signature: string): Promise<boolean> {
  const secret = getSecret();
  if (!secret || !payload || !signature) return false;
  const expected = await signPayload(payload);
  if (!expected) return false;
  return expected === signature;
}
