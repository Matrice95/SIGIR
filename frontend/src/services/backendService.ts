/**
 * Service Backend Centralisé
 * Gère toutes les communications avec le backend SIGIR
 */

import api from './api';

export interface WeatherData {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    precipitation: number;
  };
  daily: Array<{
    date: string;
    temperature_max: number;
    temperature_min: number;
    temperature_mean: number;
    precipitation_sum: number;
    precipitation_probability_max: number;
    wind_speed_max: number;
    relative_humidity_mean: number;
    et0_fao_evapotranspiration: number;
  }>;
}

export interface RainfallData {
  date: string;
  precipitation: number;
}

export interface TopographyData {
  elevation: number;
  slope: number;
  aspect: number;
  drainageClass: string;
  floodRisk: string;
}

export interface NDVIData {
  date: string;
  ndvi_mean: number;
  ndvi_min: number;
  ndvi_max: number;
  cloud_coverage: number;
}

export interface SMIData {
  smi: number;
  smi_class: string;
  swdi: number;
  swdi_class: string;
  components: {
    ndvi_contribution: number;
    ndwi_contribution: number;
    rainfall_contribution: number;
    temperature_contribution: number;
  };
  confidence: number;
  flood_risk: {
    risk_level: string;
    risk_score: number;
    warnings: string[];
    days_until_saturation: number | null;
  };
  recommendation: {
    action: string;
    priority: string;
    volume_mm: number;
    reason: string;
    details: string[];
    next_actions: string[];
    next_check_hours: number;
    confidence: number;
  };
  field_info: {
    phenology_stage: string;
    soil_type: string;
    elevation: number;
    rainfall_7d: number;
    rainfall_forecast_7d: number;
    temperature_avg: number;
    ndvi: number;
    ndwi: number;
  };
  timestamp: string;
}

export interface ETPData {
  date: string;
  et0: number;
  temperature_mean: number;
  solar_radiation: number;
  wind_speed: number;
  relative_humidity: number;
}

class BackendService {
  /**
   * Récupérer les prévisions météo (Open-Meteo)
   */
  async getWeatherForecast(fieldId: string): Promise<WeatherData> {
    try {
      const response = await api.get(`/api/weather/weather/${fieldId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching weather:', error);
      throw error;
    }
  }

  /**
   * Récupérer les données pluviométriques (NASA POWER)
   */
  async getRainfall(fieldId: string, days: number = 30): Promise<RainfallData[]> {
    try {
      const response = await api.get(`/api/weather/rainfall/${fieldId}?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching rainfall:', error);
      throw error;
    }
  }

  /**
   * Récupérer la topographie (SRTM)
   */
  async getTopography(fieldId: string): Promise<TopographyData> {
    try {
      const response = await api.get(`/api/weather/topography/${fieldId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching topography:', error);
      throw error;
    }
  }

  /**
   * Récupérer le NDVI (Sentinel-2 via GEE)
   */
  async getNDVI(fieldId: string): Promise<NDVIData[]> {
    try {
      const response = await api.get(`/api/weather/ndvi/${fieldId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching NDVI:', error);
      throw error;
    }
  }

  /**
   * Récupérer le SMI complet (Soil Moisture Index)
   */
  async getSMI(fieldId: string): Promise<SMIData> {
    try {
      const response = await api.get(`/api/weather/smi/${fieldId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching SMI:', error);
      throw error;
    }
  }

  /**
   * Récupérer l'évapotranspiration (Penman-Monteith)
   */
  async getETP(fieldId: string): Promise<{ daily: ETPData[]; average_et0: number }> {
    try {
      const response = await api.get(`/api/etp/${fieldId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching ETP:', error);
      throw error;
    }
  }

  /**
   * Récupérer toutes les données en parallèle
   */
  async getAllFieldData(fieldId: string): Promise<{
    weather: WeatherData | null;
    rainfall: RainfallData[] | null;
    topography: TopographyData | null;
    ndvi: NDVIData[] | null;
    smi: SMIData | null;
    etp: { daily: ETPData[]; average_et0: number } | null;
  }> {
    console.log('🚀 Démarrage chargement données pour parcelle:', fieldId);
    
    const results = await Promise.allSettled([
      this.getWeatherForecast(fieldId),
      this.getRainfall(fieldId, 30),
      this.getTopography(fieldId),
      this.getNDVI(fieldId),
      this.getSMI(fieldId),
      this.getETP(fieldId),
    ]);

    // Log des résultats
    const statusLabels = ['Weather', 'Rainfall', 'Topography', 'NDVI', 'SMI', 'ETP'];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`✅ ${statusLabels[index]}: OK`);
      } else {
        console.error(`❌ ${statusLabels[index]}: ${result.reason?.message || 'Erreur'}`);
      }
    });

    return {
      weather: results[0].status === 'fulfilled' ? results[0].value : null,
      rainfall: results[1].status === 'fulfilled' ? results[1].value : null,
      topography: results[2].status === 'fulfilled' ? results[2].value : null,
      ndvi: results[3].status === 'fulfilled' ? results[3].value : null,
      smi: results[4].status === 'fulfilled' ? results[4].value : null,
      etp: results[5].status === 'fulfilled' ? results[5].value : null,
    };
  }

  /**
   * Calculer le besoin en irrigation
   */
  calculateIrrigationNeed(
    et0: number,
    rainfall: number,
    smi: number
  ): {
    need: number;
    status: 'critical' | 'high' | 'moderate' | 'low' | 'none';
    recommendation: string;
  } {
    // Besoin net = ET0 - Pluie
    const netNeed = Math.max(0, et0 - rainfall);

    // Ajuster selon SMI
    let adjustedNeed = netNeed;
    let status: 'critical' | 'high' | 'moderate' | 'low' | 'none' = 'none';
    let recommendation = '';

    if (smi < 0.2) {
      // Sol très sec
      adjustedNeed = netNeed * 1.5;
      status = 'critical';
      recommendation = 'Irrigation immédiate requise - Sol très sec';
    } else if (smi < 0.4) {
      // Sol sec
      adjustedNeed = netNeed * 1.2;
      status = 'high';
      recommendation = 'Irrigation recommandée dans les 48h';
    } else if (smi < 0.6) {
      // Normal
      adjustedNeed = netNeed;
      status = 'moderate';
      recommendation = 'Surveiller l\'évolution';
    } else if (smi < 0.8) {
      // Humide
      adjustedNeed = netNeed * 0.5;
      status = 'low';
      recommendation = 'Pas d\'irrigation nécessaire';
    } else {
      // Très humide
      adjustedNeed = 0;
      status = 'none';
      recommendation = 'Risque de saturation - NE PAS irriguer';
    }

    return {
      need: Math.round(adjustedNeed * 10) / 10,
      status,
      recommendation,
    };
  }

  /**
   * Analyser la santé de la végétation
   */
  analyzeVegetationHealth(ndvi: number): {
    status: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
    color: string;
    message: string;
  } {
    if (ndvi >= 0.7) {
      return {
        status: 'excellent',
        color: '#10b981',
        message: 'Végétation très vigoureuse',
      };
    } else if (ndvi >= 0.5) {
      return {
        status: 'good',
        color: '#84cc16',
        message: 'Végétation en bonne santé',
      };
    } else if (ndvi >= 0.3) {
      return {
        status: 'moderate',
        color: '#f59e0b',
        message: 'Végétation modérée',
      };
    } else if (ndvi >= 0.15) {
      return {
        status: 'poor',
        color: '#ef4444',
        message: 'Stress végétatif détecté',
      };
    } else {
      return {
        status: 'critical',
        color: '#dc2626',
        message: 'Végétation en détresse',
      };
    }
  }

  /**
   * Formater les recommandations SMI
   */
  formatSMIRecommendations(smi: SMIData): string[] {
    const recommendations: string[] = [];

    // Recommandation principale
    recommendations.push(smi.recommendation.reason);

    // Détails
    smi.recommendation.details.forEach(detail => {
      recommendations.push(detail);
    });

    // Avertissements inondation
    if (smi.flood_risk.warnings.length > 0) {
      recommendations.push('⚠️ Alertes inondation:');
      smi.flood_risk.warnings.forEach(warning => {
        recommendations.push(`  • ${warning}`);
      });
    }

    return recommendations;
  }
}

export const backendService = new BackendService();
export default backendService;
