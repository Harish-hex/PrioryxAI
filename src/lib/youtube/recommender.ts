import { createClient } from '@/lib/supabase/server';
import { RecommendedVideo, TopicSignal, YouTubeVideo } from './types';
import { extractUserSignals } from './signal-extractor';
import { searchYouTubeVideos } from './fetcher';
import { openai, sanitize } from '@/lib/openai';
import { redis } from '@/lib/redis';
import { v4 as uuidv4 } from 'uuid';

async function generateWhyRecommended(
  video: YouTubeVideo,
  signal: TopicSignal,
  context: { stream: string; placementScore: number }
): Promise<string> {
  const cacheKey = `yt_why:${video.videoId}:${Buffer.from(signal.topic).toString('base64')}`;
  
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return cached as string;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 60,
      messages: [
        {
          role: 'user',
          content: `In one sentence, explain why '${sanitize(video.title)}' by ${sanitize(video.channelName)} is relevant for a ${sanitize(context.stream)} student with placement score ${context.placementScore}/100 who needs to improve ${sanitize(signal.topic)}. Be specific and motivating. Max 20 words.`
        }
      ]
    });

    const why = response.choices[0]?.message?.content?.trim() || `Highly recommended for your ${signal.category} goals.`;
    
    // Cache for 7 days
    await redis.setex(cacheKey, 60 * 60 * 24 * 7, why);
    
    return why;
  } catch (error) {
    console.error('Error generating whyRecommended:', error);
    return `Highly recommended for your ${signal.category} goals.`;
  }
}

export async function generateRecommendations(userId: string): Promise<RecommendedVideo[]> {
  const supabase = createClient();
  
  // 1. Get user context
  const { data: profile } = await supabase.from('profiles').select('stream').eq('id', userId).single();
  const { data: lcProfile } = await supabase.from('leetcode_profiles').select('placement_readiness_score').eq('id', userId).single();
  
  const context = {
    stream: profile?.stream || 'software engineering',
    placementScore: lcProfile?.placement_readiness_score || 50
  };

  // 2. Extract signals
  const signals = await extractUserSignals(userId);
  
  // 3. Check DB for fresh recommendations
  const { data: freshRecs } = await supabase
    .from('youtube_recommendations')
    .select('*')
    .eq('user_id', userId)
    .eq('dismissed', false)
    .gt('created_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20);
    
  if (freshRecs && freshRecs.length >= 10) {
    // Return mapped fresh recs from DB
    return freshRecs.map(rec => ({
      id: rec.id,
      userId: rec.user_id,
      video: {
        videoId: rec.video_id,
        title: rec.title,
        channelName: rec.channel_name,
        channelId: rec.channel_id,
        thumbnail: rec.thumbnail,
        duration: rec.duration,
        viewCount: rec.view_count,
        publishedAt: rec.published_at,
        description: '',
        tags: []
      },
      category: rec.category,
      source: rec.source,
      relevanceTopic: rec.relevance_topic,
      whyRecommended: rec.why_recommended,
      priority: rec.priority,
      estimatedLearningMinutes: rec.estimated_learning_minutes,
      watched: rec.watched,
      watchedAt: rec.watched_at,
      savedForLater: rec.saved_for_later,
      dismissed: rec.dismissed,
      createdAt: rec.created_at
    })) as RecommendedVideo[];
  }

  // 4. Fetch videos for top 8 signals
  const topSignals = signals.slice(0, 8);
  const candidates: Array<{ video: YouTubeVideo, signal: TopicSignal, why: string }> = [];

  // Fetch in parallel for speed
  const fetchPromises = topSignals.map(async (signal) => {
    const videos = await searchYouTubeVideos(signal, 3);
    for (const video of videos) {
      const why = await generateWhyRecommended(video, signal, context);
      candidates.push({ video, signal, why });
    }
  });

  await Promise.all(fetchPromises);

  // 5. AI ranking pass
  let rankedCandidates = candidates;
  if (candidates.length > 0) {
    try {
      const rankPrompt = candidates.map((c, i) => 
        `[${i}] Title: ${c.video.title} | Channel: ${c.video.channelName} | Topic: ${c.signal.topic} | Category: ${c.signal.category}`
      ).join('\n');

      const rankResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an AI ranking engine. Given a list of candidate YouTube videos, rank them by relevance for an engineering student. Output ONLY a comma-separated list of the bracketed indices (e.g. "3,0,1,5,2..."). Return all indices.' },
          { role: 'user', content: rankPrompt }
        ]
      });

      const orderStr = rankResponse.choices[0]?.message?.content?.trim();
      if (orderStr) {
        const orderIndices = orderStr.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n >= 0 && n < candidates.length);
        
        // Ensure all indices are present if the LLM skipped some
        const missing = candidates.map((_, i) => i).filter(i => !orderIndices.includes(i));
        const finalOrder = [...orderIndices, ...missing];
        
        rankedCandidates = finalOrder.map(i => candidates[i]);
      }
    } catch (e) {
      console.error('AI Ranking failed, using default sort', e);
    }
  }

  // 6. Deduplicate by videoId
  const uniqueVideos = new Map<string, RecommendedVideo>();
  
  for (const c of rankedCandidates) {
    if (!uniqueVideos.has(c.video.videoId)) {
      const rec: RecommendedVideo = {
        id: uuidv4(),
        userId,
        video: c.video,
        category: c.signal.category,
        source: c.signal.source,
        relevanceTopic: c.signal.topic,
        whyRecommended: c.why,
        priority: c.signal.priority,
        // Rough estimate of duration to minutes
        estimatedLearningMinutes: c.video.duration.includes(':') 
          ? parseInt(c.video.duration.split(':')[0]) * (c.video.duration.split(':').length === 3 ? 60 : 1)
          : 15,
        watched: false,
        savedForLater: false,
        dismissed: false,
        createdAt: new Date().toISOString()
      };
      uniqueVideos.set(c.video.videoId, rec);
    }
    if (uniqueVideos.size >= 20) break; // Limit to top 20
  }

  const finalRecs = Array.from(uniqueVideos.values());

  // 7. Store in DB
  if (finalRecs.length > 0) {
    const insertData = finalRecs.map(rec => ({
      id: rec.id,
      user_id: rec.userId,
      video_id: rec.video.videoId,
      title: rec.video.title,
      channel_name: rec.video.channelName,
      channel_id: rec.video.channelId,
      thumbnail: rec.video.thumbnail,
      duration: rec.video.duration,
      view_count: rec.video.viewCount,
      published_at: rec.video.publishedAt,
      category: rec.category,
      source: rec.source,
      relevance_topic: rec.relevanceTopic,
      why_recommended: rec.whyRecommended,
      priority: rec.priority,
      estimated_learning_minutes: rec.estimatedLearningMinutes,
      created_at: rec.createdAt
    }));

    await supabase.from('youtube_recommendations').insert(insertData);
  }

  return finalRecs;
}
