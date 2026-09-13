import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { AppHaptics } from '@/lib/haptics';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showAvatar?: boolean;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
}

export function ScreenHeader({
  title,
  subtitle,
  showAvatar = true,
  showBack = false,
  rightElement,
  style,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { profile } = useAuth();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 16),
          borderBottomColor: colors.separator,
        },
        style,
      ]}
    >
      <View style={styles.row}>
        {showBack && (
          <TouchableOpacity
            onPress={() => {
              AppHaptics.light();
              router.back();
            }}
            style={[styles.backBtn, { backgroundColor: colors.surface2 }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ fontSize: 18, color: colors.labelPrimary }}>←</Text>
          </TouchableOpacity>
        )}

        <View style={styles.titleContainer}>
          <Text style={[Typography.titleLG, { color: colors.labelPrimary }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[Typography.captionSM, { color: colors.labelSecondary, marginTop: 2 }]}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.rightContainer}>
          {rightElement}

          {showAvatar && (
            <TouchableOpacity
              onPress={() => {
                AppHaptics.selection();
                router.push('/(tabs)/profile');
              }}
              activeOpacity={0.8}
            >
              <Avatar
                name={profile?.name || profile?.username || 'User'}
                uri={profile?.avatar_url}
                size={38}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Layout.lg,
    paddingBottom: Layout.md,
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
