/**
 * Service Open-Meteo API
 * Météo 7 jours gratuite - température, pluie, humidité, vent
 * Documentation: https://open-meteo.com/en/docs
 */

import axios from 'axios';

const OPEN_METEO_API = 'https://api.open-meteo.com/v1/forecast';

export interface WeatherForecast {
  date: string;
  temperature_max: number; // °C
  temperature_min: number; // °C
  temperature_mean: number; // °C
  precipitation_sum: number; // mm
  precipitation_probability_max: number; // %
  wind_speed_max: number; // km/h
  relative_humidity_mean: number; // %
  et0_fao_evapotranspiration: number; // mm (calculé par Open-Meteo)
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    temperature: number;
    humidity: number;
    wind_speed: number;
    precipitation: number;
  };
  daily: WeatherForecast[];
}

class OpenMeteoService {
  /**
   * Récupérer les prévisions météo 7 jours
   */
  async getForecast(latitude: number, longitude: number): Promise<WeatherData> {
    try {
      const response = await axios.get(OPEN_METEO_API, {
        params: {
          latitude,
          longitude,
          daily: [
            'temperature_2m_max',
            'temperature_2m_min',
            'temperature_2m_mean',
            'precipitation_sum',
            'precipitation_probability_max',
            'wind_speed_10m_max',
            'relative_humidity_2m_mean',
            'et0_fao_evapotranspiration', // ET0 calculé par Open-Meteo
          ].join(','),
          current: [
            'temperature_2m',
            'relative_humidity_2m',
            'wind_speed_10m',
            'precipitation',
          ].join(','),
          timezone: 'Africa/Abidjan',
          forecast_days: 7,
        },
      });

      const data = response.data;

      // Formater les données journalières
      const daily: WeatherForecast[] = [];
      for (let i = 0; i < data.daily.time.length; i++) {
        daily.push({
          date: data.daily.time[i],
          temperature_max: data.daily.temperature_2m_max[i],
          temperature_min: data.daily.temperature_2m_min[i],
          temperature_mean: data.daily.temperature_2m_mean[i],
          precipitation_sum: data.daily.precipitation_sum[i],
          precipitation_probability_max: data.daily.precipitation_probability_max[i],
          wind_speed_max: data.daily.wind_speed_10m_max[i],
          relative_humidity_mean: data.daily.relative_humidity_2m_mean[i],
          et0_fao_evapotranspiration: data.daily.et0_fao_evapotranspiration[i],
        });
      }

      return {
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
        current: {
          temperature: data.current.temperature_2m,
          humidity: data.current.relative_humidity_2m,
          wind_speed: data.current.wind_speed_10m,
          precipitation: data.current.precipitation,
        },
        daily,
      };
    } catch (error) {
      console.error('Erreur Open-Meteo:', error);
      throw new Error('Impossible de récupérer les données météo');
    }
  }

  /**
   * Récupérer les prévisions pour plusieurs parcelles
   */
  async getForecastBatch(
    locations: Array<{ latitude: number; longitude: number; fieldId: string }>
  ): Promise<Map<string, WeatherData>> {
    const results = new Map<string, WeatherData>();

    await Promise.all(
      locations.map(async (location) => {
        try {
          const data = await this.getForecast(location.latitude, location.longitude);
          results.set(location.fieldId, data);
        } catch (error) {
          console.error(`Erreur pour parcelle ${location.fieldId}:`, error);
        }
      })
    );

    return results;
  }

  /**
   * Calculer le besoin en irrigation basé sur ET0 et pluie prévue
   */
  calculateIrrigationNeed(forecast: WeatherForecast[], cropCoefficient: number = 1.05): {
    totalET0: number;
    totalRain: number;
    irrigationNeeded: number;
    nextIrrigationDate: string | null;
  } {
    let totalET0 = 0;
    let totalRain = 0;
    let nextIrrigationDate: string | null = null;

    forecast.forEach((day) => {
      const etc = day.et0_fao_evapotranspiration * cropCoefficient; // ETc = ET0 * Kc
      totalET0 += etc;
      totalRain += day.precipitation_sum;

      // Si déficit > 15mm et pas encore trouvé de date
      const deficit = etc - day.precipitation_sum;
      if (deficit > 15 && !nextIrrigationDate) {
        nextIrrigationDate = day.date;
      }
    });

    const irrigationNeeded = Math.max(0, totalET0 - totalRain);

    return {
      totalET0: Math.round(totalET0 * 10) / 10,
      totalRain: Math.round(totalRain * 10) / 10,
      irrigationNeeded: Math.round(irrigationNeeded * 10) / 10,
      nextIrrigationDate,
    };
  }

  /**
   * Obtenir les recommandations basées sur la météo
   */
  getWeatherRecommendations(current: WeatherData['current'], daily: WeatherForecast[]): string[] {
    const recommendations: string[] = [];

    // Température actuelle
    if (current.temperature > 35) {
      recommendations.push('⚠️ Température élevée - Augmenter la fréquence d\'irrigation');
    } else if (current.temperature < 20) {
      recommendations.push('🌡️ Température basse - Surveiller la croissance');
    }

    // Pluie prévue
    const rainNext3Days = daily.slice(0, 3).reduce((sum, d) => sum + d.precipitation_sum, 0);
    if (rainNext3Days > 50) {
      recommendations.push('🌧️ Fortes pluies prévues - Réduire l\'irrigation');
    } else if (rainNext3Days < 5) {
      recommendations.push('☀️ Peu de pluie prévue - Planifier l\'irrigation');
    }

    // Humidité
    if (current.humidity > 85) {
      recommendations.push('💧 Humidité élevée - Surveiller les maladies fongiques');
    } else if (current.humidity < 50) {
      recommendations.push('🏜️ Air sec - Augmenter l\'irrigation');
    }

    // Vent
    if (current.wind_speed > 30) {
      recommendations.push('💨 Vent fort - Reporter les traitements phytosanitaires');
    }

    return recommendations;
  }
}

export const openMeteoService = new OpenMeteoService();
export default openMeteoService;
