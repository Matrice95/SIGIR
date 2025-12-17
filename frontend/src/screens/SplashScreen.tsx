/**
 * Écran Splash Screen
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/theme';

export default function SplashScreen() {
  return (
    <LinearGradient
      colors={[COLORS.primaryDark, COLORS.primary, COLORS.primaryLight]}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.logo}>🌾</Text>
        <Text style={styles.title}>SIGIR</Text>
        <Text style={styles.subtitle}>Système d'Information pour la Gestion de l'Irrigation du Riz</Text>
      </View>
      <Text style={styles.footer}>Côte d'Ivoire 🇨🇮</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 80,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.huge,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textLight,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    opacity: 0.9,
  },
  footer: {
    position: 'absolute',
    bottom: SPACING.xl,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textLight,
    opacity: 0.8,
  },
});
