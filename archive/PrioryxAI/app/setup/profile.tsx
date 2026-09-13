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
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';
import { AppHaptics } from '@/lib/haptics';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const TARGET_ROLES = [
  'Fullstack Engineer',
  'Backend Engineer (Go/Java)',
  'Frontend Engineer (React/Next)',
  'AI / ML Engineer',
  'Cloud / DevOps Engineer',
  'Mobile App Developer',
];

export default function SetupProfileScreen() {
  const [college, setCollege] = useState('');
  const [semester, setSemester] = useState<number>(6);
  const [branch, setBranch] = useState('Computer Science & Engineering');
  const [targetRole, setTargetRole] = useState(TARGET_ROLES[0]);
  const [loading, setLoading] = useState(false);
  const { colors, isDark } = useTheme();
  const { user, loadProfile } = useAuthStore();

  const handleSave = async () => {
    if (!college.trim()) {
      Toast.show({
        type: 'error',
        text1: 'College required',
        text2: 'Please enter your engineering college name.',
      });
      return;
    }

    try {
      setLoading(true);
      AppHaptics.light();

      const { error } = await supabase.from('profiles').upsert({
        id: user?.id,
        college: college.trim(),
        semester,
        target_role: targetRole,
        branch,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      await loadProfile();
      router.push('/setup/github');
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Update failed',
        text2: err.message || 'Could not save profile details',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.stepHeader}>
          <Text style={[Typography.captionSM, { color: colors.brandViolet, fontWeight: '800', letterSpacing: 1 }]}>
            STEP 1 OF 3
          </Text>
          <Text style={[Typography.titleXL, { color: colors.labelPrimary, marginTop: 4 }]}>
            Academic Details
          </Text>
          <Text style={[Typography.bodyMD, { color: colors.labelSecondary, marginTop: 6 }]}>
            This configures your exam timetable AI models & semester roadmap.
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="College / University"
            placeholder="e.g. IIT Bombay, Anna University, BITS Pilani"
            value={college}
            onChangeText={setCollege}
          />

          <Input
            label="Branch / Major"
            placeholder="e.g. Computer Science & Engineering"
            value={branch}
            onChangeText={setBranch}
          />

          {/* Semester Selector */}
          <View>
            <Text style={[Typography.captionLG, { color: colors.labelSecondary, marginBottom: 8 }]}>
              Current Semester
            </Text>
            <View style={styles.semesterRow}>
              {SEMESTERS.map((sem) => (
                <TouchableOpacity
                  key={sem}
                  onPress={() => {
                    AppHaptics.selection();
                    setSemester(sem);
                  }}
                  style={[
                    styles.semChip,
                    {
                      backgroundColor:
                        semester === sem ? colors.brandViolet : colors.surface2,
                      borderColor:
                        semester === sem ? colors.brandViolet : colors.separator,
                    },
                  ]}
                >
                  <Text
                    style={[
                      Typography.titleSM,
                      {
                        color: semester === sem ? '#FFFFFF' : colors.labelPrimary,
                        fontSize: 14,
                      },
                    ]}
                  >
                    Sem {sem}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Target Role Selector */}
          <View>
            <Text style={[Typography.captionLG, { color: colors.labelSecondary, marginBottom: 8 }]}>
              Target Career Track
            </Text>
            <View style={styles.rolesList}>
              {TARGET_ROLES.map((role) => (
                <TouchableOpacity
                  key={role}
                  onPress={() => {
                    AppHaptics.selection();
                    setTargetRole(role);
                  }}
                  style={[
                    styles.roleItem,
                    {
                      backgroundColor:
                        targetRole === role
                          ? isDark
                            ? 'rgba(124,58,237,0.2)'
                            : '#F5F3FF'
                          : colors.surface1,
                      borderColor:
                        targetRole === role ? colors.brandViolet : colors.separator,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      Typography.bodyMD,
                      {
                        color:
                          targetRole === role
                            ? colors.brandViolet
                            : colors.labelPrimary,
                        fontWeight: targetRole === role ? '700' : '400',
                      },
                    ]}
                  >
                    {role}
                  </Text>
                  {targetRole === role && (
                    <Text style={{ color: colors.brandViolet, fontWeight: '700' }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Button
            title="Continue to GitHub →"
            onPress={handleSave}
            variant="gradient"
            size="lg"
            loading={loading}
            style={{ marginTop: 16 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Layout.xl,
    paddingTop: Layout.xl,
    paddingBottom: Layout.xxl,
  },
  stepHeader: {
    marginBottom: Layout.xl,
  },
  form: {
    gap: 20,
  },
  semesterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  semChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Layout.radiusMD,
    borderWidth: 1,
  },
  rolesList: {
    gap: 8,
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: Layout.radiusLG,
    borderWidth: 1,
  },
});
