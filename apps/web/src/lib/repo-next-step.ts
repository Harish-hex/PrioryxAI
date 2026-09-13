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
  isNewProject?: boolean;
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
        `A sharper summary and README direction will help PrioryxAI infer stronger project follow-ups.`,
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

async function suggestNewProject(subjects: string[] | null | undefined): Promise<RepoNextStep> {
  const skills = (subjects ?? []).filter(Boolean).slice(0, 3);
  const skillsText = skills.length > 0 ? skills.join(', ') : 'software development';

  const fallback: RepoNextStep = {
    title: 'Build a CRUD app with authentication and deploy it publicly',
    reason:
      'A deployed project with a live URL signals execution ability. Even a simple one outperforms a blank GitHub profile.',
    estimate: '2–3 weeks',
    isNewProject: true,
  };

  if (!process.env.OPENAI_API_KEY) return fallback;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Suggest one beginner-friendly portfolio project for a student. ' +
            'Return strict JSON with keys: title (the project name, under 80 chars), reason (1–2 sentences on why this project impresses recruiters, under 200 chars), estimate (time to complete, e.g. "2–3 weeks"). ' +
            'The project must: be completable in 2–4 weeks, produce a visible deployed demo, and directly match what recruiters look for in internship candidates with the given skills.',
        },
        {
          role: 'user',
          content: `Student skills: ${skillsText}`,
        },
      ],
      max_tokens: 200,
    });

    const parsed = parseJsonResponse(response.choices[0]?.message?.content);
    if (!parsed || typeof parsed !== 'object') return fallback;

    const title = sanitize(String((parsed as any).title ?? ''));
    const reason = sanitize(String((parsed as any).reason ?? ''));
    if (!title || !reason) return fallback;

    return {
      title: `Build: ${title}`,
      reason,
      estimate: normalizeEstimate((parsed as any).estimate) || '2–3 weeks',
      isNewProject: true,
    };
  } catch {
    return fallback;
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

  // No repos or all repos empty/undescribed → suggest a new project to build
  const allWeak =
    candidateRepos.length === 0 ||
    candidateRepos.every((r) => !r.description);

  if (allWeak) {
    return suggestNewProject(subjects);
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
