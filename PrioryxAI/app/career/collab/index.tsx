import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { SafeScrollView } from '@/components/layout/SafeScrollView';
import { FriendCard, CollabFriend } from '@/components/career/FriendCard';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';
import { AppHaptics } from '@/lib/haptics';

const FRIENDS: CollabFriend[] = [
  {
    id: '1',
    name: 'Aarav Patel',
    college: 'IIT Bombay',
    level: 7,
    streak: 18,
    status: 'coding',
  },
  {
    id: '2',
    name: 'Sneha Reddy',
    college: 'BITS Pilani',
    level: 6,
    streak: 12,
    status: 'studying',
  },
  {
    id: '3',
    name: 'Vikram Singh',
    college: 'DTU Delhi',
    level: 9,
    streak: 24,
    status: 'idle',
  },
];

export default function PeerCollabScreen() {
  const [connectCodeInput, setConnectCodeInput] = useState('');
  const [friends, setFriends] = useState<CollabFriend[]>(FRIENDS);
  const myConnectCode = 'PRX-8492';
  const { colors, isDark } = useTheme();

  const handleCopyCode = async () => {
    AppHaptics.selection();
    await Clipboard.setStringAsync(myConnectCode);
    Toast.show({
      type: 'success',
      text1: 'Connect Code Copied',
      text2: 'Share this code with your classmates to duel & collaborate.',
    });
  };

  const handleAddFriend = () => {
    if (!connectCodeInput.trim()) return;
    AppHaptics.success();
    Toast.show({
      type: 'success',
      text1: 'Invite Sent',
      text2: `Collab invite sent to ${connectCodeInput.trim().toUpperCase()}`,
    });
    setConnectCodeInput('');
  };

  const handleChallenge = (friendId: string) => {
    AppHaptics.medium();
    Toast.show({
      type: 'success',
      text1: '⚔️ 25-Min DSA Duel Started',
      text2: 'You and your peer have 25 minutes to solve 2 LeetCode mediums.',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <ScreenHeader
        title="Peer Collaboration 👥"
        subtitle="Study buddies, duels & engineering leaderboard"
        showBack
        showAvatar={false}
      />

      <SafeScrollView>
        {/* Connect Code Banner */}
        <View
          style={[
            styles.codeCard,
            {
              backgroundColor: isDark ? colors.surface1 : '#F5F3FF',
              borderColor: colors.brandViolet,
            },
          ]}
        >
          <View>
            <Text style={[Typography.captionLG, { color: colors.brandViolet, fontWeight: '800' }]}>
              YOUR CONNECT CODE
            </Text>
            <Text style={[Typography.titleLG, { color: colors.labelPrimary, marginTop: 2, letterSpacing: 2 }]}>
              {myConnectCode}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleCopyCode}
            style={[styles.copyBtn, { backgroundColor: colors.brandViolet }]}
          >
            <Text style={[Typography.titleSM, { color: '#FFFFFF', fontSize: 13 }]}>
              Copy Code
            </Text>
          </TouchableOpacity>
        </View>

        {/* Add Friend Input */}
        <View style={styles.addFriendRow}>
          <Input
            placeholder="Enter friend's connect code (e.g. PRX-1234)"
            value={connectCodeInput}
            onChangeText={setConnectCodeInput}
            autoCapitalize="characters"
            containerStyle={{ flex: 1 }}
          />
          <Button
            title="Connect"
            onPress={handleAddFriend}
            variant="gradient"
            size="md"
            style={{ width: 95 }}
          />
        </View>

        {/* Study Friends List */}
        <Text style={[Typography.captionLG, { color: colors.labelSecondary, marginVertical: 10, fontWeight: '700' }]}>
          ACTIVE STUDY BUDDIES ({friends.length})
        </Text>

        <View style={styles.friendsList}>
          {friends.map((friend) => (
            <FriendCard
              key={friend.id}
              friend={friend}
              onChallenge={handleChallenge}
            />
          ))}
        </View>
      </SafeScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  codeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.lg,
    borderRadius: Layout.radius2XL,
    borderWidth: 1.5,
    marginVertical: Layout.xs,
    ...Layout.cardShadow,
  },
  copyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Layout.radiusLG,
  },
  addFriendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: Layout.sm,
  },
  friendsList: {
    gap: 8,
  },
});
