import AppShell from "@/components/app-shell";
import { requireAppUser } from "@/lib/app-user";

export const metadata = {
  title: "Profile — PrioryxAI",
  description: "Preview your public PrioryxAI profile",
};

export default async function ProfilePage() {
  const { username } = await requireAppUser();
  return <AppShell initialView="profile" username={username} />;
}
