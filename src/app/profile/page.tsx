import AppShell from "@/components/app-shell";
import { requireAppUser } from "@/lib/app-user";

export const metadata = {
  title: "Profile — DeadlineOS",
  description: "Preview your public DeadlineOS profile",
};

export default async function ProfilePage() {
  const { username } = await requireAppUser();
  return <AppShell initialView="profile" username={username} />;
}
