/**
 * Composants de couches cartographiques
 * NDVI, NDWI, limites de parcelles
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Polygon } from 'react-native-maps';
import { COLORS } from '@/constants/theme';

// Types
export interface FieldBoundary {
  id: string;
  name: string;
  coordinates: Array<{ latitude: number; longitude: number }>;
  color?: string;
}

// Props
interface FieldBoundariesLayerProps {
  fields: FieldBoundary[];
  selectedFieldId?: string | null;
  onFieldPress?: (fieldId: string) => void;
}

interface NDVILayerProps {
  visible: boolean;
  opacity?: number;
}

interface NDWILayerProps {
  visible: boolean;
  opacity?: number;
}

/**
 * Couche de limites de parcelles
 */
export const FieldBoundariesLayer: React.FC<FieldBoundariesLayerProps> = ({
  fields,
  selectedFieldId,
  onFieldPress,
}) => {
  return (
    <>
      {fields.map((field) => {
        if (!field.coordinates || field.coordinates.length < 3) return null;

        const isSelected = field.id === selectedFieldId;
        const strokeColor = isSelected ? COLORS.primary : (field.color || COLORS.secondary);
        const fillColor = isSelected 
          ? COLORS.primary + '40' 
          : (field.color || COLORS.secondary) + '20';

        return (
          <Polygon
            key={field.id}
            coordinates={field.coordinates}
            strokeColor={strokeColor}
            fillColor={fillColor}
            strokeWidth={isSelected ? 3 : 2}
            tappable
            onPress={() => onFieldPress?.(field.id)}
          />
        );
      })}
    </>
  );
};

/**
 * Couche NDVI (Normalized Difference Vegetation Index)
 * Nécessite Mapbox avec accès à Sentinel-2
 */
export const NDVILayer: React.FC<NDVILayerProps> = ({ visible, opacity = 0.7 }) => {
  if (!visible) return null;

  // TODO: Intégrer Mapbox Raster Tile avec Sentinel-2 NDVI
  // Exemple: mapbox://mapbox.satellite avec formule NDVI
  // NDVI = (NIR - Red) / (NIR + Red)
  
  console.log('🌿 Couche NDVI activée (nécessite Mapbox Satellite)');
  
  return (
    <View style={styles.layerContainer}>
      {/* Placeholder pour la couche NDVI */}
      {/* En production, utiliser MapboxGL.RasterSource avec tiles Sentinel-2 */}
    </View>
  );
};

/**
 * Couche NDWI (Normalized Difference Water Index)
 * Détecte l'humidité du sol et les zones inondées
 */
export const NDWILayer: React.FC<NDWILayerProps> = ({ visible, opacity = 0.7 }) => {
  if (!visible) return null;

  // TODO: Intégrer Mapbox avec formule NDWI
  // NDWI = (Green - NIR) / (Green + NIR)
  
  console.log('💧 Couche NDWI activée (nécessite Mapbox Satellite)');
  
  return (
    <View style={styles.layerContainer}>
      {/* Placeholder pour la couche NDWI */}
      {/* En production, utiliser MapboxGL.RasterSource avec tiles Sentinel-2 */}
    </View>
  );
};

const styles = StyleSheet.create({
  layerContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
});
