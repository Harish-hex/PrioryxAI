import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export interface AppUserProfile {
  username: string;
  onboarded: boolean;
}

export async function requireAppUser(options?: { requireOnboarding?: boolean }): Promise<AppUserProfile> {
  const requireOnboarding = options?.requireOnboarding ?? true;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("username, college, semester, subjects")
    .eq("id", user.id)
    .single();

  let username = profile?.username;

  if (!username) {
    username = user.email?.split("@")[0]?.replace(/[^a-zA-Z0-9-]/g, "") ?? "student";
    // Avoid race conditions by awaiting the update
    // Use service role to bypass any RLS update restrictions on the username column
    const serviceClient = createServiceClient();
    const { error } = await serviceClient.from("users").update({ username }).eq("id", user.id);
    if (error) console.error("Failed to update username", error);
  }

  const onboarded = Boolean(
    profile?.college &&
      profile?.semester &&
      Array.isArray(profile?.subjects) &&
      profile.subjects.length > 0
  );

  if (requireOnboarding && !onboarded) {
    redirect("/onboarding");
  }

  return { username, onboarded };
}
