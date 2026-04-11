# OAuth Redirect Bug Worklog

Date: 2026-04-11
Context: Google and GitHub OAuth redirect back to the login page instead of completing sign-in.

## Goal

Find the root cause of the Supabase OAuth redirect loop and fix it safely.

## Actions Log

- Started tracing the OAuth flow end-to-end instead of patching blindly.
- Inspected these files first:
  - `src/app/api/auth/login/route.ts`
  - `src/app/api/auth/callback/route.ts`
  - `src/lib/supabase/middleware.ts`
  - `src/middleware.ts`
  - `src/app/login/page.tsx`
  - `src/app/api/auth/signin/route.ts`
  - `src/app/api/auth/signup/route.ts`
  - `src/lib/supabase/server.ts`
  - `src/lib/supabase/client.ts`
- Confirmed the login page sends provider auth through `/api/auth/login?provider=...&next=...`.
- Confirmed the OAuth start route uses `signInWithOAuth()` and redirects to `/api/auth/callback`.
- Confirmed middleware protects `/feed`, `/assistant`, `/onboarding`, `/settings`, and `/profile`, and redirects unauthenticated users back to `/login`.
- Identified a likely failure mode in `src/app/api/auth/callback/route.ts`:
  - it creates one redirect response for Supabase to attach cookies to
  - then creates a fresh redirect response at the end
  - this can lose or mishandle auth cookies, which would explain why middleware sees no user and redirects back to `/login`
- Noted an additional hardening point:
  - callback host/origin handling should be careful on Vercel/custom domains
  - if host handling is wrong, cookies can be set for the wrong host or redirect to the wrong domain

## Pending Work

## Changes Applied

- Patched `src/app/api/auth/login/route.ts`
  - sanitized `next` so only relative in-app redirects are allowed
  - added `x-forwarded-host` / `x-forwarded-proto` handling for production callback URL generation
  - kept localhost behavior unchanged for development
- Patched `src/app/api/auth/callback/route.ts`
  - sanitized `next` the same way
  - added forwarded-host aware base URL handling
  - stopped relying on a temporary redirect response whose cookies were later passed indirectly
  - now collects Supabase cookies on a carrier response and copies them explicitly onto the final redirect response
  - this should prevent the session cookie from being lost before middleware checks protected routes

## Why This Is The Suspected Root Cause

- The previous callback route exchanged the OAuth code successfully, but then returned a fresh redirect response.
- Even though it attempted to pass headers forward, this is fragile for `Set-Cookie` handling.
- If the auth cookies do not make it onto the final redirect response, middleware sees no authenticated user and sends the browser back to `/login`.
- That matches the reported symptom exactly.

## Remaining Verification

- Local validation passed:
  - `npm run build` completed successfully after the OAuth route changes
- Production deploy completed:
  - preview/production deployment URL: `https://prioryxai-3mtano7br-harishgovind2007-8818s-projects.vercel.app`
  - aliased live domain: `https://www.prioryxai.in`
- Remaining live verification:
  - verify that Google and GitHub OAuth no longer bounce authenticated users back to `/login`
  - if any loop still happens, inspect runtime logs for `/api/auth/callback` and compare actual callback host/cookie behavior in browser

## Additional Investigation After The First Patch

- User reported the same redirect loop even after the cookie-forwarding callback fix.
- Pulled current Vercel environment variable names and confirmed production still defines `NEXT_PUBLIC_APP_URL`.
- Pulled the production env file to inspect only the canonical app URL value.
- Confirmed production `NEXT_PUBLIC_APP_URL` is `https://prioryxai.in`.
- Inspected the live OAuth entrypoint headers on both domains:
  - `https://prioryxai.in/api/auth/login?...` 307-redirects to the `www` host
  - `https://www.prioryxai.in/api/auth/login?...` then redirects to Supabase authorize with `redirect_to=https://www.prioryxai.in/api/auth/callback?...`
- This means the app is correctly constructing a `www` callback URL by the time OAuth starts.
- Combined with the earlier runtime signal that `/api/auth/callback` was not being hit, the stronger hypothesis became:
  - Supabase is sometimes returning the OAuth result to the site root or login page instead of `/api/auth/callback`
  - that would explain the observed `GET /` redirect loop while skipping the callback handler entirely

## Second Fix Applied

- Patched `src/app/page.tsx`
  - detects OAuth return params like `code`, `next`, `error`, and `error_description`
  - immediately redirects them to `/api/auth/callback`
  - this lets the app recover if Supabase falls back to the site root instead of the callback route
- Patched `src/app/login/page.tsx`
  - detects an OAuth `code` or provider error in the login URL
  - immediately forwards the full query string to `/api/auth/callback`
  - shows a short "Completing sign-in…" screen during the handoff instead of leaving the user on the login form
- Hardened `src/app/api/auth/callback/route.ts`
  - logs provider-returned errors
  - redirects cleanly to `/login?error=auth_failed` when the provider returns an error payload instead of a code

## Why This Second Fix Matters

- If the Supabase redirect allow list or site URL causes OAuth to land on `/` or `/login`, the previous fix alone would not help because `/api/auth/callback` would never run.
- The new fallback makes the app tolerant of that misrouting by forwarding the OAuth result back into the correct callback route.
- This does not replace proper Supabase redirect URL configuration, but it should eliminate the current bounce-to-login symptom when the OAuth code reaches the wrong page on the same domain.

## Validation After The Second Fix

- Rebuilt locally with `npm run build`
  - build passed successfully
- Deployed the patch to production
  - deployment URL: `https://prioryxai-q7utjzlmn-harishgovind2007-8818s-projects.vercel.app`
  - live alias: `https://www.prioryxai.in`
- Verified the live root route now recovers OAuth codes correctly:
  - `GET https://www.prioryxai.in/?code=test-code&next=%2Ffeed`
  - now returns `307 Location: /api/auth/callback?code=test-code&next=%2Ffeed`
- Checked `/login?code=...` as well:
  - server response is still the login page HTML because the recovery there happens client-side
  - in a real browser, the added `useEffect` now forwards that URL into `/api/auth/callback`

## Remaining External Risk

- If Supabase does not allow the callback URL in its redirect allow list, it may keep falling back to the site root.
- The new app-side recovery should still catch that on the same domain, but the proper long-term Supabase config is still:
  - Site URL aligned to the live canonical domain
  - redirect allow list includes both:
    - `https://www.prioryxai.in/api/auth/callback`
    - `https://prioryxai.in/api/auth/callback`
