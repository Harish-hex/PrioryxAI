import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Task } from '@/stores/tasks.store';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';
import { Badge } from '@/components/ui/Badge';
import { AppHaptics } from '@/lib/haptics';

interface TaskCardProps {
  task: Task;
  onDone: (id: string) => void;
  onDelete: (id: string) => void;
  onPress?: (task: Task) => void;
}

export function TaskCard({
  task,
  onDone,
  onDelete,
  onPress,
}: TaskCardProps) {
  const { colors, isDark } = useTheme();

  const renderLeftActions = () => (
    <View style={[styles.swipeAction, styles.swipeLeft, { backgroundColor: colors.brandEmerald }]}>
      <Text style={styles.swipeIcon}>✓</Text>
      <Text style={styles.swipeText}>Done</Text>
    </View>
  );

  const renderRightActions = () => (
    <View style={[styles.swipeAction, styles.swipeRight, { backgroundColor: colors.brandRed }]}>
      <Text style={styles.swipeIcon}>🗑</Text>
      <Text style={styles.swipeText}>Delete</Text>
    </View>
  );

  const formatDeadline = (due?: string | null) => {
    if (!due) return null;
    const d = new Date(due);
    const diffHours = Math.round((d.getTime() - Date.now()) / 3600000);
    if (diffHours < 0) return `Overdue by ${Math.abs(diffHours)}h`;
    if (diffHours < 24) return `Due in ${diffHours}h`;
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  const deadlineLabel = formatDeadline(task.deadline || task.due_at);

  return (
    <View style={styles.wrapper}>
      <Swipeable
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        onSwipeableLeftOpen={() => onDone(task.id)}
        onSwipeableRightOpen={() => onDelete(task.id)}
      >
        <TouchableOpacity
          onPress={() => onPress?.(task)}
          activeOpacity={0.88}
          style={[
            styles.card,
            {
              backgroundColor: isDark ? colors.surface1 : colors.bgPrimary,
              borderColor: colors.separator,
            },
          ]}
        >
          <View style={styles.contentRow}>
            {/* Quick checkbox button */}
            <TouchableOpacity
              onPress={() => onDone(task.id)}
              style={[
                styles.checkbox,
                {
                  borderColor: task.priority === 'urgent' ? colors.brandRed : colors.brandViolet,
                },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.checkboxInner} />
            </TouchableOpacity>

            <View style={styles.textContainer}>
              <View style={styles.metaRow}>
                {task.priority && (
                  <Badge label={task.priority} variant={task.priority} size="sm" />
                )}
                {task.type && (
                  <Badge label={task.type} variant="neutral" size="sm" />
                )}
                {deadlineLabel && (
                  <Text
                    style={[
                      Typography.captionSM,
                      {
                        color: task.priority === 'urgent' ? colors.brandRed : colors.labelSecondary,
                        fontWeight: '600',
                      },
                    ]}
                  >
                    {deadlineLabel}
                  </Text>
                )}
              </View>

              <Text
                style={[
                  Typography.titleSM,
                  { color: colors.labelPrimary, marginTop: 4 },
                ]}
                numberOfLines={2}
              >
                {task.title}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 4,
    borderRadius: Layout.radiusXL,
    overflow: 'hidden',
    ...Layout.cardShadow,
  },
  card: {
    padding: 14,
    borderRadius: Layout.radiusXL,
    borderWidth: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxInner: {
    width: 8,
    height: 8,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  textContainer: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    paddingHorizontal: 12,
  },
  swipeLeft: {
    alignItems: 'flex-start',
    paddingLeft: 20,
  },
  swipeRight: {
    alignItems: 'flex-end',
    paddingRight: 20,
  },
  swipeIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  swipeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
});
