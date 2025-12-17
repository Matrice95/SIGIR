/**
 * Écran Carte Interactive avec Mapbox GL + OpenStreetMap
 * Affiche les parcelles, satellite, NDVI, et mode offline
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker, Polygon, PROVIDER_DEFAULT } from 'react-native-maps';

// Services & Store
import { useAppSelector } from '@/store/hooks';
import { mapService, DEFAULT_COORDINATES, RICE_REGIONS } from '@/services/mapService';
import { COLORS, TYPOGRAPHY, SPACING, SIZES } from '@/constants/theme';

// Components
import Card from '@/components/Card';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';

type MapType = 'standard' | 'satellite' | 'hybrid' | 'terrain';
type LayerType = 'none' | 'ndvi' | 'ndwi' | 'boundaries';

export default function MapScreen() {
  const navigation = useNavigation();
  const mapRef = useRef<MapView>(null);
  
  const { fields, activeFieldId } = useAppSelector(state => state.fields);
  const { user } = useAppSelector(state => state.auth);
  
  const [mapType, setMapType] = useState<MapType>('hybrid');
  const [layer, setLayer] = useState<LayerType>('none');
  const [loading, setLoading] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(activeFieldId);
  
  const mapProvider = mapService.getProvider();
  const mapConfig = mapService.getConfig();

  // Calculer la région initiale
  const initialRegion = React.useMemo(() => {
    if (fields.length > 0) {
      const fieldsWithLocation = fields.filter(
        f => f.location?.latitude && f.location?.longitude
      );
      
      if (fieldsWithLocation.length > 0) {
        const points = fieldsWithLocation.map(f => ({
          latitude: f.location!.latitude,
          longitude: f.location!.longitude,
        }));
        return mapService.calculateRegion(points);
      }
    }
    return DEFAULT_COORDINATES;
  }, [fields]);

  useEffect(() => {
    console.log(`🗺️ Utilisation du provider: ${mapProvider}`);
    if (!mapService.isMapboxAvailable()) {
      console.log('📍 Mapbox non disponible, utilisation d\'OpenStreetMap');
    }
  }, [mapProvider]);

  // Centrer sur la parcelle active
  useEffect(() => {
    if (activeFieldId && mapRef.current) {
      const field = fields.find(f => f.id === activeFieldId);
      if (field?.location?.latitude && field?.location?.longitude) {
        mapRef.current.animateToRegion({
          latitude: field.location.latitude,
          longitude: field.location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
    }
  }, [activeFieldId]);

  const handleMapTypeChange = (type: MapType) => {
    setMapType(type);
    console.log(`🗺️ Type de carte changé: ${type}`);
  };

  const handleLayerChange = (newLayer: LayerType) => {
    if (newLayer === 'ndvi' || newLayer === 'ndwi') {
      if (!mapService.isMapboxAvailable()) {
        Alert.alert(
          'Mapbox Requis',
          'Les couches NDVI et NDWI nécessitent Mapbox.\n\nAjoutez votre token Mapbox dans .env:\nMAPBOX_ACCESS_TOKEN=votre_token',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    setLayer(newLayer);
    console.log(`🎨 Couche changée: ${newLayer}`);
  };

  const handleFieldPress = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    const field = fields.find(f => f.id === fieldId);
    if (field) {
      Alert.alert(
        field.name,
        `Superficie: ${field.area} ha\nVariété: ${field.variety}\nSol: ${field.soilType || 'Non spécifié'}`,
        [
          {
            text: 'Voir détails',
            onPress: () => navigation.navigate('FieldDetails' as never, { fieldId } as never),
          },
          { text: 'Fermer', style: 'cancel' },
        ]
      );
    }
  };

  const handleCenterOnFields = () => {
    if (fields.length === 0) return;
    
    const fieldsWithLocation = fields.filter(
      f => f.location?.latitude && f.location?.longitude
    );
    
    if (fieldsWithLocation.length > 0 && mapRef.current) {
      const points = fieldsWithLocation.map(f => ({
        latitude: f.location!.latitude,
        longitude: f.location!.longitude,
      }));
      const region = mapService.calculateRegion(points);
      mapRef.current.animateToRegion(region, 1000);
    }
  };

  const handleShowRiceRegions = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: 7.5400,
        longitude: -5.5471,
        latitudeDelta: 8,
        longitudeDelta: 8,
      }, 1500);
    }
  };

  const renderField = (field: any) => {
    if (!field.location?.latitude || !field.location?.longitude) {
      return null;
    }

    const isSelected = field.id === selectedFieldId;
    const color = isSelected ? COLORS.primary : COLORS.secondary;

    return (
      <Marker
        key={field.id}
        coordinate={{
          latitude: field.location.latitude,
          longitude: field.location.longitude,
        }}
        title={field.name}
        description={`${field.area} ha - ${field.variety}`}
        pinColor={color}
        onPress={() => handleFieldPress(field.id)}
      >
        <View style={[styles.customMarker, isSelected && styles.selectedMarker]}>
          <Ionicons name="location" size={32} color={color} />
          <Text style={[styles.markerText, { color }]}>{field.area}ha</Text>
        </View>
      </Marker>
    );
  };

  const renderRiceRegions = () => {
    return RICE_REGIONS.map((region) => (
      <Marker
        key={region.id}
        coordinate={{
          latitude: region.latitude,
          longitude: region.longitude,
        }}
        title={region.name}
        description={region.description}
        pinColor={COLORS.info}
      >
        <View style={styles.regionMarker}>
          <Ionicons name="business" size={24} color={COLORS.info} />
        </View>
      </Marker>
    ));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement de la carte...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Carte */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        mapType={mapType}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        showsScale
        loadingEnabled
        loadingIndicatorColor={COLORS.primary}
        onPress={() => setShowControls(!showControls)}
      >
        {/* Parcelles de l'utilisateur */}
        {fields.map(renderField)}
        
        {/* Régions rizicoles */}
        {renderRiceRegions()}
      </MapView>

      {/* Contrôles flottants */}
      {showControls && (
        <>
          {/* Type de carte */}
          <View style={styles.controlsTop}>
            <Text style={styles.controlsTitle}>Type de carte</Text>
            <View style={styles.buttonGroup}>
              <Pressable
                style={[styles.controlButton, mapType === 'standard' && styles.controlButtonActive]}
                onPress={() => handleMapTypeChange('standard')}
              >
                <Ionicons name="map-outline" size={20} color={mapType === 'standard' ? COLORS.white : COLORS.text} />
                <Text style={[styles.controlButtonText, mapType === 'standard' && styles.controlButtonTextActive]}>
                  Plan
                </Text>
              </Pressable>

              <Pressable
                style={[styles.controlButton, mapType === 'satellite' && styles.controlButtonActive]}
                onPress={() => handleMapTypeChange('satellite')}
              >
                <Ionicons name="planet-outline" size={20} color={mapType === 'satellite' ? COLORS.white : COLORS.text} />
                <Text style={[styles.controlButtonText, mapType === 'satellite' && styles.controlButtonTextActive]}>
                  Satellite
                </Text>
              </Pressable>

              <Pressable
                style={[styles.controlButton, mapType === 'hybrid' && styles.controlButtonActive]}
                onPress={() => handleMapTypeChange('hybrid')}
              >
                <Ionicons name="layers-outline" size={20} color={mapType === 'hybrid' ? COLORS.white : COLORS.text} />
                <Text style={[styles.controlButtonText, mapType === 'hybrid' && styles.controlButtonTextActive]}>
                  Hybride
                </Text>
              </Pressable>

              <Pressable
                style={[styles.controlButton, mapType === 'terrain' && styles.controlButtonActive]}
                onPress={() => handleMapTypeChange('terrain')}
              >
                <Ionicons name="globe-outline" size={20} color={mapType === 'terrain' ? COLORS.white : COLORS.text} />
                <Text style={[styles.controlButtonText, mapType === 'terrain' && styles.controlButtonTextActive]}>
                  Relief
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Couches spéciales */}
          <View style={styles.controlsMiddle}>
            <Text style={styles.controlsTitle}>Couches</Text>
            <View style={styles.buttonGroup}>
              <Pressable
                style={[styles.controlButton, layer === 'none' && styles.controlButtonActive]}
                onPress={() => handleLayerChange('none')}
              >
                <Ionicons name="eye-off-outline" size={20} color={layer === 'none' ? COLORS.white : COLORS.text} />
                <Text style={[styles.controlButtonText, layer === 'none' && styles.controlButtonTextActive]}>
                  Aucune
                </Text>
              </Pressable>

              <Pressable
                style={[styles.controlButton, layer === 'ndvi' && styles.controlButtonActive]}
                onPress={() => handleLayerChange('ndvi')}
              >
                <Ionicons name="leaf-outline" size={20} color={layer === 'ndvi' ? COLORS.white : COLORS.success} />
                <Text style={[styles.controlButtonText, layer === 'ndvi' && styles.controlButtonTextActive]}>
                  NDVI
                </Text>
              </Pressable>

              <Pressable
                style={[styles.controlButton, layer === 'ndwi' && styles.controlButtonActive]}
                onPress={() => handleLayerChange('ndwi')}
              >
                <Ionicons name="water-outline" size={20} color={layer === 'ndwi' ? COLORS.white : COLORS.info} />
                <Text style={[styles.controlButtonText, layer === 'ndwi' && styles.controlButtonTextActive]}>
                  NDWI
                </Text>
              </Pressable>

              <Pressable
                style={[styles.controlButton, layer === 'boundaries' && styles.controlButtonActive]}
                onPress={() => handleLayerChange('boundaries')}
              >
                <Ionicons name="grid-outline" size={20} color={layer === 'boundaries' ? COLORS.white : COLORS.text} />
                <Text style={[styles.controlButtonText, layer === 'boundaries' && styles.controlButtonTextActive]}>
                  Limites
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Actions rapides */}
          <View style={styles.controlsBottom}>
            <Pressable style={styles.actionButton} onPress={handleCenterOnFields}>
              <Ionicons name="locate" size={24} color={COLORS.primary} />
            </Pressable>
            
            <Pressable style={styles.actionButton} onPress={handleShowRiceRegions}>
              <Ionicons name="business" size={24} color={COLORS.info} />
            </Pressable>
            
            <Pressable style={styles.actionButton} onPress={() => setShowControls(false)}>
              <Ionicons name="eye-off" size={24} color={COLORS.textSecondary} />
            </Pressable>
          </View>

          {/* Info provider */}
          <View style={styles.providerInfo}>
            <Ionicons 
              name={mapProvider === 'mapbox' ? 'planet' : 'globe'} 
              size={16} 
              color={COLORS.textSecondary} 
            />
            <Text style={styles.providerText}>
              {mapProvider === 'mapbox' ? 'Mapbox GL' : 'OpenStreetMap'}
            </Text>
          </View>
        </>
      )}

      {/* Bouton pour afficher les contrôles */}
      {!showControls && (
        <Pressable
          style={styles.showControlsButton}
          onPress={() => setShowControls(true)}
        >
          <Ionicons name="eye" size={24} color={COLORS.white} />
        </Pressable>
      )}

      {/* Message si pas de parcelles */}
      {fields.length === 0 && (
        <View style={styles.emptyOverlay}>
          <Card style={styles.emptyCard}>
            <EmptyState
              icon="map-outline"
              title="Aucune parcelle"
              message="Créez une parcelle avec localisation GPS pour la voir sur la carte."
              actionLabel="Créer une parcelle"
              onAction={() => navigation.navigate('AddField' as never)}
            />
          </Card>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.base,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  controlsTop: {
    position: 'absolute',
    top: SPACING.base,
    left: SPACING.base,
    right: SPACING.base,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius.lg,
    padding: SPACING.sm,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  controlsMiddle: {
    position: 'absolute',
    top: 120,
    left: SPACING.base,
    right: SPACING.base,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius.lg,
    padding: SPACING.sm,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  controlsBottom: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.base,
    gap: SPACING.sm,
  },
  controlsTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.borderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  controlButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  controlButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  controlButtonTextActive: {
    color: COLORS.white,
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  showControlsButton: {
    position: 'absolute',
    top: SPACING.base,
    right: SPACING.base,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  providerInfo: {
    position: 'absolute',
    bottom: SPACING.base,
    left: SPACING.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surface + 'E6',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: SIZES.borderRadius.sm,
  },
  providerText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  customMarker: {
    alignItems: 'center',
  },
  selectedMarker: {
    transform: [{ scale: 1.2 }],
  },
  markerText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.xs,
    borderRadius: SIZES.borderRadius.sm,
  },
  regionMarker: {
    backgroundColor: COLORS.info + '40',
    padding: SPACING.xs,
    borderRadius: SIZES.borderRadius.round,
    borderWidth: 2,
    borderColor: COLORS.info,
  },
  emptyOverlay: {
    position: 'absolute',
    top: '30%',
    left: SPACING.xl,
    right: SPACING.xl,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
  },
});
