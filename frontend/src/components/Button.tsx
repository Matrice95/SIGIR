/**
 * Composant Button personnalisé
 */

import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SIZES, SHADOWS } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const buttonStyle: ViewStyle = {
    ...styles.button,
    ...styles[`${variant}Button`],
    ...styles[`${size}Button`],
    ...(fullWidth && { width: '100%' }),
    ...(disabled && styles.disabledButton),
  };

  const textStyle: TextStyle = {
    ...styles.text,
    ...styles[`${variant}Text`],
    ...styles[`${size}Text`],
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        buttonStyle,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? COLORS.primary : COLORS.textLight} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={size === 'large' ? 24 : 20}
              color={variant === 'outline' ? COLORS.primary : COLORS.textLight}
              style={styles.icon}
            />
          )}
          <Text style={textStyle}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.borderRadius.md,
    ...SHADOWS.small,
  },
  
  // Variants
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  dangerButton: {
    backgroundColor: COLORS.error,
  },
  
  // Sizes
  smallButton: {
    height: SIZES.buttonHeight.small,
    paddingHorizontal: SPACING.md,
  },
  mediumButton: {
    height: SIZES.buttonHeight.medium,
    paddingHorizontal: SPACING.lg,
  },
  largeButton: {
    height: SIZES.buttonHeight.large,
    paddingHorizontal: SPACING.xl,
  },
  
  // Text styles
  text: {
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  primaryText: {
    color: COLORS.textLight,
  },
  secondaryText: {
    color: COLORS.textLight,
  },
  outlineText: {
    color: COLORS.primary,
  },
  dangerText: {
    color: COLORS.textLight,
  },
  smallText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  mediumText: {
    fontSize: TYPOGRAPHY.fontSize.base,
  },
  largeText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
  },
  
  // States
  pressed: {
    opacity: 0.8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  
  icon: {
    marginRight: SPACING.sm,
  },
});
