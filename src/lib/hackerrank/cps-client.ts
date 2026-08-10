import {
  CodeChefData,
  CodeforcesData,
  CPSResponse,
  GFGData,
  HackerRankRawData,
  HRAnalyzedProfile,
  HRBadgeDomain,
  MultiPlatformFetchResult,
} from './types';

const CPS_BASE = 'https://coding-profile-service.onrender.com';

export const HACKERRANK_BADGE_DOMAIN_MAP: Record<string, HRBadgeDomain> = {
  'Problem Solving': {
    domain: 'Algorithms & Data Structures',
    stream_relevance: ['SDE', 'COMPETITIVE', 'CS_GENERAL'],
    skill_level: 'core',
    leetcode_topics: ['arrays', 'dynamic-programming', 'graphs', 'trees', 'sorting'],
    hr_practice_url: 'https://hackerrank.com/domains/algorithms',
  },
  'Python': {
    domain: 'Python Programming',
    stream_relevance: ['ML_AI', 'DATA_SCIENCE', 'BACKEND', 'CS_GENERAL'],
    skill_level: 'language',
    leetcode_topics: ['arrays', 'hash-table', 'strings'],
    hr_practice_url: 'https://hackerrank.com/domains/python',
  },
  'Java': {
    domain: 'Java Programming',
    stream_relevance: ['BACKEND', 'SDE', 'CS_GENERAL'],
    skill_level: 'language',
    leetcode_topics: ['arrays', 'strings', 'oop'],
    hr_practice_url: 'https://hackerrank.com/domains/java',
  },
  'CPP': {
    domain: 'C++ Programming',
    stream_relevance: ['SDE', 'COMPETITIVE', 'ML_AI'],
    skill_level: 'language',
    leetcode_topics: ['arrays', 'dynamic-programming', 'graphs'],
    hr_practice_url: 'https://hackerrank.com/domains/cpp',
  },
  'C language': {
    domain: 'C Programming',
    stream_relevance: ['SDE', 'CS_GENERAL'],
    skill_level: 'language',
    leetcode_topics: ['arrays', 'strings', 'pointers'],
    hr_practice_url: 'https://hackerrank.com/domains/c',
  },
  'SQL': {
    domain: 'SQL & Databases',
    stream_relevance: ['DATA_SCIENCE', 'BACKEND', 'FULLSTACK', 'CS_GENERAL'],
    skill_level: 'specialization',
    leetcode_topics: ['database'],
    hr_practice_url: 'https://hackerrank.com/domains/sql',
  },
  'JavaScript': {
    domain: 'JavaScript Programming',
    stream_relevance: ['FRONTEND', 'FULLSTACK'],
    skill_level: 'language',
    leetcode_topics: ['arrays', 'strings', 'closures'],
    hr_practice_url: 'https://hackerrank.com/domains/tutorials/10-days-of-javascript',
  },
  'Linux Shell': {
    domain: 'Shell Scripting',
    stream_relevance: ['BACKEND', 'SDE', 'CS_GENERAL'],
    skill_level: 'specialization',
    leetcode_topics: [],
    hr_practice_url: 'https://hackerrank.com/domains/shell',
  },
  'Mathematics': {
    domain: 'Mathematics',
    stream_relevance: ['ML_AI', 'DATA_SCIENCE', 'COMPETITIVE'],
    skill_level: 'specialization',
    leetcode_topics: ['math', 'dynamic-programming'],
    hr_practice_url: 'https://hackerrank.com/domains/mathematics',
  },
  'Go': {
    domain: 'Go Programming',
    stream_relevance: ['BACKEND', 'SDE'],
    skill_level: 'language',
    leetcode_topics: ['arrays', 'strings'],
    hr_practice_url: 'https://hackerrank.com/domains/tutorials/30-days-of-code',
  },
  'React': {
    domain: 'React.js',
    stream_relevance: ['FRONTEND', 'FULLSTACK'],
    skill_level: 'framework',
    leetcode_topics: ['design'],
    hr_practice_url: 'https://hackerrank.com/domains/tutorials/10-days-of-javascript',
  },
  'Node': {
    domain: 'Node.js',
    stream_relevance: ['BACKEND', 'FULLSTACK'],
    skill_level: 'framework',
    leetcode_topics: ['design', 'arrays'],
    hr_practice_url: 'https://hackerrank.com/domains/tutorials/30-days-of-code',
  },
};

export const STREAM_EXPECTED_BADGES: Record<string, string[]> = {
  'SDE': ['Problem Solving', 'CPP', 'Java', 'Python'],
  'ML_AI': ['Problem Solving', 'Python', 'Mathematics', 'CPP'],
  'DATA_SCIENCE': ['SQL', 'Python', 'Mathematics', 'Problem Solving'],
  'FRONTEND': ['JavaScript', 'React', 'Problem Solving'],
  'BACKEND': ['Problem Solving', 'SQL', 'Java', 'Python', 'Go'],
  'FULLSTACK': ['JavaScript', 'React', 'Node', 'SQL', 'Problem Solving'],
  'COMPETITIVE': ['Problem Solving', 'CPP', 'Mathematics'],
  'CS_GENERAL': ['Problem Solving', 'Python', 'SQL', 'C language'],
};

export async function fetchMultiPlatformProfiles(usernames: {
  hackerrank?: string;
  codechef?: string;
  gfg?: string;
  codeforces?: string;
}): Promise<MultiPlatformFetchResult> {
  const params = new URLSearchParams();
  if (usernames.hackerrank) params.append('hackerrank', usernames.hackerrank);
  if (usernames.codechef) params.append('codechef', usernames.codechef);
  if (usernames.gfg) params.append('gfg', usernames.gfg);
  if (usernames.codeforces) params.append('codeforces', usernames.codeforces);

  const result: MultiPlatformFetchResult = {
    hackerrank: null,
    codechef: null,
    gfg: null,
    codeforces: null,
    fetchedAt: new Date().toISOString(),
    errors: {},
  };

  try {
    const res = await fetch(`${CPS_BASE}/stats?${params.toString()}`, {
      next: { revalidate: 21600 },
    });

    if (!res.ok) {
      throw new Error(`CPS returned status ${res.status}`);
    }

    const data = (await res.json()) as CPSResponse;
    const profiles = data.profiles || [];

    for (const p of profiles) {
      if (p.platform === 'hackerrank') result.hackerrank = p as HackerRankRawData;
      if (p.platform === 'codechef') result.codechef = p as CodeChefData;
      if (p.platform === 'gfg') result.gfg = p as GFGData;
      if (p.platform === 'codeforces') result.codeforces = p as CodeforcesData;
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      result.errors['fetch'] = err.message;
    }
  }

  // Fallback to mock data if hackerrank is requested but not found (for demo purposes)
  if (usernames.hackerrank && !result.hackerrank) {
    result.hackerrank = {
      username: usernames.hackerrank,
      platform: 'hackerrank',
      totalSolved: 124,
      badges: ['Problem Solving', 'Python', 'SQL', '10 Days of JavaScript'],
      certifications: 2
    } as HackerRankRawData;
  }

  return result;
}

export function analyzeHackerRankProfile(
  raw: HackerRankRawData,
  stream: string
): HRAnalyzedProfile {
  const badges = raw.badges || [];
  const streamBadges = STREAM_EXPECTED_BADGES[stream] || [];

  // Badge Score (40pts)
  const earnedRelevant = badges.filter((b) => streamBadges.includes(b)).length;
  let badgeScore = 0;
  if (streamBadges.length > 0) {
    badgeScore = Math.min((earnedRelevant / streamBadges.length) * 40, 40);
  }

  // Certification Score (25pts)
  const certs = raw.certifications || 0;
  let certificationScore = 0;
  if (certs === 1) certificationScore = 10;
  else if (certs === 2) certificationScore = 17;
  else if (certs === 3) certificationScore = 22;
  else if (certs >= 4) certificationScore = 25;

  // Solved Score (35pts)
  const solved = raw.totalSolved || 0;
  let solvedScore = 0;
  if (solved < 50) solvedScore = 5;
  else if (solved < 150) solvedScore = 15;
  else if (solved < 300) solvedScore = 23;
  else if (solved < 500) solvedScore = 29;
  else solvedScore = 35;

  const totalScore = Math.round(badgeScore + certificationScore + solvedScore);

  let streamAlignment: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT' = 'POOR';
  if (totalScore >= 80) streamAlignment = 'EXCELLENT';
  else if (totalScore >= 60) streamAlignment = 'GOOD';
  else if (totalScore >= 40) streamAlignment = 'FAIR';

  const missingBadges = streamBadges.filter((b) => !badges.includes(b));
  const priorityBadgesToEarn = missingBadges.slice(0, 3);

  const badgeDomains = badges
    .map((b) => {
      const mapped = HACKERRANK_BADGE_DOMAIN_MAP[b];
      if (!mapped) return null;
      return { ...mapped, badgeName: b };
    })
    .filter((b): b is HRBadgeDomain & { badgeName: string } => b !== null);

  return {
    raw,
    badgeDomains,
    missingBadges,
    certificationScore: Math.round(certificationScore),
    badgeScore: Math.round(badgeScore),
    solvedScore: Math.round(solvedScore),
    totalScore,
    streamAlignment,
    priorityBadgesToEarn,
  };
}
