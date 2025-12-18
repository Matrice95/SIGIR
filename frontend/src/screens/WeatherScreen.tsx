/**
 * Écran Météo avec données réelles
 * Open-Meteo API + NASA POWER + Penman-Monteith
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';

// Services
import {
  backendWeatherService,
  BackendWeatherResponse,
  BackendRainfallData,
  BackendTopography,
  BackendNDVI,
} from '@/services/weather/backendWeatherService';

// Store & Types
import { useAppSelector } from '@/store/hooks';
import { COLORS, TYPOGRAPHY, SPACING, SIZES } from '@/constants/theme';

// Components
import Card from '@/components/Card';

type WeatherScreenRouteProp = RouteProp<{ params: { fieldId: string } }, 'params'>;

export default function WeatherScreen() {
  const route = useRoute<WeatherScreenRouteProp>();
  const fieldId = route.params?.fieldId;
  
  const { fields } = useAppSelector(state => state.fields);
  const field = fields.find(f => f.id === fieldId);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weather, setWeather] = useState<BackendWeatherResponse | null>(null);
  const [rainfall, setRainfall] = useState<BackendRainfallData[]>([]);
  const [topography, setTopography] = useState<BackendTopography | null>(null);
  const [ndvi, setNdvi] = useState<BackendNDVI[]>([]);
  const [irrigationNeed, setIrrigationNeed] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { token } = useAppSelector(state => state.auth);

  useEffect(() => {
    if (field?.location?.latitude && field?.location?.longitude) {
      loadWeatherData();
    }
  }, [fieldId]);

  const loadWeatherData = async () => {
    if (!field) {
      setError('Parcelle non trouvée');
      setLoading(false);
      return;
    }

    if (!token) {
      setError('Non authentifié');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      // Définir le token pour les requêtes backend
      backendWeatherService.setToken(token);

      // Charger toutes les données depuis le backend
      const data = await backendWeatherService.getAllFieldData(fieldId);

      // Calculer besoin irrigation
      const irrigation = backendWeatherService.calculateIrrigationNeed(
        data.weather,
        data.rainfall
      );

      // Générer recommandations
      const recs = backendWeatherService.generateRecommendations(data);

      setWeather(data.weather);
      setRainfall(data.rainfall);
      setTopography(data.topography);
      setNdvi(data.ndvi);
      setIrrigationNeed(irrigation);
      setRecommendations(recs);
    } catch (err: any) {
      console.error('Erreur chargement météo:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWeatherData();
  };

  const getWeatherIcon = (precipitation: number, temp: number): string => {
    if (precipitation > 10) return 'rainy';
    if (precipitation > 0) return 'rainy-outline';
    if (temp > 32) return 'sunny';
    return 'partly-sunny';
  };

  if (!field) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={COLORS.error} />
        <Text style={styles.errorText}>Parcelle non trouvée</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement des données météo...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={COLORS.error} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* En-tête parcelle */}
      <Card style={styles.headerCard}>
        <Text style={styles.fieldName}>{field.name}</Text>
        <Text style={styles.fieldLocation}>
          📍 {field.location?.latitude.toFixed(4)}°, {field.location?.longitude.toFixed(4)}°
        </Text>
        {topography && (
          <Text style={styles.fieldElevation}>
            🏔️ Altitude: {topography.elevation}m | Pente: {topography.slope}°
          </Text>
        )}
      </Card>

      {/* Météo actuelle */}
      {weather && (
        <Card style={styles.currentCard}>
          <Text style={styles.sectionTitle}>Météo Actuelle</Text>
          <View style={styles.currentWeather}>
            <View style={styles.currentTemp}>
              <Text style={styles.tempValue}>{Math.round(weather.current.temperature)}°</Text>
              <Text style={styles.tempLabel}>Température</Text>
            </View>
            <View style={styles.currentDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="water" size={20} color={COLORS.info} />
                <Text style={styles.detailText}>{weather.current.humidity}% humidité</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="speedometer" size={20} color={COLORS.secondary} />
                <Text style={styles.detailText}>{Math.round(weather.current.wind_speed)} km/h vent</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="rainy" size={20} color={COLORS.primary} />
                <Text style={styles.detailText}>{weather.current.precipitation} mm pluie</Text>
              </View>
            </View>
          </View>
        </Card>
      )}

      {/* Prévisions 7 jours */}
      {weather && (
        <Card style={styles.forecastCard}>
          <Text style={styles.sectionTitle}>Prévisions 7 Jours</Text>
          {weather.daily.map((day, index) => (
            <View key={index} style={styles.forecastDay}>
              <View style={styles.forecastLeft}>
                <Ionicons
                  name={getWeatherIcon(day.precipitation_sum, day.temperature_max)}
                  size={32}
                  color={COLORS.primary}
                />
                <View style={styles.forecastDate}>
                  <Text style={styles.forecastDateText}>
                    {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </Text>
                  <Text style={styles.forecastDateSubtext}>
                    {new Date(day.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
              </View>
              <View style={styles.forecastRight}>
                <Text style={styles.forecastTemp}>
                  {Math.round(day.temperature_max)}° / {Math.round(day.temperature_min)}°
                </Text>
                <Text style={styles.forecastRain}>
                  💧 {day.precipitation_sum}mm ({day.precipitation_probability_max}%)
                </Text>
                <Text style={styles.forecastET0}>
                  🌱 ET0: {day.et0_fao_evapotranspiration.toFixed(1)}mm
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Besoin en irrigation */}
      {irrigationNeed && (
        <Card style={styles.irrigationCard}>
          <Text style={styles.sectionTitle}>💧 Besoin en Irrigation (7 jours)</Text>
          <View style={styles.irrigationStats}>
            <View style={styles.irrigationStat}>
              <Text style={styles.statValue}>{irrigationNeed.totalET0}mm</Text>
              <Text style={styles.statLabel}>Évapotranspiration</Text>
            </View>
            <View style={styles.irrigationStat}>
              <Text style={styles.statValue}>{irrigationNeed.totalRain}mm</Text>
              <Text style={styles.statLabel}>Pluie prévue</Text>
            </View>
            <View style={styles.irrigationStat}>
              <Text style={[styles.statValue, { color: irrigationNeed.irrigationNeeded > 30 ? COLORS.error : COLORS.success }]}>
                {irrigationNeed.irrigationNeeded}mm
              </Text>
              <Text style={styles.statLabel}>Irrigation nécessaire</Text>
            </View>
          </View>
          {irrigationNeed.nextIrrigationDate && (
            <View style={styles.irrigationAlert}>
              <Ionicons name="alert-circle" size={24} color={COLORS.warning} />
              <Text style={styles.irrigationAlertText}>
                Irriguer avant le {new Date(irrigationNeed.nextIrrigationDate).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          )}
        </Card>
      )}

      {/* Historique pluies */}
      {rainfall.length > 0 && (
        <Card style={styles.rainfallCard}>
          <Text style={styles.sectionTitle}>🌧️ Pluies ({rainfall.length} derniers jours)</Text>
          <View style={styles.rainfallStats}>
            <View style={styles.rainfallStat}>
              <Text style={styles.statValue}>
                {Math.round(rainfall.reduce((sum, d) => sum + d.precipitation, 0))}mm
              </Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.rainfallStat}>
              <Text style={styles.statValue}>
                {(rainfall.reduce((sum, d) => sum + d.precipitation, 0) / rainfall.length).toFixed(1)}mm
              </Text>
              <Text style={styles.statLabel}>Moyenne/jour</Text>
            </View>
            <View style={styles.rainfallStat}>
              <Text style={styles.statValue}>
                {rainfall.filter(d => d.precipitation > 1).length}
              </Text>
              <Text style={styles.statLabel}>Jours pluvieux</Text>
            </View>
            <View style={styles.rainfallStat}>
              <Text style={styles.statValue}>
                {Math.max(...rainfall.map(d => d.precipitation)).toFixed(1)}mm
              </Text>
              <Text style={styles.statLabel}>Max quotidien</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Recommandations */}
      {recommendations.length > 0 && (
        <Card style={styles.recommendationsCard}>
          <Text style={styles.sectionTitle}>💡 Recommandations</Text>
          {recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendation}>
              <Ionicons 
                name={rec.includes('🚨') ? 'warning' : rec.includes('⚠️') ? 'alert-circle' : 'checkmark-circle'} 
                size={20} 
                color={rec.includes('🚨') ? COLORS.error : rec.includes('⚠️') ? COLORS.warning : COLORS.success} 
              />
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </Card>
      )}

      {/* Santé de la végétation (NDVI) */}
      {ndvi.length > 0 && (
        <Card style={styles.ndviCard}>
          <Text style={styles.sectionTitle}>🛰️ Santé Végétation (NDVI)</Text>
          {(() => {
            const health = backendWeatherService.analyzeVegetationHealth(ndvi);
            return (
              <View>
                <View style={styles.ndviStatus}>
                  <Text style={styles.ndviValue}>{health.currentNDVI}</Text>
                  <Text style={[
                    styles.ndviLabel,
                    { color: 
                      health.status === 'excellent' ? COLORS.success :
                      health.status === 'good' ? COLORS.info :
                      health.status === 'moderate' ? COLORS.warning :
                      COLORS.error
                    }
                  ]}>
                    {health.message}
                  </Text>
                </View>
                <Text style={styles.ndviTrend}>
                  Tendance: {health.trend === 'improving' ? '📈 En amélioration' : 
                             health.trend === 'declining' ? '📉 En baisse' : 
                             '➡️ Stable'}
                </Text>
                <Text style={styles.ndviInfo}>
                  {ndvi.length} mesures depuis plantation
                </Text>
              </View>
            );
          })()}
        </Card>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Données: Open-Meteo, NASA POWER, SRTM
        </Text>
        <Text style={styles.footerText}>
          Mis à jour: {new Date().toLocaleString('fr-FR')}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
  },
  errorText: {
    marginTop: SPACING.base,
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.error,
    textAlign: 'center',
  },
  headerCard: {
    margin: SPACING.base,
  },
  fieldName: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  fieldLocation: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  fieldElevation: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  currentCard: {
    margin: SPACING.base,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.base,
  },
  currentWeather: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  currentTemp: {
    alignItems: 'center',
  },
  tempValue: {
    fontSize: 64,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  tempLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  currentDetails: {
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  detailText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
  },
  forecastCard: {
    margin: SPACING.base,
    marginTop: 0,
  },
  forecastDay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  forecastLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  forecastDate: {},
  forecastDateText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  forecastDateSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  forecastRight: {
    alignItems: 'flex-end',
  },
  forecastTemp: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  forecastRain: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.info,
  },
  forecastET0: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.success,
  },
  irrigationCard: {
    margin: SPACING.base,
    marginTop: 0,
  },
  irrigationStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.base,
  },
  irrigationStat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  irrigationAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.warning + '20',
    padding: SPACING.sm,
    borderRadius: SIZES.borderRadius.md,
  },
  irrigationAlertText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
  },
  rainfallCard: {
    margin: SPACING.base,
    marginTop: 0,
  },
  rainfallStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rainfallStat: {
    alignItems: 'center',
  },
  recommendationsCard: {
    margin: SPACING.base,
    marginTop: 0,
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  recommendationText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
  },
  ndviCard: {
    margin: SPACING.base,
    marginTop: 0,
  },
  ndviStatus: {
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  ndviValue: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  ndviLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginTop: SPACING.xs,
  },
  ndviTrend: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  ndviInfo: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
});
