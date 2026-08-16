import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AppHaptics } from '@/lib/haptics';

export interface FoundryProject {
  id: string;
  title: string;
  description: string;
  tier: 'foundation' | 'intermediate' | 'advanced';
  tech_stack: string[];
  current_phase?: number;
  total_phases?: number;
}

interface ProjectCardProps {
  project: FoundryProject;
  onPress: (id: string) => void;
}

export function ProjectCard({ project, onPress }: ProjectCardProps) {
  const { colors, isDark } = useTheme();
  const currentPhase = project.current_phase || 1;
  const totalPhases = project.total_phases || 6;
  const progress = currentPhase / totalPhases;

  return (
    <TouchableOpacity
      onPress={() => {
        AppHaptics.selection();
        onPress(project.id);
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
      <View style={styles.header}>
        <Badge
          label={project.tier.toUpperCase()}
          variant={project.tier === 'advanced' ? 'brand' : project.tier === 'intermediate' ? 'high' : 'low'}
          size="sm"
        />

        <Text style={[Typography.captionSM, { color: colors.labelSecondary, fontWeight: '700' }]}>
          Phase {currentPhase}/{totalPhases}
        </Text>
      </View>

      <Text
        style={[Typography.titleSM, { color: colors.labelPrimary, marginTop: 8 }]}
        numberOfLines={2}
      >
        {project.title}
      </Text>

      <Text
        style={[Typography.bodySM, { color: colors.labelSecondary, marginTop: 4, lineHeight: 20 }]}
        numberOfLines={2}
      >
        {project.description}
      </Text>

      <View style={styles.techRow}>
        {project.tech_stack.slice(0, 4).map((tech) => (
          <View
            key={tech}
            style={[styles.techBadge, { backgroundColor: colors.surface2 }]}
          >
            <Text style={[Typography.captionSM, { color: colors.labelSecondary, fontSize: 10 }]}>
              {tech}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.progressContainer}>
        <ProgressBar progress={progress} height={4} color={colors.brandViolet} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Layout.md,
    borderRadius: Layout.radiusXL,
    borderWidth: 1,
    marginVertical: 4,
    ...Layout.cardShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  techRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 10,
  },
  techBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  progressContainer: {
    marginTop: 12,
  },
});
