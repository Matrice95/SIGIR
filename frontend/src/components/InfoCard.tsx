/**
 * InfoCard - Composant carte d'information générique
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '@/constants/theme';

interface InfoCardProps {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  headerRight?: React.ReactNode;
}

export default function InfoCard({
  title,
  icon,
  iconColor = COLORS.primary,
  children,
  style,
  headerRight,
}: InfoCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          {icon && <Ionicons name={icon} size={20} color={iconColor} style={styles.icon} />}
          <Text style={styles.title}>{title}</Text>
        </View>
        {headerRight}
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: SPACING.xs,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: '600',
  },
  content: {
    // Children content
  },
});
