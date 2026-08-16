import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';
import { Profile } from '@/stores/auth.store';

interface MemoryCardProps {
  profile: Profile | null;
}

export function MemoryCard({ profile }: MemoryCardProps) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.surface1 : colors.bgPrimary,
          borderColor: colors.separator,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={{ fontSize: 20 }}>🧠</Text>
        <Text style={[Typography.titleSM, { color: colors.labelPrimary }]}>
          AI Working Memory
        </Text>
      </View>

      <Text style={[Typography.bodySM, { color: colors.labelSecondary, marginTop: 6, lineHeight: 20 }]}>
        PrioryxAI remembers your context across conversations to tailor all recommendations:
      </Text>

      <View style={styles.detailsList}>
        <View style={styles.detailItem}>
          <Text style={[Typography.captionLG, { color: colors.labelTertiary }]}>College</Text>
          <Text style={[Typography.bodySM, { color: colors.labelPrimary, fontWeight: '600' }]}>
            {profile?.college || 'Not set'}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={[Typography.captionLG, { color: colors.labelTertiary }]}>Semester</Text>
          <Text style={[Typography.bodySM, { color: colors.labelPrimary, fontWeight: '600' }]}>
            {profile?.semester ? `Semester ${profile.semester}` : 'Not set'}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={[Typography.captionLG, { color: colors.labelTertiary }]}>GitHub</Text>
          <Text style={[Typography.bodySM, { color: colors.brandViolet, fontWeight: '600' }]}>
            {profile?.github_username ? `@${profile.github_username}` : 'Not connected'}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={[Typography.captionLG, { color: colors.labelTertiary }]}>Tier</Text>
          <Text style={[Typography.bodySM, { color: profile?.subscription_status === 'pro' ? colors.brandCyan : colors.labelSecondary, fontWeight: '700' }]}>
            {profile?.subscription_status === 'pro' ? 'PRO PLAN ✦' : 'FREE PLAN'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Layout.lg,
    borderRadius: Layout.radius2XL,
    borderWidth: 1,
    marginVertical: Layout.xs,
    ...Layout.cardShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsList: {
    marginTop: 14,
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
});
