import { createServiceClient } from "@/lib/supabase/server";

const GITHUB_GRAPHQL = `
query($login: String!) {
  user(login: $login) {
    repositories(first: 20, orderBy: {field: PUSHED_AT, direction: DESC}, ownerAffiliations: OWNER) {
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

  const allDays = ghUser.contributionsCollection.contributionCalendar.weeks
    .flatMap((week: any) => week.contributionDays)
    .sort((a: any, b: any) => b.date.localeCompare(a.date));

  let streak = 0;
  for (const day of allDays) {
    if (day.contributionCount > 0) streak++;
    else break;
  }

  const totalCommits = ghUser.contributionsCollection.totalCommitContributions;
  const langCount = Object.keys(langMap).length;
  const healthScore = Math.min(
    100,
    Math.round(streak * 2 + Math.min(totalCommits / 10, 40) + Math.min(langCount * 5, 20))
  );

  const repos = ghUser.repositories.nodes.map((repo: any) => ({
    name: repo.name,
    description: repo.description,
    url: repo.url,
    language: repo.primaryLanguage?.name ?? null,
    stargazerCount: repo.stargazerCount,
    pushedAt: repo.pushedAt,
  }));

  const supabase = createServiceClient();
  await Promise.all([
    supabase.from("github_cache").upsert(
      {
        user_id: userId,
        repos,
        languages: langMap,
        last_commit_at: repos[0]?.pushedAt ?? null,
        streak_days: streak,
        health_score: healthScore,
        synced_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    ),
    supabase.from("users").update({ last_active_at: new Date().toISOString() }).eq("id", userId),
  ]);

  return { streak_days: streak, health_score: healthScore, repos_count: repos.length };
}
