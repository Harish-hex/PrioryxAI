import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { SafeScrollView } from '@/components/layout/SafeScrollView';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { Badge } from '@/components/ui/Badge';
import { useTheme } from '@/hooks/useTheme';
import { AppHaptics } from '@/lib/haptics';

interface VideoItem {
  id: string;
  title: string;
  channel: string;
  duration: string;
  category: string;
  views: string;
  thumbnail: string;
  url: string;
}

const CATEGORIES = ['All', 'DSA & LeetCode', 'System Design', 'Fullstack', 'AI & ML', 'Interview Prep'];

const VIDEOS: VideoItem[] = [
  {
    id: '1',
    title: 'Top 15 Dynamic Programming Patterns for FAANG',
    channel: 'NeetCode',
    duration: '42:15',
    category: 'DSA & LeetCode',
    views: '340K views',
    thumbnail: 'https://images.unsplash.com/photo-1516116211227-bbc13c73335c?w=600&auto=format&fit=crop&q=60',
    url: 'https://www.youtube.com/watch?v=Hdr64lKQ3e4',
  },
  {
    id: '2',
    title: 'Design a Distributed Message Queue like Kafka',
    channel: 'Gaurav Sen',
    duration: '28:40',
    category: 'System Design',
    views: '520K views',
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=60',
    url: 'https://www.youtube.com/watch?v=kGZmsU7l870',
  },
  {
    id: '3',
    title: 'Building Production REST & gRPC Microservices in Go',
    channel: 'Tech With Tim',
    duration: '35:10',
    category: 'Fullstack',
    views: '180K views',
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=60',
    url: 'https://www.youtube.com/watch?v=un6ZyFkqFKo',
  },
  {
    id: '4',
    title: 'How Transformer Attention Mechanisms Actually Work',
    channel: 'StatQuest',
    duration: '18:50',
    category: 'AI & ML',
    views: '890K views',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&auto=format&fit=crop&q=60',
    url: 'https://www.youtube.com/watch?v=PSs6nx4l_6k',
  },
];

export default function FeedScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { colors, isDark } = useTheme();

  const handleOpenVideo = async (url: string) => {
    AppHaptics.selection();
    await WebBrowser.openBrowserAsync(url);
  };

  const filteredVideos =
    selectedCategory === 'All'
      ? VIDEOS
      : VIDEOS.filter((v) => v.category === selectedCategory);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <ScreenHeader
        title="Learning Feed 🧭"
        subtitle="Curated high-signal engineering lectures & walkthroughs"
        showAvatar
      />

      {/* Category Pills */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => {
                AppHaptics.selection();
                setSelectedCategory(cat);
              }}
              style={[
                styles.categoryChip,
                {
                  backgroundColor:
                    selectedCategory === cat ? colors.brandViolet : colors.surface2,
                  borderColor:
                    selectedCategory === cat ? colors.brandViolet : colors.separator,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  Typography.captionLG,
                  {
                    color: selectedCategory === cat ? '#FFFFFF' : colors.labelPrimary,
                    fontWeight: '700',
                  },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <SafeScrollView>
        <View style={styles.list}>
          {filteredVideos.map((video) => (
            <TouchableOpacity
              key={video.id}
              onPress={() => handleOpenVideo(video.url)}
              style={[
                styles.videoCard,
                {
                  backgroundColor: isDark ? colors.surface1 : colors.bgPrimary,
                  borderColor: colors.separator,
                },
              ]}
              activeOpacity={0.88}
            >
              <View style={styles.thumbnailContainer}>
                <Image
                  source={{ uri: video.thumbnail }}
                  style={styles.thumbnail}
                />
                <View style={styles.durationBadge}>
                  <Text style={[Typography.captionSM, { color: '#FFFFFF', fontWeight: '700' }]}>
                    {video.duration}
                  </Text>
                </View>
              </View>

              <View style={styles.videoDetails}>
                <View style={styles.badgeRow}>
                  <Badge label={video.category} variant="brand" size="sm" />
                  <Text style={[Typography.captionSM, { color: colors.labelTertiary }]}>
                    {video.views}
                  </Text>
                </View>

                <Text
                  style={[
                    Typography.titleSM,
                    { color: colors.labelPrimary, marginTop: 6, lineHeight: 20 },
                  ]}
                  numberOfLines={2}
                >
                  {video.title}
                </Text>

                <Text
                  style={[
                    Typography.captionSM,
                    { color: colors.labelSecondary, marginTop: 4, fontWeight: '600' },
                  ]}
                >
                  {video.channel}
                </Text>
              </View>
            </TouchableOpacity>
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
  categoryContainer: {
    paddingBottom: 8,
  },
  categoryScroll: {
    paddingHorizontal: Layout.lg,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Layout.radiusFull,
    borderWidth: 1,
  },
  list: {
    gap: 14,
  },
  videoCard: {
    borderRadius: Layout.radius2XL,
    overflow: 'hidden',
    borderWidth: 1,
    ...Layout.cardShadow,
  },
  thumbnailContainer: {
    height: 180,
    width: '100%',
    backgroundColor: '#1E1E1E',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoDetails: {
    padding: Layout.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
