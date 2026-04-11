import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LandingPage from "@/components/landing-page";

type SearchParamValue = string | string[] | undefined;

function appendSearchParam(params: URLSearchParams, key: string, value: SearchParamValue) {
  if (typeof value === "string") {
    params.set(key, value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => params.append(key, entry));
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Record<string, SearchParamValue>;
}) {
  // Pass OAuth callback params through to the callback handler
  const oauthParams = new URLSearchParams();
  const oauthKeys = ["code", "next", "error", "error_code", "error_description"];
  oauthKeys.forEach((key) => {
    appendSearchParam(oauthParams, key, searchParams?.[key]);
  });

  if (oauthParams.has("code") || oauthParams.has("error")) {
    redirect(`/api/auth/callback?${oauthParams.toString()}`);
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Logged-in → go to feed
  if (user) redirect("/feed");

  // Logged-out → show landing page
  return <LandingPage />;
}
