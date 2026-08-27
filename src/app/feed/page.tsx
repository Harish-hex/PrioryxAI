import AppShell from "@/components/app-shell";
import { requireAppUser } from "@/lib/app-user";
import { createClient } from "@/lib/supabase/server";
import { getFeedData } from "@/lib/data/feed";
import { getStatsData } from "@/lib/data/stats";
import { getUserStatusData } from "@/lib/data/user-status";

export const metadata = {
  title: "Feed — PrioryxAI",
  description: "Your AI-ranked priority feed",
};

export default async function FeedPage() {
  const { id: userId, username } = await requireAppUser();
  const supabase = createClient();

  // Fetch the dashboard's initial data on the server so the first paint has
  // real content instead of an empty shell that waits for a client-side
  // useEffect fetch after hydration. Each loader has its own Redis cache
  // (see src/lib/data/*), so this doesn't add DB load beyond what the old
  // client-fetched /api/* routes already did — it just moves the same work
  // earlier, into the initial render.
  const [initialFeed, initialStats, initialStatus] = await Promise.allSettled([
    getFeedData(supabase, userId),
    getStatsData(supabase, userId),
    getUserStatusData(supabase, userId),
  ]);

  return (
    <AppShell
      initialView="dashboard"
      username={username}
      initialFeed={initialFeed.status === "fulfilled" ? (initialFeed.value as any) : null}
      initialStats={initialStats.status === "fulfilled" ? (initialStats.value as any) : null}
      initialStatus={initialStatus.status === "fulfilled" ? (initialStatus.value as any) : null}
    />
  );
}
