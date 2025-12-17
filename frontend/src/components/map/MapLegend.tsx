/**
 * Légende pour les couches cartographiques
 * NDVI, NDWI, etc.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, SIZES } from '@/constants/theme';

interface MapLegendProps {
  type: 'ndvi' | 'ndwi' | 'boundaries';
}

interface LegendItem {
  value?: string;
  color: string;
  label: string;
}

const NDVI_LEGEND: LegendItem[] = [
  { value: '0.8 - 1.0', color: '#006400', label: 'Excellente végétation' },
  { value: '0.6 - 0.8', color: '#228B22', label: 'Bonne végétation' },
  { value: '0.4 - 0.6', color: '#90EE90', label: 'Végétation modérée' },
  { value: '0.2 - 0.4', color: '#FFFF00', label: 'Végétation faible' },
  { value: '0.0 - 0.2', color: '#FF8C00', label: 'Végétation rare' },
  { value: '< 0.0', color: '#8B4513', label: 'Sol nu / Eau' },
];

const NDWI_LEGEND: LegendItem[] = [
  { value: '0.5 - 1.0', color: '#000080', label: 'Eau profonde' },
  { value: '0.3 - 0.5', color: '#0000FF', label: 'Eau peu profonde' },
  { value: '0.1 - 0.3', color: '#87CEEB', label: 'Humidité élevée' },
  { value: '-0.1 - 0.1', color: '#90EE90', label: 'Humidité modérée' },
  { value: '-0.3 - -0.1', color: '#FFD700', label: 'Sol sec' },
  { value: '< -0.3', color: '#8B4513', label: 'Sol très sec' },
];

const BOUNDARY_LEGEND: LegendItem[] = [
  { color: COLORS.primary, label: 'Parcelle sélectionnée' },
  { color: COLORS.secondary, label: 'Mes parcelles' },
  { color: COLORS.info, label: 'Régions rizicoles' },
];

export default function MapLegend({ type }: MapLegendProps) {
  const getLegendData = () => {
    switch (type) {
      case 'ndvi':
        return { title: 'NDVI - Santé de la végétation', items: NDVI_LEGEND };
      case 'ndwi':
        return { title: 'NDWI - Humidité du sol', items: NDWI_LEGEND };
      case 'boundaries':
        return { title: 'Limites des parcelles', items: BOUNDARY_LEGEND };
      default:
        return null;
    }
  };

  const legendData = getLegendData();
  if (!legendData) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{legendData.title}</Text>
      <View style={styles.items}>
        {legendData.items.map((item, index) => (
          <View key={index} style={styles.item}>
            <View style={[styles.colorBox, { backgroundColor: item.color }]} />
            <View style={styles.labelContainer}>
              {'value' in item && (
                <Text style={styles.value}>{item.value}</Text>
              )}
              <Text style={styles.label}>{item.label}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface + 'F0',
    borderRadius: SIZES.borderRadius.lg,
    padding: SPACING.sm,
    maxWidth: 250,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  items: {
    gap: SPACING.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  colorBox: {
    width: 20,
    height: 20,
    borderRadius: SIZES.borderRadius.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  labelContainer: {
    flex: 1,
  },
  value: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
});
