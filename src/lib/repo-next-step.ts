import { openai, sanitize } from "@/lib/openai";

type RepoSummary = {
  name: string;
  description: string | null;
  url: string | null;
  language: string | null;
  stargazerCount?: number | null;
  pushedAt?: string | null;
};

type RepoNextStep = {
  title: string;
  reason: string;
  estimate: string;
};

function normalizeEstimate(value: string | null | undefined) {
  const trimmed = (value ?? "").trim();
  return trimmed || "45 min";
}

function pickFallbackRepo(repos: RepoSummary[]) {
  return [...repos].sort((a, b) => {
    const aHasDescription = a.description ? 1 : 0;
    const bHasDescription = b.description ? 1 : 0;

    if (aHasDescription !== bHasDescription) {
      return bHasDescription - aHasDescription;
    }

    const aPushed = a.pushedAt ? new Date(a.pushedAt).getTime() : 0;
    const bPushed = b.pushedAt ? new Date(b.pushedAt).getTime() : 0;
    if (aPushed !== bPushed) {
      return bPushed - aPushed;
    }

    return (b.stargazerCount ?? 0) - (a.stargazerCount ?? 0);
  })[0];
}

function buildFallbackStep(repo: RepoSummary): RepoNextStep {
  if (!repo.description) {
    return {
      title: `Clarify what ${repo.name} does and why it matters`,
      reason:
        `${repo.name} is synced, but its public description is still weak. ` +
        `A sharper summary and README direction will help DeadlineOS infer stronger project follow-ups.`,
      estimate: "25 min",
    };
  }

  return {
    title: `Ship one visible improvement in ${repo.name}`,
    reason:
      `${repo.name} already signals ${sanitize(repo.description)}. ` +
      `The next best move is to turn that signal into stronger proof of execution with one demo-worthy improvement.`,
    estimate: "45 min",
  };
}

function parseJsonResponse(raw: string | null | undefined) {
  if (!raw) return null;
  const cleaned = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export async function generateRepoNextStep({
  repos,
  subjects,
}: {
  repos: RepoSummary[];
  subjects?: string[] | null;
}): Promise<RepoNextStep | null> {
  const candidateRepos = repos
    .filter((repo) => repo?.name)
    .slice(0, 6)
    .map((repo) => ({
      name: sanitize(repo.name),
      description: sanitize(repo.description),
      language: sanitize(repo.language),
      stars: repo.stargazerCount ?? 0,
      pushedAt: repo.pushedAt ?? null,
      url: repo.url ?? null,
    }));

  if (candidateRepos.length === 0) {
    return null;
  }

  const fallback = buildFallbackStep(pickFallbackRepo(repos));

  if (!process.env.OPENAI_API_KEY) {
    return fallback;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You rank the single highest-leverage next product step for a student based only on public GitHub repo summaries. " +
            "Return strict JSON with keys title, reason, estimate. " +
            "Title must be a concrete next action under 90 characters and should name the repo when possible. " +
            "Reason must be 1-2 sentences under 220 characters and grounded in the repo descriptions.",
        },
        {
          role: "user",
          content: JSON.stringify({
            subjects: (subjects ?? []).map((subject) => sanitize(subject)).filter(Boolean),
            repos: candidateRepos,
          }),
        },
      ],
      max_tokens: 220,
    });

    const parsed = parseJsonResponse(response.choices[0]?.message?.content);
    if (!parsed || typeof parsed !== "object") {
      return fallback;
    }

    const title = sanitize(String((parsed as any).title ?? ""));
    const reason = sanitize(String((parsed as any).reason ?? ""));
    if (!title || !reason) {
      return fallback;
    }

    return {
      title,
      reason,
      estimate: normalizeEstimate((parsed as any).estimate),
    };
  } catch {
    return fallback;
  }
}
