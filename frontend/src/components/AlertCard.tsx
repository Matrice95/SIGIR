/**
 * AlertCard - Carte d'alerte avec niveaux de priorité
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '@/constants/theme';

export type AlertLevel = 'success' | 'info' | 'warning' | 'danger' | 'critical';

interface AlertCardProps {
  level: AlertLevel;
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

const ALERT_CONFIG: Record<AlertLevel, { color: string; backgroundColor: string; icon: keyof typeof Ionicons.glyphMap }> = {
  success: {
    color: '#10b981',
    backgroundColor: '#d1fae5',
    icon: 'checkmark-circle',
  },
  info: {
    color: '#3b82f6',
    backgroundColor: '#dbeafe',
    icon: 'information-circle',
  },
  warning: {
    color: '#f59e0b',
    backgroundColor: '#fef3c7',
    icon: 'warning',
  },
  danger: {
    color: '#f97316',
    backgroundColor: '#ffedd5',
    icon: 'alert-circle',
  },
  critical: {
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    icon: 'flash',
  },
};

export default function AlertCard({
  level,
  title,
  message,
  icon,
  style,
}: AlertCardProps) {
  const config = ALERT_CONFIG[level];
  const displayIcon = icon || config.icon;

  return (
    <View style={[styles.card, { backgroundColor: config.backgroundColor }, style]}>
      <View style={styles.iconContainer}>
        <Ionicons name={displayIcon} size={24} color={config.color} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: config.color }]}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  iconContainer: {
    marginRight: SPACING.sm,
  },
  content: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  message: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
    lineHeight: 18,
  },
});
