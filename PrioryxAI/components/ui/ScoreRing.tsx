import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/useTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;
}

export function ScoreRing({
  score = 0,
  size = 80,
  strokeWidth = 7,
  showLabel = true,
  label,
}: ScoreRingProps) {
  const { colors } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.min(100, Math.max(0, score)) / 100, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [score]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  const getScoreColor = () => {
    if (score >= 80) return colors.brandEmerald;
    if (score >= 60) return colors.brandCyan;
    if (score >= 40) return colors.brandAmber;
    return colors.brandRed;
  };

  const scoreColor = getScoreColor();

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.surface3}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated score arc */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={scoreColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
            fill="transparent"
          />
        </G>
      </Svg>

      {showLabel && (
        <View style={styles.labelContainer}>
          <Text
            style={[
              Typography.titleMD,
              { color: colors.labelPrimary, fontSize: Math.max(14, Math.floor(size * 0.28)), fontWeight: '800' },
            ]}
          >
            {Math.round(score)}
          </Text>
          {label && (
            <Text
              style={[
                Typography.captionSM,
                { color: colors.labelSecondary, fontSize: Math.max(9, Math.floor(size * 0.13)) },
              ]}
            >
              {label}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
