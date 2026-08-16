import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';
import { Badge } from '@/components/ui/Badge';
import { AppHaptics } from '@/lib/haptics';

interface ProjectIdea {
  id: string;
  title: string;
  tier: 'foundation' | 'intermediate' | 'advanced';
  tech_stack: string[];
  impact: string;
}

const SAMPLE_IDEAS: ProjectIdea[] = [
  {
    id: '1',
    title: 'Distributed Rate Limiter in Go',
    tier: 'intermediate',
    tech_stack: ['Go', 'Redis', 'Docker'],
    impact: 'Demonstrates concurrency & system design for backend interviews.',
  },
  {
    id: '2',
    title: 'Real-Time Collaborative Code Editor',
    tier: 'advanced',
    tech_stack: ['TypeScript', 'WebSockets', 'OT/CRDT'],
    impact: 'High-signal fullstack architecture for top product teams.',
  },
  {
    id: '3',
    title: 'Neural Network Optimizer in Python',
    tier: 'foundation',
    tech_stack: ['Python', 'NumPy', 'PyTorch'],
    impact: 'Proves core ML mathematical fundamentals on your resume.',
  },
];

export function ProjectIdeasWidget({ isPro = false }: { isPro?: boolean }) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[Typography.captionLG, { color: colors.labelSecondary, fontWeight: '700' }]}>
          RESUME-GAP PROJECT FOUNDRY
        </Text>

        <TouchableOpacity
          onPress={() => {
            AppHaptics.selection();
            router.push('/career/foundry');
          }}
        >
          <Text style={[Typography.captionSM, { color: colors.brandViolet, fontWeight: '700' }]}>
            View all →
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {SAMPLE_IDEAS.map((idea) => (
          <TouchableOpacity
            key={idea.id}
            onPress={() => {
              AppHaptics.selection();
              router.push('/career/foundry');
            }}
            style={[
              styles.card,
              {
                backgroundColor: isDark ? colors.surface1 : colors.bgPrimary,
                borderColor: colors.separator,
              },
            ]}
            activeOpacity={0.88}
          >
            <View style={styles.badgeRow}>
              <Badge
                label={idea.tier.toUpperCase()}
                variant={idea.tier === 'advanced' ? 'brand' : idea.tier === 'intermediate' ? 'high' : 'low'}
                size="sm"
              />
            </View>

            <Text
              style={[
                Typography.titleSM,
                { color: colors.labelPrimary, marginTop: 8 },
              ]}
              numberOfLines={2}
            >
              {idea.title}
            </Text>

            <Text
              style={[
                Typography.captionSM,
                { color: colors.labelSecondary, marginTop: 6, lineHeight: 18 },
              ]}
              numberOfLines={2}
            >
              {idea.impact}
            </Text>

            <View style={styles.techStackRow}>
              {idea.tech_stack.map((tech) => (
                <View
                  key={tech}
                  style={[styles.techChip, { backgroundColor: colors.surface2 }]}
                >
                  <Text style={[Typography.captionSM, { color: colors.labelSecondary, fontSize: 10 }]}>
                    {tech}
                  </Text>
                </View>
              ))}
            </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scrollContent: {
    gap: 10,
    paddingRight: Layout.lg,
  },
  card: {
    width: 240,
    padding: 14,
    borderRadius: Layout.radiusXL,
    borderWidth: 1,
    ...Layout.cardShadow,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  techStackRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 12,
  },
  techChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
});
