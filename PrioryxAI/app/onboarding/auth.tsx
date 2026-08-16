import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Toast from 'react-native-toast-message';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Divider } from '@/components/ui/Divider';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { AppHaptics } from '@/lib/haptics';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors, isDark } = useTheme();

  const handleOAuth = async (provider: 'google' | 'github') => {
    AppHaptics.selection();
    try {
      setLoading(true);
      const redirectUrl = Linking.createURL('/onboarding/auth');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;
      if (data?.url) {
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        if (res.type === 'success' && res.url) {
          const params = Linking.parse(res.url);
          if (params.queryParams?.access_token) {
            router.replace('/setup/profile');
          }
        }
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Authentication Error',
        text2: err.message || 'Failed to sign in with OAuth',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing fields',
        text2: 'Please enter both email and password',
      });
      return;
    }

    try {
      setLoading(true);
      AppHaptics.light();

      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        if (data.session) {
          router.replace('/setup/profile');
        } else {
          Toast.show({
            type: 'success',
            text1: 'Check your email',
            text2: 'Confirmation link sent to your inbox.',
          });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
        if (data.session) {
          router.replace('/');
        }
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: mode === 'signup' ? 'Registration failed' : 'Sign in failed',
        text2: err.message || 'Please check your credentials.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Top Title */}
          <View style={styles.header}>
            <Text style={[Typography.titleXL, { color: colors.labelPrimary }]}>
              {mode === 'signin' ? 'Welcome back' : 'Create account'}
            </Text>
            <Text style={[Typography.bodyMD, { color: colors.labelSecondary, marginTop: 6 }]}>
              {mode === 'signin'
                ? 'Sign in to access your prioritized tasks & career tools.'
                : 'Join engineering students preparing for top product careers.'}
            </Text>
          </View>

          {/* Social OAuth Buttons */}
          <View style={styles.socialButtons}>
            <TouchableOpacity
              onPress={() => handleOAuth('google')}
              disabled={loading}
              style={[
                styles.socialBtn,
                { backgroundColor: colors.surface1, borderColor: colors.separator },
              ]}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 18 }}>🌐</Text>
              <Text style={[Typography.titleSM, { color: colors.labelPrimary, fontSize: 14 }]}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleOAuth('github')}
              disabled={loading}
              style={[
                styles.socialBtn,
                { backgroundColor: colors.surface1, borderColor: colors.separator },
              ]}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 18 }}>🐙</Text>
              <Text style={[Typography.titleSM, { color: colors.labelPrimary, fontSize: 14 }]}>
                Continue with GitHub
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerRow}>
            <Divider style={{ flex: 1 }} />
            <Text style={[Typography.captionSM, { color: colors.labelTertiary, marginHorizontal: 12 }]}>
              OR EMAIL
            </Text>
            <Divider style={{ flex: 1 }} />
          </View>

          {/* Email / Password Form */}
          <View style={styles.form}>
            {mode === 'signup' && (
              <Input
                label="Full Name"
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            )}

            <Input
              label="Email Address"
              placeholder="you@college.edu.in"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Button
              title={mode === 'signin' ? 'Sign In ⚡' : 'Create Free Account →'}
              onPress={handleEmailAuth}
              variant="gradient"
              size="lg"
              loading={loading}
              style={{ marginTop: 12 }}
            />
          </View>

          {/* Toggle between Sign In / Sign Up */}
          <View style={styles.toggleRow}>
            <Text style={[Typography.bodyMD, { color: colors.labelSecondary }]}>
              {mode === 'signin'
                ? "Don't have an account?"
                : 'Already have an account?'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                AppHaptics.selection();
                setMode(mode === 'signin' ? 'signup' : 'signin');
              }}
            >
              <Text style={[Typography.titleSM, { color: colors.brandViolet, fontSize: 15 }]}>
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  header: {
    marginBottom: Layout.xl,
  },
  socialButtons: {
    gap: 12,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: Layout.radiusLG,
    borderWidth: 1,
    gap: 10,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Layout.xl,
  },
  form: {
    gap: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Layout.xxl,
  },
});
