import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { SafeScrollView } from '@/components/layout/SafeScrollView';
import { ResumeUploader } from '@/components/career/ResumeUploader';
import { SkillsCloud } from '@/components/career/SkillsCloud';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Badge } from '@/components/ui/Badge';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';
import { AppHaptics } from '@/lib/haptics';

export default function ResumeIntelligenceScreen() {
  const [atsScore, setAtsScore] = useState(78);
  const [extractedSkills, setExtractedSkills] = useState([
    'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'REST APIs', 'Git', 'TailwindCSS',
  ]);
  const [missingSkills, setMissingSkills] = useState([
    'Redis Caching', 'Kafka / RabbitMQ', 'Microservices', 'Kubernetes', 'CI/CD Pipelines',
  ]);
  const [uploading, setUploading] = useState(false);
  const { colors, isDark } = useTheme();

  const handleFileSelected = async (uri: string, name: string) => {
    setUploading(true);
    AppHaptics.light();
    await new Promise((res) => setTimeout(res, 1200));
    setAtsScore(86);
    setExtractedSkills((prev) => [...prev, 'Python', 'FastAPI', 'AWS S3']);
    setUploading(false);
    AppHaptics.success();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <ScreenHeader
        title="Resume Intelligence 📄"
        subtitle="ATS score & SWOT gap analysis"
        showBack
        showAvatar={false}
      />

      <SafeScrollView>
        {/* Top Score Banner */}
        <View
          style={[
            styles.scoreCard,
            {
              backgroundColor: isDark ? colors.surface1 : colors.bgPrimary,
              borderColor: colors.separator,
            },
          ]}
        >
          <ScoreRing score={atsScore} size={92} strokeWidth={8} label="ATS Score" />

          <View style={styles.scoreDetails}>
            <Text style={[Typography.titleMD, { color: colors.labelPrimary }]}>
              {atsScore >= 80 ? 'Strong Tier 1 Profile' : 'Target Improvements Found'}
            </Text>
            <Text style={[Typography.bodySM, { color: colors.labelSecondary, marginTop: 4 }]}>
              Matched against 1,200+ SDE job descriptions at top product firms.
            </Text>
          </View>
        </View>

        {/* Uploader */}
        <ResumeUploader
          onFileSelected={handleFileSelected}
          uploading={uploading}
        />

        {/* Skills Extracted */}
        <SkillsCloud skills={extractedSkills} title="DETECTED TECHNICAL SKILLS" />

        {/* Missing Placement Keywords */}
        <View
          style={[
            styles.missingCard,
            {
              backgroundColor: isDark ? colors.surface1 : colors.bgPrimary,
              borderColor: colors.separator,
            },
          ]}
        >
          <Text style={[Typography.captionLG, { color: colors.brandAmber, fontWeight: '700' }]}>
            RECOMMENDED MISSING KEYWORDS
          </Text>
          <Text style={[Typography.bodySM, { color: colors.labelSecondary, marginTop: 4 }]}>
            Add real projects with these tools to boost ATS pass-rate by 40%:
          </Text>

          <View style={styles.missingChips}>
            {missingSkills.map((skill) => (
              <View
                key={skill}
                style={[
                  styles.missingChip,
                  { backgroundColor: colors.highBg, borderColor: colors.highBorder },
                ]}
              >
                <Text style={[Typography.captionLG, { color: colors.highText, fontWeight: '700' }]}>
                  + {skill}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </SafeScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.lg,
    borderRadius: Layout.radius2XL,
    borderWidth: 1,
    gap: 16,
    marginVertical: Layout.xs,
    ...Layout.cardShadow,
  },
  scoreDetails: {
    flex: 1,
  },
  missingCard: {
    padding: Layout.lg,
    borderRadius: Layout.radius2XL,
    borderWidth: 1,
    marginVertical: Layout.sm,
    ...Layout.cardShadow,
  },
  missingChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  missingChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Layout.radiusFull,
    borderWidth: 1,
  },
});
