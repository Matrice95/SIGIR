/**
 * Service Backend pour les Données Météo et Satellite
 * Utilise les endpoints backend qui agrègent les données de toutes les sources
 */

import axios from 'axios';
import { API_BASE_URL } from '@env';

// Types pour les réponses backend
export interface BackendWeatherDay {
  date: string;
  temperature_max: number;
  temperature_min: number;
  temperature_mean: number;
  precipitation_sum: number;
  precipitation_probability_max: number;
  wind_speed_max: number;
  relative_humidity_mean: number;
  et0_fao_evapotranspiration: number;
}

export interface BackendWeatherResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    temperature: number;
    humidity: number;
    wind_speed: number;
    precipitation: number;
  };
  daily: BackendWeatherDay[];
}

export interface BackendRainfallData {
  date: string;
  precipitation: number;
}

export interface BackendTopography {
  elevation: number;
  slope: number;
  aspect: number;
  drainageClass: string;
  floodRisk: string;
}

export interface BackendNDVI {
  date: string;
  ndvi_mean: number;
  ndvi_min: number;
  ndvi_max: number;
  cloud_coverage: number;
}

export interface FieldDataFromBackend {
  fieldId: string;
  timestamp: Date;
  weather: BackendWeatherResponse;
  rainfall: BackendRainfallData[];
  topography: BackendTopography;
  ndvi: BackendNDVI[];
}

class BackendWeatherService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL || 'http://192.168.10.43:8000';
  }

  /**
   * Définir le token JWT pour l'authentification
   */
  setToken(token: string) {
    this.token = token;
  }

  /**
   * Headers avec authentification
   */
  private getHeaders() {
    if (!this.token) {
      throw new Error('Token non défini. Appelez setToken() d\'abord.');
    }
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Récupérer les prévisions météo 7 jours (Open-Meteo)
   */
  async getWeatherForecast(fieldId: string): Promise<BackendWeatherResponse> {
    try {
      console.log(`🌤️ Récupération météo pour parcelle ${fieldId}...`);
      const response = await axios.get<BackendWeatherResponse>(
        `${this.baseUrl}/api/weather/weather/${fieldId}`,
        { headers: this.getHeaders() }
      );
      console.log('✅ Météo récupérée avec succès');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération météo:', error);
      throw new Error('Impossible de récupérer les données météo');
    }
  }

  /**
   * Récupérer l'historique des pluies (NASA POWER)
   */
  async getRainfall(fieldId: string, days: number = 30): Promise<BackendRainfallData[]> {
    try {
      console.log(`🌧️ Récupération pluies (${days} jours) pour parcelle ${fieldId}...`);
      const response = await axios.get<BackendRainfallData[]>(
        `${this.baseUrl}/api/weather/rainfall/${fieldId}`,
        {
          headers: this.getHeaders(),
          params: { days },
        }
      );
      
      // Filtrer les valeurs -999 (pas de données)
      const validData = response.data.filter(item => item.precipitation > -900);
      console.log(`✅ ${validData.length} jours de pluie récupérés`);
      return validData;
    } catch (error) {
      console.error('❌ Erreur récupération pluies:', error);
      throw new Error('Impossible de récupérer les données de pluie');
    }
  }

  /**
   * Récupérer les données topographiques (SRTM)
   */
  async getTopography(fieldId: string): Promise<BackendTopography> {
    try {
      console.log(`⛰️ Récupération topographie pour parcelle ${fieldId}...`);
      const response = await axios.get<BackendTopography>(
        `${this.baseUrl}/api/weather/topography/${fieldId}`,
        { headers: this.getHeaders() }
      );
      console.log('✅ Topographie récupérée avec succès');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération topographie:', error);
      throw new Error('Impossible de récupérer les données topographiques');
    }
  }

  /**
   * Récupérer les données NDVI (Google Earth Engine / Simulées)
   */
  async getNDVI(fieldId: string): Promise<BackendNDVI[]> {
    try {
      console.log(`🛰️ Récupération NDVI pour parcelle ${fieldId}...`);
      const response = await axios.get<BackendNDVI[]>(
        `${this.baseUrl}/api/weather/ndvi/${fieldId}`,
        { headers: this.getHeaders() }
      );
      console.log(`✅ ${response.data.length} mesures NDVI récupérées`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération NDVI:', error);
      throw new Error('Impossible de récupérer les données NDVI');
    }
  }

  /**
   * Récupérer toutes les données d'une parcelle en une fois
   */
  async getAllFieldData(fieldId: string): Promise<FieldDataFromBackend> {
    try {
      console.log(`📊 Récupération complète des données pour parcelle ${fieldId}...`);
      
      const [weather, rainfall, topography, ndvi] = await Promise.all([
        this.getWeatherForecast(fieldId),
        this.getRainfall(fieldId, 30),
        this.getTopography(fieldId),
        this.getNDVI(fieldId),
      ]);

      console.log('✅ Toutes les données récupérées avec succès');

      return {
        fieldId,
        timestamp: new Date(),
        weather,
        rainfall,
        topography,
        ndvi,
      };
    } catch (error) {
      console.error('❌ Erreur récupération données complètes:', error);
      throw error;
    }
  }

  /**
   * Calculer le besoin en irrigation
   */
  calculateIrrigationNeed(
    weather: BackendWeatherResponse,
    rainfallData: BackendRainfallData[]
  ): {
    totalET0: number;
    totalRain: number;
    irrigationNeeded: number;
    dailyAverage: number;
  } {
    // ET0 des 7 prochains jours
    const totalET0 = weather.daily.reduce(
      (sum, day) => sum + day.et0_fao_evapotranspiration,
      0
    );

    // Pluie des 7 derniers jours
    const recentRainfall = rainfallData.slice(-7);
    const totalRain = recentRainfall.reduce((sum, day) => sum + day.precipitation, 0);

    // Besoin en irrigation = ET0 - Pluie
    const irrigationNeeded = Math.max(0, totalET0 - totalRain);
    const dailyAverage = irrigationNeeded / 7;

    return {
      totalET0: Math.round(totalET0 * 10) / 10,
      totalRain: Math.round(totalRain * 10) / 10,
      irrigationNeeded: Math.round(irrigationNeeded * 10) / 10,
      dailyAverage: Math.round(dailyAverage * 10) / 10,
    };
  }

  /**
   * Analyser la santé de la végétation à partir du NDVI
   */
  analyzeVegetationHealth(ndviData: BackendNDVI[]): {
    status: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
    trend: 'improving' | 'stable' | 'declining';
    currentNDVI: number;
    message: string;
  } {
    if (ndviData.length === 0) {
      return {
        status: 'critical',
        trend: 'stable',
        currentNDVI: 0,
        message: 'Aucune donnée NDVI disponible',
      };
    }

    const latest = ndviData[ndviData.length - 1];
    const currentNDVI = latest.ndvi_mean;

    // Déterminer le statut
    let status: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
    if (currentNDVI > 0.8) status = 'excellent';
    else if (currentNDVI > 0.6) status = 'good';
    else if (currentNDVI > 0.4) status = 'moderate';
    else if (currentNDVI > 0.2) status = 'poor';
    else status = 'critical';

    // Déterminer la tendance
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (ndviData.length >= 2) {
      const previous = ndviData[ndviData.length - 2];
      const change = currentNDVI - previous.ndvi_mean;
      if (change > 0.05) trend = 'improving';
      else if (change < -0.05) trend = 'declining';
    }

    const messages = {
      excellent: 'Végétation en excellente santé',
      good: 'Végétation en bonne santé',
      moderate: 'Végétation modérée, surveillance recommandée',
      poor: 'Végétation faible, action nécessaire',
      critical: 'Végétation critique, intervention urgente',
    };

    return {
      status,
      trend,
      currentNDVI: Math.round(currentNDVI * 100) / 100,
      message: messages[status],
    };
  }

  /**
   * Générer des recommandations basées sur toutes les données
   */
  generateRecommendations(data: FieldDataFromBackend): string[] {
    const recommendations: string[] = [];
    const { weather, rainfall, topography, ndvi } = data;

    // Recommandations météo
    const avgTemp = weather.daily.reduce((sum, d) => sum + d.temperature_mean, 0) / weather.daily.length;
    if (avgTemp > 32) {
      recommendations.push('⚠️ Températures élevées: augmenter fréquence d\'irrigation');
    }

    const rainExpected = weather.daily.some(d => d.precipitation_probability_max > 50);
    if (rainExpected) {
      recommendations.push('🌧️ Pluie prévue: ajuster l\'irrigation en conséquence');
    }

    // Recommandations irrigation
    const irrigation = this.calculateIrrigationNeed(weather, rainfall);
    if (irrigation.irrigationNeeded > 20) {
      recommendations.push(`💧 Besoin élevé en irrigation: ${irrigation.irrigationNeeded}mm nécessaires`);
    } else if (irrigation.irrigationNeeded > 10) {
      recommendations.push(`💧 Irrigation modérée recommandée: ${irrigation.irrigationNeeded}mm`);
    }

    // Recommandations topographie
    if (topography.drainageClass === 'poor' || topography.drainageClass === 'very-poor') {
      recommendations.push('⚠️ Drainage faible: surveiller stagnation d\'eau');
    }
    if (topography.floodRisk === 'high') {
      recommendations.push('🚨 Risque d\'inondation élevé: prendre précautions');
    }

    // Recommandations NDVI
    const vegHealth = this.analyzeVegetationHealth(ndvi);
    if (vegHealth.status === 'poor' || vegHealth.status === 'critical') {
      recommendations.push(`🌱 ${vegHealth.message}`);
    }
    if (vegHealth.trend === 'declining') {
      recommendations.push('📉 Santé végétation en baisse: vérifier stress hydrique/nutritif');
    }

    return recommendations;
  }
}

export const backendWeatherService = new BackendWeatherService();
