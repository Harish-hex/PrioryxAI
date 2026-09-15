import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

/** Lightweight password hashing for private study rooms using Node's
 * built-in scrypt (no bcrypt dependency in this app yet — this is a
 * "keep a casual study group private", not a security-critical secret). */
export function hashRoomPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyRoomPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}
