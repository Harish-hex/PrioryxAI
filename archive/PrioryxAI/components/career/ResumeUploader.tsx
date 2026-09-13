import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';
import { AppHaptics } from '@/lib/haptics';

interface ResumeUploaderProps {
  onFileSelected: (uri: string, name: string, mimeType: string) => void;
  uploading?: boolean;
}

export function ResumeUploader({
  onFileSelected,
  uploading = false,
}: ResumeUploaderProps) {
  const { colors, isDark } = useTheme();

  const handlePickDocument = async () => {
    AppHaptics.selection();
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/*',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        onFileSelected(file.uri, file.name, file.mimeType || 'application/pdf');
      }
    } catch {
      // handled
    }
  };

  const handlePickCamera = async () => {
    AppHaptics.selection();
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        onFileSelected(photo.uri, 'scanned_resume.jpg', 'image/jpeg');
      }
    } catch {
      // handled
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.surface1 : colors.bgPrimary,
          borderColor: colors.brandViolet,
        },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: 'rgba(124,58,237,0.1)' }]}>
        <Text style={{ fontSize: 32 }}>📄</Text>
      </View>

      <Text style={[Typography.titleMD, { color: colors.labelPrimary, marginTop: 14, textAlign: 'center' }]}>
        Upload your resume
      </Text>

      <Text
        style={[
          Typography.bodySM,
          { color: colors.labelSecondary, textAlign: 'center', marginTop: 4, maxWidth: 280 },
        ]}
      >
        PDF, DOCX, or scanned photo. AI extracts 64+ technical skills & SWOT match.
      </Text>

      {uploading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.brandViolet} />
          <Text style={[Typography.captionLG, { color: colors.brandViolet, marginTop: 8 }]}>
            Analyzing resume with AI...
          </Text>
        </View>
      ) : (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={handlePickDocument}
            style={[styles.actionBtn, { backgroundColor: colors.brandViolet }]}
            activeOpacity={0.85}
          >
            <Text style={[Typography.titleSM, { color: '#FFFFFF' }]}>Select File</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePickCamera}
            style={[
              styles.actionBtn,
              { backgroundColor: colors.surface2, borderColor: colors.separator, borderWidth: 1 },
            ]}
            activeOpacity={0.85}
          >
            <Text style={[Typography.titleSM, { color: colors.labelPrimary }]}>Scan Photo</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Layout.radius2XL,
    padding: Layout.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginVertical: Layout.sm,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  actionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Layout.radiusLG,
  },
});
