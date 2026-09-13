import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Task } from '@/stores/tasks.store';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AppHaptics } from '@/lib/haptics';
import { useTheme } from '@/hooks/useTheme';

interface NextPriorityCardProps {
  task: Task | null;
  loading?: boolean;
  onComplete: (id: string) => void;
}

export function NextPriorityCard({
  task,
  loading = false,
  onComplete,
}: NextPriorityCardProps) {
  const { colors, isDark } = useTheme();

  if (!task) {
    return (
      <View
        style={[
          styles.emptyContainer,
          {
            backgroundColor: isDark ? colors.surface1 : colors.bgPrimary,
            borderColor: colors.separator,
          },
        ]}
      >
        <Text style={{ fontSize: 28 }}>🎉</Text>
        <Text style={[Typography.titleSM, { color: colors.labelPrimary, marginTop: 8 }]}>
          All caught up!
        </Text>
        <Text style={[Typography.captionSM, { color: colors.labelSecondary, marginTop: 2 }]}>
          No urgent deadlines pending right now.
        </Text>
      </View>
    );
  }

  const formatDeadline = (due?: string | null) => {
    if (!due) return 'No deadline';
    const d = new Date(due);
    const diffHours = Math.round((d.getTime() - Date.now()) / 3600000);
    if (diffHours < 0) return `Overdue by ${Math.abs(diffHours)}h`;
    if (diffHours < 24) return `Due in ${diffHours}h`;
    if (diffHours < 48) return 'Due tomorrow';
    return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <LinearGradient
      colors={isDark ? ['#1E1538', '#13111C'] : ['#F5F3FF', '#FFFFFF']}
      style={[
        styles.container,
        {
          borderColor: isDark ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.2)',
          borderWidth: 1.5,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <Badge label="NEXT PRIORITY" variant="brand" size="sm" />
          {task.priority && (
            <Badge label={task.priority.toUpperCase()} variant={task.priority} size="sm" />
          )}
        </View>

        <Text style={[Typography.captionSM, { color: colors.brandViolet, fontWeight: '700' }]}>
          {formatDeadline(task.deadline || task.due_at)}
        </Text>
      </View>

      <Text
        style={[
          Typography.titleMD,
          { color: colors.labelPrimary, marginTop: 12, lineHeight: 26 },
        ]}
        numberOfLines={2}
      >
        {task.title}
      </Text>

      {task.description && (
        <Text
          style={[
            Typography.bodySM,
            { color: colors.labelSecondary, marginTop: 6, lineHeight: 20 },
          ]}
          numberOfLines={2}
        >
          {task.description}
        </Text>
      )}

      <View style={styles.actionRow}>
        <Button
          title="Mark Done"
          onPress={() => onComplete(task.id)}
          variant="gradient"
          size="sm"
          style={{ flex: 1 }}
        />

        <Button
          title="AI Plan"
          onPress={() => {
            AppHaptics.selection();
            router.push('/(tabs)/assistant');
          }}
          variant="secondary"
          size="sm"
          style={{ width: 90 }}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Layout.radius2XL,
    padding: Layout.lg,
    marginVertical: Layout.xs,
    ...Layout.cardShadow,
  },
  emptyContainer: {
    borderRadius: Layout.radius2XL,
    padding: Layout.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginVertical: Layout.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: Layout.lg,
  },
});
