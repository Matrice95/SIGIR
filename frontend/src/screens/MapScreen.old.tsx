/**
 * Écran Carte Interactive
 * Carte avec Mapbox GL + OpenStreetMap
 * Affiche les parcelles avec NDVI et alertes
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Components
import Card from '@/components/Card';
import Button from '@/components/Button';

// Store & Constants
import { useAppSelector } from '@/store/hooks';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/theme';

export default function MapScreen() {
  const navigation = useNavigation();
  const { fields, activeFieldId } = useAppSelector(state => state.fields);
  const [mapType, setMapType] = useState<'satellite' | 'ndvi' | 'osm'>('osm');

  const activeField = fields.find(f => f.id === activeFieldId) || fields[0];

  const handleConfigureMapbox = () => {
    Alert.alert(
      'Configuration Mapbox',
      'Pour activer la carte satellite avec NDVI:\n\n' +
      '1. Créez un compte sur mapbox.com\n' +
      '2. Obtenez votre token d\'accès\n' +
      '3. Ajoutez-le dans le fichier .env\n\n' +
      'MAPBOX_ACCESS_TOKEN=votre_token',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Contrôles carte */}
      <View style={styles.controls}>
        <Pressable
          style={[
            styles.controlButton,
            mapType === 'osm' && styles.controlButtonActive,
          ]}
          onPress={() => setMapType('osm')}
        >
          <Ionicons
            name="map-outline"
            size={20}
            color={mapType === 'osm' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text
            style={[
              styles.controlText,
              mapType === 'osm' && styles.controlTextActive,
            ]}
          >
            OSM
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.controlButton,
            mapType === 'satellite' && styles.controlButtonActive,
          ]}
          onPress={() => setMapType('satellite')}
        >
          <Ionicons
            name="planet"
            size={20}
            color={mapType === 'satellite' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text
            style={[
              styles.controlText,
              mapType === 'satellite' && styles.controlTextActive,
            ]}
          >
            Satellite
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.controlButton,
            mapType === 'ndvi' && styles.controlButtonActive,
          ]}
          onPress={() => setMapType('ndvi')}
        >
          <Ionicons
            name="leaf"
            size={20}
            color={mapType === 'ndvi' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text
            style={[
              styles.controlText,
              mapType === 'ndvi' && styles.controlTextActive,
            ]}
          >
            NDVI
          </Text>
        </Pressable>
      </View>

      {/* Zone de carte (placeholder) */}
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map" size={80} color={COLORS.border} />
        <Text style={styles.placeholderTitle}>Carte interactive</Text>
        <Text style={styles.placeholderText}>
          {mapType === 'osm'
            ? 'OpenStreetMap sera affiché ici'
            : mapType === 'satellite'
            ? 'Vue satellite Mapbox sera affichée ici'
            : 'Carte NDVI (santé des cultures) sera affichée ici'}
        </Text>

        <Button
          title="Configurer Mapbox"
          onPress={handleConfigureMapbox}
          variant="primary"
          icon="settings"
          style={styles.configButton}
        />
      </View>

      {/* Liste des parcelles */}
      {fields.length > 0 && (
        <View style={styles.fieldsList}>
          <Text style={styles.fieldsTitle}>Mes parcelles ({fields.length})</Text>
          {fields.map((field) => (
            <Card key={field.id} style={styles.fieldCard}>
              <Pressable
                onPress={() =>
                  navigation.navigate('FieldDetails' as never, { fieldId: field.id })
                }
                style={styles.fieldContent}
              >
                <View style={styles.fieldInfo}>
                  <View style={styles.fieldHeader}>
                    <Text style={styles.fieldName}>{field.name}</Text>
                    {field.id === activeFieldId && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Active</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.fieldDetail}>
                    {field.area} ha • {field.variety}
                  </Text>
                  {field.location && (
                    <Text style={styles.fieldLocation}>
                      📍 {field.location.latitude.toFixed(4)}, {field.location.longitude.toFixed(4)}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </Pressable>
            </Card>
          ))}
        </View>
      )}

      {/* Légende NDVI */}
      {mapType === 'ndvi' && (
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Indice NDVI</Text>
          <View style={styles.legendRow}>
            <View style={[styles.legendColor, { backgroundColor: '#8B0000' }]} />
            <Text style={styles.legendText}>Très faible (0.0-0.2)</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendColor, { backgroundColor: '#FF6B6B' }]} />
            <Text style={styles.legendText}>Faible (0.2-0.4)</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendColor, { backgroundColor: '#FFE66D' }]} />
            <Text style={styles.legendText}>Modéré (0.4-0.6)</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendColor, { backgroundColor: '#A8E6CF' }]} />
            <Text style={styles.legendText}>Bon (0.6-0.8)</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendColor, { backgroundColor: '#2ECC71' }]} />
            <Text style={styles.legendText}>Excellent (0.8-1.0)</Text>
          </View>
        </View>
      )}

      {/* Bouton localisation */}
      <Pressable style={styles.locationButton}>
        <Ionicons name="locate" size={24} color={COLORS.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  controls: {
    flexDirection: 'row',
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  controlButtonActive: {
    backgroundColor: `${COLORS.primary}10`,
    borderColor: COLORS.primary,
  },
  controlText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  controlTextActive: {
    color: COLORS.primary,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  placeholderTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  placeholderText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  configButton: {
    marginTop: SPACING.lg,
  },
  fieldsList: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.base,
    maxHeight: '40%',
  },
  fieldsTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  fieldCard: {
    marginBottom: SPACING.sm,
  },
  fieldContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldInfo: {
    flex: 1,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  fieldName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  activeBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  fieldDetail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  fieldLocation: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  legend: {
    position: 'absolute',
    top: 70,
    right: SPACING.base,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  legendText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text,
  },
  locationButton: {
    position: 'absolute',
    bottom: SPACING.base,
    right: SPACING.base,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
});

