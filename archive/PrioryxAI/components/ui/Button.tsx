import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Layout } from '@/constants/layout';
import { AppHaptics } from '@/lib/haptics';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const handlePress = () => {
    if (disabled || loading) return;
    AppHaptics.light();
    onPress();
  };

  const height = size === 'sm' ? 36 : size === 'lg' ? 56 : 48;
  const paddingHorizontal = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 16 : 14;

  if (variant === 'gradient') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        style={[{ borderRadius: Layout.radiusLG, overflow: 'hidden' }, style]}
      >
        <LinearGradient
          colors={disabled ? ['#94A3B8', '#64748B'] : (Gradients.brand as any)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.base,
            { height, paddingHorizontal },
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              {icon}
              <Text style={[Typography.titleSM, styles.gradientText, { fontSize }, textStyle]}>
                {title}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          container: styles.secondaryContainer,
          text: styles.secondaryText,
        };
      case 'ghost':
        return {
          container: styles.ghostContainer,
          text: styles.ghostText,
        };
      case 'danger':
        return {
          container: styles.dangerContainer,
          text: styles.dangerText,
        };
      default:
        return {
          container: styles.primaryContainer,
          text: styles.primaryText,
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.base,
        { height, paddingHorizontal, borderRadius: Layout.radiusLG },
        vStyles.container,
        disabled && styles.disabledContainer,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFFFFF' : Colors.light.brandViolet}
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              Typography.titleSM,
              vStyles.text,
              { fontSize },
              disabled && styles.disabledText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryContainer: {
    backgroundColor: Colors.light.brandViolet,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  gradientText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryContainer: {
    backgroundColor: Colors.light.surface2,
    borderWidth: 1,
    borderColor: Colors.light.separator,
  },
  secondaryText: {
    color: Colors.light.labelPrimary,
    fontWeight: '600',
  },
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: Colors.light.brandViolet,
    fontWeight: '600',
  },
  dangerContainer: {
    backgroundColor: Colors.light.urgentBg,
    borderWidth: 1,
    borderColor: Colors.light.urgentBorder,
  },
  dangerText: {
    color: Colors.light.brandRed,
    fontWeight: '600',
  },
  disabledContainer: {
    opacity: 0.5,
  },
  disabledText: {
    color: Colors.light.labelDisabled,
  },
});
