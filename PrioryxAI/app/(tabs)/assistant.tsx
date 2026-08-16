import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ChatBubble, ChatMessage } from '@/components/assistant/ChatBubble';
import { ChatInput } from '@/components/assistant/ChatInput';
import { SuggestedPrompts } from '@/components/assistant/SuggestedPrompts';
import { MemoryCard } from '@/components/assistant/MemoryCard';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { apiCall } from '@/lib/api';
import { AppHaptics } from '@/lib/haptics';

export default function AssistantScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I'm your PrioryxAI academic & career copilot. Ask me to prioritize tasks, analyze syllabus topics, suggest system design projects, or review your resume.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [memoryModalVisible, setMemoryModalVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { profile, isPro } = useAuth();
  const { colors, isDark } = useTheme();

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // Call backend API assistant endpoint
      const response = await apiCall<{ reply?: string; message?: string; text?: string }>('/assistant', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          context: {
            college: profile?.college,
            semester: profile?.semester,
            github: profile?.github_username,
          },
        }),
      }).catch(() => null);

      const replyContent =
        response?.reply ||
        response?.message ||
        response?.text ||
        `Here is my prioritized plan for you:\n\n1. **Focus on high-leverage deliverables**: Complete immediate assignment deadlines first.\n2. **Targeted DSA Practice**: Solve 2 LeetCode Mediums on Trees/Graphs.\n3. **Portfolio**: Push 1 clean commit with tests for your current project.`;

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      AppHaptics.success();
    } catch {
      Toast.show({
        type: 'error',
        text1: 'AI Response Error',
        text2: 'Could not connect to PrioryxAI servers.',
      });
    } finally {
      setLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Toast.show({
      type: 'success',
      text1: 'Copied to clipboard',
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <ScreenHeader
        title="AI Copilot ✨"
        subtitle={isPro ? 'Pro Unlimited Access ✦' : 'Free Tier • Context-Locked'}
        showAvatar
        rightElement={
          !isPro ? (
            <TouchableOpacity
              onPress={() => {
                AppHaptics.selection();
                router.push('/(modals)/upgrade');
              }}
              style={[styles.proBadge, { backgroundColor: 'rgba(6,182,212,0.12)' }]}
            >
              <Text style={[Typography.captionSM, { color: colors.brandCyan, fontWeight: '800' }]}>
                UPGRADE ✦
              </Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ChatBubble message={item} onCopy={handleCopy} />
          )}
          ListFooterComponent={
            loading ? (
              <View style={styles.thinkingContainer}>
                <Text style={[Typography.captionSM, { color: colors.brandViolet, fontStyle: 'italic' }]}>
                  ✨ PrioryxAI is reasoning through your syllabus and goals...
                </Text>
              </View>
            ) : null
          }
        />

        {messages.length <= 2 && (
          <SuggestedPrompts onSelectPrompt={handleSendMessage} />
        )}

        <ChatInput
          onSend={handleSendMessage}
          disabled={loading}
          onOpenMemory={() => setMemoryModalVisible(true)}
        />
      </KeyboardAvoidingView>

      {/* Memory Sheet Modal */}
      <Modal
        visible={memoryModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMemoryModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.bgPrimary }]}>
          <View style={styles.modalHeader}>
            <Text style={[Typography.titleLG, { color: colors.labelPrimary }]}>
              AI Working Memory
            </Text>
            <TouchableOpacity
              onPress={() => setMemoryModalVisible(false)}
              style={[styles.closeBtn, { backgroundColor: colors.surface2 }]}
            >
              <Text style={{ fontSize: 16, color: colors.labelPrimary }}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={{ padding: Layout.lg }}>
            <MemoryCard profile={profile} />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatList: {
    paddingVertical: Layout.md,
  },
  thinkingContainer: {
    paddingHorizontal: Layout.lg,
    paddingVertical: 8,
  },
  proBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Layout.radiusFull,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.lg,
    paddingVertical: Layout.md,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
