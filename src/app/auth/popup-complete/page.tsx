"use client";

import { Bot } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import ModernLoginSignup from "@/components/ui/modern-login-signup";

function getSafeNext(value: string | null) {
  return value?.startsWith("/") ? value : "/feed";
}

function PopupCompleteContent() {
  const searchParams = useSearchParams();
  const next = getSafeNext(searchParams.get("next"));
  const error = searchParams.get("error");

  useEffect(() => {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        error
          ? { type: "prioryx-oauth-error", error }
          : { type: "prioryx-oauth-complete", next },
        window.location.origin
      );
      window.close();
      return;
    }

    window.location.replace(error ? `/login?error=${encodeURIComponent(error)}` : next);
  }, [error, next]);

  return (
    <ModernLoginSignup>
      <div className="dark flex w-full items-center justify-center p-4">
        <section className="w-full max-w-[420px] rounded-[28px] border border-white/10 bg-[#0c1222]/95 p-7 text-center shadow-[0_24px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950">
            <Bot size={20} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            {error ? "Sign-in failed" : "Sign-in complete"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {error
              ? "Returning you to PrioryxAI so you can try again."
              : "Returning you to PrioryxAI. This popup should close automatically."}
          </p>
        </section>
      </div>
    </ModernLoginSignup>
  );
}

export default function PopupCompletePage() {
  return (
    <Suspense>
      <PopupCompleteContent />
    </Suspense>
  );
}
