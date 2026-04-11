interface LoginPageProps {
  searchParams?: {
    error?: string;
    next?: string;
  };
}

const errorCopy: Record<string, string> = {
  oauth_failed: "OAuth sign-in could not be started. Please try again.",
  no_code: "The provider did not return an auth code.",
  auth_failed: "We could not finish signing you in. Please try again.",
};

export const metadata = {
  title: "Sign in — DeadlineOS",
  description: "Sign in to your DeadlineOS account",
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const next = searchParams?.next ?? "/feed";
  const error = searchParams?.error ? errorCopy[searchParams.error] ?? "Sign-in failed." : null;

  return (
    <main className="app-background flex min-h-screen items-center justify-center px-4 py-8 text-neutral-100 sm:px-6">
      <section className="grid w-full max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_440px]">
        <div className="glass-strong rounded-lg p-6 sm:p-8">
          <p className="text-sm font-medium text-volt">DeadlineOS</p>
          <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">
            Your academic and career command center.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-400">
            Connect GitHub or Google, pull your deadlines into one place, and let the product rank your next move.
          </p>
        </div>

        <div className="glass rounded-lg p-5 sm:p-6">
          <h2 className="text-2xl font-semibold text-white">Sign in</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Use your existing account to enter the workspace.
          </p>

          {error && (
            <p className="mt-5 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          <div className="mt-6 space-y-3">
            <a
              href={`/api/auth/login?provider=github&next=${encodeURIComponent(next)}`}
              className="flex w-full items-center justify-center rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black transition hover:scale-[1.01]"
            >
              Continue with GitHub
            </a>
            <a
              href={`/api/auth/login?provider=google&next=${encodeURIComponent(next)}`}
              className="flex w-full items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.1]"
            >
              Continue with Google
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
