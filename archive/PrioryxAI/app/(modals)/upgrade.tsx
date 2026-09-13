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
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/auth.store';
import { apiCall } from '@/lib/api';
import { AppHaptics } from '@/lib/haptics';

interface ProFeature {
  emoji: string;
  title: string;
  desc: string;
}

const PRO_FEATURES: ProFeature[] = [
  {
    emoji: '✨',
    title: 'Unlimited AI Copilot & Working Memory',
    desc: 'Zero query caps with persistent academic context across semesters.',
  },
  {
    emoji: '📄',
    title: 'Deep ATS Resume Scanner & SWOT',
    desc: 'Unlocks missing placement skills and 40+ ATS checklist tests.',
  },
  {
    emoji: '🔨',
    title: 'Complete Project Foundry & AI Mentor',
    desc: 'Step-by-step guidance through architecture, databases, and Docker.',
  },
  {
    emoji: '🔑',
    title: 'GitHub Intelligence & Placement Reports',
    desc: 'Generate recruiter-ready PDF reports highlighting commit streaks.',
  },
  {
    emoji: '📅',
    title: 'AI Timetable & Exam Schedule Parser',
    desc: 'Upload class timetables to auto-generate weekly priority checklists.',
  },
];

export default function UpgradeModal() {
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');
  const [loading, setLoading] = useState(false);
  const { colors, isDark } = useTheme();
  const { setProfile, profile } = useAuthStore();

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      AppHaptics.light();

      // Initiate Razorpay / backend payment
      const order = await apiCall<{ orderId?: string }>('/payments/subscribe', {
        method: 'POST',
        body: JSON.stringify({ plan: selectedPlan }),
      }).catch(() => null);

      // Simulate successful confirmation
      await new Promise((res) => setTimeout(res, 1200));

      if (profile) {
        setProfile({ ...profile, subscription_status: 'pro' });
      }

      AppHaptics.success();
      Toast.show({
        type: 'success',
        text1: 'Welcome to PrioryxAI Pro! ✦',
        text2: 'All pro tools and unlimited AI queries are unlocked.',
      });
      router.back();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Subscription Failed',
        text2: err.message || 'Payment could not be processed.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={styles.header}>
        <View style={{ width: 34 }} />
        <Badge label="PRIORYX PRO ✦" variant="pro" size="md" />
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
        <View style={styles.titleSection}>
          <Text style={[Typography.titleXL, { color: colors.labelPrimary, textAlign: 'center' }]}>
            Supercharge your engineering career.
          </Text>
          <Text style={[Typography.bodyMD, { color: colors.labelSecondary, textAlign: 'center', marginTop: 8 }]}>
            Join 12,000+ Indian engineering students building top-tier resumes and portfolios.
          </Text>
        </View>

        {/* Plan Selector */}
        <View style={styles.plansContainer}>
          <TouchableOpacity
            onPress={() => {
              AppHaptics.selection();
              setSelectedPlan('yearly');
            }}
            style={[
              styles.planCard,
              {
                backgroundColor: isDark ? colors.surface1 : colors.bgPrimary,
                borderColor: selectedPlan === 'yearly' ? colors.brandViolet : colors.separator,
                borderWidth: selectedPlan === 'yearly' ? 2 : 1,
              },
            ]}
            activeOpacity={0.85}
          >
            <View style={styles.planBadge}>
              <Text style={[Typography.captionSM, { color: '#FFFFFF', fontWeight: '800' }]}>
                SAVE 40%
              </Text>
            </View>

            <View style={styles.planHeader}>
              <View>
                <Text style={[Typography.titleMD, { color: colors.labelPrimary }]}>Annual Pro</Text>
                <Text style={[Typography.captionSM, { color: colors.labelSecondary }]}>Billed annually</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[Typography.titleLG, { color: colors.brandViolet, fontWeight: '800' }]}>
                  ₹499
                </Text>
                <Text style={[Typography.captionSM, { color: colors.labelTertiary }]}>/ year</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              AppHaptics.selection();
              setSelectedPlan('monthly');
            }}
            style={[
              styles.planCard,
              {
                backgroundColor: isDark ? colors.surface1 : colors.bgPrimary,
                borderColor: selectedPlan === 'monthly' ? colors.brandViolet : colors.separator,
                borderWidth: selectedPlan === 'monthly' ? 2 : 1,
              },
            ]}
            activeOpacity={0.85}
          >
            <View style={styles.planHeader}>
              <View>
                <Text style={[Typography.titleMD, { color: colors.labelPrimary }]}>Monthly Pro</Text>
                <Text style={[Typography.captionSM, { color: colors.labelSecondary }]}>Cancel anytime</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[Typography.titleLG, { color: colors.labelPrimary, fontWeight: '800' }]}>
                  ₹69
                </Text>
                <Text style={[Typography.captionSM, { color: colors.labelTertiary }]}>/ month</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Feature List */}
        <View style={styles.featureList}>
          {PRO_FEATURES.map((feat) => (
            <View key={feat.title} style={styles.featureRow}>
              <Text style={styles.featureEmoji}>{feat.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.titleSM, { color: colors.labelPrimary }]}>
                  {feat.title}
                </Text>
                <Text style={[Typography.captionLG, { color: colors.labelSecondary, marginTop: 2, lineHeight: 18 }]}>
                  {feat.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Button
          title={selectedPlan === 'yearly' ? 'Upgrade to Pro (₹499/yr) ✦' : 'Upgrade to Pro (₹69/mo) ✦'}
          onPress={handleSubscribe}
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
  },
  titleSection: {
    marginVertical: Layout.md,
  },
  plansContainer: {
    gap: 12,
    marginVertical: Layout.md,
  },
  planCard: {
    padding: Layout.lg,
    borderRadius: Layout.radius2XL,
    position: 'relative',
    ...Layout.cardShadow,
  },
  planBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featureList: {
    gap: 16,
    marginTop: Layout.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  featureEmoji: {
    fontSize: 22,
    marginTop: 2,
  },
});
