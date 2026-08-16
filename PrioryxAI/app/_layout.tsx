import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';
import { useTheme } from '@/hooks/useTheme';
import '../global.css';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { isDark } = useTheme();
  const { loadProfile, setUser } = useAuthStore();

  useEffect(() => {
    // Initialize Auth state
    loadProfile().finally(() => {
      SplashScreen.hideAsync().catch(() => {});
    });

    // Subscribe to Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          loadProfile();
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: isDark ? '#000000' : '#FFFFFF' },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding/index" />
            <Stack.Screen name="onboarding/auth" />
            <Stack.Screen name="setup/profile" />
            <Stack.Screen name="setup/github" />
            <Stack.Screen name="setup/resume" />
            <Stack.Screen name="setup/complete" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="(modals)/add-task"
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="(modals)/upgrade"
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="(modals)/notifications"
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen name="career/resume/index" />
            <Stack.Screen name="career/foundry/index" />
            <Stack.Screen name="career/foundry/[id]" />
            <Stack.Screen name="career/coding/unified" />
            <Stack.Screen name="career/coding/github" />
            <Stack.Screen name="career/jobs/index" />
            <Stack.Screen name="career/collab/index" />
          </Stack>
          <Toast />
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
