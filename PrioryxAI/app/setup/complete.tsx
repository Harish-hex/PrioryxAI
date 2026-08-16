import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { AppHaptics } from '@/lib/haptics';

export default function SetupCompleteScreen() {
  const { colors, isDark } = useTheme();

  useEffect(() => {
    AppHaptics.success();
  }, []);

  const handleEnter = () => {
    AppHaptics.medium();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={styles.content}>
        <LinearGradient
          colors={['#7C3AED', '#06B6D4']}
          style={styles.circle}
        >
          <Text style={{ fontSize: 56 }}>🚀</Text>
        </LinearGradient>

        <Text style={[Typography.titleXL, { color: colors.labelPrimary, textAlign: 'center', marginTop: 24 }]}>
          You're Ready to Roll!
        </Text>

        <Text
          style={[
            Typography.bodyMD,
            { color: colors.labelSecondary, textAlign: 'center', marginTop: 12, lineHeight: 24, maxWidth: 300 },
          ]}
        >
          Your college roadmap, priority checklist, and AI career assistant are initialized.
        </Text>

        <View style={[styles.summaryCard, { backgroundColor: isDark ? colors.surface1 : colors.surface2 }]}>
          <View style={styles.checkRow}>
            <Text style={{ fontSize: 16 }}>⚡</Text>
            <Text style={[Typography.bodyMD, { color: colors.labelPrimary, flex: 1 }]}>
              Daily Priority Engine Active
            </Text>
          </View>

          <View style={styles.checkRow}>
            <Text style={{ fontSize: 16 }}>🧠</Text>
            <Text style={[Typography.bodyMD, { color: colors.labelPrimary, flex: 1 }]}>
              AI Working Memory Synchronized
            </Text>
          </View>

          <View style={styles.checkRow}>
            <Text style={{ fontSize: 16 }}>🎯</Text>
            <Text style={[Typography.bodyMD, { color: colors.labelPrimary, flex: 1 }]}>
              Placement Roadmap Prepared
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Launch PrioryxAI Command Center ⚡"
          onPress={handleEnter}
          variant="gradient"
          size="lg"
          style={{ width: '100%' }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.xl,
  },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...Layout.cardShadow,
  },
  summaryCard: {
    width: '100%',
    padding: Layout.lg,
    borderRadius: Layout.radius2XL,
    gap: 14,
    marginTop: 32,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footer: {
    paddingHorizontal: Layout.xl,
    paddingBottom: Layout.xl,
  },
});
