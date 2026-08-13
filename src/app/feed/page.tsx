import AppShell from "@/components/app-shell";
import { requireAppUser } from "@/lib/app-user";

export const metadata = {
  title: "Feed — PrioryxAI",
  description: "Your AI-ranked priority feed",
};

export default async function FeedPage() {
  const { username } = await requireAppUser();
  return <AppShell initialView="dashboard" username={username} />;
}
