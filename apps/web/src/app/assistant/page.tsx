import AppShell from "@/components/app-shell";
import { requireAppUser } from "@/lib/app-user";

export const metadata = {
  title: "Assistant — PrioryxAI",
  description: "Context-aware AI assistant for deadlines and planning",
};

export default async function AssistantPage() {
  const { username } = await requireAppUser();
  return <AppShell initialView="assistant" username={username} />;
}
