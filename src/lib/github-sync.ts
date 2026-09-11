import { createServiceClient } from "@/lib/supabase/server";
import { syncInternshalaJobsForUser } from "@/lib/job-sync";

const GITHUB_GRAPHQL = `
query($login: String!) {
  user(login: $login) {
    repositories(first: 20, orderBy: {field: STARGAZERS, direction: DESC}, ownerAffiliations: OWNER) {
      nodes {
        name
        description
        url
        primaryLanguage { name }
        stargazerCount
        pushedAt
      }
    }
    contributionsCollection {
      totalCommitContributions
      contributionCalendar {
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }
    }
    languages: repositories(first: 100, ownerAffiliations: OWNER) {
      nodes {
        primaryLanguage { name }
      }
    }
  }
}
`;

export async function syncGithubForUser(userId: string, githubUsername: string) {
  const ghRes = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: GITHUB_GRAPHQL, variables: { login: githubUsername } }),
  });

  if (!ghRes.ok) {
    throw new Error("GitHub API error");
  }

  const { data: ghData, errors } = await ghRes.json();
  if (errors || !ghData?.user) {
    throw new Error("GitHub user not found or API error");
  }

  const ghUser = ghData.user;
  const langMap: Record<string, number> = {};
  for (const repo of ghUser.languages.nodes) {
    const lang = repo.primaryLanguage?.name;
    if (lang) langMap[lang] = (langMap[lang] ?? 0) + 1;
  }

  interface ContributionDay {
  date: string;
  contributionCount: number;
}

interface ContributionWeek {
  contributionDays: ContributionDay[];
}

const allDays: ContributionDay[] =
    ghUser.contributionsCollection.contributionCalendar.weeks
      .flatMap((week: ContributionWeek) => week.contributionDays)
      .sort((a: ContributionDay, b: ContributionDay) => b.date.localeCompare(a.date));

  let streak = 0;
  let startIdx = 0;
  if (allDays.length > 0 && allDays[0].contributionCount === 0) {
    startIdx = 1; // today hasn't happened yet — don't let it break the streak
  }
  for (let i = startIdx; i < allDays.length; i++) {
    if (allDays[i].contributionCount > 0) streak++;
    else break;
  }

  // Keep the most recent 182 days (26 weeks) for the contribution graph
  const contributionDays = allDays
    .slice(0, 182)
    .map((d) => ({ date: d.date, count: d.contributionCount }));

  const totalCommits = ghUser.contributionsCollection.totalCommitContributions;
  const langCount = Object.keys(langMap).length;
  const healthScore = Math.min(
    100,
    Math.round(streak * 2 + Math.min(totalCommits / 10, 40) + Math.min(langCount * 5, 20))
  );

  interface GitHubRepo {
  name: string;
  description: string | null;
  url: string;
  primaryLanguage: { name: string } | null;
  stargazerCount: number;
  pushedAt: string | null;
}

const repos = ghUser.repositories.nodes.map((repo: GitHubRepo) => ({
    name: repo.name,
    description: repo.description,
    url: repo.url,
    language: repo.primaryLanguage?.name ?? null,
    stargazerCount: repo.stargazerCount,
    pushedAt: repo.pushedAt,
  }));

  const supabase = createServiceClient();

  // Fetch user's subjects to merge with GitHub languages for job matching
  const { data: userData } = await supabase
    .from("users")
    .select("subjects, college")
    .eq("id", userId)
    .single();

  await Promise.all([
    supabase.from("github_cache").upsert(
      {
        user_id: userId,
        repos,
        languages: langMap,
        last_commit_at: repos[0]?.pushedAt ?? null,
        streak_days: streak,
        health_score: healthScore,
        contribution_days: contributionDays,
        synced_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    ),
    supabase.from("users").update({ last_active_at: new Date().toISOString() }).eq("id", userId),
  ]);

  // Auto-trigger Internshala job sync using GitHub languages + user subjects.
  // Fire-and-forget — don't block the GitHub sync response.
  syncInternshalaJobsForUser({
    userId,
    subjects: userData?.subjects ?? [],
    college: userData?.college ?? null,
    languages: langMap,
    force: false,
  }).catch((err) => console.error("[github-sync] auto job sync failed:", err));

  return { streak_days: streak, health_score: healthScore, repos_count: repos.length };
}
