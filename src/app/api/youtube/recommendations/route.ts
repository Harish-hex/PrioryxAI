export const maxDuration = 60;
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateRecommendations } from '@/lib/youtube/recommender';

export async function GET(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    let recommendations = [];

    if (forceRefresh) {
      // Clear existing non-saved, non-dismissed, non-watched to replace them?
      // Wait, the recommender logic just checks if fresh recs exist.
      // Since we want to force refresh, we just call it.
      // But we should probably delete the cache or let recommender handle it.
      // The recommender checks for recs in the last 6 hrs. If forceRefresh, we should bypass that.
      // Let's modify the recommender to accept forceRefresh, or we can just delete old recs here.
      await supabase
        .from('youtube_recommendations')
        .delete()
        .eq('user_id', user.id)
        .eq('saved_for_later', false)
        .eq('watched', false)
        .eq('dismissed', false);

      recommendations = await generateRecommendations(user.id);
    } else {
      recommendations = await generateRecommendations(user.id);
    }

    const groupedBy = {
      dsa_problem: recommendations.filter(r => r.category === 'dsa_problem'),
      tech_stack: recommendations.filter(r => r.category === 'tech_stack'),
      trending_tech: recommendations.filter(r => r.category === 'trending_tech'),
      system_design: recommendations.filter(r => r.category === 'system_design'),
      career_growth: recommendations.filter(r => r.category === 'career_growth'),
      project_tutorial: recommendations.filter(r => r.category === 'project_tutorial'),
      language: recommendations.filter(r => r.category === 'language'),
      certification_prep: recommendations.filter(r => r.category === 'certification_prep'),
    };

    const CURATED_VIDEOS = {
      'dsa_problem': [
        { videoId: 'pkYVOmU3MgA', title: 'Dynamic Programming - Full Course', channel: 'freeCodeCamp', duration: '5:02:46', views: '2.1M' },
        { videoId: 'RBSGKlAvoiM', title: 'Data Structures - Full Course for Beginners', channel: 'freeCodeCamp', duration: '9:36:57', views: '3.4M' },
        { videoId: 'B31LgI4Y4DQ', title: 'Graph Algorithms for Technical Interviews', channel: 'freeCodeCamp', duration: '2:52:26', views: '854K' },
        { videoId: 'tWVWeAqZ0WU', title: 'Binary Search - Full Course', channel: 'freeCodeCamp', duration: '3:05:00', views: '650K' },
      ],
      'tech_stack': [
        { videoId: 'w7ejDZ8SWv8', title: 'React JS Full Course 2024', channel: 'Traversy Media', duration: '1:49:00', views: '1.5M' },
        { videoId: 'Ke90Tje7VS0', title: 'Node.js Crash Course', channel: 'Traversy Media', duration: '1:30:49', views: '2.1M' },
        { videoId: 'f2EqECiTBL8', title: 'TypeScript Full Course', channel: 'Traversy Media', duration: '1:30:00', views: '920K' },
        { videoId: 'rHux0gMZ3Eg', title: 'Python for Beginners - Full Course', channel: 'Programming with Mosh', duration: '6:14:07', views: '4.2M' },
      ],
      'trending_tech': [
        { videoId: 'sFmi9AzF7E0', title: 'Build GPT From Scratch', channel: 'Andrej Karpathy', duration: '2:25:21', views: '3.1M' },
        { videoId: 'AhyznRSDjw8', title: 'Docker Tutorial for Beginners', channel: 'TechWorld with Nana', duration: '2:00:18', views: '2.8M' },
        { videoId: 'pTFZFxd5uri', title: 'LangChain Full Course - Build LLM Apps', channel: 'freeCodeCamp', duration: '6:53:00', views: '780K' },
        { videoId: '8aGhZQkoFbQ', title: 'Redis Crash Course', channel: 'Traversy Media', duration: '40:00', views: '680K' },
      ],
      'system_design': [
        { videoId: 'xpDnVSmNFX0', title: 'System Design for Beginners', channel: 'NeetCode', duration: '32:45', views: '720K' },
        { videoId: 'lX4CrbXMsNQ', title: 'System Design Interview - Step By Step', channel: 'freeCodeCamp', duration: '2:31:00', views: '1.1M' },
        { videoId: 'i53Gi_K3o7I', title: 'Microservices Explained', channel: 'TechWorld with Nana', duration: '32:00', views: '1.5M' },
      ],
      'career_growth': [
        { videoId: 'Mv5ALWA6zTk', title: 'How to Get a FAANG Job', channel: 'CS Dojo', duration: '15:00', views: '2.5M' },
        { videoId: 'GJsBn4Oys6c', title: 'Coding Interview Tips - How to Get Offers', channel: 'TechLead', duration: '12:00', views: '1.8M' },
        { videoId: 'BN3L7MvSAqY', title: 'Resume Tips for Software Engineers', channel: 'Clément Mihailescu', duration: '14:00', views: '900K' },
        { videoId: 'qIMFR7o7PHY', title: 'How to Prepare for Coding Interviews', channel: 'CS Dojo', duration: '18:00', views: '2.2M' },
      ],
      'language': [
        { videoId: '_uQrJ0TkZlc', title: 'Python Full Course - 12 Hours', channel: 'Programming with Mosh', duration: '12:10:00', views: '5.1M' },
        { videoId: 'W6NZfCO5SIk', title: 'JavaScript Full Course', channel: 'Programming with Mosh', duration: '7:21:00', views: '3.8M' },
        { videoId: 'GjqeZzvgsHc', title: 'Java Full Course', channel: 'Programming with Mosh', duration: '2:30:00', views: '3.2M' },
        { videoId: 'vLnPwxZdW4Y', title: 'C++ Full Course', channel: 'freeCodeCamp', duration: '31:00:00', views: '2.1M' },
      ],
    };

    const fallbackRecommendations = Object.entries(CURATED_VIDEOS).flatMap(([cat, vids]) => vids.map(v => ({
      id: `fallback-${v.videoId}`,
      video_id: v.videoId,
      title: v.title,
      channel_title: v.channel,
      thumbnails: { high: { url: `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg` } },
      view_count: v.views,
      duration: v.duration,
      category: cat,
      reasoning: "Hand-picked essential learning resource",
      relevance_score: 1,
      saved_for_later: false,
      watched: false,
      dismissed: false
    })));

    if (recommendations.length === 0) {
      recommendations = fallbackRecommendations;
      Object.keys(groupedBy).forEach(key => {
        (groupedBy as any)[key] = fallbackRecommendations.filter(r => r.category === key);
      });
    }

    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? Math.min(50, Math.max(1, parseInt(limitParam, 10))) : recommendations.length;
    const offset = (page - 1) * limit;
    const paginated = limitParam ? recommendations.slice(offset, offset + limit) : recommendations;

    return NextResponse.json({
      recommendations: paginated,
      groupedBy,
      generatedAt: new Date().toISOString(),
      totalCount: recommendations.length,
      ...(limitParam ? {
        pagination: {
          page,
          limit,
          total: recommendations.length,
          totalPages: Math.ceil(recommendations.length / limit),
          hasMore: offset + limit < recommendations.length,
        }
      } : {})
    });

  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    // Even if an error happens (e.g. YouTube API Key missing), we MUST return the fallback videos!
    
    const CURATED_VIDEOS = {
      'dsa_problem': [
        { videoId: 'pkYVOmU3MgA', title: 'Dynamic Programming - Full Course', channel: 'freeCodeCamp', duration: '5:02:46', views: '2.1M' },
        { videoId: 'RBSGKlAvoiM', title: 'Data Structures - Full Course for Beginners', channel: 'freeCodeCamp', duration: '9:36:57', views: '3.4M' },
        { videoId: 'B31LgI4Y4DQ', title: 'Graph Algorithms for Technical Interviews', channel: 'freeCodeCamp', duration: '2:52:26', views: '854K' },
        { videoId: 'tWVWeAqZ0WU', title: 'Binary Search - Full Course', channel: 'freeCodeCamp', duration: '3:05:00', views: '650K' },
      ],
      'tech_stack': [
        { videoId: 'w7ejDZ8SWv8', title: 'React JS Full Course 2024', channel: 'Traversy Media', duration: '1:49:00', views: '1.5M' },
        { videoId: 'Ke90Tje7VS0', title: 'Node.js Crash Course', channel: 'Traversy Media', duration: '1:30:49', views: '2.1M' },
        { videoId: 'f2EqECiTBL8', title: 'TypeScript Full Course', channel: 'Traversy Media', duration: '1:30:00', views: '920K' },
        { videoId: 'rHux0gMZ3Eg', title: 'Python for Beginners - Full Course', channel: 'Programming with Mosh', duration: '6:14:07', views: '4.2M' },
      ],
      'trending_tech': [
        { videoId: 'sFmi9AzF7E0', title: 'Build GPT From Scratch', channel: 'Andrej Karpathy', duration: '2:25:21', views: '3.1M' },
        { videoId: 'AhyznRSDjw8', title: 'Docker Tutorial for Beginners', channel: 'TechWorld with Nana', duration: '2:00:18', views: '2.8M' },
        { videoId: 'pTFZFxd5uri', title: 'LangChain Full Course - Build LLM Apps', channel: 'freeCodeCamp', duration: '6:53:00', views: '780K' },
        { videoId: '8aGhZQkoFbQ', title: 'Redis Crash Course', channel: 'Traversy Media', duration: '40:00', views: '680K' },
      ],
      'system_design': [
        { videoId: 'xpDnVSmNFX0', title: 'System Design for Beginners', channel: 'NeetCode', duration: '32:45', views: '720K' },
        { videoId: 'lX4CrbXMsNQ', title: 'System Design Interview - Step By Step', channel: 'freeCodeCamp', duration: '2:31:00', views: '1.1M' },
        { videoId: 'i53Gi_K3o7I', title: 'Microservices Explained', channel: 'TechWorld with Nana', duration: '32:00', views: '1.5M' },
      ],
      'career_growth': [
        { videoId: 'Mv5ALWA6zTk', title: 'How to Get a FAANG Job', channel: 'CS Dojo', duration: '15:00', views: '2.5M' },
        { videoId: 'GJsBn4Oys6c', title: 'Coding Interview Tips - How to Get Offers', channel: 'TechLead', duration: '12:00', views: '1.8M' },
        { videoId: 'BN3L7MvSAqY', title: 'Resume Tips for Software Engineers', channel: 'Clément Mihailescu', duration: '14:00', views: '900K' },
        { videoId: 'qIMFR7o7PHY', title: 'How to Prepare for Coding Interviews', channel: 'CS Dojo', duration: '18:00', views: '2.2M' },
      ],
      'language': [
        { videoId: '_uQrJ0TkZlc', title: 'Python Full Course - 12 Hours', channel: 'Programming with Mosh', duration: '12:10:00', views: '5.1M' },
        { videoId: 'W6NZfCO5SIk', title: 'JavaScript Full Course', channel: 'Programming with Mosh', duration: '7:21:00', views: '3.8M' },
        { videoId: 'GjqeZzvgsHc', title: 'Java Full Course', channel: 'Programming with Mosh', duration: '2:30:00', views: '3.2M' },
        { videoId: 'vLnPwxZdW4Y', title: 'C++ Full Course', channel: 'freeCodeCamp', duration: '31:00:00', views: '2.1M' },
      ],
    };

    const fallbackRecommendations = Object.entries(CURATED_VIDEOS).flatMap(([cat, vids]) => vids.map(v => ({
      id: `fallback-${v.videoId}`,
      video_id: v.videoId,
      title: v.title,
      channel_title: v.channel,
      thumbnails: { high: { url: `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg` } },
      view_count: v.views,
      duration: v.duration,
      category: cat,
      reasoning: "Hand-picked essential learning resource",
      relevance_score: 1,
      saved_for_later: false,
      watched: false,
      dismissed: false
    })));

    const groupedBy = {
      dsa_problem: fallbackRecommendations.filter(r => r.category === 'dsa_problem'),
      tech_stack: fallbackRecommendations.filter(r => r.category === 'tech_stack'),
      trending_tech: fallbackRecommendations.filter(r => r.category === 'trending_tech'),
      system_design: fallbackRecommendations.filter(r => r.category === 'system_design'),
      career_growth: fallbackRecommendations.filter(r => r.category === 'career_growth'),
      project_tutorial: fallbackRecommendations.filter(r => r.category === 'project_tutorial'),
      language: fallbackRecommendations.filter(r => r.category === 'language'),
      certification_prep: fallbackRecommendations.filter(r => r.category === 'certification_prep'),
    };

    return NextResponse.json({
      recommendations: fallbackRecommendations,
      groupedBy,
      generatedAt: new Date().toISOString(),
      totalCount: fallbackRecommendations.length,
      error: error.message
    });
  }
}
