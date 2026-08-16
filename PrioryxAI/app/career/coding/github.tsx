import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { SafeScrollView } from '@/components/layout/SafeScrollView';
import { ContributionGraph } from '@/components/career/ContributionGraph';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Badge } from '@/components/ui/Badge';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import { AppHaptics } from '@/lib/haptics';

interface RepoHealth {
  name: string;
  description: string;
  language: string;
  stars: number;
  health_score: number;
  improvements: string[];
}

const REPOS: RepoHealth[] = [
  {
    name: 'PrioryxAI',
    description: 'AI-powered academic & career command center for Indian engineering students.',
    language: 'TypeScript',
    stars: 18,
    health_score: 95,
    improvements: ['All checks passing', 'Clean architecture'],
  },
  {
    name: 'distributed-cache-go',
    description: 'In-memory LRU cache with consistent hashing and Raft consensus.',
    language: 'Go',
    stars: 8,
    health_score: 82,
    improvements: ['Add benchmark graphs to README', 'Add CI test workflow'],
  },
  {
    name: 'neural-style-transfer',
    description: 'PyTorch implementation of Gatys style transfer with VGG-19.',
    language: 'Python',
    stars: 4,
    health_score: 70,
    improvements: ['Add MIT License', 'Include requirements.txt'],
  },
];

export default function GitHubIntelligenceScreen() {
  const { profile } = useAuth();
  const { stats, contributions } = useProfile();
  const { colors, isDark } = useTheme();

  const handleOpenGitHub = async () => {
    AppHaptics.selection();
    const handle = profile?.github_username || 'codewithyug06';
    await WebBrowser.openBrowserAsync(`https://github.com/${handle}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <ScreenHeader
        title="GitHub Intelligence 🔑"
        subtitle="Repository health scores & commit consistency"
        showBack
        showAvatar={false}
      />

      <SafeScrollView>
        {/* Top GitHub Header */}
        <View
          style={[
            styles.githubBanner,
            {
              backgroundColor: isDark ? colors.surface1 : colors.bgPrimary,
              borderColor: colors.separator,
            },
          ]}
        >
          <View style={styles.bannerTop}>
            <Text style={{ fontSize: 36 }}>🐙</Text>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.titleMD, { color: colors.labelPrimary }]}>
                @{profile?.github_username || 'codewithyug06'}
              </Text>
              <Text style={[Typography.captionLG, { color: colors.brandViolet, marginTop: 2 }]}>
                Verified Developer Profile
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleOpenGitHub}
              style={[styles.viewProfileBtn, { backgroundColor: colors.surface2 }]}
            >
              <Text style={[Typography.captionLG, { color: colors.labelPrimary, fontWeight: '700' }]}>
                View ↗
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contribution Graph */}
        <ContributionGraph
          days={contributions}
          streakDays={stats?.github_streak || 14}
        />

        {/* Repositories Health List */}
        <Text style={[Typography.captionLG, { color: colors.labelSecondary, marginVertical: 10, fontWeight: '700' }]}>
          TOP REPOSITORIES HEALTH ({REPOS.length})
        </Text>

        <View style={styles.reposList}>
          {REPOS.map((repo) => (
            <View
              key={repo.name}
              style={[
                styles.repoCard,
                {
                  backgroundColor: isDark ? colors.surface1 : colors.bgPrimary,
                  borderColor: colors.separator,
                },
              ]}
            >
              <View style={styles.repoHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.titleSM, { color: colors.labelPrimary }]}>
                    {repo.name}
                  </Text>
                  <Text style={[Typography.bodySM, { color: colors.labelSecondary, marginTop: 2 }]} numberOfLines={2}>
                    {repo.description}
                  </Text>
                </View>

                <ScoreRing
                  score={repo.health_score}
                  size={52}
                  strokeWidth={5}
                />
              </View>

              <View style={styles.metaRow}>
                <Badge label={repo.language} variant="brand" size="sm" />
                <Text style={[Typography.captionSM, { color: colors.labelTertiary }]}>
                  ★ {repo.stars} stars
                </Text>
              </View>

              {repo.improvements.length > 0 && (
                <View style={styles.improvementsBox}>
                  {repo.improvements.map((imp, idx) => (
                    <Text
                      key={idx}
                      style={[
                        Typography.captionSM,
                        { color: repo.health_score >= 90 ? colors.brandEmerald : colors.brandAmber },
                      ]}
                    >
                      {repo.health_score >= 90 ? '✓' : '⚡'} {imp}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </SafeScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  githubBanner: {
    padding: Layout.lg,
    borderRadius: Layout.radius2XL,
    borderWidth: 1,
    marginVertical: Layout.xs,
    ...Layout.cardShadow,
  },
  bannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  viewProfileBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Layout.radiusMD,
  },
  reposList: {
    gap: 10,
  },
  repoCard: {
    padding: Layout.md,
    borderRadius: Layout.radiusXL,
    borderWidth: 1,
    ...Layout.cardShadow,
  },
  repoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  improvementsBox: {
    marginTop: 10,
    gap: 4,
  },
});
