import AppShell from "@/components/app-shell";
import { requireAppUser } from "@/lib/app-user";

export const metadata = {
  title: "Dashboard — PrioryxAI",
  description: "Your AI-ranked priority feed",
};

export default async function DashboardPage() {
  const { username } = await requireAppUser();
  return <AppShell initialView="dashboard" username={username} />;
}
