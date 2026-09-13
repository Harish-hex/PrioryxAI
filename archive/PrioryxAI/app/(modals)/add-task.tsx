import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useTheme } from '@/hooks/useTheme';
import { useTasksStore, Task } from '@/stores/tasks.store';
import { AppHaptics } from '@/lib/haptics';

const PRIORITIES: Array<Task['priority']> = ['urgent', 'high', 'medium', 'low'];
const CATEGORIES = ['Assignment', 'Exam Prep', 'Project', 'DSA Practice', 'College Timetable', 'Career'];

export default function AddTaskModal() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('high');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [dueHours, setDueHours] = useState<number>(24);
  const [loading, setLoading] = useState(false);
  const { colors, isDark } = useTheme();
  const { addTask } = useTasksStore();

  const handleSave = async () => {
    if (!title.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Task title required',
      });
      return;
    }

    try {
      setLoading(true);
      const deadline = new Date(Date.now() + dueHours * 3600 * 1000).toISOString();
      await addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        category,
        type: category,
        deadline,
        due_at: deadline,
        source: 'manual',
      });

      Toast.show({
        type: 'success',
        text1: 'Task Added',
        text2: 'Added to your PrioryxAI priority feed.',
      });
      router.back();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to add task',
        text2: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={styles.header}>
        <Text style={[Typography.titleLG, { color: colors.labelPrimary }]}>
          New Priority Task ⚡
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
        <Input
          label="Task Title"
          placeholder="e.g. Complete Operating Systems lab assignment 3"
          value={title}
          onChangeText={setTitle}
        />

        <Input
          label="Description / Notes (Optional)"
          placeholder="e.g. Implement multi-threaded producer-consumer in C++"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={{ height: 75, textAlignVertical: 'top', paddingTop: 10 }}
        />

        {/* Priority Selector */}
        <View style={styles.section}>
          <Text style={[Typography.captionLG, { color: colors.labelSecondary, marginBottom: 8 }]}>
            Priority Level
          </Text>
          <View style={styles.chipRow}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => {
                  AppHaptics.selection();
                  setPriority(p);
                }}
                style={[
                  styles.priorityChip,
                  {
                    backgroundColor: priority === p ? colors.brandViolet : colors.surface2,
                    borderColor: priority === p ? colors.brandViolet : colors.separator,
                  },
                ]}
              >
                <Text
                  style={[
                    Typography.titleSM,
                    {
                      color: priority === p ? '#FFFFFF' : colors.labelPrimary,
                      textTransform: 'capitalize',
                      fontSize: 13,
                    },
                  ]}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Category Selector */}
        <View style={styles.section}>
          <Text style={[Typography.captionLG, { color: colors.labelSecondary, marginBottom: 8 }]}>
            Category
          </Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => {
                  AppHaptics.selection();
                  setCategory(cat);
                }}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: category === cat ? colors.surface1 : colors.surface2,
                    borderColor: category === cat ? colors.brandViolet : colors.separator,
                    borderWidth: category === cat ? 1.5 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    Typography.captionLG,
                    {
                      color: category === cat ? colors.brandViolet : colors.labelSecondary,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Due Time Selector */}
        <View style={styles.section}>
          <Text style={[Typography.captionLG, { color: colors.labelSecondary, marginBottom: 8 }]}>
            Deadline / Target
          </Text>
          <View style={styles.chipRow}>
            {[
              { label: 'Today (8h)', hours: 8 },
              { label: 'Tomorrow (24h)', hours: 24 },
              { label: 'This Weekend (72h)', hours: 72 },
              { label: 'Next Week (168h)', hours: 168 },
            ].map((d) => (
              <TouchableOpacity
                key={d.hours}
                onPress={() => {
                  AppHaptics.selection();
                  setDueHours(d.hours);
                }}
                style={[
                  styles.timeChip,
                  {
                    backgroundColor: dueHours === d.hours ? colors.brandViolet : colors.surface2,
                    borderColor: dueHours === d.hours ? colors.brandViolet : colors.separator,
                  },
                ]}
              >
                <Text
                  style={[
                    Typography.captionLG,
                    {
                      color: dueHours === d.hours ? '#FFFFFF' : colors.labelPrimary,
                      fontWeight: '600',
                    },
                  ]}
                >
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          title="Save Priority Task ⚡"
          onPress={handleSave}
          variant="gradient"
          size="lg"
          loading={loading}
          style={{ marginTop: 24 }}
        />
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
    gap: 16,
  },
  section: {
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Layout.radiusLG,
    borderWidth: 1,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Layout.radiusFull,
  },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Layout.radiusLG,
    borderWidth: 1,
  },
});
