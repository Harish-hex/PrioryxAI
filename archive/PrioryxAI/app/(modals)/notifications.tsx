import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';

interface AppNotification {
  id: string;
  emoji: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const NOTIFICATIONS: AppNotification[] = [
  {
    id: '1',
    emoji: '⚠️',
    title: 'Deadline Approaching in 2 Hours',
    message: 'Operating Systems lab assignment 3 is due at 11:59 PM today.',
    time: '2h ago',
    read: false,
  },
  {
    id: '2',
    emoji: '⚔️',
    title: 'New Duel Challenge',
    message: 'Aarav Patel challenged you to a 25-minute LeetCode study duel!',
    time: '5h ago',
    read: false,
  },
  {
    id: '3',
    emoji: '✨',
    title: 'Weekly Priority Reset',
    message: 'Your weekly tasks and streak counter have been updated for Sunday.',
    time: '1d ago',
    read: true,
  },
];

export default function NotificationsModal() {
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={styles.header}>
        <Text style={[Typography.titleLG, { color: colors.labelPrimary }]}>
          Notifications 🔔
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeBtn, { backgroundColor: colors.surface2 }]}
        >
          <Text style={{ fontSize: 16, color: colors.labelPrimary }}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.list}>
          {NOTIFICATIONS.map((notif) => (
            <View
              key={notif.id}
              style={[
                styles.notifCard,
                {
                  backgroundColor: notif.read
                    ? colors.bgPrimary
                    : isDark
                    ? 'rgba(124,58,237,0.1)'
                    : '#F5F3FF',
                  borderColor: notif.read ? colors.separator : 'rgba(124,58,237,0.25)',
                },
              ]}
            >
              <Text style={styles.emoji}>{notif.emoji}</Text>

              <View style={{ flex: 1 }}>
                <View style={styles.topRow}>
                  <Text style={[Typography.titleSM, { color: colors.labelPrimary }]} numberOfLines={1}>
                    {notif.title}
                  </Text>
                  <Text style={[Typography.captionSM, { color: colors.labelTertiary }]}>
                    {notif.time}
                  </Text>
                </View>

                <Text style={[Typography.bodySM, { color: colors.labelSecondary, marginTop: 4, lineHeight: 18 }]}>
                  {notif.message}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.xl,
    paddingVertical: Layout.md,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Layout.xl,
    paddingBottom: Layout.xxl,
  },
  list: {
    gap: 10,
    marginTop: Layout.sm,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Layout.md,
    borderRadius: Layout.radiusXL,
    borderWidth: 1,
    gap: 12,
    ...Layout.cardShadow,
  },
  emoji: {
    fontSize: 22,
    marginTop: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
