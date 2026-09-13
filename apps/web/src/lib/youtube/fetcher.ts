import { redis } from '@/lib/redis';
import { TopicSignal, YouTubeVideo, VideoCategory } from './types';

const YT_BASE = 'https://www.googleapis.com/youtube/v3';
const API_KEY = process.env.YOUTUBE_API_KEY;

const TRUSTED_CHANNELS = [
  'UCVa4bnpgRbNnPYMwEGFJh5A', // NeetCode
  'UC_mB3bSM5NwpvFt2IxnXcNg', // Abdul Bari
  'UCnxhETjJtTPs37KCavpwDSw', // freeCodeCamp
  'UC8butISFwT-Wl7EV0hUK0BQ', // freeCodeCamp (alt)
  'UCWN3xxRkmTPmbKwht9FuE5A', // Fireship
  'UCbmNph6atAoGfqLoCL_duAg', // Traversy Media
  'UCW5YeuERMmlnqo4oq8vwUpg', // Code With Harry
  'UCsXVk37bltHxD1rDPwtNM8Q', // Kunal Kushwaha
  'UClEEsT7DkdVO_fkrBx0brHQ', // MIT OpenCourseWare
  'UCYO_jab_esuFRV4b17AJtAw', // 3Blue1Brown
  'UCJli7rFnNcCIFmjepBbJqyQ', // Jenny's Lectures
  'UC29ju8bIPH5as8OGnQzwJyA', // Traversy Media 2
];

const FALLBACK_VIDEOS: Record<VideoCategory, YouTubeVideo> = {
  'dsa_problem': { videoId: 'pkYVOmU3MgA', title: 'Dynamic Programming - Learn to Solve Algorithmic Problems', channelName: 'freeCodeCamp', channelId: '', thumbnail: 'https://i.ytimg.com/vi/pkYVOmU3MgA/mqdefault.jpg', duration: '5:10:00', viewCount: 1500000, publishedAt: '2023-01-01T00:00:00Z', description: '', tags: [] },
  'system_design': { videoId: 'xpDnVSmNFX0', title: 'System Design for Beginners Course', channelName: 'NeetCode', channelId: '', thumbnail: 'https://i.ytimg.com/vi/xpDnVSmNFX0/mqdefault.jpg', duration: '35:20', viewCount: 500000, publishedAt: '2023-01-01T00:00:00Z', description: '', tags: [] },
  'tech_stack': { videoId: 'w7ejDZ8SWv8', title: 'React JS Crash Course', channelName: 'Traversy Media', channelId: '', thumbnail: 'https://i.ytimg.com/vi/w7ejDZ8SWv8/mqdefault.jpg', duration: '1:48:00', viewCount: 2000000, publishedAt: '2021-01-01T00:00:00Z', description: '', tags: [] },
  'language': { videoId: '8jPQjjsBbIc', title: 'Python for Beginners - Full Course', channelName: 'Programming with Mosh', channelId: '', thumbnail: 'https://i.ytimg.com/vi/8jPQjjsBbIc/mqdefault.jpg', duration: '6:14:00', viewCount: 30000000, publishedAt: '2020-01-01T00:00:00Z', description: '', tags: [] },
  'trending_tech': { videoId: '5p248yoa3oE', title: 'Generative AI Full Course', channelName: 'freeCodeCamp', channelId: '', thumbnail: 'https://i.ytimg.com/vi/5p248yoa3oE/mqdefault.jpg', duration: '3:00:00', viewCount: 100000, publishedAt: '2024-01-01T00:00:00Z', description: '', tags: [] },
  'career_growth': { videoId: 'c_hO_fjm2RQ', title: 'How to create a Software Engineering Resume', channelName: 'NeetCode', channelId: '', thumbnail: 'https://i.ytimg.com/vi/c_hO_fjm2RQ/mqdefault.jpg', duration: '12:00', viewCount: 250000, publishedAt: '2023-01-01T00:00:00Z', description: '', tags: [] },
  'project_tutorial': { videoId: 'bMknfKXIFA8', title: 'React Course - Beginner\'s Tutorial for React', channelName: 'freeCodeCamp', channelId: '', thumbnail: 'https://i.ytimg.com/vi/bMknfKXIFA8/mqdefault.jpg', duration: '11:55:00', viewCount: 4000000, publishedAt: '2022-01-01T00:00:00Z', description: '', tags: [] },
  'certification_prep': { videoId: 'HXV3zeQKqGY', title: 'SQL Tutorial - Full Database Course for Beginners', channelName: 'freeCodeCamp', channelId: '', thumbnail: 'https://i.ytimg.com/vi/HXV3zeQKqGY/mqdefault.jpg', duration: '4:20:00', viewCount: 8000000, publishedAt: '2019-01-01T00:00:00Z', description: '', tags: [] },
};

function parseDuration(pt: string): string {
  // Convert ISO 8601 duration to MM:SS
  const match = pt.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  const h = parseInt(match[1] || '0', 10);
  const m = parseInt(match[2] || '0', 10);
  const s = parseInt(match[3] || '0', 10);
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getDurationMinutes(pt: string): number {
  const match = pt.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || '0', 10);
  const m = parseInt(match[2] || '0', 10);
  return (h * 60) + m;
}

export async function searchYouTubeVideos(
  signal: TopicSignal,
  maxResults: number = 3
): Promise<YouTubeVideo[]> {
  try {
    if (!API_KEY) {
      console.warn('YOUTUBE_API_KEY missing, using fallback');
      return [FALLBACK_VIDEOS[signal.category]];
    }

    const todayDate = new Date().toISOString().split('T')[0];
    const quotaKey = `yt_quota:${todayDate}`;
    
    // Check quota
    const currentQuotaStr = await redis.get(quotaKey);
    const currentQuota = currentQuotaStr ? parseInt(currentQuotaStr as string, 10) : 0;
    
    // Leave headroom under the real 10,000-unit daily quota for other callers.
    const DAILY_UNIT_BUDGET = 9000;
    const SEARCH_COST = 100; // search.list costs 100 units
    const LIST_COST = 1; // videos.list costs 1 unit

    if (currentQuota + SEARCH_COST + LIST_COST > DAILY_UNIT_BUDGET) {
      console.warn('YouTube API Quota exceeded for today, using fallback');
      return [FALLBACK_VIDEOS[signal.category]];
    }

    // Step 1: Search
    const searchUrl = `${YT_BASE}/search?part=snippet&q=${encodeURIComponent(signal.searchQuery)}&type=video&videoDuration=medium&videoDefinition=high&relevanceLanguage=en&order=relevance&maxResults=10&key=${API_KEY}`;
    const searchRes = await fetch(searchUrl);

    if (!searchRes.ok) {
       console.error('YouTube Search API failed', await searchRes.text());
       return [FALLBACK_VIDEOS[signal.category]];
    }

    // Increment quota by the real search.list cost (100 units)
    await redis.incrby(quotaKey, SEARCH_COST);
    // Rough estimation: if it's new key, set expire to 24h
    if (currentQuota === 0) await redis.expire(quotaKey, 60 * 60 * 24);

    const searchData = await searchRes.json();
    const videoIds = searchData.items?.map((i: any) => i.id?.videoId).filter(Boolean);
    
    if (!videoIds || videoIds.length === 0) {
      return [FALLBACK_VIDEOS[signal.category]];
    }

    // Step 2: Get Details
    const detailsUrl = `${YT_BASE}/videos?part=contentDetails,statistics,snippet&id=${videoIds.join(',')}&key=${API_KEY}`;
    const detailsRes = await fetch(detailsUrl);
    
    if (!detailsRes.ok) {
       console.error('YouTube Details API failed', await detailsRes.text());
       return [FALLBACK_VIDEOS[signal.category]];
    }

    // Increment quota by the real videos.list cost (1 unit)
    await redis.incrby(quotaKey, LIST_COST);
    
    const detailsData = await detailsRes.json();
    const videos = detailsData.items || [];

    // Step 3: Filter & Rank
    const rankedVideos = videos.map((video: any) => {
      const durationStr = video.contentDetails?.duration || '';
      const mins = getDurationMinutes(durationStr);
      const views = parseInt(video.statistics?.viewCount || '0', 10);
      const title = video.snippet?.title || '';
      const lowerTitle = title.toLowerCase();
      const channelId = video.snippet?.channelId || '';
      const publishedAt = video.snippet?.publishedAt || '';
      
      let score = 0;
      let valid = true;

      // Hard filters
      if (mins < 5) valid = false;
      if (mins > 180) valid = false;
      if (views < 10000) valid = false;
      if (lowerTitle.includes('shorts') || lowerTitle.includes('#shorts') || lowerTitle.includes('reaction') || lowerTitle.includes('meme') || lowerTitle.includes('funny')) valid = false;
      
      const publishedYear = new Date(publishedAt).getFullYear();
      if (publishedYear < 2022 && !signal.topic.toLowerCase().includes('binary search') && !signal.topic.toLowerCase().includes('algorithm')) {
         valid = false;
      }

      // Boosts
      if (TRUSTED_CHANNELS.includes(channelId)) score += 50;
      if (views > 500000) score += 30;
      else if (views > 100000) score += 15;
      
      if (publishedYear >= 2025) score += 20;
      if (mins >= 10 && mins <= 30) score += 10;
      if (lowerTitle.includes(signal.topic.toLowerCase())) score += 10;

      return { video, score, valid, mins, views, title, channelId, publishedAt };
    });

    const filtered = rankedVideos.filter((v: any) => v.valid).sort((a: any, b: any) => b.score - a.score).slice(0, maxResults);
    
    if (filtered.length === 0) {
      return [FALLBACK_VIDEOS[signal.category]];
    }

    // Step 4: Format
    return filtered.map((v: any) => {
      const vid = v.video;
      return {
        videoId: vid.id,
        title: v.title,
        channelName: vid.snippet?.channelTitle || '',
        channelId: v.channelId,
        thumbnail: `https://i.ytimg.com/vi/${vid.id}/mqdefault.jpg`,
        duration: parseDuration(vid.contentDetails?.duration || ''),
        viewCount: v.views,
        publishedAt: v.publishedAt,
        description: vid.snippet?.description || '',
        tags: vid.snippet?.tags || []
      };
    });

  } catch (error) {
    console.error('YouTube Fetcher Error:', error);
    return [FALLBACK_VIDEOS[signal.category]];
  }
}
