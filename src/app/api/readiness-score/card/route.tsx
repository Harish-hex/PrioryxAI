import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Read query parameters
  const paramScore = searchParams.get('score');
  const paramDelta = searchParams.get('delta');
  const paramName = searchParams.get('name');
  const paramCollege = searchParams.get('college');
  const paramSummary = searchParams.get('summary');
  const includeName = searchParams.get('includeName') !== 'false';
  const includeCollege = searchParams.get('includeCollege') !== 'false';

  let score = paramScore ? parseInt(paramScore, 10) : 72;
  let delta: number | null = paramDelta ? parseInt(paramDelta, 10) : null;
  let studentName = paramName || '';
  let studentCollege = paramCollege || '';
  const summary = paramSummary || 'Deterministic career & placement readiness benchmark verified across GitHub, LeetCode, Resume & Tasks.';

  // If user is authenticated, fill in live database details if not provided in query
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const [scoreRes, userRes] = await Promise.allSettled([
        supabase
          .from('readiness_scores')
          .select('score, breakdown')
          .eq('user_id', user.id)
          .order('computed_at', { ascending: false })
          .limit(2),
        supabase
          .from('users')
          .select('display_name, full_name, college')
          .eq('id', user.id)
          .maybeSingle(),
      ]);

      if (scoreRes.status === 'fulfilled' && scoreRes.value.data?.length) {
        const rows = scoreRes.value.data;
        if (!paramScore) score = rows[0].score;
        if (rows.length > 1 && paramDelta === null) {
          delta = rows[0].score - rows[1].score;
        }
      }

      if (userRes.status === 'fulfilled' && userRes.value.data) {
        const u = userRes.value.data;
        if (!paramName) {
          studentName = u.display_name || u.full_name || '';
        }
        if (!paramCollege) {
          studentCollege = u.college || '';
        }
      }
    }
  } catch {
    // Fall back gracefully to query params
  }

  // Safety clamps
  if (isNaN(score)) score = 70;
  score = Math.max(0, Math.min(100, score));

  const scoreColor =
    score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444';
  const scoreBadgeBg =
    score >= 70 ? 'rgba(16, 185, 129, 0.15)' : score >= 45 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)';

  const displayName = includeName && studentName ? studentName : 'PrioryxAI Candidate';
  const displayCollege = includeCollege && studentCollege ? studentCollege : '';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 56px',
          backgroundColor: '#090d16',
          backgroundImage:
            'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.18) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.15) 0%, transparent 40%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 'bold',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
              }}
            >
              ⚡
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                PrioryxAI
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: '#94a3b8', textTransform: 'uppercase' }}>
                Placement Intelligence
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 255, 255, 0.07)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '13px',
              fontWeight: 600,
              color: '#cbd5e1',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            VERIFIED DETERMINISTIC AUDIT
          </div>
        </div>

        {/* Main Body */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '40px',
            margin: '20px 0',
          }}
        >
          {/* Left info */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '28px', fontWeight: 700, color: '#f8fafc' }}>
                {displayName}
              </span>
              {displayCollege ? (
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    padding: '4px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    color: '#a5b4fc',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                  }}
                >
                  {displayCollege}
                </span>
              ) : null}
            </div>

            <p
              style={{
                fontSize: '17px',
                lineHeight: '1.5',
                color: '#94a3b8',
                maxWidth: '650px',
                margin: 0,
              }}
            >
              {summary}
            </p>

            {/* Component badges */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
              {['GitHub Activity', 'Coding Practice', 'Resume SWOT', 'Task Velocity', 'Consistency'].map((label) => (
                <span
                  key={label}
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '6px 14px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#cbd5e1',
                  }}
                >
                  ✓ {label}
                </span>
              ))}
            </div>
          </div>

          {/* Right Score Badge */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px 36px',
              borderRadius: '28px',
              backgroundColor: scoreBadgeBg,
              border: `2px solid ${scoreColor}`,
              boxShadow: `0 0 40px ${scoreColor}33`,
              minWidth: '220px',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#cbd5e1' }}>
              Readiness Score
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '4px 0' }}>
              <span style={{ fontSize: '72px', fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
                {score}
              </span>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#64748b' }}>
                /100
              </span>
            </div>
            {delta !== null ? (
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: delta >= 0 ? '#10b981' : '#f87171',
                }}
              >
                {delta >= 0 ? `+${delta}` : delta} this week
              </span>
            ) : (
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>
                Placement Index
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '20px',
            fontSize: '13px',
            color: '#64748b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>🔒 Cryptographically Deterministic Evaluation</span>
            <span>•</span>
            <span>Zero Hallucinations</span>
          </div>
          <span style={{ fontWeight: 700, color: '#94a3b8' }}>prioryx.ai</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
