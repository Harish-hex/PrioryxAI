import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import Toast from 'react-native-toast-message';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { SafeScrollView } from '@/components/layout/SafeScrollView';
import { JobCard, JobListing } from '@/components/career/JobCard';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';
import { AppHaptics } from '@/lib/haptics';

const JOBS: JobListing[] = [
  {
    id: '1',
    role: 'SDE Intern (Backend / Go)',
    company: 'Razorpay',
    location: 'Bengaluru (Hybrid)',
    stipend_or_ctc: '₹45,000 / month',
    match_score: 92,
    skills_required: ['Go', 'PostgreSQL', 'Redis', 'Docker'],
    apply_url: 'https://razorpay.com/jobs',
    bookmarked: true,
  },
  {
    id: '2',
    role: 'Junior Fullstack Engineer',
    company: 'CRED',
    location: 'Bengaluru (On-site)',
    stipend_or_ctc: '18 - 24 LPA',
    match_score: 84,
    skills_required: ['React', 'TypeScript', 'Node.js', 'System Design'],
    apply_url: 'https://cred.club/careers',
    bookmarked: false,
  },
  {
    id: '3',
    role: 'AI / Machine Learning Intern',
    company: 'Postman',
    location: 'Remote (India)',
    stipend_or_ctc: '₹50,000 / month',
    match_score: 76,
    skills_required: ['Python', 'FastAPI', 'LLMs', 'Vector DBs'],
    apply_url: 'https://postman.com/careers',
    bookmarked: false,
  },
];

export default function JobMarketScreen() {
  const [jobs, setJobs] = useState<JobListing[]>(JOBS);
  const [filter, setFilter] = useState<'all' | 'high_match' | 'bookmarked'>('all');
  const { colors } = useTheme();

  const handleApply = async (url?: string) => {
    if (url) {
      await WebBrowser.openBrowserAsync(url);
    }
  };

  const handleToggleBookmark = (id: string) => {
    AppHaptics.selection();
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, bookmarked: !j.bookmarked } : j))
    );
    Toast.show({
      type: 'success',
      text1: 'Bookmark Updated',
    });
  };

  const filteredJobs = jobs.filter((j) => {
    if (filter === 'bookmarked') return j.bookmarked;
    if (filter === 'high_match') return j.match_score >= 85;
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <ScreenHeader
        title="Job Market 💼"
        subtitle="AI-matched roles based on your resume & projects"
        showBack
        showAvatar={false}
      />

      <View style={styles.filterRow}>
        {(['all', 'high_match', 'bookmarked'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => {
              AppHaptics.selection();
              setFilter(f);
            }}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  filter === f ? colors.brandViolet : colors.surface2,
                borderColor:
                  filter === f ? colors.brandViolet : colors.separator,
              },
            ]}
          >
            <Text
              style={[
                Typography.captionLG,
                {
                  color: filter === f ? '#FFFFFF' : colors.labelPrimary,
                  textTransform: 'capitalize',
                  fontWeight: '700',
                },
              ]}
            >
              {f === 'high_match' ? '90%+ Match' : f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SafeScrollView>
        <View style={styles.list}>
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onApply={handleApply}
              onToggleBookmark={handleToggleBookmark}
            />
          ))}
        </View>
      </SafeScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Layout.lg,
    gap: 8,
    paddingBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Layout.radiusFull,
    borderWidth: 1,
  },
  list: {
    gap: 8,
  },
});
