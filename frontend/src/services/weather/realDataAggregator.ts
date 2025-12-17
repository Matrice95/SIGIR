/**
 * Service d'Agrégation de Données Réelles
 * Combine toutes les sources: Open-Meteo, CHIRPS, Penman-Monteith, SRTM, GEE
 */

import { openMeteoService, WeatherData } from './openMeteoService';
import { chirpsService, RainfallData, RainfallStats } from './chirpsService';
import { penmanMonteithService, ET0Result } from './penmanMonteithService';
import { srtmService, TopographyData } from './srtmService';
import { geeService, NDVIData, VegetationHealth } from './geeService';

export interface FieldDataSnapshot {
  fieldId: string;
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
  };
  
  // Météo actuelle et prévisions
  weather: WeatherData;
  
  // Historique des pluies
  rainfall: {
    data: RainfallData[];
    stats: RainfallStats;
  };
  
  // Évapotranspiration
  et0: ET0Result;
  irrigationNeed: {
    totalET0: number;
    totalRain: number;
    irrigationNeeded: number;
    nextIrrigationDate: string | null;
  };
  
  // Topographie
  topography: TopographyData;
  
  // Santé de la végétation (NDVI)
  vegetation: {
    current: NDVIData | null;
    history: NDVIData[];
    health: VegetationHealth;
  };
  
  // Recommandations consolidées
  recommendations: string[];
}

class RealDataAggregatorService {
  /**
   * Récupérer toutes les données pour une parcelle
   */
  async getFieldData(
    fieldId: string,
    latitude: number,
    longitude: number,
    plantingDate: Date
  ): Promise<FieldDataSnapshot> {
    console.log(`📊 Agrégation données pour parcelle ${fieldId}...`);

    try {
      // Exécuter tous les appels en parallèle
      const [weather, rainfallData, topography, ndviHistory] = await Promise.all([
        openMeteoService.getForecast(latitude, longitude),
        chirpsService.getRainfallForCropCycle(latitude, longitude, plantingDate),
        srtmService.getTopography(latitude, longitude),
        geeService.getNDVI(latitude, longitude, 100, plantingDate),
      ]);

      // Calculer ET0 basé sur météo actuelle
      const daysAfterPlanting = Math.floor(
        (Date.now() - plantingDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const cropCoefficient = penmanMonteithService.getCropCoefficient(daysAfterPlanting, 'rice');

      const et0 = penmanMonteithService.calculateET0(
        {
          temperature_max: weather.daily[0].temperature_max,
          temperature_min: weather.daily[0].temperature_min,
          humidity_mean: weather.daily[0].relative_humidity_mean,
          wind_speed: weather.current.wind_speed / 3.6, // km/h -> m/s
          latitude,
          altitude: topography.elevation,
          date: new Date(),
        },
        cropCoefficient
      );

      // Calculer besoin en irrigation
      const irrigationNeed = openMeteoService.calculateIrrigationNeed(
        weather.daily,
        cropCoefficient
      );

      // Statistiques de pluie
      const rainfallStats = chirpsService.calculateRainfallStats(rainfallData);

      // Analyser santé végétation
      const vegetationHealth = geeService.analyzeVegetationHealth(ndviHistory);
      const currentNDVI = ndviHistory.length > 0 ? ndviHistory[ndviHistory.length - 1] : null;

      // Consolider les recommandations
      const recommendations = this.consolidateRecommendations(
        weather,
        et0,
        irrigationNeed,
        topography,
        vegetationHealth,
        rainfallStats
      );

      return {
        fieldId,
        timestamp: new Date(),
        location: { latitude, longitude },
        weather,
        rainfall: {
          data: rainfallData.slice(-30), // 30 derniers jours
          stats: rainfallStats,
        },
        et0,
        irrigationNeed,
        topography,
        vegetation: {
          current: currentNDVI,
          history: ndviHistory,
          health: vegetationHealth,
        },
        recommendations,
      };
    } catch (error) {
      console.error('Erreur agrégation données:', error);
      throw new Error('Impossible d\'agréger les données de la parcelle');
    }
  }

  /**
   * Récupérer les données pour plusieurs parcelles
   */
  async getFieldsData(
    fields: Array<{
      id: string;
      latitude: number;
      longitude: number;
      plantingDate: Date;
    }>
  ): Promise<Map<string, FieldDataSnapshot>> {
    const results = new Map<string, FieldDataSnapshot>();

    await Promise.all(
      fields.map(async (field) => {
        try {
          const data = await this.getFieldData(
            field.id,
            field.latitude,
            field.longitude,
            field.plantingDate
          );
          results.set(field.id, data);
        } catch (error) {
          console.error(`Erreur pour parcelle ${field.id}:`, error);
        }
      })
    );

    return results;
  }

  /**
   * Consolider toutes les recommandations
   */
  private consolidateRecommendations(
    weather: WeatherData,
    et0: ET0Result,
    irrigationNeed: any,
    topography: TopographyData,
    vegetationHealth: VegetationHealth,
    rainfallStats: RainfallStats
  ): string[] {
    const recommendations: string[] = [];

    // Priorité 1: Santé de la végétation (NDVI)
    if (vegetationHealth.status === 'critical' || vegetationHealth.status === 'poor') {
      recommendations.push(...vegetationHealth.recommendation);
    }

    // Priorité 2: Irrigation urgente
    if (irrigationNeed.irrigationNeeded > 30) {
      recommendations.push(`🚨 URGENT: Irrigation de ${irrigationNeed.irrigationNeeded}mm nécessaire`);
    } else if (irrigationNeed.irrigationNeeded > 15) {
      recommendations.push(`💧 Irrigation de ${irrigationNeed.irrigationNeeded}mm recommandée`);
    }

    // Priorité 3: Météo défavorable
    const weatherRecs = openMeteoService.getWeatherRecommendations(weather.current, weather.daily);
    recommendations.push(...weatherRecs);

    // Priorité 4: Topographie
    const topoRecs = srtmService.getTopographyRecommendations(topography);
    if (topoRecs.length > 0) {
      recommendations.push(...topoRecs);
    }

    // Priorité 5: Déficit hydrique historique
    if (rainfallStats.totalRainfall < et0.etc * rainfallStats.rainyDays) {
      const deficit = Math.round(et0.etc * rainfallStats.rainyDays - rainfallStats.totalRainfall);
      recommendations.push(`📉 Déficit hydrique cumulé: ${deficit}mm depuis plantation`);
    }

    // Priorité 6: Tendance NDVI
    if (vegetationHealth.trend === 'declining') {
      recommendations.push('📉 Santé en déclin - Surveiller étroitement');
    } else if (vegetationHealth.trend === 'improving' && vegetationHealth.status !== 'excellent') {
      recommendations.push('📈 Amélioration détectée - Continuer les pratiques actuelles');
    }

    // Limiter à 8 recommandations maximum
    return recommendations.slice(0, 8);
  }

  /**
   * Obtenir un résumé rapide pour le Dashboard
   */
  getDashboardSummary(snapshot: FieldDataSnapshot): {
    health: string;
    waterStatus: string;
    nextAction: string;
    priority: 'high' | 'medium' | 'low';
  } {
    const { vegetation, irrigationNeed, weather } = snapshot;

    // Santé
    const healthLabels = {
      excellent: '✅ Excellente',
      good: '✅ Bonne',
      moderate: '⚠️ Modérée',
      poor: '⚠️ Faible',
      critical: '🚨 Critique',
    };
    const health = healthLabels[vegetation.health.status];

    // Eau
    let waterStatus = '✅ Suffisante';
    if (irrigationNeed.irrigationNeeded > 30) {
      waterStatus = '🚨 Irrigation urgente';
    } else if (irrigationNeed.irrigationNeeded > 15) {
      waterStatus = '💧 Irrigation nécessaire';
    }

    // Prochaine action
    let nextAction = 'Surveillance normale';
    if (irrigationNeed.nextIrrigationDate) {
      nextAction = `Irriguer avant le ${new Date(irrigationNeed.nextIrrigationDate).toLocaleDateString('fr-FR')}`;
    } else if (vegetation.health.status === 'poor' || vegetation.health.status === 'critical') {
      nextAction = 'Intervention urgente requise';
    }

    // Priorité
    let priority: 'high' | 'medium' | 'low' = 'low';
    if (
      vegetation.health.status === 'critical' ||
      irrigationNeed.irrigationNeeded > 30
    ) {
      priority = 'high';
    } else if (
      vegetation.health.status === 'poor' ||
      irrigationNeed.irrigationNeeded > 15
    ) {
      priority = 'medium';
    }

    return { health, waterStatus, nextAction, priority };
  }
}

export const realDataAggregator = new RealDataAggregatorService();
export default realDataAggregator;
