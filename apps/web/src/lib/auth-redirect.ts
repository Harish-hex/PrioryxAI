/**
 * `X-Forwarded-Host` is set by the proxy in front of the app, but it is
 * client-controllable on some deployment setups — trusting it unconditionally
 * lets an attacker redirect the OAuth flow (and its session cookies) to an
 * arbitrary host. Only trust it when it matches the app's configured host.
 */
export function resolveTrustedBaseUrl(
  forwardedHost: string | null,
  forwardedProto: string,
  fallbackOrigin: string
): string {
  const allowedHost = process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname.toLowerCase()
    : null;

  const candidateHost = forwardedHost?.split(':')[0]?.toLowerCase() ?? null;

  if (allowedHost && candidateHost === allowedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return fallbackOrigin;
}
