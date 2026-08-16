import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';
import { AppHaptics } from '@/lib/haptics';

interface SuggestedPromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

const PROMPTS = [
  '⚡ Prioritize my pending assignments for this week',
  '📄 Review my resume for ATS flaws and backend gaps',
  '💻 What 3 LeetCode problems should I solve today?',
  '🔨 Recommend a system design project for 6th semester',
  '🎯 How do I crack an off-campus SDE-1 interview?',
];

export function SuggestedPrompts({ onSelectPrompt }: SuggestedPromptsProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[Typography.captionSM, { color: colors.labelSecondary, marginBottom: 8, fontWeight: '700' }]}>
        SUGGESTIONS
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {PROMPTS.map((prompt) => (
          <TouchableOpacity
            key={prompt}
            onPress={() => {
              AppHaptics.selection();
              onSelectPrompt(prompt.slice(2)); // strip emoji
            }}
            style={[
              styles.chip,
              {
                backgroundColor: isDark ? colors.surface2 : colors.surface2,
                borderColor: colors.separator,
              },
            ]}
            activeOpacity={0.8}
          >
            <Text style={[Typography.captionLG, { color: colors.labelPrimary }]}>
              {prompt}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Layout.xs,
  },
  scroll: {
    gap: 8,
    paddingHorizontal: Layout.sm,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Layout.radiusFull,
    borderWidth: 1,
  },
});
