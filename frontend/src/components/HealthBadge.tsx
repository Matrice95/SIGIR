/**
 * Badge de statut de santé
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, SIZES } from '@/constants/theme';
import type { HealthStatus } from '@/types';

interface HealthBadgeProps {
  status: HealthStatus;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export default function HealthBadge({ status, size = 'medium', showLabel = true }: HealthBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'healthy':
      case 'good':
        return {
          emoji: '🟢',
          label: 'SAIN',
          color: COLORS.healthy || COLORS.success,
        };
      case 'warning':
      case 'moderate':
        return {
          emoji: '🟡',
          label: 'VIGILANCE',
          color: COLORS.warning,
        };
      case 'critical':
      case 'bad':
        return {
          emoji: '🔴',
          label: 'CRITIQUE',
          color: COLORS.critical || COLORS.error,
        };
      default:
        return {
          emoji: '🟢',
          label: 'BON',
          color: COLORS.success,
        };
    }
  };

  const config = getStatusConfig();
  const sizeStyles = styles[`${size}Container`];
  const textSizeStyles = styles[`${size}Text`];

  return (
    <View style={[styles.container, sizeStyles, { backgroundColor: `${config.color}20` }]}>
      <Text style={styles.emoji}>{config.emoji}</Text>
      {showLabel && (
        <Text style={[styles.text, textSizeStyles, { color: config.color }]}>
          {config.label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: SIZES.borderRadius.round,
  },
  
  smallContainer: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  mediumContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  largeContainer: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
  },
  
  emoji: {
    fontSize: TYPOGRAPHY.fontSize.base,
    marginRight: SPACING.xs,
  },
  
  text: {
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  
  smallText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  mediumText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  largeText: {
    fontSize: TYPOGRAPHY.fontSize.base,
  },
});
