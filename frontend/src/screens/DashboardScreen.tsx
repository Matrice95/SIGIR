/**
 * Dashboard Principal - Version Améliorée
 * Suivi en temps réel avec données backend
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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

// Components
import Card from '@/components/Card';
import Button from '@/components/Button';
import HealthBadge from '@/components/HealthBadge';
import EmptyState from '@/components/EmptyState';

// Services & Store
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setFields, setActiveField } from '@/store/slices/fieldsSlice';
import { fieldService } from '@/services/fieldService';
import backendService, { SMIData, WeatherData } from '@/services/backendService';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';

export default function DashboardScreenV2() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { activeFieldId, fields } = useAppSelector(state => state.fields);
  const activeField = fields.find(f => f.id === activeFieldId) || fields[0];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [smiData, setSmiData] = useState<SMIData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Charger les parcelles au démarrage
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
      dispatch(setFields(fetchedFields));
      if (fetchedFields.length > 0 && !activeFieldId) {
        dispatch(setActiveField(fetchedFields[0].id));
      }
    } catch (err) {
      console.error('Erreur chargement parcelles:', err);
      setError('Impossible de charger les parcelles');
    }
  };

  const loadDashboardData = async () => {
    if (!activeField) return;

    try {
      setError(null);
      console.log('📡 Chargement des données satellites pour:', activeField.name);
      
      const data = await backendService.getAllFieldData(activeField.id);
      
      console.log('✅ Données reçues:', {
        smi: !!data.smi,
        weather: !!data.weather,
        ndvi: !!data.ndvi,
        topography: !!data.topography,
      });
      
      setSmiData(data.smi);
      setWeatherData(data.weather);
      
      if (!data.smi && !data.weather) {
        setError('Données satellites temporairement indisponibles. Réessayez dans quelques instants.');
      }
    } catch (err: any) {
      console.error('❌ Erreur chargement dashboard:', err);
      if (err.message?.includes('timeout')) {
        setError('Le chargement des données satellites prend plus de temps que prévu. Réessayez.');
      } else if (err.message?.includes('Network Error')) {
        setError('Vérifiez votre connexion Internet');
      } else {
        setError('Erreur de connexion au serveur');
      }
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
        <Text style={styles.loadingText}>Chargement des parcelles...</Text>
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement des données...</Text>
      </View>
    );
  }

  const getSMIStatusColor = (smiClass: string): string => {
    switch (smiClass) {
      case 'TRÈS_SEC': return '#dc2626';
      case 'SEC': return '#f97316';
      case 'NORMAL': return '#10b981';
      case 'HUMIDE': return '#3b82f6';
      case 'TRÈS_HUMIDE': return '#8b5cf6';
      default: return COLORS.textSecondary;
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority?.toUpperCase()) {
      case 'URGENTE':
      case 'CRITIQUE': return '#dc2626';
      case 'HAUTE': return '#f97316';
      case 'MOYENNE': return '#f59e0b';
      case 'BASSE': return '#10b981';
      default: return COLORS.textSecondary;
    }
  };

  const getRiskLevelColor = (level: string): string => {
    switch (level?.toUpperCase()) {
      case 'CRITIQUE': return '#dc2626';
      case 'ÉLEVÉ': return '#f97316';
      case 'MODÉRÉ': return '#f59e0b';
      case 'FAIBLE': return '#10b981';
      default: return COLORS.textSecondary;
    }
  };

  const currentTemp = weatherData?.current?.temperature_2m ?? null;
  const currentHumidity = weatherData?.current?.relative_humidity_2m ?? null;

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
      {/* En-tête Parcelle */}
      <LinearGradient
        colors={['#10b981', '#059669']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerInfo}>
            <Text style={styles.fieldName}>{activeField.name}</Text>
            <Text style={styles.fieldDetails}>
              {activeField.area} ha • {activeField.variety || 'Riz pluvial'}
            </Text>
            <Text style={styles.fieldLocation}>
              📍 {activeField.location?.latitude.toFixed(4)}, {activeField.location?.longitude.toFixed(4)}
            </Text>
          </View>
          <HealthBadge status={activeField.healthStatus} size="large" />
        </View>

        {/* Météo actuelle */}
        {currentTemp && (
          <View style={styles.currentWeather}>
            <View style={styles.weatherMain}>
              <Text style={styles.tempLarge}>{Math.round(currentTemp)}°</Text>
              <View style={styles.weatherDetails}>
                <View style={styles.weatherDetail}>
                  <Ionicons name="water" size={16} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.weatherDetailText}>{currentHumidity}%</Text>
                </View>
                {weatherData?.current?.wind_speed_10m && (
                  <View style={styles.weatherDetail}>
                    <Ionicons name="speedometer" size={16} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.weatherDetailText}>
                      {Math.round(weatherData.current.wind_speed_10m)} km/h
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </LinearGradient>

      {error && (
        <Card style={styles.errorCard}>
          <Ionicons name="alert-circle" size={24} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Réessayer"
            onPress={loadDashboardData}
            variant="outline"
            size="small"
          />
        </Card>
      )}

      {/* SMI - Indicateur Principal */}
      {smiData && (
        <Card style={styles.smiCard}>
          <View style={styles.smiHeader}>
            <View>
              <Text style={styles.sectionTitle}>💧 Humidité du Sol (SMI)</Text>
              <Text style={styles.sectionSubtitle}>Temps réel • Sentinel-2</Text>
            </View>
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>{smiData.confidence}%</Text>
            </View>
          </View>

          {/* Jauge SMI */}
          <View style={styles.smiGaugeContainer}>
            <View style={styles.smiGauge}>
              <View
                style={[
                  styles.smiGaugeFill,
                  {
                    width: `${smiData.smi * 100}%`,
                    backgroundColor: getSMIStatusColor(smiData.smi_class),
                  },
                ]}
              />
            </View>
            <View style={styles.smiValues}>
              <View style={styles.smiValue}>
                <Text style={styles.smiValueNumber}>{(smiData.smi * 100).toFixed(0)}%</Text>
                <Text style={[styles.smiValueLabel, { color: getSMIStatusColor(smiData.smi_class) }]}>
                  {smiData.smi_class}
                </Text>
              </View>
              <View style={styles.smiValue}>
                <Text style={styles.smiValueNumber}>{smiData.swdi.toFixed(2)}</Text>
                <Text style={styles.smiValueLabel}>SWDI</Text>
              </View>
            </View>
          </View>

          {/* Composantes */}
          <View style={styles.componentsGrid}>
            <View style={styles.componentItem}>
              <Text style={styles.componentLabel}>NDVI</Text>
              <Text style={styles.componentValue}>
                {(smiData.field_info.ndvi * 100).toFixed(0)}%
              </Text>
            </View>
            <View style={styles.componentItem}>
              <Text style={styles.componentLabel}>NDWI</Text>
              <Text style={styles.componentValue}>
                {((smiData.field_info.ndwi + 1) * 50).toFixed(0)}%
              </Text>
            </View>
            <View style={styles.componentItem}>
              <Text style={styles.componentLabel}>Pluie 7j</Text>
              <Text style={styles.componentValue}>{smiData.field_info.rainfall_7d.toFixed(0)}mm</Text>
            </View>
            <View style={styles.componentItem}>
              <Text style={styles.componentLabel}>Temp</Text>
              <Text style={styles.componentValue}>{smiData.field_info.temperature_avg.toFixed(0)}°C</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Recommandation Irrigation */}
      {smiData?.recommendation && (
        <Card
          style={[
            styles.recommendationCard,
            { borderLeftColor: getPriorityColor(smiData.recommendation.priority) },
          ]}
        >
          <View style={styles.recommendationHeader}>
            <View style={styles.recommendationTitle}>
              <Ionicons
                name="water"
                size={24}
                color={getPriorityColor(smiData.recommendation.priority)}
              />
              <Text style={styles.recommendationAction}>{smiData.recommendation.action}</Text>
            </View>
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor(smiData.recommendation.priority) },
              ]}
            >
              <Text style={styles.priorityText}>{smiData.recommendation.priority}</Text>
            </View>
          </View>

          <Text style={styles.recommendationReason}>{smiData.recommendation.reason}</Text>

          {smiData.recommendation.volume_mm > 0 && (
            <View style={styles.volumeCard}>
              <Ionicons name="flask" size={20} color={COLORS.info} />
              <Text style={styles.volumeText}>Volume recommandé: </Text>
              <Text style={styles.volumeValue}>{smiData.recommendation.volume_mm}mm</Text>
            </View>
          )}

          {smiData.recommendation.next_actions.length > 0 && (
            <View style={styles.actionsList}>
              <Text style={styles.actionsTitle}>Actions à effectuer:</Text>
              {smiData.recommendation.next_actions.map((action, index) => (
                <View key={index} style={styles.actionItem}>
                  <Text style={styles.actionBullet}>✓</Text>
                  <Text style={styles.actionText}>{action}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.nextCheckText}>
            Prochain contrôle: {smiData.recommendation.next_check_hours}h
          </Text>
        </Card>
      )}

      {/* Risque Inondation */}
      {smiData?.flood_risk && smiData.flood_risk.risk_score > 0 && (
        <Card style={styles.floodCard}>
          <View style={styles.floodHeader}>
            <Ionicons name="warning" size={24} color={getRiskLevelColor(smiData.flood_risk.risk_level)} />
            <Text style={styles.floodTitle}>Risque d'Inondation</Text>
            <View
              style={[
                styles.riskBadge,
                { backgroundColor: getRiskLevelColor(smiData.flood_risk.risk_level) },
              ]}
            >
              <Text style={styles.riskText}>{smiData.flood_risk.risk_level}</Text>
            </View>
          </View>

          <View style={styles.riskGauge}>
            <View
              style={[
                styles.riskGaugeFill,
                {
                  width: `${smiData.flood_risk.risk_score}%`,
                  backgroundColor: getRiskLevelColor(smiData.flood_risk.risk_level),
                },
              ]}
            />
          </View>
          <Text style={styles.riskScore}>Score: {smiData.flood_risk.risk_score}/100</Text>

          {smiData.flood_risk.warnings.length > 0 && (
            <View style={styles.warningsList}>
              {smiData.flood_risk.warnings.map((warning, index) => (
                <View key={index} style={styles.warningItem}>
                  <Text style={styles.warningBullet}>⚠️</Text>
                  <Text style={styles.warningText}>{warning}</Text>
                </View>
              ))}
            </View>
          )}

          {smiData.flood_risk.days_until_saturation && (
            <Text style={styles.saturationText}>
              Saturation estimée dans {smiData.flood_risk.days_until_saturation} jour(s)
            </Text>
          )}
        </Card>
      )}

      {/* Stade Phénologique */}
      {smiData?.field_info && (
        <Card>
          <View style={styles.stageHeader}>
            <Text style={styles.stageIcon}>🌾</Text>
            <View style={styles.stageInfo}>
              <Text style={styles.stageTitle}>Stade Phénologique</Text>
              <Text style={styles.stageName}>{smiData.field_info.phenology_stage.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.stageDetails}>
            <View style={styles.stageDetail}>
              <Text style={styles.stageDetailLabel}>Type de sol</Text>
              <Text style={styles.stageDetailValue}>{smiData.field_info.soil_type}</Text>
            </View>
            <View style={styles.stageDetail}>
              <Text style={styles.stageDetailLabel}>Altitude</Text>
              <Text style={styles.stageDetailValue}>{smiData.field_info.elevation}m</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Prévisions 7 jours */}
      {weatherData?.daily && (
        <Card>
          <View style={styles.forecastHeader}>
            <Ionicons name="partly-sunny" size={24} color={COLORS.secondary} />
            <Text style={styles.forecastTitle}>Prévisions 7 jours</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {weatherData.daily.slice(0, 7).map((day, index) => (
              <View key={index} style={styles.forecastDay}>
                <Text style={styles.forecastDate}>
                  {index === 0 ? 'Auj.' : `J+${index}`}
                </Text>
                <Text style={styles.forecastIcon}>
                  {day.precipitation_sum > 0 ? '🌧️' : '☀️'}
                </Text>
                <Text style={styles.forecastTemp}>{Math.round(day.temperature_max)}°</Text>
                <Text style={styles.forecastTempMin}>{Math.round(day.temperature_min)}°</Text>
                {day.precipitation_sum > 0 && (
                  <Text style={styles.forecastRain}>💧{day.precipitation_sum.toFixed(0)}mm</Text>
                )}
                <Text style={styles.forecastEt0}>ET0: {day.et0_fao_evapotranspiration.toFixed(1)}</Text>
              </View>
            ))}
          </ScrollView>
        </Card>
      )}

      {/* Actions Rapides */}
      <View style={styles.quickActions}>
        <Pressable
          style={styles.quickAction}
          onPress={() => navigation.navigate('Weather' as never)}
        >
          <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.quickActionGradient}>
            <Ionicons name="partly-sunny" size={28} color="#fff" />
            <Text style={styles.quickActionText}>Météo</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          style={styles.quickAction}
          onPress={() => navigation.navigate('Map' as never)}
        >
          <LinearGradient colors={['#10b981', '#059669']} style={styles.quickActionGradient}>
            <Ionicons name="map" size={28} color="#fff" />
            <Text style={styles.quickActionText}>Carte</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          style={styles.quickAction}
          onPress={() => navigation.navigate('Evapotranspiration' as never)}
        >
          <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.quickActionGradient}>
            <Ionicons name="thermometer" size={28} color="#fff" />
            <Text style={styles.quickActionText}>ETP</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          style={styles.quickAction}
          onPress={() => navigation.navigate('AddOperation' as never, { fieldId: activeField.id })}
        >
          <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.quickActionGradient}>
            <Ionicons name="add-circle" size={28} color="#fff" />
            <Text style={styles.quickActionText}>Opération</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Dernière mise à jour */}
      {smiData && (
        <Text style={styles.lastUpdate}>
          Dernière mise à jour: {new Date(smiData.timestamp).toLocaleString('fr-FR')}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: SPACING.xxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  headerGradient: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerInfo: {
    flex: 1,
  },
  fieldName: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#fff',
    marginBottom: SPACING.xs,
  },
  fieldDetails: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: SPACING.xs,
  },
  fieldLocation: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  currentWeather: {
    marginTop: SPACING.lg,
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tempLarge: {
    fontSize: 64,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#fff',
  },
  weatherDetails: {
    alignItems: 'flex-end',
  },
  weatherDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  weatherDetailText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: SPACING.xs,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: '#fee2e2',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.error,
  },
  smiCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  smiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  confidenceBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#fff',
  },
  smiGaugeContainer: {
    marginBottom: SPACING.lg,
  },
  smiGauge: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  smiGaugeFill: {
    height: '100%',
    borderRadius: 4,
  },
  smiValues: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  smiValue: {
    alignItems: 'center',
  },
  smiValueNumber: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  smiValueLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginTop: SPACING.xs,
  },
  componentsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  componentItem: {
    alignItems: 'center',
  },
  componentLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  componentValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  recommendationCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  recommendationTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recommendationAction: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  priorityBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#fff',
  },
  recommendationReason: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    marginBottom: SPACING.md,
    lineHeight: 22,
  },
  volumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  volumeText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  volumeValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.info,
  },
  actionsList: {
    marginBottom: SPACING.md,
  },
  actionsTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  actionBullet: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.success,
    marginRight: SPACING.sm,
  },
  actionText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    lineHeight: 20,
  },
  nextCheckText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  floodCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: '#fef3c7',
  },
  floodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  floodTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  riskBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  riskText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#fff',
  },
  riskGauge: {
    height: 6,
    backgroundColor: '#fff',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  riskGaugeFill: {
    height: '100%',
  },
  riskScore: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  warningsList: {
    marginTop: SPACING.md,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  warningBullet: {
    marginRight: SPACING.sm,
  },
  warningText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
  },
  saturationText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: SPACING.md,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  stageIcon: {
    fontSize: 40,
    marginRight: SPACING.md,
  },
  stageInfo: {
    flex: 1,
  },
  stageTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  stageName: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  stageDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  stageDetail: {
    alignItems: 'center',
  },
  stageDetailLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  stageDetailValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  forecastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  forecastTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  forecastDay: {
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginRight: SPACING.md,
    minWidth: 90,
  },
  forecastDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  forecastIcon: {
    fontSize: 32,
    marginVertical: SPACING.xs,
  },
  forecastTemp: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  forecastTempMin: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  forecastRain: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.info,
    marginTop: SPACING.xs,
  },
  forecastEt0: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  quickAction: {
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
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: '#fff',
    marginTop: SPACING.xs,
  },
  lastUpdate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
});
