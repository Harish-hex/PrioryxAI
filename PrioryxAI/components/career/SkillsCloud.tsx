import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';

interface SkillsCloudProps {
  skills: string[];
  title?: string;
}

export function SkillsCloud({ skills = [], title = 'EXTRACTED SKILLS' }: SkillsCloudProps) {
  const { colors, isDark } = useTheme();

  if (skills.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[Typography.captionLG, { color: colors.labelSecondary, marginBottom: 8, fontWeight: '700' }]}>
        {title} ({skills.length})
      </Text>

      <View style={styles.cloud}>
        {skills.map((skill, idx) => (
          <View
            key={`${skill}-${idx}`}
            style={[
              styles.chip,
              {
                backgroundColor: isDark ? 'rgba(124,58,237,0.15)' : '#F5F3FF',
                borderColor: isDark ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.2)',
              },
            ]}
          >
            <Text style={[Typography.captionLG, { color: colors.brandViolet, fontWeight: '700' }]}>
              {skill}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Layout.xs,
  },
  cloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Layout.radiusFull,
    borderWidth: 1,
  },
});
