import React from 'react';
import { ScrollView, ScrollViewProps, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';

interface SafeScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  contentContainerStyle?: ViewStyle;
}

export function SafeScrollView({
  children,
  contentContainerStyle,
  style,
  ...props
}: SafeScrollViewProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={[{ flex: 1, backgroundColor: colors.bgPrimary }, style]}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: insets.bottom + Layout.tabBarHeight + 24,
        },
        contentContainerStyle,
      ]}
      {...props}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Layout.lg,
    paddingTop: Layout.sm,
  },
});
