import AppShell from "@/components/app-shell";
import { requireAppUser } from "@/lib/app-user";

export const metadata = {
  title: "Settings — DeadlineOS",
  description: "Update your DeadlineOS profile and workspace",
};

export default async function SettingsPage() {
  const { username } = await requireAppUser();
  return <AppShell initialView="settings" username={username} />;
}
