import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';
import { AppHaptics } from '@/lib/haptics';

export function AddTaskBar() {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      onPress={() => {
        AppHaptics.light();
        router.push('/(modals)/add-task');
      }}
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.surface1 : colors.bgPrimary,
          borderColor: colors.separator,
        },
      ]}
      activeOpacity={0.85}
    >
      <View style={[styles.plusIcon, { backgroundColor: colors.brandViolet }]}>
        <Text style={styles.plusText}>+</Text>
      </View>

      <Text style={[Typography.bodyMD, { color: colors.labelSecondary, flex: 1 }]}>
        Add assignment, exam, or career goal...
      </Text>

      <View style={[styles.shortcutBadge, { backgroundColor: colors.surface2 }]}>
        <Text style={[Typography.captionSM, { color: colors.labelTertiary, fontWeight: '700' }]}>
          ⌘N
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderRadius: Layout.radiusXL,
    paddingHorizontal: 14,
    gap: 12,
    marginVertical: Layout.xs,
    ...Layout.cardShadow,
  },
  plusIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: -2,
  },
  shortcutBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
});
