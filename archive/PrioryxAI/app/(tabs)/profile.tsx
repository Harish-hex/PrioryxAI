import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { SafeScrollView } from '@/components/layout/SafeScrollView';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { ContributionGraph } from '@/components/career/ContributionGraph';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import { AppHaptics } from '@/lib/haptics';

export default function ProfileScreen() {
  const { profile, isPro, signOut } = useAuth();
  const { stats, contributions, loadStats } = useProfile();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    loadStats();
  }, []);

  const handleSignOut = () => {
    AppHaptics.warning();
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of PrioryxAI?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/onboarding/auth');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <ScreenHeader
        title="Student Profile 👤"
        showAvatar={false}
        rightElement={
          <TouchableOpacity
            onPress={handleSignOut}
            style={[styles.logoutBtn, { backgroundColor: colors.surface2 }]}
          >
            <Text style={[Typography.captionSM, { color: colors.brandRed, fontWeight: '700' }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        }
      />

      <SafeScrollView>
        {/* User Card */}
        <View
          style={[
            styles.userCard,
            {
              backgroundColor: isDark ? colors.surface1 : colors.bgPrimary,
              borderColor: colors.separator,
            },
          ]}
        >
          <View style={styles.userTop}>
            <Avatar
              name={profile?.name || profile?.full_name || 'User'}
              uri={profile?.avatar_url}
              size={64}
            />

            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={[Typography.titleMD, { color: colors.labelPrimary }]} numberOfLines={1}>
                  {profile?.name || profile?.full_name || 'Engineering Student'}
                </Text>
                {isPro && <Badge label="PRO ✦" variant="pro" size="sm" />}
              </View>

              <Text style={[Typography.bodySM, { color: colors.labelSecondary, marginTop: 2 }]}>
                {profile?.college || 'College not set'} • Sem {profile?.semester || 6}
              </Text>

              {profile?.github_username && (
                <Text style={[Typography.captionLG, { color: colors.brandViolet, marginTop: 4 }]}>
                  @{profile.github_username}
                </Text>
              )}
            </View>
          </View>

          {!isPro && (
            <Button
              title="Upgrade to Pro (₹499/yr) ✦"
              onPress={() => router.push('/(modals)/upgrade')}
              variant="gradient"
              size="sm"
              style={{ marginTop: 16 }}
            />
          )}
        </View>

        {/* Recruiter Placement Snapshot */}
        <View
          style={[
            styles.snapshotCard,
            {
              backgroundColor: isDark ? colors.surface1 : colors.bgPrimary,
              borderColor: colors.separator,
            },
          ]}
        >
          <Text style={[Typography.captionLG, { color: colors.labelSecondary, fontWeight: '700' }]}>
            RECRUITER READINESS SCORE
          </Text>

          <View style={styles.scoreRow}>
            <ScoreRing
              score={profile?.placement_score || 78}
              size={84}
              strokeWidth={7}
              label="ATS Score"
            />

            <View style={styles.scoreBreakdown}>
              <View style={styles.breakdownItem}>
                <Text style={[Typography.captionSM, { color: colors.labelTertiary }]}>GitHub Health</Text>
                <Text style={[Typography.titleSM, { color: colors.labelPrimary }]}>
                  {stats?.health_score || 85}%
                </Text>
              </View>

              <View style={styles.breakdownItem}>
                <Text style={[Typography.captionSM, { color: colors.labelTertiary }]}>Weekly Solved</Text>
                <Text style={[Typography.titleSM, { color: colors.labelPrimary }]}>
                  {stats?.completed_this_week || 4} tasks
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* GitHub Commit Streak Heatmap */}
        <ContributionGraph
          days={contributions}
          streakDays={stats?.github_streak || 0}
        />

        {/* Quick Portal Links */}
        <View style={styles.portalLinks}>
          <TouchableOpacity
            onPress={() => router.push('/career/resume')}
            style={[styles.linkRow, { backgroundColor: isDark ? colors.surface1 : colors.bgPrimary, borderColor: colors.separator }]}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 20 }}>📄</Text>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.titleSM, { color: colors.labelPrimary }]}>
                Resume Intelligence & SWOT
              </Text>
              <Text style={[Typography.captionSM, { color: colors.labelSecondary }]}>
                View ATS analysis & missing keywords
              </Text>
            </View>
            <Text style={{ color: colors.labelTertiary }}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/career/coding/unified')}
            style={[styles.linkRow, { backgroundColor: isDark ? colors.surface1 : colors.bgPrimary, borderColor: colors.separator }]}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 20 }}>💻</Text>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.titleSM, { color: colors.labelPrimary }]}>
                Connected Coding Profiles
              </Text>
              <Text style={[Typography.captionSM, { color: colors.labelSecondary }]}>
                LeetCode, CodeChef, HackerRank
              </Text>
            </View>
            <Text style={{ color: colors.labelTertiary }}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/career/collab')}
            style={[styles.linkRow, { backgroundColor: isDark ? colors.surface1 : colors.bgPrimary, borderColor: colors.separator }]}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 20 }}>👥</Text>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.titleSM, { color: colors.labelPrimary }]}>
                Peer Collaboration & Duels
              </Text>
              <Text style={[Typography.captionSM, { color: colors.labelSecondary }]}>
                Study buddies & leaderboard rank
              </Text>
            </View>
            <Text style={{ color: colors.labelTertiary }}>→</Text>
          </TouchableOpacity>
        </View>
      </SafeScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Layout.radiusMD,
  },
  userCard: {
    padding: Layout.lg,
    borderRadius: Layout.radius2XL,
    borderWidth: 1,
    marginVertical: Layout.xs,
    ...Layout.cardShadow,
  },
  userTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  snapshotCard: {
    padding: Layout.lg,
    borderRadius: Layout.radius2XL,
    borderWidth: 1,
    marginVertical: Layout.xs,
    ...Layout.cardShadow,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 14,
  },
  scoreBreakdown: {
    gap: 12,
  },
  breakdownItem: {
    gap: 2,
  },
  portalLinks: {
    gap: 10,
    marginVertical: Layout.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: Layout.radiusXL,
    borderWidth: 1,
    gap: 12,
    ...Layout.cardShadow,
  },
});
