import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';
import { useTheme } from '@/hooks/useTheme';

export default function IndexScreen() {
  const { user, profile, isLoading } = useAuthStore();
  const { colors } = useTheme();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/onboarding');
      return;
    }

    if (!profile?.college || !profile?.semester) {
      router.replace('/setup/profile');
      return;
    }

    router.replace('/(tabs)');
  }, [user, profile, isLoading]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <ActivityIndicator size="large" color={colors.brandViolet} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
