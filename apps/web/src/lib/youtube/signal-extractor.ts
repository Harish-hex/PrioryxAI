import { createClient } from '@/lib/supabase/server';
import { TopicSignal, VideoCategory } from './types';
import { getTrendingSignals } from './trending';

const COMPANY_TECH_MAP: Record<string, string[]> = {
  'Google': ['system design', 'distributed systems', 'algorithms'],
  'Meta': ['react', 'system design', 'algorithms'],
  'Amazon': ['system design', 'AWS', 'java'],
  'Microsoft': ['azure', 'system design', 'dotnet'],
  'Apple': ['swift', 'system design', 'algorithms'],
  'Stripe': ['distributed systems', 'payments api', 'ruby'],
  'Flipkart': ['system design', 'java', 'microservices'],
  'Swiggy': ['golang', 'system design', 'kafka'],
  'Zomato': ['system design', 'nodejs', 'react'],
  'NVIDIA': ['cuda programming', 'GPU architecture', 'C++'],
  'Anthropic': ['LLM fine-tuning', 'transformer architecture', 'python ML']
};

function buildDSAQuery(topic: string, stream: string): string {
  if (stream.includes('ML_AI')) return `${topic} machine learning application tutorial`;
  if (stream.includes('COMPETITIVE')) return `${topic} competitive programming tricks advanced`;
  return `${topic} leetcode explained tutorial 2026`;
}

function buildSkillQuery(gap: string, companies: string[]): string {
  return `${gap} tutorial complete guide ${companies[0] ?? ''} interview 2026`;
}

function buildBadgeQuery(badge: string): string {
  const map: Record<string, string> = {
    'Problem Solving': 'data structures algorithms complete course',
    'Python': 'python programming full course 2026',
    'SQL': 'SQL complete tutorial advanced queries',
    'CPP': 'C++ programming tutorial competitive',
    'Java': 'Java programming complete course',
    'JavaScript': 'JavaScript complete course modern',
    'Mathematics': 'discrete mathematics for programming',
  };
  return map[badge] ?? `${badge} tutorial complete 2026`;
}

function detectCategory(skill: string): VideoCategory {
  const langKeywords = ['python','java','javascript','typescript','c++','go','rust'];
  const lower = skill.toLowerCase();
  if (langKeywords.some(k => lower.includes(k))) return 'language';
  if (lower.includes('system design')) return 'system_design';
  return 'tech_stack';
}

export async function extractUserSignals(userId: string): Promise<TopicSignal[]> {
  const supabase = createClient();
  const signals: TopicSignal[] = [];
  
  try {
    // Parallel fetching of all required profile data
    const [
      { data: profile },
      { data: leetcodeProfile },
      { data: resume },
      { data: multiProfile },
      { data: projects }
    ] = await Promise.all([
      supabase.from('users').select('stream, target_companies').eq('id', userId).single(),
      supabase.from('leetcode_profiles').select('ai_analysis').eq('id', userId).single(),
      supabase.from('user_resumes').select('swot').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('multi_platform_profiles').select('missingBadges').eq('id', userId).single(),
      supabase.from('user_projects').select('tech_stack').eq('user_id', userId).eq('verified', false).order('phase', { ascending: true }).limit(1).maybeSingle()
    ]);

    const stream = profile?.stream || '';
    const targetCompanies = profile?.target_companies || [];

    // SOURCE 1: LeetCode Weak Topics
    if (leetcodeProfile?.ai_analysis?.priority_topics) {
      const weakTopics = leetcodeProfile.ai_analysis.priority_topics
        .filter((t: any) => t.priority === 'CRITICAL' || t.priority === 'HIGH')
        .slice(0, 3);
      
      for (const topic of weakTopics) {
        signals.push({
          topic: topic.topic,
          source: 'leetcode_weak',
          priority: topic.priority,
          searchQuery: buildDSAQuery(topic.topic, stream),
          category: 'dsa_problem',
          reason: `Weak area in LeetCode: ${topic.topic}`
        });
      }
    }

    // SOURCE 2: Resume Skill Gaps
    if (resume?.swot?.critical_gaps) {
      const gaps = resume.swot.critical_gaps.slice(0, 3);
      for (const gap of gaps) {
        signals.push({
          topic: gap,
          source: 'skill_gap',
          priority: 'HIGH',
          searchQuery: buildSkillQuery(gap, targetCompanies),
          category: detectCategory(gap),
          reason: `Identified as a critical skill gap in your resume analysis`
        });
      }
    }

    // SOURCE 3: HackerRank Missing Badges
    if (multiProfile?.missingBadges) {
      const missing = multiProfile.missingBadges.slice(0, 2);
      for (const badge of missing) {
        signals.push({
          topic: badge,
          source: 'hackerrank_missing',
          priority: 'HIGH',
          searchQuery: buildBadgeQuery(badge),
          category: 'language',
          reason: `Missing HackerRank badge needed for ${stream || 'your career stream'}`
        });
      }
    }

    // SOURCE 4: Active Project Tech Stack
    if (projects?.tech_stack) {
      const techStack = projects.tech_stack.slice(0, 2);
      for (const tech of techStack) {
        signals.push({
          topic: tech,
          source: 'project_phase',
          priority: 'MEDIUM',
          searchQuery: `${tech} tutorial for beginners project 2026`,
          category: 'project_tutorial',
          reason: `You're using ${tech} in your active Foundry project`
        });
      }
    }

    // SOURCE 5: Target Company Tech Stack
    if (targetCompanies.length > 0) {
      const topCompany = targetCompanies[0];
      // Normalize case for matching map
      const companyKey = Object.keys(COMPANY_TECH_MAP).find(k => k.toLowerCase() === topCompany.toLowerCase());
      
      if (companyKey) {
        const companyTechs = COMPANY_TECH_MAP[companyKey].slice(0, 2);
        for (const tech of companyTechs) {
          signals.push({
            topic: tech,
            source: 'company_prep',
            priority: 'HIGH',
            searchQuery: `${tech} interview preparation ${companyKey} 2026`,
            category: tech.includes('system design') ? 'system_design' : 'tech_stack',
            reason: `${companyKey} interviews heavily test ${tech}`
          });
        }
      }
    }

    // SOURCE 6: Trending Tech
    const trendingSignals = await getTrendingSignals(stream, targetCompanies);
    signals.push(...trendingSignals);

    // Deduplicate by topic (case-insensitive), keeping higher priority
    const priorityValues = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    
    const uniqueMap = new Map<string, TopicSignal>();
    for (const signal of signals) {
      const key = signal.topic.toLowerCase();
      const existing = uniqueMap.get(key);
      if (!existing || priorityValues[signal.priority] > priorityValues[existing.priority]) {
        uniqueMap.set(key, signal);
      }
    }

    // Return up to 12 signals max
    return Array.from(uniqueMap.values()).slice(0, 12);

  } catch (error) {
    console.error('Error extracting user signals:', error);
    return [];
  }
}
