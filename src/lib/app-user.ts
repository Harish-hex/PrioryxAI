import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AUTH_HEADER_NAMES, verifyUserId } from "@/lib/auth-header";

export interface AppUserProfile {
  id: string;
  username: string;
  onboarded: boolean;
}

export async function requireAppUser(options?: { requireOnboarding?: boolean }): Promise<AppUserProfile> {
  const requireOnboarding = options?.requireOnboarding ?? true;
  const supabase = createClient();

  // The middleware (src/lib/supabase/middleware.ts) already calls getUser()
  // for every request that reaches a protected page and forwards the
  // validated id via an HMAC-signed header — reuse it instead of paying a
  // second Supabase Auth round trip here. The header is never trusted on its
  // own: it must carry a valid signature produced from a server-only secret
  // the client never sees, so a request can't forge it even if the
  // middleware matcher ever fails to cover this route. Any missing or
  // invalid signature falls back to the real getUser() check below — this
  // path must fail closed, never fail open.
  const headerUserId = headers().get(AUTH_HEADER_NAMES.id);
  const headerSig = headers().get(AUTH_HEADER_NAMES.sig);

  let user: { id: string; email?: string | null } | null = null;
  if (headerUserId && headerSig && (await verifyUserId(headerUserId, headerSig))) {
    user = { id: headerUserId, email: null };
  }

  if (!user) {
    const {
      data: { user: fetchedUser },
    } = await supabase.auth.getUser();
    user = fetchedUser;
  }

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("username, college, semester, subjects")
    .eq("id", user.id)
    .single();

  const username =
    profile?.username ??
    user.email?.split("@")[0]?.replace(/[^a-zA-Z0-9-]/g, "") ??
    "student";

  const onboarded = Boolean(
    profile?.college &&
      profile?.semester &&
      Array.isArray(profile?.subjects) &&
      profile.subjects.length > 0
  );

  if (requireOnboarding && !onboarded) {
    redirect("/onboarding");
  }

  return { id: user.id, username, onboarded };
}
