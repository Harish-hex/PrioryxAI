import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';
import { AppHaptics } from '@/lib/haptics';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  onOpenMemory?: () => void;
}

export function ChatInput({ onSend, disabled = false, onOpenMemory }: ChatInputProps) {
  const [text, setText] = useState('');
  const { colors, isDark } = useTheme();

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    AppHaptics.light();
    onSend(text.trim());
    setText('');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.surface1 : colors.bgPrimary,
          borderTopColor: colors.separator,
        },
      ]}
    >
      {onOpenMemory && (
        <TouchableOpacity
          onPress={() => {
            AppHaptics.selection();
            onOpenMemory();
          }}
          style={[styles.memoryBtn, { backgroundColor: colors.surface2 }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ fontSize: 16 }}>🧠</Text>
        </TouchableOpacity>
      )}

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Ask anything about syllabus, tasks, career..."
        placeholderTextColor={colors.labelTertiary}
        style={[
          styles.input,
          {
            color: colors.labelPrimary,
            backgroundColor: isDark ? colors.surface2 : colors.surface2,
          },
        ]}
        multiline
        maxLength={1000}
        editable={!disabled}
      />

      <TouchableOpacity
        onPress={handleSend}
        disabled={!text.trim() || disabled}
        style={[
          styles.sendBtn,
          {
            backgroundColor: text.trim() && !disabled ? colors.brandViolet : colors.surface3,
          },
        ]}
      >
        <Text
          style={[
            Typography.titleSM,
            { color: text.trim() && !disabled ? '#FFFFFF' : colors.labelDisabled },
          ]}
        >
          ↑
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.sm,
    borderTopWidth: 1,
    gap: 8,
  },
  memoryBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: Layout.radiusLG,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
