import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';
import { AppHaptics } from '@/lib/haptics';
import { router } from 'expo-router';

interface StatItem {
  id: string;
  label: string;
  value: string | number;
  emoji: string;
  highlight?: boolean;
}

interface ThisWeekStatsProps {
  stats: {
    pending_tasks: number;
    completed_this_week: number;
    overdue: number;
    github_streak: number;
  } | null;
  isPro?: boolean;
}

export function ThisWeekStats({ stats, isPro = false }: ThisWeekStatsProps) {
  const { colors, isDark } = useTheme();

  const statItems: StatItem[] = [
    {
      id: 'pending',
      label: 'Pending',
      value: stats?.pending_tasks ?? 0,
      emoji: '⏳',
    },
    {
      id: 'done',
      label: 'Done this week',
      value: stats?.completed_this_week ?? 0,
      emoji: '✅',
      highlight: true,
    },
    {
      id: 'overdue',
      label: 'Overdue',
      value: stats?.overdue ?? 0,
      emoji: '⚠️',
    },
    {
      id: 'github',
      label: 'GitHub Streak',
      value: isPro ? `${stats?.github_streak ?? 0}d` : 'Pro ✦',
      emoji: '🔥',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={[Typography.captionLG, { color: colors.labelSecondary, marginBottom: 8, fontWeight: '700' }]}>
        THIS WEEK
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {statItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => {
              AppHaptics.selection();
              if (item.id === 'github' && !isPro) {
                router.push('/(modals)/upgrade');
              }
            }}
            style={[
              styles.card,
              {
                backgroundColor: isDark ? colors.surface1 : colors.bgPrimary,
                borderColor: item.highlight ? 'rgba(124,58,237,0.3)' : colors.separator,
                borderWidth: item.highlight ? 1.5 : 1,
              },
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={[Typography.titleLG, { color: colors.labelPrimary, fontWeight: '800' }]}>
                {item.value}
              </Text>
            </View>

            <Text
              style={[
                Typography.captionSM,
                { color: colors.labelSecondary, marginTop: 4, fontWeight: '600' },
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Layout.xs,
  },
  scrollContent: {
    gap: 10,
    paddingRight: Layout.lg,
  },
  card: {
    width: 130,
    padding: 14,
    borderRadius: Layout.radiusXL,
    ...Layout.cardShadow,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emoji: {
    fontSize: 20,
  },
});
