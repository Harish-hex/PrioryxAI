import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { SafeScrollView } from '@/components/layout/SafeScrollView';
import { CodingPlatformCard, CodingPlatform } from '@/components/career/CodingPlatformCard';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';
import { AppHaptics } from '@/lib/haptics';

const INITIAL_PLATFORMS: CodingPlatform[] = [
  {
    name: 'LeetCode',
    username: 'yug_dev',
    problems_solved: 248,
    rating: 1742,
    badge: 'Knight',
    connected: true,
  },
  {
    name: 'CodeChef',
    username: null,
    problems_solved: 0,
    rating: 0,
    connected: false,
  },
  {
    name: 'Codeforces',
    username: null,
    problems_solved: 0,
    rating: 0,
    connected: false,
  },
  {
    name: 'HackerRank',
    username: 'yugendhar',
    problems_solved: 85,
    connected: true,
  },
];

export default function UnifiedCodingScreen() {
  const [platforms, setPlatforms] = useState<CodingPlatform[]>(INITIAL_PLATFORMS);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors, isDark } = useTheme();

  const totalSolved = platforms.reduce((acc, p) => acc + (p.problems_solved || 0), 0);

  const handleConnect = async () => {
    if (!usernameInput.trim()) return;
    setLoading(true);
    AppHaptics.light();
    await new Promise((res) => setTimeout(res, 800));

    setPlatforms((prev) =>
      prev.map((p) =>
        p.name === connectingPlatform
          ? {
              ...p,
              username: usernameInput.trim(),
              problems_solved: 112,
              rating: 1540,
              connected: true,
            }
          : p
      )
    );

    Toast.show({
      type: 'success',
      text1: 'Platform Connected',
      text2: `Successfully synced @${usernameInput.trim()} statistics.`,
    });
    setLoading(false);
    setConnectingPlatform(null);
    setUsernameInput('');
    AppHaptics.success();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <ScreenHeader
        title="Coding Profiles 💻"
        subtitle="Unified cross-platform metrics & LeetCode rating"
        showBack
        showAvatar={false}
      />

      <SafeScrollView>
        {/* Top Aggregate Card */}
        <View
          style={[
            styles.aggCard,
            {
              backgroundColor: isDark ? colors.surface1 : colors.bgPrimary,
              borderColor: colors.separator,
            },
          ]}
        >
          <ScoreRing score={Math.min(100, totalSolved / 5)} size={88} strokeWidth={7} label="Index" />

          <View style={styles.aggInfo}>
            <Text style={[Typography.titleLG, { color: colors.labelPrimary, fontWeight: '800' }]}>
              {totalSolved}
            </Text>
            <Text style={[Typography.captionLG, { color: colors.labelSecondary, fontWeight: '600' }]}>
              Total Problems Solved
            </Text>
            <Text style={[Typography.captionSM, { color: colors.brandEmerald, marginTop: 4, fontWeight: '700' }]}>
              Top 12% among Indian Students
            </Text>
          </View>
        </View>

        <Text style={[Typography.captionLG, { color: colors.labelSecondary, marginVertical: 10, fontWeight: '700' }]}>
          PLATFORMS ({platforms.filter((p) => p.connected).length}/{platforms.length})
        </Text>

        <View style={styles.list}>
          {platforms.map((platform) => (
            <CodingPlatformCard
              key={platform.name}
              platform={platform}
              onConnect={() => setConnectingPlatform(platform.name)}
            />
          ))}
        </View>
      </SafeScrollView>

      {/* Connect Platform Modal */}
      <Modal
        visible={!!connectingPlatform}
        transparent
        animationType="fade"
        onRequestClose={() => setConnectingPlatform(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: isDark ? colors.surface1 : colors.bgPrimary,
                borderColor: colors.separator,
              },
            ]}
          >
            <Text style={[Typography.titleMD, { color: colors.labelPrimary }]}>
              Connect {connectingPlatform}
            </Text>
            <Text style={[Typography.bodySM, { color: colors.labelSecondary, marginTop: 4 }]}>
              Enter your public username or handle to fetch solved counts.
            </Text>

            <Input
              placeholder={`e.g. your_${connectingPlatform?.toLowerCase()}_handle`}
              value={usernameInput}
              onChangeText={setUsernameInput}
              autoCapitalize="none"
              containerStyle={{ marginVertical: 16 }}
            />

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                onPress={() => setConnectingPlatform(null)}
                variant="secondary"
                size="sm"
                style={{ flex: 1 }}
              />
              <Button
                title="Verify & Connect"
                onPress={handleConnect}
                variant="gradient"
                size="sm"
                loading={loading}
                style={{ flex: 1.5 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  aggCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.lg,
    borderRadius: Layout.radius2XL,
    borderWidth: 1,
    gap: 18,
    marginVertical: Layout.xs,
    ...Layout.cardShadow,
  },
  aggInfo: {
    flex: 1,
  },
  list: {
    gap: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.xl,
  },
  modalCard: {
    width: '100%',
    padding: Layout.xl,
    borderRadius: Layout.radius2XL,
    borderWidth: 1,
    ...Layout.modalShadow,
  },
  modalBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
