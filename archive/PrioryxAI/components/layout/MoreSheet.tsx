import React, { forwardRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';
import { AppHaptics } from '@/lib/haptics';

interface CareerItem {
  title: string;
  desc: string;
  emoji: string;
  gradient: readonly [string, string];
  route: string;
}

const CAREER_ITEMS: CareerItem[] = [
  {
    title: 'Resume Intelligence',
    desc: 'ATS score & SWOT',
    emoji: '📄',
    gradient: ['#06B6D4', '#3B82F6'] as const,
    route: '/career/resume',
  },
  {
    title: 'Project Foundry',
    desc: 'Step-by-step builder',
    emoji: '🔨',
    gradient: ['#F59E0B', '#EF4444'] as const,
    route: '/career/foundry',
  },
  {
    title: 'Coding Profiles',
    desc: 'LeetCode & HackerRank',
    emoji: '💻',
    gradient: ['#10B981', '#06B6D4'] as const,
    route: '/career/coding/unified',
  },
  {
    title: 'GitHub Intelligence',
    desc: 'Repo health & streak',
    emoji: '🔑',
    gradient: ['#7C3AED', '#9333EA'] as const,
    route: '/career/coding/github',
  },
  {
    title: 'Job Market',
    desc: 'AI-matched roles',
    emoji: '💼',
    gradient: ['#EC4899', '#8B5CF6'] as const,
    route: '/career/jobs',
  },
  {
    title: 'Peer Collab',
    desc: 'Duels & study friends',
    emoji: '👥',
    gradient: ['#6366F1', '#A855F7'] as const,
    route: '/career/collab',
  },
];

export const MoreSheet = forwardRef<BottomSheetModal>((props, ref) => {
  const { colors, isDark } = useTheme();
  const snapPoints = useMemo(() => ['65%'], []);

  const handleNavigate = (route: string) => {
    AppHaptics.selection();
    // @ts-ignore
    ref?.current?.dismiss();
    setTimeout(() => {
      // @ts-ignore
      router.push(route);
    }, 150);
  };

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      backgroundStyle={{
        backgroundColor: isDark ? colors.surface1 : colors.bgPrimary,
        borderRadius: Layout.radius2XL,
      }}
      handleIndicatorStyle={{
        backgroundColor: colors.separator,
        width: 44,
        height: 5,
      }}
      backdropComponent={(backdropProps) => (
        <BottomSheetBackdrop
          {...backdropProps}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.45}
        />
      )}
    >
      <BottomSheetView style={styles.container}>
        <View style={styles.header}>
          <Text style={[Typography.captionLG, { color: colors.brandViolet, fontWeight: '700', letterSpacing: 1.2 }]}>
            WORKSPACE PORTALS
          </Text>
          <Text style={[Typography.titleMD, { color: colors.labelPrimary, marginTop: 2 }]}>
            AI Career Guidance
          </Text>
        </View>

        <View style={styles.grid}>
          {CAREER_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.title}
              onPress={() => handleNavigate(item.route)}
              style={[
                styles.gridItem,
                {
                  backgroundColor: isDark ? colors.surface2 : colors.surface2,
                  borderColor: colors.separator,
                },
              ]}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={item.gradient as any}
                style={styles.iconBox}
              >
                <Text style={styles.emoji}>{item.emoji}</Text>
              </LinearGradient>

              <View style={styles.itemTextContainer}>
                <Text
                  style={[
                    Typography.titleSM,
                    { color: colors.labelPrimary, fontSize: 14 },
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text
                  style={[
                    Typography.captionSM,
                    { color: colors.labelSecondary, marginTop: 2 },
                  ]}
                  numberOfLines={1}
                >
                  {item.desc}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Layout.lg,
    paddingTop: Layout.xs,
    paddingBottom: Layout.xl,
  },
  header: {
    marginBottom: Layout.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Layout.radiusLG,
    borderWidth: 1,
    gap: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 18,
  },
  itemTextContainer: {
    flex: 1,
  },
});
