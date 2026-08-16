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
import Toast from 'react-native-toast-message';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { Button } from '@/components/ui/Button';
import { ResumeUploader } from '@/components/career/ResumeUploader';
import { useTheme } from '@/hooks/useTheme';
import { AppHaptics } from '@/lib/haptics';

export default function SetupResumeScreen() {
  const [selectedFile, setSelectedFile] = useState<{ name: string; uri: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const { colors } = useTheme();

  const handleFileSelected = async (uri: string, name: string) => {
    setSelectedFile({ uri, name });
    AppHaptics.success();
    Toast.show({
      type: 'success',
      text1: 'Resume attached',
      text2: name,
    });
  };

  const handleFinish = async () => {
    try {
      setUploading(true);
      AppHaptics.light();
      // Simulate/process resume sync
      await new Promise((res) => setTimeout(res, 800));
      router.replace('/setup/complete');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.stepHeader}>
          <Text style={[Typography.captionSM, { color: colors.brandViolet, fontWeight: '800', letterSpacing: 1 }]}>
            STEP 3 OF 3
          </Text>
          <Text style={[Typography.titleXL, { color: colors.labelPrimary, marginTop: 4 }]}>
            Resume Intelligence
          </Text>
          <Text style={[Typography.bodyMD, { color: colors.labelSecondary, marginTop: 6 }]}>
            Upload your resume now to unlock placement match scores & project recommendations.
          </Text>
        </View>

        <ResumeUploader
          onFileSelected={handleFileSelected}
          uploading={uploading}
        />

        {selectedFile && (
          <View style={[styles.fileCard, { backgroundColor: colors.surface2 }]}>
            <Text style={{ fontSize: 20 }}>✅</Text>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.titleSM, { color: colors.labelPrimary }]} numberOfLines={1}>
                {selectedFile.name}
              </Text>
              <Text style={[Typography.captionSM, { color: colors.brandEmerald, fontWeight: '700' }]}>
                Ready for AI SWOT Analysis
              </Text>
            </View>
          </View>
        )}

        <View style={styles.actionSection}>
          <Button
            title={selectedFile ? 'Analyze & Enter Command Center →' : 'Skip & Finish Setup'}
            onPress={handleFinish}
            variant="gradient"
            size="lg"
            loading={uploading}
          />

          {!selectedFile && (
            <TouchableOpacity
              onPress={() => router.replace('/setup/complete')}
              style={styles.skipBtn}
            >
              <Text style={[Typography.titleSM, { color: colors.labelTertiary, fontSize: 14 }]}>
                I don't have a resume ready yet
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Layout.xl,
    paddingTop: Layout.xl,
    paddingBottom: Layout.xxl,
  },
  stepHeader: {
    marginBottom: Layout.xl,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: Layout.radiusLG,
    gap: 12,
    marginVertical: 12,
  },
  actionSection: {
    gap: 12,
    marginTop: Layout.xl,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});
