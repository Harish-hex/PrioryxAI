import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { AppHaptics } from '@/lib/haptics';

export interface CodingPlatform {
  name: 'LeetCode' | 'CodeChef' | 'Codeforces' | 'HackerRank';
  username?: string | null;
  problems_solved?: number;
  rating?: number;
  badge?: string;
  connected: boolean;
}

interface CodingPlatformCardProps {
  platform: CodingPlatform;
  onConnect: () => void;
}

export function CodingPlatformCard({ platform, onConnect }: CodingPlatformCardProps) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.surface1 : colors.bgPrimary,
          borderColor: colors.separator,
        },
      ]}
    >
      <View style={styles.left}>
        <Text style={[Typography.titleMD, { color: colors.labelPrimary }]}>
          {platform.name}
        </Text>
        {platform.connected && platform.username ? (
          <>
            <Text style={[Typography.captionLG, { color: colors.brandViolet, marginTop: 2 }]}>
              @{platform.username}
            </Text>
            <View style={styles.statsRow}>
              <Text style={[Typography.captionSM, { color: colors.labelSecondary }]}>
                {platform.problems_solved || 0} solved
              </Text>
              {platform.rating && (
                <Text style={[Typography.captionSM, { color: colors.labelSecondary }]}>
                  • Rating: {platform.rating}
                </Text>
              )}
            </View>
          </>
        ) : (
          <Text style={[Typography.captionSM, { color: colors.labelTertiary, marginTop: 4 }]}>
            Not connected yet
          </Text>
        )}
      </View>

      <View style={styles.right}>
        {platform.connected ? (
          <ScoreRing
            score={Math.min(100, (platform.problems_solved || 0) / 3)}
            size={56}
            strokeWidth={5}
          />
        ) : (
          <TouchableOpacity
            onPress={() => {
              AppHaptics.selection();
              onConnect();
            }}
            style={[styles.connectBtn, { backgroundColor: colors.brandViolet }]}
          >
            <Text style={[Typography.captionLG, { color: '#FFFFFF', fontWeight: '700' }]}>
              Connect
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.md,
    borderRadius: Layout.radiusXL,
    borderWidth: 1,
    marginVertical: 4,
    ...Layout.cardShadow,
  },
  left: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  right: {
    marginLeft: 12,
  },
  connectBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Layout.radiusLG,
  },
});
