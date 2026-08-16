import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';
import { AppHaptics } from '@/lib/haptics';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'flat';
}

export function Card({
  children,
  onPress,
  style,
  variant = 'elevated',
}: CardProps) {
  const { isDark, colors } = useTheme();

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: isDark ? colors.surface1 : colors.bgPrimary,
          borderWidth: 1,
          borderColor: colors.separator,
        };
      case 'flat':
        return {
          backgroundColor: isDark ? colors.surface2 : colors.surface2,
        };
      default:
        return {
          backgroundColor: isDark ? colors.surface1 : colors.bgPrimary,
          borderWidth: isDark ? 1 : 0.5,
          borderColor: isDark ? colors.separator : 'rgba(0,0,0,0.04)',
          ...Layout.cardShadow,
        };
    }
  };

  const content = (
    <View style={[styles.card, getVariantStyles(), style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={() => {
          AppHaptics.selection();
          onPress();
        }}
        activeOpacity={0.88}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Layout.radiusXL,
    padding: Layout.lg,
  },
});
