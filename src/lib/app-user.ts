import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  return { username, onboarded };
}
