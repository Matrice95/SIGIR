/**
 * AddFieldScreen - Formulaire création parcelle optimisé
 * 3 champs minimum + 5 champs recommandés pour 85%+ précision
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

// Components
import Button from '@/components/Button';
import Card from '@/components/Card';

// Store & Constants
import { useAppDispatch } from '@/store/hooks';
import { addField, setActiveField } from '@/store/slices/fieldsSlice';
import { fieldService } from '@/services/fieldService';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { 
  RICE_VARIETIES, 
  SOIL_TYPES,
  IRRIGATION_REGIMES,
  WATER_SOURCES 
} from '@/constants/config';
import {
  getAvailableZones,
  getSowingWindowsForZone,
  getZoneInfo,
  isDateInSowingWindow,
  formatSowingWindow,
  type SowingWindow,
} from '@/constants/sowingCalendar';

export default function AddFieldScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  // 🔴 TIER 1: Champs CRITIQUES (minimum fonctionnel)
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [area, setArea] = useState('');

  // 🟡 TIER 2: Champs RECOMMANDÉS (précision 85%+)
  const [soilType, setSoilType] = useState('clay_loam'); // Défaut: Argilo-limoneux
  const [variety, setVariety] = useState('wita_9'); // Défaut: WITA 9
  const [zone, setZone] = useState('');
  const [locality, setLocality] = useState('');
  const [sowingWindow, setSowingWindow] = useState<SowingWindow | null>(null);
  const [sowingDate, setSowingDate] = useState(new Date());
  const [irrigationRegime, setIrrigationRegime] = useState('rainfed'); // Défaut: Pluvial
  const [waterSources, setWaterSources] = useState<string[]>(['rainwater']); // Défaut: Pluie

  // UI States
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Zones et fenêtres disponibles
  const availableZones = getAvailableZones();
  const sowingWindows = zone ? getSowingWindowsForZone(zone) : [];
  const selectedZoneInfo = zone ? getZoneInfo(zone) : null;

  // Mapping ID variété → Nom variété
  const getVarietyName = (varietyId: string): string => {
    const varietyObj = RICE_VARIETIES.find(v => v.id === varietyId);
    return varietyObj?.name || varietyId;
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // TIER 1: Critiques
    if (!name.trim()) {
      newErrors.name = 'Nom de la parcelle requis';
    }

    if (!latitude || parseFloat(latitude) < 4 || parseFloat(latitude) > 11) {
      newErrors.latitude = 'Latitude invalide (4-11°N pour CI)';
    }

    if (!longitude || parseFloat(longitude) < -8.6 || parseFloat(longitude) > -2.5) {
      newErrors.longitude = 'Longitude invalide (-8.6 à -2.5°W pour CI)';
    }

    if (!area || parseFloat(area) < 0.1 || parseFloat(area) > 100) {
      newErrors.area = 'Superficie invalide (0.1-100 ha)';
    }

    // TIER 2: Recommandés
    if (!zone) {
      newErrors.zone = 'Zone géographique requise';
    }

    if (!locality) {
      newErrors.locality = 'Localité requise';
    }

    if (!sowingWindow) {
      newErrors.sowingWindow = 'Fenêtre de semis optimale requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gérer la soumission
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setLoading(true);

    try {
      const fieldData = {
        name: name.trim(),
        area: parseFloat(area),
        crop_type: 'rice',
        variety: variety || 'wita_9',
        planting_date: sowingDate.toISOString(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        soil_type: soilType || 'clay_loam',
        zone,
        locality,
        irrigation_regime: irrigationRegime,
        water_sources: waterSources,
        sowing_window_id: sowingWindow?.id,
      };

      const response = await fieldService.createField(fieldData);

      const formattedField = {
        id: response.id,
        name: response.name,
        area: response.area,
        variety: response.variety,
        sowingDate: sowingDate.toISOString(),
        currentStage: 'levee',
        healthStatus: 'good',
        location: {
          latitude: response.latitude,
          longitude: response.longitude,
        },
        soilType: response.soil_type,
        notes: undefined,
      };

      dispatch(addField(formattedField as any));
      dispatch(setActiveField(response.id));

      Alert.alert(
        'Succès',
        'La parcelle a été créée avec succès !',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Erreur création parcelle:', error);
      Alert.alert('Erreur', error.message || 'Impossible de créer la parcelle');
    } finally {
      setLoading(false);
    }
  };

  // Gérer le changement de date
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate && sowingWindow) {
      if (isDateInSowingWindow(selectedDate, sowingWindow)) {
        setSowingDate(selectedDate);
        setErrors({ ...errors, sowingDate: '' });
      } else {
        Alert.alert(
          'Date invalide',
          `La date doit être dans la fenêtre de semis optimale:\n${formatSowingWindow(sowingWindow, selectedDate.getFullYear())}\n\nProbabilité de succès: ${sowingWindow.successProbability}%`,
          [{ text: 'OK' }]
        );
      }
    } else if (selectedDate) {
      setSowingDate(selectedDate);
    }
  };

  // Toggle source d'eau
  const toggleWaterSource = (sourceId: string) => {
    if (sourceId === 'none') {
      setWaterSources(['none']);
    } else {
      const filtered = waterSources.filter(s => s !== 'none');
      if (waterSources.includes(sourceId)) {
        const newSources = filtered.filter(s => s !== sourceId);
        setWaterSources(newSources.length > 0 ? newSources : ['rainwater']);
      } else {
        setWaterSources([...filtered, sourceId]);
      }
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Nouvelle parcelle</Text>
          <Text style={styles.headerSubtitle}>
            Remplissez les informations pour un suivi optimal
          </Text>
          
          {/* Indicateur de progression */}
          <View style={styles.progressContainer}>
            <View style={styles.progressStep}>
              <View style={[styles.progressDot, name && latitude && longitude && area && styles.progressDotComplete]}>
                {name && latitude && longitude && area && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              <Text style={styles.progressLabel}>Critiques</Text>
            </View>
            <View style={styles.progressLine} />
            <View style={styles.progressStep}>
              <View style={[styles.progressDot, soilType && variety && zone && locality && styles.progressDotComplete]}>
                {soilType && variety && zone && locality && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              <Text style={styles.progressLabel}>Recommandés</Text>
            </View>
            <View style={styles.progressLine} />
            <View style={styles.progressStep}>
              <View style={[styles.progressDot, sowingWindow && styles.progressDotComplete]}>
                {sowingWindow && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              <Text style={styles.progressLabel}>Date</Text>
            </View>
          </View>
        </View>

        {/* 🔴 TIER 1: CHAMPS CRITIQUES */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔴 Informations critiques</Text>
            <Text style={styles.sectionBadge}>OBLIGATOIRE</Text>
          </View>
          <Text style={styles.sectionHelper}>
            Ces 3 champs sont le minimum pour démarrer le suivi
          </Text>

          {/* Nom */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              1️⃣ Nom de la parcelle <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.helperText}>Ex: Paddy_Est_2.5ha</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Nom unique d'identification"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setErrors({ ...errors, name: '' });
              }}
              maxLength={50}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Localisation GPS */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              2️⃣ Localisation GPS <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.helperText}>
              📍 Détermine zone, satellites, calcul SMI
            </Text>
            
            <View style={styles.gpsRow}>
              <View style={styles.gpsInput}>
                <Text style={styles.gpsLabel}>Latitude (°N)</Text>
                <TextInput
                  style={[styles.input, errors.latitude && styles.inputError]}
                  placeholder="Ex: 6.8523"
                  value={latitude}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9.-]/g, '');
                    setLatitude(cleaned);
                    setErrors({ ...errors, latitude: '' });
                  }}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.gpsInput}>
                <Text style={styles.gpsLabel}>Longitude (°W)</Text>
                <TextInput
                  style={[styles.input, errors.longitude && styles.inputError]}
                  placeholder="Ex: -5.2891"
                  value={longitude}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9.-]/g, '');
                    setLongitude(cleaned);
                    setErrors({ ...errors, longitude: '' });
                  }}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            {errors.latitude && <Text style={styles.errorText}>{errors.latitude}</Text>}
            {errors.longitude && <Text style={styles.errorText}>{errors.longitude}</Text>}
          </View>

          {/* Superficie */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              3️⃣ Superficie <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.helperText}>
              📏 Volume irrigation, semences, rendement
            </Text>
            <View style={styles.inputWithUnit}>
              <TextInput
                style={[styles.input, styles.inputWithUnitField, errors.area && styles.inputError]}
                placeholder="Ex: 2.5"
                value={area}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9.]/g, '');
                  setArea(cleaned);
                  setErrors({ ...errors, area: '' });
                }}
                keyboardType="decimal-pad"
                maxLength={10}
              />
              <Text style={styles.unitText}>hectares</Text>
            </View>
            {errors.area && <Text style={styles.errorText}>{errors.area}</Text>}
          </View>
        </Card>

        {/* 🟡 TIER 2: CHAMPS RECOMMANDÉS */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🟡 Recommandations 85%+</Text>
            <Text style={[styles.sectionBadge, styles.sectionBadgeWarning]}>RECOMMANDÉ</Text>
          </View>
          <Text style={styles.sectionHelper}>
            Ces 5 champs permettent des recommandations précises
          </Text>

          {/* Type de sol */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              4️⃣ Type de sol <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.helperText}>
              🌍 Calibre tous les seuils SMI (humidité sol)
            </Text>
            
            {SOIL_TYPES.map((soil) => (
              <Pressable
                key={soil.id}
                style={[
                  styles.radioOption,
                  soilType === soil.id && styles.radioOptionSelected,
                ]}
                onPress={() => {
                  setSoilType(soil.id);
                  setErrors({ ...errors, soilType: '' });
                }}
              >
                <View style={styles.radioCircle}>
                  {soilType === soil.id && <View style={styles.radioCircleInner} />}
                </View>
                <View style={styles.radioContent}>
                  <Text style={[
                    styles.radioTitle,
                    soilType === soil.id && styles.radioTitleSelected
                  ]}>
                    {soil.name}
                  </Text>
                  <Text style={styles.radioDescription}>{soil.description}</Text>
                </View>
              </Pressable>
            ))}
            {errors.soilType && <Text style={styles.errorText}>{errors.soilType}</Text>}
          </View>

          {/* Variété de riz */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              5️⃣ Variété de riz <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.helperText}>
              🌾 Détermine tous les stades phénologiques
            </Text>
            
            {RICE_VARIETIES.map((v) => (
              <Pressable
                key={v.id}
                style={[
                  styles.radioOption,
                  variety === v.id && styles.radioOptionSelected,
                ]}
                onPress={() => {
                  setVariety(v.id);
                  setErrors({ ...errors, variety: '' });
                }}
              >
                <View style={styles.radioCircle}>
                  {variety === v.id && <View style={styles.radioCircleInner} />}
                </View>
                <View style={styles.radioContent}>
                  <Text style={[
                    styles.radioTitle,
                    variety === v.id && styles.radioTitleSelected
                  ]}>
                    {v.name} ({v.cycle}j)
                  </Text>
                  <Text style={styles.radioDescription}>
                    {v.type} • {v.description}
                  </Text>
                </View>
              </Pressable>
            ))}
            {errors.variety && <Text style={styles.errorText}>{errors.variety}</Text>}
          </View>
        </Card>

        {/* Zone géographique */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>6️⃣ Zone et Localité</Text>
          <Text style={styles.helperText}>
            📍 Détermine les fenêtres de semis optimales
          </Text>

          {/* Zone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Zone géographique <Text style={styles.required}>*</Text>
            </Text>
            
            {availableZones.map((z) => (
              <Pressable
                key={z.id}
                style={[
                  styles.radioOption,
                  zone === z.id && styles.radioOptionSelected,
                ]}
                onPress={() => {
                  setZone(z.id);
                  setLocality('');
                  setSowingWindow(null);
                  setErrors({ ...errors, zone: '', locality: '', sowingWindow: '' });
                }}
              >
                <View style={styles.radioCircle}>
                  {zone === z.id && <View style={styles.radioCircleInner} />}
                </View>
                <View style={styles.radioContent}>
                  <Text style={[
                    styles.radioTitle,
                    zone === z.id && styles.radioTitleSelected
                  ]}>
                    {z.name}
                  </Text>
                </View>
              </Pressable>
            ))}
            {errors.zone && <Text style={styles.errorText}>{errors.zone}</Text>}
          </View>

          {/* Localité */}
          {zone && selectedZoneInfo && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Localité <Text style={styles.required}>*</Text>
              </Text>
              
              <View style={styles.localityGrid}>
                {selectedZoneInfo.localities.map((loc) => (
                  <Pressable
                    key={loc}
                    style={[
                      styles.chipOption,
                      locality === loc && styles.chipOptionSelected,
                    ]}
                    onPress={() => {
                      setLocality(loc);
                      setErrors({ ...errors, locality: '' });
                    }}
                  >
                    <Text style={[
                      styles.chipText,
                      locality === loc && styles.chipTextSelected
                    ]}>
                      {loc}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {errors.locality && <Text style={styles.errorText}>{errors.locality}</Text>}
            </View>
          )}

          {/* Info zone */}
          {selectedZoneInfo && (
            <View style={styles.zoneInfoBox}>
              <Ionicons name="information-circle" size={20} color="#2196F3" />
              <View style={styles.zoneInfoContent}>
                <Text style={styles.zoneInfoText}>
                  {selectedZoneInfo.description}
                </Text>
                <Text style={styles.zoneInfoDetail}>
                  🌾 Cycles/an: {selectedZoneInfo.cyclesPerYear} • Régime: {selectedZoneInfo.regime}
                </Text>
              </View>
            </View>
          )}
        </Card>

        {/* Date de semis */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>7️⃣ Date de semis prévue</Text>
          <Text style={styles.helperText}>
            📅 Génère le calendrier cultural complet
          </Text>

          {!zone || !locality || !variety ? (
            <View style={styles.disabledBox}>
              <Ionicons name="lock-closed" size={24} color="#94a3b8" />
              <Text style={styles.disabledText}>
                Veuillez d'abord sélectionner une variété, une zone et une localité
              </Text>
            </View>
          ) : (
            <>
              {/* Fenêtres de semis */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Fenêtre de semis optimale <Text style={styles.required}>*</Text>
                </Text>
                <Text style={styles.warningText}>
                  ⚠️ Basé sur recherches scientifiques 1980-2017
                </Text>
              
              {sowingWindows.filter(w => w.varieties.includes(getVarietyName(variety))).length === 0 ? (
                <View style={styles.warningBox}>
                  <Ionicons name="warning" size={20} color="#f97316" />
                  <Text style={styles.warningBoxText}>
                    Aucune fenêtre de semis disponible pour cette combinaison zone/variété.
                    Veuillez choisir une autre zone ou variété.
                  </Text>
                </View>
              ) : (
                sowingWindows
                  .filter(w => w.varieties.includes(getVarietyName(variety)))
                  .map((window) => (
                  <Pressable
                    key={window.id}
                    style={[
                      styles.sowingWindowCard,
                      sowingWindow?.id === window.id && styles.sowingWindowCardSelected,
                    ]}
                    onPress={() => {
                      setSowingWindow(window);
                      const [startMonth, startDay] = window.startDate.split('-').map(Number);
                      const year = new Date().getFullYear();
                      const defaultDate = new Date(year, startMonth - 1, startDay);
                      setSowingDate(defaultDate);
                      setErrors({ ...errors, sowingWindow: '' });
                    }}
                  >
                    <View style={styles.sowingWindowHeader}>
                      <Text style={[
                        styles.sowingWindowTitle,
                        sowingWindow?.id === window.id && styles.sowingWindowTitleSelected,
                      ]}>
                        {window.label}
                      </Text>
                      <View style={[
                        styles.successBadge,
                        { backgroundColor: window.successProbability >= 80 ? '#dcfce7' : '#fef3c7' }
                      ]}>
                        <Text style={[
                          styles.successBadgeText,
                          { color: window.successProbability >= 80 ? '#16a34a' : '#ca8a04' }
                        ]}>
                          {window.successProbability}% succès
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.sowingWindowCycle}>{window.cycleLabel}</Text>
                    <Text style={styles.sowingWindowDate}>
                      📅 {formatSowingWindow(window, new Date().getFullYear())}
                    </Text>

                    {window.warning && (
                      <View style={styles.warningBox}>
                        <Ionicons name="warning" size={16} color="#f97316" />
                        <Text style={styles.warningBoxText}>{window.warning}</Text>
                      </View>
                    )}

                    <View style={styles.recommendationsList}>
                      {window.recommendations.slice(0, 2).map((rec, idx) => (
                        <Text key={idx} style={styles.recommendationItem}>
                          • {rec}
                        </Text>
                      ))}
                    </View>
                  </Pressable>
                  ))
              )}
              {errors.sowingWindow && <Text style={styles.errorText}>{errors.sowingWindow}</Text>}
            </View>

              {/* Date précise */}
              {sowingWindow && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Date de semis précise <Text style={styles.required}>*</Text>
                  </Text>
                  <Text style={styles.helperText}>
                    Doit être dans la fenêtre sélectionnée
                  </Text>
                  <Pressable
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons name="calendar" size={20} color={COLORS.primary} />
                    <Text style={styles.dateButtonText}>{formatDate(sowingDate)}</Text>
                  </Pressable>
                  {showDatePicker && (
                    <DateTimePicker
                      value={sowingDate}
                      mode="date"
                      display="default"
                      onChange={handleDateChange}
                    />
                  )}
                </View>
              )}
            </>
          )}
        </Card>

        {/* Régime irrigation */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>8️⃣ Régime d'irrigation</Text>
          <Text style={styles.helperText}>
            💧 Alimente la logique de recommandations
          </Text>

          <View style={styles.inputGroup}>
            {IRRIGATION_REGIMES.map((regime) => (
              <Pressable
                key={regime.id}
                style={[
                  styles.radioOption,
                  irrigationRegime === regime.id && styles.radioOptionSelected,
                ]}
                onPress={() => setIrrigationRegime(regime.id)}
              >
                <View style={styles.radioCircle}>
                  {irrigationRegime === regime.id && <View style={styles.radioCircleInner} />}
                </View>
                <View style={styles.radioContent}>
                  <Text style={[
                    styles.radioTitle,
                    irrigationRegime === regime.id && styles.radioTitleSelected
                  ]}>
                    {regime.icon} {regime.name}
                  </Text>
                  <Text style={styles.radioDescription}>{regime.description}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Sources d'eau */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Accès à l'eau (multiple)</Text>
            <Text style={styles.helperText}>
              💧 Détermine la faisabilité d'irrigation
            </Text>
            
            {WATER_SOURCES.map((source) => (
              <Pressable
                key={source.id}
                style={[
                  styles.checkboxOption,
                  waterSources.includes(source.id) && styles.checkboxOptionSelected,
                ]}
                onPress={() => toggleWaterSource(source.id)}
              >
                <View style={styles.checkbox}>
                  {waterSources.includes(source.id) && (
                    <Ionicons name="checkmark" size={16} color={COLORS.white} />
                  )}
                </View>
                <Text style={[
                  styles.checkboxText,
                  waterSources.includes(source.id) && styles.checkboxTextSelected
                ]}>
                  {source.icon} {source.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>
      </ScrollView>

      {/* Actions - Toujours visible en bas */}
      <View style={styles.actionsFixed}>
        <View style={styles.buttonWrapper}>
          <Button
            title="Annuler"
            onPress={() => navigation.goBack()}
            variant="outline"
            fullWidth
          />
        </View>
        <View style={styles.buttonWrapper}>
          <Button
            title={loading ? 'Création...' : 'Créer la parcelle'}
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            fullWidth
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  progressDotComplete: {
    backgroundColor: COLORS.primary,
  },
  progressLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 8,
  },
  section: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: '600',
  },
  sectionBadge: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sectionBadgeWarning: {
    backgroundColor: '#fef3c7',
    color: '#ca8a04',
  },
  sectionHelper: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    fontStyle: 'italic',
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  required: {
    color: '#ef4444',
  },
  helperText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontStyle: 'italic',
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.base,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    ...TYPOGRAPHY.small,
    color: '#ef4444',
    marginTop: SPACING.xs,
  },
  gpsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  gpsInput: {
    flex: 1,
  },
  gpsLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  inputWithUnitField: {
    flex: 1,
  },
  unitText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  radioOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    marginTop: 2,
  },
  radioCircleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  radioContent: {
    flex: 1,
  },
  radioTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  radioTitleSelected: {
    color: COLORS.primary,
  },
  radioDescription: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  localityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chipOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
  },
  chipOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  chipText: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  zoneInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.sm,
  },
  zoneInfoContent: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  zoneInfoText: {
    ...TYPOGRAPHY.small,
    color: '#1565c0',
    marginBottom: SPACING.xs,
  },
  zoneInfoDetail: {
    ...TYPOGRAPHY.small,
    color: '#1976d2',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  sowingWindowCard: {
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.sm,
  },
  sowingWindowCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  sowingWindowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  sowingWindowTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    flex: 1,
  },
  sowingWindowTitleSelected: {
    color: COLORS.primary,
  },
  successBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  successBadgeText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  sowingWindowCycle: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  sowingWindowDate: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.sm,
  },
  warningText: {
    ...TYPOGRAPHY.small,
    color: '#f97316',
    marginBottom: SPACING.sm,
    fontStyle: 'italic',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    padding: SPACING.sm,
    borderRadius: 6,
    marginBottom: SPACING.sm,
  },
  warningBoxText: {
    ...TYPOGRAPHY.small,
    color: '#f97316',
    marginLeft: SPACING.xs,
    flex: 1,
  },
  recommendationsList: {
    gap: 4,
  },
  recommendationItem: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.base,
    backgroundColor: COLORS.surface,
  },
  dateButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  checkboxOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    backgroundColor: COLORS.white,
  },
  checkboxText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  checkboxTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  disabledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    marginVertical: SPACING.md,
  },
  disabledText: {
    ...TYPOGRAPHY.body,
    color: '#64748b',
    marginLeft: SPACING.sm,
    textAlign: 'center',
    flex: 1,
  },
  actionsFixed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonWrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
  submitButton: {
    flex: 1,
  },
});
