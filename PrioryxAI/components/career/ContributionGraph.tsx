import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';

interface ContributionDay {
  date: string;
  count: number;
}

interface ContributionGraphProps {
  days?: ContributionDay[];
  streakDays?: number;
}

const SQUARE_SIZE = 12;
const SQUARE_GAP = 3;
const WEEKS_COUNT = 24; // ~6 months

export function ContributionGraph({
  days = [],
  streakDays = 0,
}: ContributionGraphProps) {
  const { colors, isDark } = useTheme();

  // Create a 24-week x 7-day grid with data
  const gridData = useMemo(() => {
    const dayMap = new Map<string, number>();
    days.forEach((d) => dayMap.set(d.date, d.count));

    const weeks: Array<Array<{ date: string; count: number; level: number }>> = [];
    const today = new Date();

    for (let w = WEEKS_COUNT - 1; w >= 0; w--) {
      const week: Array<{ date: string; count: number; level: number }> = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (w * 7 + (6 - d)));
        const dateStr = date.toISOString().split('T')[0];
        const count = dayMap.get(dateStr) || 0;
        let level = 0;
        if (count >= 5) level = 4;
        else if (count >= 3) level = 3;
        else if (count >= 2) level = 2;
        else if (count >= 1) level = 1;
        week.push({ date: dateStr, count, level });
      }
      weeks.push(week);
    }
    return weeks;
  }, [days]);

  const getLevelColor = (level: number) => {
    switch (level) {
      case 4:
        return '#7C3AED';
      case 3:
        return '#8B5CF6';
      case 2:
        return '#A78BFA';
      case 1:
        return '#C4B5FD';
      default:
        return isDark ? '#27272A' : '#F1F5F9';
    }
  };

  const svgWidth = WEEKS_COUNT * (SQUARE_SIZE + SQUARE_GAP);
  const svgHeight = 7 * (SQUARE_SIZE + SQUARE_GAP);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.surface1 : colors.bgPrimary,
          borderColor: colors.separator,
        },
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text style={[Typography.captionLG, { color: colors.labelSecondary, fontWeight: '700' }]}>
            GITHUB COMMIT STREAK
          </Text>
          <Text style={[Typography.titleMD, { color: colors.labelPrimary, marginTop: 2 }]}>
            {streakDays} Days Active
          </Text>
        </View>

        <View style={styles.legend}>
          <Text style={[Typography.captionSM, { color: colors.labelTertiary }]}>Less</Text>
          {[0, 1, 2, 3, 4].map((lvl) => (
            <View
              key={lvl}
              style={[
                styles.legendSquare,
                { backgroundColor: getLevelColor(lvl) },
              ]}
            />
          ))}
          <Text style={[Typography.captionSM, { color: colors.labelTertiary }]}>More</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Svg width={svgWidth} height={svgHeight}>
          {gridData.map((week, wIdx) =>
            week.map((day, dIdx) => (
              <Rect
                key={`${wIdx}-${dIdx}`}
                x={wIdx * (SQUARE_SIZE + SQUARE_GAP)}
                y={dIdx * (SQUARE_SIZE + SQUARE_GAP)}
                width={SQUARE_SIZE}
                height={SQUARE_SIZE}
                rx={2.5}
                fill={getLevelColor(day.level)}
              />
            ))
          )}
        </Svg>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Layout.radiusXL,
    padding: Layout.lg,
    borderWidth: 1,
    marginVertical: Layout.xs,
    ...Layout.cardShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendSquare: {
    width: 9,
    height: 9,
    borderRadius: 2,
  },
  scrollContent: {
    paddingVertical: 4,
  },
});
