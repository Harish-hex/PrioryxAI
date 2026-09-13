import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { router } from 'expo-router';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { SafeScrollView } from '@/components/layout/SafeScrollView';
import { NextPriorityCard } from '@/components/dashboard/NextPriorityCard';
import { ThisWeekStats } from '@/components/dashboard/ThisWeekStats';
import { AddTaskBar } from '@/components/dashboard/AddTaskBar';
import { PriorityFeed } from '@/components/dashboard/PriorityFeed';
import { ProjectIdeasWidget } from '@/components/dashboard/ProjectIdeasWidget';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import { AppHaptics } from '@/lib/haptics';

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { profile, isPro } = useAuth();
  const { tasks, isLoading, loadTasks, markDone, deleteTask } = useTasks();
  const { stats, loadStats } = useProfile();
  const { colors } = useTheme();

  useEffect(() => {
    loadTasks();
    loadStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    AppHaptics.light();
    await Promise.all([loadTasks(), loadStats()]);
    setRefreshing(false);
  };

  // Find the top urgent / next priority task
  const nextPriorityTask = useMemo(() => {
    if (tasks.length === 0) return null;
    const sorted = [...tasks].sort((a, b) => {
      const order: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      const pA = order[a.priority] ?? 2;
      const pB = order[b.priority] ?? 2;
      return pA - pB;
    });
    return sorted[0];
  }, [tasks]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <ScreenHeader
        title={`Hey, ${(profile?.name || profile?.full_name || 'Engineer').split(' ')[0]} ⚡`}
        subtitle={`${profile?.college || 'Engineering Command Center'} • Sem ${profile?.semester || 6}`}
        showAvatar
        rightElement={
          <TouchableOpacity
            onPress={() => {
              AppHaptics.selection();
              router.push('/(modals)/notifications');
            }}
            style={[styles.bellBtn, { backgroundColor: colors.surface2 }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ fontSize: 16 }}>🔔</Text>
          </TouchableOpacity>
        }
      />

      <SafeScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brandViolet}
          />
        }
      >
        <NextPriorityCard
          task={nextPriorityTask}
          loading={isLoading}
          onComplete={markDone}
        />

        <ThisWeekStats stats={stats} isPro={isPro} />

        <AddTaskBar />

        <PriorityFeed
          tasks={tasks}
          loading={isLoading}
          onDone={markDone}
          onDelete={deleteTask}
        />

        <ProjectIdeasWidget isPro={isPro} />
      </SafeScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
