import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { AppHaptics } from '@/lib/haptics';

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  emoji: string;
  badge: string;
  title: string;
  highlight: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    emoji: '⚡',
    badge: 'PRIORITY ENGINE',
    title: 'Never miss an exam, assignment, or deadline',
    highlight: 'again.',
    description:
      'PrioryxAI parses your college timetable and syllabus to auto-generate your daily priority checklist.',
  },
  {
    id: '2',
    emoji: '📄',
    badge: 'RESUME & ATS INTELLIGENCE',
    title: 'Bridge skill gaps with AI-recommended',
    highlight: 'projects.',
    description:
      'Upload your resume to discover placement match scores, missing industry frameworks, and ATS vulnerabilities.',
  },
  {
    id: '3',
    emoji: '🎯',
    badge: 'CAREER COMMAND CENTER',
    title: 'Unified coding profiles & study',
    highlight: 'duels.',
    description:
      'Sync GitHub, LeetCode, and HackerRank in one command center while competing with engineering peers across India.',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { colors, isDark } = useTheme();

  const handleNext = () => {
    AppHaptics.light();
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      router.push('/onboarding/auth');
    }
  };

  const handleSkip = () => {
    AppHaptics.selection();
    router.push('/onboarding/auth');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <LinearGradient
            colors={['#7C3AED', '#06B6D4']}
            style={styles.logoBadge}
          >
            <Text style={{ fontSize: 14 }}>⚡</Text>
          </LinearGradient>
          <Text style={[Typography.titleSM, { color: colors.labelPrimary, fontWeight: '800' }]}>
            PrioryxAI
          </Text>
        </View>

        <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[Typography.titleSM, { color: colors.labelSecondary, fontSize: 14 }]}>
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.emojiContainer, { backgroundColor: isDark ? colors.surface1 : '#F5F3FF' }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>

            <View style={styles.badge}>
              <Text style={[Typography.captionSM, { color: colors.brandViolet, fontWeight: '800', letterSpacing: 1 }]}>
                {item.badge}
              </Text>
            </View>

            <Text style={[Typography.titleXL, { color: colors.labelPrimary, textAlign: 'center', marginTop: 14 }]}>
              {item.title}{' '}
              <Text style={{ color: colors.brandViolet }}>{item.highlight}</Text>
            </Text>

            <Text
              style={[
                Typography.bodyMD,
                { color: colors.labelSecondary, textAlign: 'center', marginTop: 12, lineHeight: 24, maxWidth: 320 },
              ]}
            >
              {item.description}
            </Text>
          </View>
        )}
      />

      {/* Footer / Pagination & CTA */}
      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentIndex ? colors.brandViolet : colors.surface3,
                  width: index === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <Button
          title={currentIndex === SLIDES.length - 1 ? 'Get Started ⚡' : 'Continue →'}
          onPress={handleNext}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.xl,
    paddingTop: Layout.sm,
    paddingBottom: Layout.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.xxl,
  },
  emojiContainer: {
    width: 110,
    height: 110,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emoji: {
    fontSize: 52,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Layout.radiusFull,
    backgroundColor: 'rgba(124,58,237,0.1)',
  },
  footer: {
    paddingHorizontal: Layout.xl,
    paddingBottom: Layout.xl,
    gap: 24,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
