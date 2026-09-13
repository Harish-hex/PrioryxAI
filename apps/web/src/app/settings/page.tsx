import AppShell from "@/components/app-shell";
import { requireAppUser } from "@/lib/app-user";

export const metadata = {
  title: "Settings — PrioryxAI",
  description: "Update your PrioryxAI profile and workspace",
};

export default async function SettingsPage() {
  const { username } = await requireAppUser();
  return <AppShell initialView="settings" username={username} />;
}
