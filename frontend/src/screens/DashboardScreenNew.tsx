/**
 * Dashboard Principal - Version Guide Agricole
 * Interface intuitive pour suivre son champ comme une boussole
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

// Components
import InfoCard from '@/components/InfoCard';
import ProgressBar from '@/components/ProgressBar';
import AlertCard from '@/components/AlertCard';
import EmptyState from '@/components/EmptyState';

// Services & Store
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setFields, setActiveField } from '@/store/slices/fieldsSlice';
import { fieldService } from '@/services/fieldService';
import backendService, { SMIData, WeatherData, ETPData } from '@/services/backendService';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';

// Utils
import {
  calculatePhenology,
  calculateIrrigationStatus,
  generateAlerts,
  formatDate,
  getWeatherEmoji,
  PhenologyInfo,
  IrrigationStatus,
  Alert,
} from '@/utils/dashboardUtils';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { activeFieldId, fields } = useAppSelector(state => state.fields);
  const activeField = fields.find(f => f.id === activeFieldId) || fields[0];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [smiData, setSmiData] = useState<SMIData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [etpData, setEtpData] = useState<ETPData[] | null>(null);
  const [phenology, setPhenology] = useState<PhenologyInfo | null>(null);
  const [irrigationStatus, setIrrigationStatus] = useState<IrrigationStatus | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    loadFields();
  }, []);

  useEffect(() => {
    if (activeField) {
      loadDashboardData();
    } else if (fields.length === 0 && !loading) {
      setLoading(false);
    }
  }, [activeField?.id]);

  const loadFields = async () => {
    try {
      const fetchedFields = await fieldService.getFields();
      dispatch(setFields(fetchedFields as any));
      if (fetchedFields.length > 0 && !activeFieldId) {
        dispatch(setActiveField(fetchedFields[0].id));
      }
    } catch (err) {
      console.error('Erreur chargement parcelles:', err);
    }
  };

  const loadDashboardData = async () => {
    if (!activeField) return;

    try {
      setLoading(true);
      console.log('📡 Chargement dashboard pour:', activeField.name);
      
      // Charger toutes les données en parallèle
      const data = await backendService.getAllFieldData(activeField.id);
      
      setSmiData(data.smi);
      setWeatherData(data.weather);
      setEtpData(null); // ETP sera géré plus tard

      // Calculer les informations dérivées
      const fieldData: any = activeField;
      if (fieldData.planting_date || fieldData.sowingDate) {
        const phenoInfo = calculatePhenology(fieldData.planting_date || fieldData.sowingDate);
        setPhenology(phenoInfo);

        const irrigStatus = calculateIrrigationStatus(data.smi, null, data.weather);
        setIrrigationStatus(irrigStatus);

        const newAlerts = generateAlerts(data.smi, data.weather, null, phenoInfo);
        setAlerts(newAlerts);
      }

      console.log('✅ Dashboard chargé avec succès');
    } catch (err: any) {
      console.error('❌ Erreur dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFields();
    await loadDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement des données...</Text>
      </View>
    );
  }

  if (!activeField) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="leaf-outline"
          title="Aucune parcelle"
          message="Créez votre première parcelle pour commencer le suivi"
          actionLabel="Créer une parcelle"
          onAction={() => navigation.navigate('AddField' as never)}
        />
      </View>
    );
  }

  const getStatusColor = (status: IrrigationStatus['status']) => {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'caution': return '#f59e0b';
      case 'warning': return '#f97316';
      case 'critical': return '#dc2626';
      default: return COLORS.textSecondary;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[COLORS.primary]}
        />
      }
    >
      {/* En-tête avec informations parcelle */}
      <LinearGradient
        colors={['#10b981', '#059669']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <Pressable onPress={() => navigation.navigate('Settings' as never)}>
            <Ionicons name="settings-outline" size={24} color="white" />
          </Pressable>
        </View>

        <View style={styles.fieldInfo}>
          <Text style={styles.fieldLocation}>📍 {(activeField as any).location_name || 'Position enregistrée'}</Text>
          <Text style={styles.fieldName}>Champ : {activeField.name}</Text>
          <Text style={styles.fieldArea}>Superficie : {activeField.area} ha</Text>
        </View>
      </LinearGradient>

      {/* Stade Actuel */}
      {phenology && (
        <InfoCard
          title="STADE ACTUEL"
          icon="leaf"
          iconColor="#10b981"
        >
          <ProgressBar
            progress={phenology.progress}
            color="#10b981"
            height={12}
            showPercentage
          />
          <View style={styles.stageInfo}>
            <Text style={styles.stageName}>
              {phenology.stageIcon} {phenology.stageName} (jour {phenology.daysSincePlanting}/{phenology.totalDays})
            </Text>
            <Text style={styles.stageDetail}>Semis : {formatDate((activeField as any).planting_date || (activeField as any).sowingDate)}</Text>
            <Text style={styles.stageDetail}>Récolte prévue : {formatDate(phenology.harvestDate)}</Text>
            {phenology.isCritical && (
              <Text style={styles.stageCritical}>⚠️ Stade critique - Surveillance accrue</Text>
            )}
          </View>
        </InfoCard>
      )}

      {/* Irrigation */}
      {irrigationStatus && (
        <InfoCard
          title="IRRIGATION"
          icon="water"
          iconColor="#3b82f6"
          headerRight={
            smiData && (
              <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>
                📡 Sentinel-2
              </Text>
            )
          }
        >
          {smiData && (
            <View style={styles.smiIndicator}>
              <Text style={styles.smiLabel}>Humidité du sol (SMI) :</Text>
              <Text style={[styles.smiValueLarge, { color: getStatusColor(irrigationStatus.status) }]}>
                {(smiData.smi * 100).toFixed(0)}%
              </Text>
            </View>
          )}
          
          <View style={styles.irrigationInfo}>
            <View style={styles.irrigationRow}>
              <Text style={styles.irrigationLabel}>Besoin quotidien :</Text>
              <Text style={styles.irrigationValue}>{Math.round(irrigationStatus.dailyNeed)} mm</Text>
            </View>
            {irrigationStatus.waterDeficit > 0 && (
              <View style={styles.irrigationRow}>
                <Text style={styles.irrigationLabel}>Déficit estimé :</Text>
                <Text style={[styles.irrigationValue, { color: '#f97316' }]}>
                  {Math.round(irrigationStatus.waterDeficit)} mm
                </Text>
              </View>
            )}
            <View style={styles.irrigationRow}>
              <Text style={styles.irrigationLabel}>Besoin 7 jours :</Text>
              <Text style={styles.irrigationValue}>{Math.round(irrigationStatus.totalNeed)} mm</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(irrigationStatus.status) + '20' }]}>
            <Text style={[styles.statusBadgeText, { color: getStatusColor(irrigationStatus.status) }]}>
              {irrigationStatus.statusText}
            </Text>
          </View>

          <Text style={styles.irrigationRecommendation}>
            <Text style={styles.irrigationLabel}>Irriguer : </Text>
            <Text style={[styles.irrigationValue, { fontWeight: '700' }]}>
              {irrigationStatus.needsIrrigation ? 'OUI' : 'NON'}
            </Text>
          </Text>

          {irrigationStatus.recommendation && (
            <Text style={styles.recommendation}>💡 {irrigationStatus.recommendation}</Text>
          )}

          <Pressable
            style={styles.detailButton}
            onPress={() => navigation.navigate('IrrigationDetail' as never)}
          >
            <Text style={styles.detailButtonText}>📊 Voir bilan hydrique complet</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
          </Pressable>
        </InfoCard>
      )}

      {/* Prévisions 7 jours */}
      {weatherData?.daily && (
        <InfoCard
          title="PRÉVISION 7 JOURS"
          icon="calendar-outline"
          iconColor="#8b5cf6"
        >
          {weatherData.daily.slice(0, 7).map((day, index) => {
            const precip = day.precipitation_sum || 0;
            const tempMax = day.temperature_max;
            const tempMin = day.temperature_min;
            const date = day.date;
            const dayDate = new Date(date);
            const dayName = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][dayDate.getDay()];
            const dayNum = dayDate.getDate();

            return (
              <View key={date} style={styles.forecastRow}>
                <Text style={styles.forecastDay}>{dayName} {dayNum}</Text>
                <Text style={styles.forecastEmoji}>{getWeatherEmoji(precip)}</Text>
                <Text style={styles.forecastTemp}>
                  {Math.round(tempMax)}° / {Math.round(tempMin)}°
                </Text>
                <Text style={styles.forecastRain}>
                  {precip > 0 ? `${Math.round(precip)}mm` : '0mm'}
                </Text>
              </View>
            );
          })}

          {(() => {
            const rain3j = weatherData.daily.slice(0, 3).reduce((sum: number, d) => sum + d.precipitation_sum, 0);
            const maxRain = Math.max(...weatherData.daily.slice(0, 3).map(d => d.precipitation_sum));
            
            if (maxRain > 50) {
              return (
                <Text style={[styles.weatherRecommendation, { backgroundColor: '#fee2e2', color: '#dc2626' }]}>
                  ⚠️ Fortes pluies ({Math.round(maxRain)}mm) - Arrêter irrigation, surveiller drainage
                </Text>
              );
            } else if (rain3j > 20) {
              return (
                <Text style={styles.weatherRecommendation}>
                  💡 Pluies prévues ({Math.round(rain3j)}mm sur 3j) - Reporter irrigation
                </Text>
              );
            } else if (rain3j < 2 && irrigationStatus?.needsIrrigation) {
              return (
                <Text style={[styles.weatherRecommendation, { backgroundColor: '#fff7ed', color: '#f97316' }]}>
                  ☀️ Temps sec prévu - Irrigation nécessaire
                </Text>
              );
            }
            return null;
          })()}
        </InfoCard>
      )}

      {/* Alertes Critiques */}
      <InfoCard
        title="ALERTES CRITIQUES"
        icon="alert-circle"
        iconColor="#dc2626"
      >
        {alerts.length === 0 ? (
          <View style={styles.noAlerts}>
            <Ionicons name="checkmark-circle" size={32} color="#10b981" />
            <Text style={styles.noAlertsText}>✓ Aucune alerte</Text>
          </View>
        ) : (
          alerts.map(alert => (
            <AlertCard
              key={alert.id}
              level={alert.level}
              title={alert.title}
              message={alert.message}
              icon={alert.icon as any}
            />
          ))
        )}
      </InfoCard>

      {/* Actions Rapides */}
      <View style={styles.quickActions}>
        <Pressable
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Map' as never)}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.quickActionGradient}
          >
            <Ionicons name="map-outline" size={32} color="white" />
            <Text style={styles.quickActionText}>CARTE{'\n'}SANTÉ</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Journal' as never)}
        >
          <LinearGradient
            colors={['#3b82f6', '#2563eb']}
            style={styles.quickActionGradient}
          >
            <Ionicons name="document-text-outline" size={32} color="white" />
            <Text style={styles.quickActionText}>JOURNAL{'\n'}OPÉRATIONS</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <View style={styles.quickActions}>
        <Pressable
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Calendar' as never)}
        >
          <LinearGradient
            colors={['#8b5cf6', '#7c3aed']}
            style={styles.quickActionGradient}
          >
            <Ionicons name="calendar" size={32} color="white" />
            <Text style={styles.quickActionText}>CALENDRIER</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Settings' as never)}
        >
          <LinearGradient
            colors={['#6b7280', '#4b5563']}
            style={styles.quickActionGradient}
          >
            <Ionicons name="settings" size={32} color="white" />
            <Text style={styles.quickActionText}>RÉGLAGES</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <Text style={styles.lastUpdate}>
        Dernière mise à jour : {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 100, // Espace pour la barre de navigation
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl + 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: SPACING.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: 'white',
    fontWeight: '700',
  },
  fieldInfo: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: SPACING.md,
    borderRadius: 12,
  },
  fieldLocation: {
    ...TYPOGRAPHY.small,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: SPACING.xs,
  },
  fieldName: {
    ...TYPOGRAPHY.h3,
    color: 'white',
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  fieldArea: {
    ...TYPOGRAPHY.body,
    color: 'rgba(255,255,255,0.9)',
  },
  stageInfo: {
    marginTop: SPACING.md,
  },
  stageName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  stageDetail: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  stageCritical: {
    ...TYPOGRAPHY.body,
    color: '#f97316',
    fontWeight: '600',
    marginTop: SPACING.sm,
  },
  smiIndicator: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  smiLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  smiValueLarge: {
    fontSize: 32,
    fontWeight: '700',
  },
  irrigationInfo: {
    marginBottom: SPACING.md,
  },
  irrigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  irrigationLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  irrigationValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  statusBadge: {
    padding: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  statusBadgeText: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
  },
  irrigationRecommendation: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.sm,
  },
  recommendation: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  detailButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  forecastDay: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    width: 60,
  },
  forecastEmoji: {
    fontSize: 24,
    width: 40,
    textAlign: 'center',
  },
  forecastTemp: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    width: 80,
  },
  forecastRain: {
    ...TYPOGRAPHY.small,
    color: '#3b82f6',
    fontWeight: '600',
    width: 50,
    textAlign: 'right',
  },
  weatherRecommendation: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    fontStyle: 'italic',
  },
  noAlerts: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  noAlertsText: {
    ...TYPOGRAPHY.body,
    color: '#10b981',
    marginTop: SPACING.sm,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  quickActionButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickActionGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  quickActionText: {
    ...TYPOGRAPHY.small,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  lastUpdate: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
