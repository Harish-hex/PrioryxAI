import { createClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai';
import { TopicSignal } from './types';

export async function getTrendingSignals(
  stream: string,
  targetCompanies: string[]
): Promise<TopicSignal[]> {
  try {
    const supabase = createClient();
    
    // Check cache
    const { data: cached } = await supabase
      .from('youtube_trending_cache')
      .select('signals')
      .eq('stream', stream)
      .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached && cached.signals) {
      return cached.signals as TopicSignal[];
    }

    // Call OpenAI
    const companiesStr = targetCompanies.length > 0 ? targetCompanies.join(', ') : 'top tech companies';
    const streamStr = stream || 'software engineering';
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a tech industry expert tracking what skills are trending in software engineering right now in August 2026. Return a JSON object with a single key "signals" containing an array of exactly 4 topic objects.'
        },
        {
          role: 'user',
          content: `A student targeting ${streamStr} roles at ${companiesStr} is learning right now. What are the top 4 trending technical topics they should learn in August 2026? Return ONLY JSON matching this structure for the array elements:
          {
            "topic": "LLM Fine-tuning",
            "searchQuery": "LLM fine-tuning tutorial LoRA 2026",
            "category": "trending_tech",
            "reason": "LLM fine-tuning is now expected in ML roles at top companies"
          }
          Focus on: tools released/updated in last 6 months, frameworks gaining traction, interview topics emerging at FAANG. No fluff.`
        }
      ]
    });

    const resultText = response.choices[0]?.message?.content;
    if (!resultText) throw new Error('No response from OpenAI');
    
    const parsed = JSON.parse(resultText);
    if (!parsed.signals || !Array.isArray(parsed.signals)) {
       throw new Error('Invalid JSON shape from OpenAI');
    }

    const newSignals: TopicSignal[] = parsed.signals.map((s: any) => ({
      ...s,
      source: 'trending',
      priority: 'MEDIUM',
    }));

    // Cache the result
    await supabase.from('youtube_trending_cache').insert({
      stream,
      signals: newSignals
    });

    return newSignals;
  } catch (error) {
    console.error('Error fetching trending signals:', error);
    return [];
  }
}
