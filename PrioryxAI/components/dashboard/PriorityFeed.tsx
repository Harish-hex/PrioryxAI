import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Task } from '@/stores/tasks.store';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';
import { TaskCard } from './TaskCard';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { router } from 'expo-router';

interface PriorityFeedProps {
  tasks: Task[];
  loading?: boolean;
  onDone: (id: string) => void;
  onDelete: (id: string) => void;
  onPressTask?: (task: Task) => void;
}

export function PriorityFeed({
  tasks,
  loading = false,
  onDone,
  onDelete,
  onPressTask,
}: PriorityFeedProps) {
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={[Typography.captionLG, { color: colors.labelSecondary, marginBottom: 10, fontWeight: '700' }]}>
          PRIORITY FEED
        </Text>
        <Skeleton height={68} radius={Layout.radiusXL} style={{ marginBottom: 8 }} />
        <Skeleton height={68} radius={Layout.radiusXL} style={{ marginBottom: 8 }} />
        <Skeleton height={68} radius={Layout.radiusXL} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[Typography.captionLG, { color: colors.labelSecondary, fontWeight: '700' }]}>
          PRIORITY FEED ({tasks.length})
        </Text>
      </View>

      {tasks.length === 0 ? (
        <EmptyState
          emoji="🎯"
          title="No tasks pending"
          description="Add a task, timetable, or exam to let PrioryxAI prioritize your week."
          actionTitle="+ Add First Task"
          onAction={() => router.push('/(modals)/add-task')}
        />
      ) : (
        <View style={styles.list}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDone={onDone}
              onDelete={onDelete}
              onPress={onPressTask}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Layout.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  list: {
    gap: 4,
  },
});
