import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Layout } from '@/constants/layout';
import { MoreSheet } from '@/components/layout/MoreSheet';
import { useTheme } from '@/hooks/useTheme';
import { AppHaptics } from '@/lib/haptics';

export default function TabLayout() {
  const moreSheetRef = useRef<BottomSheetModal>(null);
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const handleOpenMore = () => {
    AppHaptics.selection();
    moreSheetRef.current?.present();
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: isDark ? '#121214' : '#FFFFFF',
            borderTopColor: colors.separator,
            borderTopWidth: 1,
            height: (Platform.OS === 'ios' ? 54 : 60) + insets.bottom,
            paddingBottom: insets.bottom + 4,
            paddingTop: 6,
          },
          tabBarActiveTintColor: colors.brandViolet,
          tabBarInactiveTintColor: colors.labelTertiary,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 20 }}>{focused ? '⚡' : '⚡'}</Text>
            ),
          }}
        />

        <Tabs.Screen
          name="feed"
          options={{
            title: 'Feed',
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 20 }}>{focused ? '🧭' : '🧭'}</Text>
            ),
          }}
        />

        <Tabs.Screen
          name="assistant"
          options={{
            title: 'AI Copilot',
            tabBarButton: ({ onPress }) => (
              <TouchableOpacity
                onPress={(e) => {
                  AppHaptics.medium();
                  onPress?.(e);
                }}
                style={styles.aiButtonContainer}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#7C3AED', '#06B6D4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.aiButton}
                >
                  <Text style={{ fontSize: 22 }}>✨</Text>
                </LinearGradient>
              </TouchableOpacity>
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 20 }}>{focused ? '👤' : '👤'}</Text>
            ),
          }}
        />

        <Tabs.Screen
          name="more"
          options={{
            title: 'Career',
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 20 }}>{focused ? '🎛️' : '🎛️'}</Text>
            ),
            tabBarButton: () => (
              <TouchableOpacity
                onPress={handleOpenMore}
                activeOpacity={0.8}
                style={styles.tabBarItem}
              >
                <Text style={{ fontSize: 20 }}>🎛️</Text>
                <Text style={[styles.tabLabel, { color: colors.labelTertiary }]}>Career</Text>
              </TouchableOpacity>
            ),
          }}
        />
      </Tabs>

      <MoreSheet ref={moreSheetRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  aiButtonContainer: {
    top: -16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  aiButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    ...Layout.cardShadow,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  tabBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
