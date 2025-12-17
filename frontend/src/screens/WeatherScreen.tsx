/**
 * Écran Météo Détaillée
 * Affiche les prévisions météorologiques sur 7 jours
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Components
import Card from '@/components/Card';
import Loading from '@/components/Loading';

// Store & Constants
import { useAppSelector } from '@/store/hooks';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';

interface WeatherDay {
  date: Date;
  temp: { min: number; max: number };
  humidity: number;
  precipitation: number;
  wind: number;
  condition: string;
  icon: string;
}

export default function WeatherScreen() {
  const { activeFieldId, fields } = useAppSelector(state => state.fields);
  const activeField = fields.find(f => f.id === activeFieldId) || fields[0];

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);

  // Données météo simulées (à remplacer par API réelle)
  const [forecast, setForecast] = useState<WeatherDay[]>([
    {
      date: new Date(),
      temp: { min: 22, max: 32 },
      humidity: 75,
      precipitation: 5,
      wind: 12,
      condition: 'Partiellement nuageux',
      icon: '⛅',
    },
    {
      date: new Date(Date.now() + 86400000),
      temp: { min: 23, max: 33 },
      humidity: 70,
      precipitation: 0,
      wind: 10,
      condition: 'Ensoleillé',
      icon: '☀️',
    },
    {
      date: new Date(Date.now() + 2 * 86400000),
      temp: { min: 21, max: 30 },
      humidity: 85,
      precipitation: 15,
      wind: 15,
      condition: 'Pluie légère',
      icon: '🌧️',
    },
    {
      date: new Date(Date.now() + 3 * 86400000),
      temp: { min: 22, max: 31 },
      humidity: 80,
      precipitation: 10,
      wind: 13,
      condition: 'Averses',
      icon: '🌦️',
    },
    {
      date: new Date(Date.now() + 4 * 86400000),
      temp: { min: 23, max: 32 },
      humidity: 72,
      precipitation: 2,
      wind: 11,
      condition: 'Nuageux',
      icon: '☁️',
    },
    {
      date: new Date(Date.now() + 5 * 86400000),
      temp: { min: 24, max: 34 },
      humidity: 68,
      precipitation: 0,
      wind: 9,
      condition: 'Ensoleillé',
      icon: '☀️',
    },
    {
      date: new Date(Date.now() + 6 * 86400000),
      temp: { min: 23, max: 33 },
      humidity: 73,
      precipitation: 3,
      wind: 12,
      condition: 'Partiellement nuageux',
      icon: '⛅',
    },
  ]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // TODO: Charger données météo depuis API
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const formatDate = (date: Date, format: 'short' | 'long' = 'short') => {
    if (format === 'short') {
      const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      return days[date.getDay()];
    }
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    });
  };

  const selectedWeather = forecast[selectedDay];

  if (loading) {
    return <Loading fullScreen message="Chargement des données météo..." />;
  }

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
      {/* Localisation */}
      {activeField?.location && (
        <Card style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <Text style={styles.locationText}>{activeField.name}</Text>
          </View>
          <Text style={styles.locationDetail}>
            📍 {activeField.location.latitude.toFixed(4)}, {activeField.location.longitude.toFixed(4)}
          </Text>
        </Card>
      )}

      {/* Sélecteur de jours */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.daysScroll}
        contentContainerStyle={styles.daysContent}
      >
        {forecast.map((day, index) => (
          <Pressable
            key={index}
            style={[
              styles.dayCard,
              selectedDay === index && styles.dayCardActive,
            ]}
            onPress={() => setSelectedDay(index)}
          >
            <Text
              style={[
                styles.dayName,
                selectedDay === index && styles.dayNameActive,
              ]}
            >
              {index === 0 ? "Aujourd'hui" : formatDate(day.date)}
            </Text>
            <Text style={styles.dayIcon}>{day.icon}</Text>
            <Text
              style={[
                styles.dayTemp,
                selectedDay === index && styles.dayTempActive,
              ]}
            >
              {day.temp.max}°
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Météo détaillée du jour sélectionné */}
      <Card style={styles.detailCard}>
        <Text style={styles.detailDate}>{formatDate(selectedWeather.date, 'long')}</Text>
        
        <View style={styles.mainWeather}>
          <Text style={styles.mainIcon}>{selectedWeather.icon}</Text>
          <View style={styles.mainTemp}>
            <Text style={styles.tempValue}>{selectedWeather.temp.max}°</Text>
            <Text style={styles.tempLabel}>Max</Text>
          </View>
          <View style={styles.mainTemp}>
            <Text style={styles.tempValue}>{selectedWeather.temp.min}°</Text>
            <Text style={styles.tempLabel}>Min</Text>
          </View>
        </View>

        <Text style={styles.condition}>{selectedWeather.condition}</Text>

        {/* Détails supplémentaires */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Ionicons name="water" size={24} color={COLORS.info} />
            <Text style={styles.detailValue}>{selectedWeather.humidity}%</Text>
            <Text style={styles.detailLabel}>Humidité</Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="rainy" size={24} color={COLORS.info} />
            <Text style={styles.detailValue}>{selectedWeather.precipitation} mm</Text>
            <Text style={styles.detailLabel}>Pluie</Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="speedometer" size={24} color={COLORS.info} />
            <Text style={styles.detailValue}>{selectedWeather.wind} km/h</Text>
            <Text style={styles.detailLabel}>Vent</Text>
          </View>
        </View>
      </Card>

      {/* Recommandations */}
      <Card>
        <Text style={styles.sectionTitle}>💡 Recommandations</Text>
        
        {selectedWeather.precipitation > 10 ? (
          <View style={styles.recommendation}>
            <Ionicons name="alert-circle" size={20} color={COLORS.warning} />
            <Text style={styles.recommendationText}>
              Pluie prévue : reportez l'irrigation si possible
            </Text>
          </View>
        ) : selectedWeather.precipitation === 0 && selectedWeather.temp.max > 32 ? (
          <View style={styles.recommendation}>
            <Ionicons name="water" size={20} color={COLORS.info} />
            <Text style={styles.recommendationText}>
              Temps chaud et sec : irrigation recommandée
            </Text>
          </View>
        ) : (
          <View style={styles.recommendation}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.recommendationText}>
              Conditions favorables pour les opérations agricoles
            </Text>
          </View>
        )}
      </Card>

      {/* Avertissement */}
      <Card style={styles.warningCard}>
        <Ionicons name="information-circle" size={20} color={COLORS.textSecondary} />
        <Text style={styles.warningText}>
          Les prévisions météorologiques sont fournies à titre indicatif. 
          Consultez les services météorologiques locaux pour plus de précision.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.base,
    paddingBottom: SPACING.xxxl,
  },
  locationCard: {
    marginBottom: SPACING.md,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  locationText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  locationDetail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  daysScroll: {
    marginBottom: SPACING.md,
  },
  daysContent: {
    paddingHorizontal: SPACING.xs,
    gap: SPACING.sm,
  },
  dayCard: {
    width: 90,
    padding: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  dayCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  dayNameActive: {
    color: COLORS.textLight,
  },
  dayIcon: {
    fontSize: 32,
    marginVertical: SPACING.sm,
  },
  dayTemp: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  dayTempActive: {
    color: COLORS.textLight,
  },
  detailCard: {
    marginBottom: SPACING.md,
  },
  detailDate: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    textTransform: 'capitalize',
  },
  mainWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  mainIcon: {
    fontSize: 80,
    marginRight: SPACING.lg,
  },
  mainTemp: {
    alignItems: 'center',
    marginHorizontal: SPACING.md,
  },
  tempValue: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  tempLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  condition: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  recommendationText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    marginLeft: SPACING.md,
    flex: 1,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${COLORS.warning}10`,
  },
  warningText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.md,
    flex: 1,
    lineHeight: 20,
  },
});
