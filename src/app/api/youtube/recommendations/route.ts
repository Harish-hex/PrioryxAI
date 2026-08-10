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

    return NextResponse.json({
      recommendations,
      groupedBy,
      generatedAt: new Date().toISOString(),
      totalCount: recommendations.length
    });

  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
