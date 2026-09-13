import { calculateStreakFromDays, getTodayDateStr } from './activity-tracker';

export interface ContributionDay {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface AggregatedContributions {
  contribution_days: ContributionDay[];
  streak_days: number;
  total_contributions: number;
  internal_count: number;
  github_count: number;
}

/**
 * Aggregates all internal PrioryxAI platform activities (tasks, YouTube videos,
 * DSA problems, Foundry submissions, assistant chats, daily visits)
 * and seamlessly merges them with GitHub commit history.
 */
export async function getAggregatedUserContributions(
  userId: string,
  db: any,
  githubCache?: any,
  daysBack: number = 365
): Promise<AggregatedContributions> {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - daysBack);
  const fromDateStr = getTodayDateStr(fromDate);

  const platformDateCounts = new Map<string, number>();

  // 1. Try invoking get_user_daily_activity RPC
  let rpcSucceeded = false;
  try {
    const { data: rpcData, error: rpcErr } = await db.rpc('get_user_daily_activity', {
      p_user_id: userId,
      p_from: fromDateStr,
    });

    if (!rpcErr && Array.isArray(rpcData)) {
      rpcSucceeded = true;
      for (const row of rpcData) {
        if (row.activity_date) {
          const dStr = typeof row.activity_date === 'string' ? row.activity_date.slice(0, 10) : String(row.activity_date);
          const current = platformDateCounts.get(dStr) ?? 0;
          platformDateCounts.set(dStr, current + Number(row.count ?? 0));
        }
      }
    }
  } catch (err) {
    // Fall back to direct table queries
  }

  // 2. Direct table queries fallback (or addition for tables not yet in older RPC versions)
  if (!rpcSucceeded || platformDateCounts.size === 0) {
    try {
      const [
        { data: activities },
        { data: tasks },
        { data: ytHistory },
        { data: ytRecs },
        { data: problems },
        { data: phaseSubs },
        { data: projects },
        { data: assistantMsgs },
      ] = await Promise.all([
        db.from('user_activities').select('created_at').eq('user_id', userId).gte('created_at', fromDateStr),
        db.from('tasks').select('created_at, updated_at, completed').eq('user_id', userId).gte('created_at', fromDateStr),
        db.from('youtube_watch_history').select('watched_at').eq('user_id', userId).gte('watched_at', fromDateStr),
        db.from('youtube_recommendations').select('watched_at').eq('user_id', userId).eq('watched', true).gte('watched_at', fromDateStr),
        db.from('problem_progress').select('completed_at').eq('user_id', userId).eq('completed', true).gte('completed_at', fromDateStr),
        db.from('phase_submissions').select('submitted_at').eq('user_id', userId).gte('submitted_at', fromDateStr),
        db.from('user_projects').select('created_at').eq('user_id', userId).gte('created_at', fromDateStr),
        db.from('assistant_messages').select('created_at').eq('user_id', userId).gte('created_at', fromDateStr),
      ]);

      const addDate = (ts?: string | null) => {
        if (!ts) return;
        const d = ts.slice(0, 10);
        if (d && d.length === 10) {
          platformDateCounts.set(d, (platformDateCounts.get(d) ?? 0) + 1);
        }
      };

      activities?.forEach((a: any) => addDate(a.created_at));
      tasks?.forEach((t: any) => {
        addDate(t.created_at);
        if (t.completed && t.updated_at) addDate(t.updated_at);
      });
      ytHistory?.forEach((y: any) => addDate(y.watched_at));
      ytRecs?.forEach((y: any) => addDate(y.watched_at));
      problems?.forEach((p: any) => addDate(p.completed_at));
      phaseSubs?.forEach((p: any) => addDate(p.submitted_at));
      projects?.forEach((p: any) => addDate(p.created_at));
      assistantMsgs?.forEach((m: any) => addDate(m.created_at));
    } catch (err) {
      console.warn('[activity-aggregator] Direct fallback query error:', err);
    }
  }

  // 3. GitHub contribution days
  const githubContributionDays: ContributionDay[] = Array.isArray(githubCache?.contribution_days)
    ? githubCache.contribution_days
    : [];

  let githubCount = 0;
  const mergedMap = new Map<string, number>();

  // Add GitHub counts
  for (const gh of githubContributionDays) {
    if (gh.date) {
      const d = gh.date.slice(0, 10);
      const cnt = Number(gh.count ?? 0);
      githubCount += cnt;
      mergedMap.set(d, cnt);
    }
  }

  // Merge Platform counts
  let internalCount = 0;
  platformDateCounts.forEach((count, date) => {
    internalCount += count;
    const existing = mergedMap.get(date) ?? 0;
    mergedMap.set(date, existing + count);
  });

  // Convert to sorted array
  const combinedDays: ContributionDay[] = Array.from(mergedMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Compute live active streak
  const calculatedStreak = calculateStreakFromDays(combinedDays);
  const githubStreak = Number(githubCache?.streak_days ?? 0);
  const streakDays = Math.max(calculatedStreak, githubStreak);

  let totalContributions = 0;
  combinedDays.forEach((d) => (totalContributions += d.count));

  return {
    contribution_days: combinedDays,
    streak_days: streakDays,
    total_contributions: totalContributions,
    internal_count: internalCount,
    github_count: githubCount,
  };
}
