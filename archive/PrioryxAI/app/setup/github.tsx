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

export default function SetupGithubScreen() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors, isDark } = useTheme();
  const { user, loadProfile } = useAuthStore();

  const handleSave = async (skip = false) => {
    try {
      setLoading(true);
      AppHaptics.light();

      if (!skip && username.trim()) {
        const { error } = await supabase.from('profiles').upsert({
          id: user?.id,
          github_username: username.trim().replace('@', ''),
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
        await loadProfile();
      }

      router.push('/setup/resume');
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Sync Error',
        text2: err.message || 'Could not connect GitHub username',
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
            STEP 2 OF 3
          </Text>
          <Text style={[Typography.titleXL, { color: colors.labelPrimary, marginTop: 4 }]}>
            GitHub Intelligence
          </Text>
          <Text style={[Typography.bodyMD, { color: colors.labelSecondary, marginTop: 6 }]}>
            Sync your commit streaks, repo health scores, and open-source contributions.
          </Text>
        </View>

        <View style={[styles.iconCard, { backgroundColor: isDark ? colors.surface1 : '#F5F3FF' }]}>
          <Text style={{ fontSize: 44 }}>🐙</Text>
          <Text style={[Typography.titleMD, { color: colors.labelPrimary, marginTop: 12 }]}>
            Sync Public Activity
          </Text>
          <Text
            style={[
              Typography.bodySM,
              { color: colors.labelSecondary, textAlign: 'center', marginTop: 4, maxWidth: 260 },
            ]}
          >
            We analyze commit regularity, README completeness, and language distributions.
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="GitHub Handle"
            placeholder="e.g. torvalds or codewithyug06"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <Button
            title="Connect & Continue →"
            onPress={() => handleSave(false)}
            variant="gradient"
            size="lg"
            loading={loading}
          />

          <TouchableOpacity
            onPress={() => handleSave(true)}
            style={styles.skipBtn}
          >
            <Text style={[Typography.titleSM, { color: colors.labelTertiary, fontSize: 14 }]}>
              I will connect GitHub later
            </Text>
          </TouchableOpacity>
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
  iconCard: {
    padding: Layout.xl,
    borderRadius: Layout.radius2XL,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.xl,
  },
  form: {
    gap: 16,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
});
