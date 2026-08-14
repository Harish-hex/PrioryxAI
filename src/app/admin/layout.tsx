"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAILS = ["yugendhars06@gmail.com"];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      if (!ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "")) {
        router.push("/feed");
        return;
      }

      setAuthed(true);
      setLoading(false);
    }

    checkAuth();
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white mx-auto" />
          <p className="mt-4 text-slate-400 text-sm">Verifying admin access…</p>
        </div>
      </div>
    );
  }

  if (!authed) {
    return null;
  }

  return <>{children}</>;
}