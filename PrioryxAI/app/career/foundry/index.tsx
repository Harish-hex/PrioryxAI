import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { SafeScrollView } from '@/components/layout/SafeScrollView';
import { ProjectCard, FoundryProject } from '@/components/career/ProjectCard';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';
import { AppHaptics } from '@/lib/haptics';

const PROJECTS: FoundryProject[] = [
  {
    id: '1',
    title: 'High-Throughput Distributed Rate Limiter',
    description:
      'Implements Token Bucket and Sliding Window algorithms in Go with Redis caching cluster and Docker Compose.',
    tier: 'intermediate',
    tech_stack: ['Go', 'Redis', 'Docker', 'gRPC'],
    current_phase: 3,
    total_phases: 6,
  },
  {
    id: '2',
    title: 'Real-Time Collaborative Markdown Editor',
    description:
      'Multiplayer document editor using Conflict-Free Replicated Data Types (CRDT), WebSockets, and Node.js.',
    tier: 'advanced',
    tech_stack: ['TypeScript', 'Node.js', 'WebSockets', 'CRDT', 'PostgreSQL'],
    current_phase: 1,
    total_phases: 6,
  },
  {
    id: '3',
    title: 'AI Resume Semantic Matcher & Parser',
    description:
      'Vector embeddings and OpenAI API integration to extract skills and compute cosine similarity against job postings.',
    tier: 'foundation',
    tech_stack: ['Python', 'FastAPI', 'pgvector', 'OpenAI API'],
    current_phase: 4,
    total_phases: 6,
  },
];

export default function ProjectFoundryScreen() {
  const [selectedTier, setSelectedTier] = useState<'all' | 'foundation' | 'intermediate' | 'advanced'>('all');
  const { colors } = useTheme();

  const filteredProjects =
    selectedTier === 'all'
      ? PROJECTS
      : PROJECTS.filter((p) => p.tier === selectedTier);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <ScreenHeader
        title="Project Foundry 🔨"
        subtitle="6-phase guided portfolio projects with AI Mentor"
        showBack
        showAvatar={false}
      />

      <View style={styles.filterRow}>
        {(['all', 'foundation', 'intermediate', 'advanced'] as const).map((tier) => (
          <TouchableOpacity
            key={tier}
            onPress={() => {
              AppHaptics.selection();
              setSelectedTier(tier);
            }}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedTier === tier ? colors.brandViolet : colors.surface2,
                borderColor:
                  selectedTier === tier ? colors.brandViolet : colors.separator,
              },
            ]}
          >
            <Text
              style={[
                Typography.captionLG,
                {
                  color: selectedTier === tier ? '#FFFFFF' : colors.labelPrimary,
                  textTransform: 'capitalize',
                  fontWeight: '700',
                },
              ]}
            >
              {tier}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SafeScrollView>
        <View style={styles.list}>
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onPress={(id) => router.push(`/career/foundry/${id}` as any)}
            />
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Layout.lg,
    gap: 8,
    paddingBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Layout.radiusFull,
    borderWidth: 1,
  },
  list: {
    gap: 8,
  },
});
