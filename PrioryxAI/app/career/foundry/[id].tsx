import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { SafeScrollView } from '@/components/layout/SafeScrollView';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';
import { AppHaptics } from '@/lib/haptics';

interface Phase {
  id: number;
  title: string;
  desc: string;
  completed: boolean;
  deliverables: string[];
}

const PHASES: Phase[] = [
  {
    id: 1,
    title: 'Problem Framing & System Architecture',
    desc: 'Define non-functional requirements (10,000 RPS) and draw high-level data flow diagrams.',
    completed: true,
    deliverables: ['System Diagram SVG', 'API Endpoint Contract', 'Latency budget sheet'],
  },
  {
    id: 2,
    title: 'Database Schema & Storage Engine',
    desc: 'Design PostgreSQL relational schema with indexes, migration files, and Docker compose config.',
    completed: true,
    deliverables: ['init.sql migration', 'Foreign key constraints', 'Indexing strategy'],
  },
  {
    id: 3,
    title: 'Core Algorithm & Rate Limiter Service',
    desc: 'Write Token Bucket and Leaky Bucket concurrency primitives in Go with atomic operations.',
    completed: true,
    deliverables: ['rate_limiter.go', 'Benchmark unit tests', 'Mutex & Atomic sync'],
  },
  {
    id: 4,
    title: 'Distributed Redis Cluster & Caching',
    desc: 'Connect Redis cluster with pipelining and Lua scripts for zero-race distributed counters.',
    completed: false,
    deliverables: ['Lua atomic script', 'Redis connection pool', 'Failover logic'],
  },
  {
    id: 5,
    title: 'Docker Containerization & GitHub Actions CI',
    desc: 'Multi-stage Dockerfile build, automated test runner, and vulnerability scans.',
    completed: false,
    deliverables: ['Dockerfile (<25MB)', 'github-actions.yml', 'Docker Compose file'],
  },
  {
    id: 6,
    title: 'Resume Impact Bullets & Interview Defense',
    desc: 'Synthesize STAR-method bullet points with quantifiable performance numbers.',
    completed: false,
    deliverables: ['3 ATS Bullet points', 'Interview FAQ script', 'GitHub README guide'],
  },
];

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams();
  const [phases, setPhases] = useState<Phase[]>(PHASES);
  const [expandedPhase, setExpandedPhase] = useState<number>(4);
  const [mentorInput, setMentorInput] = useState('');
  const [mentorReplies, setMentorReplies] = useState<string[]>([]);
  const { colors, isDark } = useTheme();

  const completedCount = phases.filter((p) => p.completed).length;
  const progress = completedCount / phases.length;

  const togglePhaseComplete = (phaseId: number) => {
    AppHaptics.success();
    setPhases((prev) =>
      prev.map((p) => (p.id === phaseId ? { ...p, completed: !p.completed } : p))
    );
  };

  const handleAskMentor = () => {
    if (!mentorInput.trim()) return;
    AppHaptics.light();
    setMentorReplies((prev) => [
      ...prev,
      `✨ AI Mentor: To write an atomic Redis Lua script for Token Bucket, use 'redis.call("HGET", KEYS[1], "tokens")' to avoid network round-trip race conditions.`,
    ]);
    setMentorInput('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <ScreenHeader
        title="Project Foundry 🔨"
        subtitle={`Phase ${completedCount + 1} of 6 in progress`}
        showBack
        showAvatar={false}
      />

      <SafeScrollView>
        {/* Project Header Banner */}
        <View
          style={[
            styles.banner,
            {
              backgroundColor: isDark ? colors.surface1 : colors.bgPrimary,
              borderColor: colors.separator,
            },
          ]}
        >
          <Badge label="INTERMEDIATE BACKEND" variant="brand" size="sm" />
          <Text style={[Typography.titleMD, { color: colors.labelPrimary, marginTop: 8 }]}>
            High-Throughput Distributed Rate Limiter
          </Text>
          <Text style={[Typography.bodySM, { color: colors.labelSecondary, marginTop: 4 }]}>
            Implements Token Bucket in Go + Redis cluster. Top-tier resume project for backend engineering interviews.
          </Text>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={[Typography.captionLG, { color: colors.labelSecondary, fontWeight: '700' }]}>
                PROGRESS
              </Text>
              <Text style={[Typography.captionLG, { color: colors.brandViolet, fontWeight: '800' }]}>
                {Math.round(progress * 100)}% COMPLETED
              </Text>
            </View>
            <ProgressBar progress={progress} height={6} color={colors.brandViolet} />
          </View>
        </View>

        {/* 6-Phase Accordion */}
        <Text style={[Typography.captionLG, { color: colors.labelSecondary, marginVertical: 10, fontWeight: '700' }]}>
          EXECUTION PHASES (6)
        </Text>

        <View style={styles.phasesList}>
          {phases.map((phase) => {
            const isExpanded = expandedPhase === phase.id;

            return (
              <View
                key={phase.id}
                style={[
                  styles.phaseCard,
                  {
                    backgroundColor: isDark ? colors.surface1 : colors.bgPrimary,
                    borderColor: phase.completed ? colors.brandEmerald : isExpanded ? colors.brandViolet : colors.separator,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => {
                    AppHaptics.selection();
                    setExpandedPhase(isExpanded ? 0 : phase.id);
                  }}
                  style={styles.phaseHeader}
                  activeOpacity={0.8}
                >
                  <TouchableOpacity
                    onPress={() => togglePhaseComplete(phase.id)}
                    style={[
                      styles.checkCircle,
                      {
                        backgroundColor: phase.completed ? colors.brandEmerald : 'transparent',
                        borderColor: phase.completed ? colors.brandEmerald : colors.separator,
                      },
                    ]}
                  >
                    {phase.completed && <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800' }}>✓</Text>}
                  </TouchableOpacity>

                  <View style={{ flex: 1 }}>
                    <Text style={[Typography.titleSM, { color: colors.labelPrimary }]}>
                      Phase {phase.id}: {phase.title}
                    </Text>
                  </View>

                  <Text style={{ color: colors.labelTertiary, fontSize: 16 }}>
                    {isExpanded ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={[styles.phaseBody, { borderTopColor: colors.separator }]}>
                    <Text style={[Typography.bodySM, { color: colors.labelSecondary, lineHeight: 20 }]}>
                      {phase.desc}
                    </Text>

                    <Text style={[Typography.captionLG, { color: colors.labelPrimary, marginTop: 12, fontWeight: '700' }]}>
                      Deliverables Checklist:
                    </Text>
                    {phase.deliverables.map((item, idx) => (
                      <View key={idx} style={styles.deliverableRow}>
                        <Text style={{ color: colors.brandViolet }}>•</Text>
                        <Text style={[Typography.bodySM, { color: colors.labelSecondary }]}>
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* AI Mentor Context-Locked Chat Box */}
        <View
          style={[
            styles.mentorBox,
            {
              backgroundColor: isDark ? colors.surface1 : '#F5F3FF',
              borderColor: colors.brandViolet,
            },
          ]}
        >
          <View style={styles.mentorHeader}>
            <Text style={{ fontSize: 20 }}>🧠</Text>
            <Text style={[Typography.titleSM, { color: colors.labelPrimary }]}>
              Ask AI Project Mentor
            </Text>
          </View>

          {mentorReplies.map((reply, idx) => (
            <View key={idx} style={[styles.replyBubble, { backgroundColor: colors.surface2 }]}>
              <Text style={[Typography.bodySM, { color: colors.labelPrimary }]}>{reply}</Text>
            </View>
          ))}

          <View style={styles.mentorInputRow}>
            <TextInput
              value={mentorInput}
              onChangeText={setMentorInput}
              placeholder="Ask anything about this project phase..."
              placeholderTextColor={colors.labelTertiary}
              style={[
                styles.mentorInput,
                {
                  color: colors.labelPrimary,
                  backgroundColor: isDark ? colors.surface2 : colors.bgPrimary,
                  borderColor: colors.separator,
                },
              ]}
            />

            <TouchableOpacity
              onPress={handleAskMentor}
              style={[styles.sendBtn, { backgroundColor: colors.brandViolet }]}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>↑</Text>
            </TouchableOpacity>
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
  banner: {
    padding: Layout.lg,
    borderRadius: Layout.radius2XL,
    borderWidth: 1,
    marginVertical: Layout.xs,
    ...Layout.cardShadow,
  },
  progressSection: {
    marginTop: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  phasesList: {
    gap: 8,
  },
  phaseCard: {
    borderRadius: Layout.radiusXL,
    borderWidth: 1,
    overflow: 'hidden',
    ...Layout.cardShadow,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  deliverableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  mentorBox: {
    borderRadius: Layout.radius2XL,
    padding: Layout.lg,
    borderWidth: 1.5,
    marginTop: 20,
    gap: 10,
  },
  mentorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replyBubble: {
    padding: 10,
    borderRadius: Layout.radiusLG,
  },
  mentorInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  mentorInput: {
    flex: 1,
    height: 44,
    borderRadius: Layout.radiusLG,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: Layout.radiusLG,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
