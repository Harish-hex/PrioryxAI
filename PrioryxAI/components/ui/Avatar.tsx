import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle, ImageStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

interface AvatarProps {
  name?: string | null;
  uri?: string | null;
  size?: number;
  style?: ViewStyle;
}

export function Avatar({
  name = 'User',
  uri,
  size = 40,
  style,
}: AvatarProps) {
  const initials = (name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 },
          style as ImageStyle,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <Text
        style={[
          Typography.titleSM,
          styles.initials,
          { fontSize: Math.max(12, Math.floor(size * 0.38)) },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: Colors.light.surface2,
  },
  fallback: {
    backgroundColor: Colors.light.brandViolet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
