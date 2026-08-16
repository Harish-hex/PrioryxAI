import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';
import { Avatar } from '@/components/ui/Avatar';
import { AppHaptics } from '@/lib/haptics';

export interface CollabFriend {
  id: string;
  name: string;
  college?: string;
  level?: number;
  streak?: number;
  avatar_url?: string;
  status?: 'studying' | 'coding' | 'idle';
}

interface FriendCardProps {
  friend: CollabFriend;
  onChallenge: (friendId: string) => void;
}

export function FriendCard({ friend, onChallenge }: FriendCardProps) {
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
      <Avatar
        name={friend.name}
        uri={friend.avatar_url}
        size={44}
      />

      <View style={styles.info}>
        <Text style={[Typography.titleSM, { color: colors.labelPrimary }]} numberOfLines={1}>
          {friend.name}
        </Text>
        <Text style={[Typography.captionSM, { color: colors.labelSecondary, marginTop: 2 }]}>
          {friend.college || 'Engineering Peer'} • Lv.{friend.level || 1}
        </Text>
        <Text style={[Typography.captionSM, { color: colors.brandAmber, marginTop: 2 }]}>
          🔥 {friend.streak || 0}d streak
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => {
          AppHaptics.selection();
          onChallenge(friend.id);
        }}
        style={[styles.challengeBtn, { backgroundColor: 'rgba(124,58,237,0.1)' }]}
        activeOpacity={0.8}
      >
        <Text style={[Typography.captionLG, { color: colors.brandViolet, fontWeight: '700' }]}>
          ⚔️ Duel
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.md,
    borderRadius: Layout.radiusXL,
    borderWidth: 1,
    marginVertical: 4,
    ...Layout.cardShadow,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  challengeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Layout.radiusLG,
  },
});
