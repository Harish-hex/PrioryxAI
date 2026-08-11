import AppShell from "@/components/app-shell";
import { requireAppUser } from "@/lib/app-user";

export const metadata = {
  title: "Learning Feed — PrioryxAI",
  description: "AI-curated learning videos based on your profile",
};

export default async function LearningFeedPage() {
  const { username } = await requireAppUser();
  return <AppShell initialView="learning" username={username} />;
}
