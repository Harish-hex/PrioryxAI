import { redirect } from "next/navigation";

interface SignupPageProps {
  searchParams?: {
    next?: string;
  };
}

export default function SignupPage({ searchParams }: SignupPageProps) {
  const params = new URLSearchParams({ mode: "signup" });
  if (searchParams?.next) params.set("next", searchParams.next);
  redirect(`/login?${params.toString()}`);
}
