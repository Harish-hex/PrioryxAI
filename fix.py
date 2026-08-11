import re
with open('src/app/api/feed/route.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'  const urgencyText =.*?if \(shouldSyncJobs\) {', """  const urgencyText =
    daysLeft !== null
      ? daysLeft <= 0
        ? ' · Deadline today'
        : daysLeft <= 3
          ? ` · ${daysLeft}d left to apply`
          : daysLeft <= 14
            ? ` · ${daysLeft} days left`
            : ''
      : '';

  return `${skillText}${stipendText}${urgencyText}`;
}

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Try cache first
  const cacheKey = `feed:${user.id}`;
  // Temporarily bypass cache so F5 works immediately
  // const cached = await withFallback(() => redis.get(cacheKey), null);
  // if (cached) {
  //   return NextResponse.json(cached);
  // }

  const [{ data: userProfile }, { data: githubCache }] = await Promise.all([
    supabase
      .from('users')
      .select('college, semester, subjects, cgpa, github_username, pro_status, pro_expires_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('github_cache')
      .select('languages, repos')
      .eq('user_id', user.id)
      .single(),
  ]);

  const isPro = Boolean(userProfile?.pro_status) &&
    (!userProfile?.pro_expires_at || new Date(userProfile.pro_expires_at) > new Date());

  const shouldSyncJobs =
    Boolean(process.env.APIFY_TOKEN) &&
    ((userProfile?.subjects?.length ?? 0) > 0 || Object.keys(githubCache?.languages ?? {}).length > 0);

  if (shouldSyncJobs) {""", content, flags=re.DOTALL)

with open('src/app/api/feed/route.ts', 'w', encoding='utf-8') as f:
    f.write(content)
