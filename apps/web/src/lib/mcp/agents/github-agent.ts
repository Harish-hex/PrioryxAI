import { AgentModule } from '../types';
import { createServiceClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai';

export const githubAgent: AgentModule = {
  name: 'GitHub Commit-Quality Agent',
  prefix: 'github',
  tools: [
    {
      name: 'analyzeRepositoryCommits',
      description: 'Analyzes the latest commits of a specific repository to determine quality, strengths, weaknesses, and priority actions.',
      inputSchema: {
        type: 'object',
        properties: {
          repo_name: { type: 'string', description: 'Name of the repository to analyze (e.g., "Pinn-FSI-Airfoil").' },
          github_username: { type: 'string', description: 'GitHub username of the user.' },
        },
        required: ['repo_name', 'github_username'],
      },
      handler: async (args: Record<string, unknown>, userId: string) => {
        const repoName = args.repo_name as string;
        const githubUsername = args.github_username as string;

        if (!repoName || !githubUsername || !userId) {
          throw new Error('Missing repo_name, github_username, or user context.');
        }

        const token = process.env.GITHUB_TOKEN;
        if (!token) {
          throw new Error('GITHUB_TOKEN environment variable is not configured.');
        }

        // 1. Fetch latest commits from GitHub API
        const ghRes = await fetch(`https://api.github.com/repos/${githubUsername}/${repoName}/commits?per_page=30`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': 'PrioryxAI-Agent',
            Accept: 'application/vnd.github.v3+json',
          },
        });

        if (!ghRes.ok) {
          throw new Error(`Failed to fetch commits for ${githubUsername}/${repoName}. Status: ${ghRes.status}`);
        }

        const commitsData = await ghRes.json();
        
        // 2. Prepare concise commit history for the LLM
        const recentCommits = commitsData.map((c: any) => ({
          message: c.commit.message,
          date: c.commit.author.date,
          author: c.commit.author.name,
        }));

        if (recentCommits.length === 0) {
          return { success: true, data: { message: 'No commits found in the repository.', grade: 'N/A' } };
        }

        // 3. Call OpenAI for analysis
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          response_format: { type: 'json_object' },
          max_tokens: 2500,
          temperature: 0.2,
          messages: [
            {
              role: 'system',
              content: `You are an elite Staff Software Engineer evaluating a junior developer's GitHub commits.
Analyse the provided recent commits for quality, message clarity, frequency, and professional standard.

Return JSON with exactly this schema:
{
  "total_score": number (0-100),
  "grade": string (e.g., "A", "B+", "C", "F"),
  "dimensions": {
    "message_quality": number (0-100),
    "commit_frequency": number (0-100),
    "size_appropriateness": number (0-100)
  },
  "strengths": [string],
  "weaknesses": [string],
  "career_relevance": {
    "ats_impact": string (how this looks to recruiters),
    "technical_depth": string (assessment of technical complexity based on messages)
  },
  "priority_actions": [
    {
      "action_title": string,
      "action_description": string,
      "weakness_category": string,
      "priority": string ("HIGH", "MEDIUM", "LOW"),
      "effort": string ("quick_fix", "half_day", "long_term"),
      "estimated_minutes": number,
      "impact_score": number (0-100),
      "impact_areas": [string],
      "ai_suggested_commands": string (e.g., "git commit -m 'feat: add login router'")
    }
  ]
}`,
            },
            {
              role: 'user',
              content: `Repository: ${githubUsername}/${repoName}\n\nRecent Commits:\n${JSON.stringify(recentCommits, null, 2)}`,
            },
          ],
        });

        const raw = completion.choices[0]?.message?.content ?? '{}';
        let analysis: any;
        try {
          analysis = JSON.parse(raw);
        } catch {
          throw new Error('Failed to parse AI analysis result as JSON.');
        }

        // 4. Upsert into Supabase tables
        const supabase = createServiceClient();

        // Upsert analysis
        const { error: analysisError } = await supabase
          .from('github_analysis')
          .upsert({
            user_id: userId,
            repo_name: repoName,
            total_score: analysis.total_score || 0,
            grade: analysis.grade || 'F',
            dimensions: analysis.dimensions || {},
            strengths: analysis.strengths || [],
            weaknesses: analysis.weaknesses || [],
            career_relevance: analysis.career_relevance || {},
            analysed_at: new Date().toISOString(),
          }, { onConflict: 'user_id, repo_name' });

        if (analysisError) {
          throw new Error(`Failed to save github_analysis: ${analysisError.message}`);
        }

        // Delete old priority actions for this repo and insert new ones
        await supabase
          .from('github_priority_actions')
          .delete()
          .match({ user_id: userId, repo_name: repoName });

        if (analysis.priority_actions && Array.isArray(analysis.priority_actions)) {
          const actionsToInsert = analysis.priority_actions.map((action: any) => ({
            user_id: userId,
            repo_name: repoName,
            repo_url: `https://github.com/${githubUsername}/${repoName}`,
            action_title: action.action_title,
            action_description: action.action_description,
            weakness_category: action.weakness_category || 'general',
            priority: action.priority || 'MEDIUM',
            effort: action.effort || 'half_day',
            estimated_minutes: action.estimated_minutes || 30,
            impact_score: action.impact_score || 50,
            impact_areas: action.impact_areas || [],
            ai_suggested_commands: action.ai_suggested_commands || null,
          }));

          const { error: actionsError } = await supabase
            .from('github_priority_actions')
            .insert(actionsToInsert);

          if (actionsError) {
             console.error('[github-agent] failed to save priority actions:', actionsError);
             // don't completely fail if just actions fail, but it's noted.
          }
        }

        return {
          success: true,
          data: {
            message: `Successfully analyzed ${repoName}. Total score: ${analysis.total_score}, Grade: ${analysis.grade}.`,
            grade: analysis.grade,
            actionsGenerated: analysis.priority_actions?.length || 0
          }
        };
      },
    },
  ],
};
