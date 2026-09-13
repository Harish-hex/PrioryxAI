import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/hooks/useTheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const { isDark, colors } = useTheme();

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text style={[Typography.captionLG, { color: colors.labelSecondary, marginBottom: 6 }]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? colors.surface2 : colors.bgPrimary,
            borderColor: error ? colors.brandRed : colors.separator,
          },
        ]}
      >
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}

        <TextInput
          placeholderTextColor={colors.labelTertiary}
          style={[
            styles.input,
            { color: colors.labelPrimary },
            style,
          ]}
          {...props}
        />

        {rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>}
      </View>

      {error ? (
        <Text style={[Typography.captionSM, { color: colors.brandRed, marginTop: 4 }]}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={[Typography.captionSM, { color: colors.labelTertiary, marginTop: 4 }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderRadius: Layout.radiusLG,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  iconContainer: {
    marginRight: 8,
  },
});
