import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/useTheme';
import { Button } from './Button';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  emoji = '✨',
  title,
  description,
  actionTitle,
  onAction,
  style,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconBox, { backgroundColor: colors.surface2 }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>

      <Text style={[Typography.titleMD, { color: colors.labelPrimary, textAlign: 'center', marginTop: 16 }]}>
        {title}
      </Text>

      {description && (
        <Text
          style={[
            Typography.bodyMD,
            { color: colors.labelSecondary, textAlign: 'center', marginTop: 8, maxWidth: 280 },
          ]}
        >
          {description}
        </Text>
      )}

      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="gradient"
          size="sm"
          style={{ marginTop: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 34,
  },
});
