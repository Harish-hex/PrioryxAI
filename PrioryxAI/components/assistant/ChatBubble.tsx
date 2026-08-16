import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';
import { AppHaptics } from '@/lib/haptics';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatBubbleProps {
  message: ChatMessage;
  onCopy?: (text: string) => void;
}

export function ChatBubble({ message, onCopy }: ChatBubbleProps) {
  const { colors, isDark } = useTheme();
  const isUser = message.role === 'user';

  const handleCopy = () => {
    AppHaptics.selection();
    onCopy?.(message.content);
  };

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      {!isUser && (
        <View style={styles.assistantAvatar}>
          <Text style={{ fontSize: 16 }}>✨</Text>
        </View>
      )}

      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.userBubble, { backgroundColor: colors.brandViolet }]
            : [
                styles.assistantBubble,
                {
                  backgroundColor: isDark ? colors.surface1 : colors.surface2,
                  borderColor: colors.separator,
                },
              ],
        ]}
      >
        <Text
          style={[
            Typography.bodyMD,
            {
              color: isUser ? '#FFFFFF' : colors.labelPrimary,
              lineHeight: 22,
            },
          ]}
          selectable
        >
          {message.content}
        </Text>

        <View style={styles.footer}>
          <Text
            style={[
              Typography.captionSM,
              {
                color: isUser ? 'rgba(255,255,255,0.7)' : colors.labelTertiary,
                fontSize: 10,
              },
            ]}
          >
            {message.timestamp}
          </Text>

          {!isUser && (
            <TouchableOpacity
              onPress={handleCopy}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[Typography.captionSM, { color: colors.labelTertiary, fontSize: 10 }]}>
                Copy
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 6,
    paddingHorizontal: Layout.sm,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
    gap: 8,
  },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(124,58,237,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Layout.radiusXL,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 8,
  },
});
