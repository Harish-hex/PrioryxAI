import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { AppHaptics } from '@/lib/haptics';

export interface JobListing {
  id: string;
  role: string;
  company: string;
  location: string;
  stipend_or_ctc: string;
  match_score: number;
  skills_required: string[];
  apply_url?: string;
  bookmarked?: boolean;
}

interface JobCardProps {
  job: JobListing;
  onApply: (url?: string) => void;
  onToggleBookmark?: (id: string) => void;
}

export function JobCard({ job, onApply, onToggleBookmark }: JobCardProps) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.surface1 : colors.bgPrimary,
          borderColor: colors.separator,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.leftInfo}>
          <Text style={[Typography.titleSM, { color: colors.labelPrimary }]} numberOfLines={1}>
            {job.role}
          </Text>
          <Text style={[Typography.captionLG, { color: colors.brandViolet, marginTop: 2 }]}>
            {job.company} • {job.location}
          </Text>
          <Text style={[Typography.captionSM, { color: colors.labelSecondary, marginTop: 2 }]}>
            {job.stipend_or_ctc}
          </Text>
        </View>

        <ScoreRing
          score={job.match_score}
          size={50}
          strokeWidth={4}
          label="Match"
        />
      </View>

      <View style={styles.skillsRow}>
        {job.skills_required.slice(0, 4).map((skill) => (
          <View
            key={skill}
            style={[styles.skillChip, { backgroundColor: colors.surface2 }]}
          >
            <Text style={[Typography.captionSM, { color: colors.labelSecondary, fontSize: 10 }]}>
              {skill}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={() => {
            AppHaptics.selection();
            onToggleBookmark?.(job.id);
          }}
          style={[styles.bookmarkBtn, { backgroundColor: colors.surface2 }]}
        >
          <Text style={{ fontSize: 16 }}>{job.bookmarked ? '★' : '☆'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            AppHaptics.selection();
            onApply(job.apply_url);
          }}
          style={[styles.applyBtn, { backgroundColor: colors.brandViolet }]}
        >
          <Text style={[Typography.titleSM, { color: '#FFFFFF', fontSize: 13 }]}>
            Apply Now →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Layout.md,
    borderRadius: Layout.radiusXL,
    borderWidth: 1,
    marginVertical: 4,
    ...Layout.cardShadow,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftInfo: {
    flex: 1,
    marginRight: 10,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 10,
  },
  skillChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  bookmarkBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
