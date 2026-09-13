import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';

interface BadgeProps {
  label: string;
  variant?: 'urgent' | 'high' | 'medium' | 'low' | 'neutral' | 'brand' | 'pro';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({
  label,
  variant = 'neutral',
  size = 'md',
  style,
}: BadgeProps) {
  const { isDark, colors } = useTheme();

  const getBadgeColors = () => {
    switch (variant) {
      case 'urgent':
        return { bg: colors.urgentBg, text: colors.urgentText, border: colors.urgentBorder };
      case 'high':
        return { bg: colors.highBg, text: colors.highText, border: colors.highBorder };
      case 'medium':
        return { bg: colors.mediumBg, text: colors.mediumText, border: colors.mediumBorder };
      case 'low':
        return { bg: colors.lowBg, text: colors.lowText, border: colors.lowBorder };
      case 'brand':
        return { bg: 'rgba(124,58,237,0.12)', text: colors.brandViolet, border: 'rgba(124,58,237,0.25)' };
      case 'pro':
        return { bg: 'rgba(6,182,212,0.12)', text: colors.brandCyan, border: 'rgba(6,182,212,0.3)' };
      default:
        return { bg: colors.surface2, text: colors.labelSecondary, border: colors.separator };
    }
  };

  const c = getBadgeColors();
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: c.bg,
          borderColor: c.border,
          paddingHorizontal: isSmall ? 6 : 10,
          paddingVertical: isSmall ? 2 : 4,
          borderRadius: Layout.radiusFull,
        },
        style,
      ]}
    >
      <Text
        style={[
          isSmall ? Typography.captionSM : Typography.captionLG,
          { color: c.text, fontWeight: '700' },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
