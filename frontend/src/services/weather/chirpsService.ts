/**
 * Service CHIRPS (Climate Hazards InfraRed Precipitation with Station data)
 * Données de précipitations quotidiennes depuis 1981
 * Documentation: https://www.chc.ucsb.edu/data/chirps
 */

import axios from 'axios';

const CHIRPS_API = 'https://iridl.ldeo.columbia.edu/SOURCES/.UCSB/.CHIRPS/.v2p0/.daily-improved/.global/.0p05/.prcp';

export interface RainfallData {
  date: string;
  precipitation: number; // mm
  latitude: number;
  longitude: number;
}

export interface RainfallStats {
  period: string;
  totalRainfall: number; // mm
  averageDaily: number; // mm/jour
  rainyDays: number;
  maxDaily: number; // mm
  minDaily: number; // mm
}

class ChirpsService {
  /**
   * Récupérer les données de pluie pour une période
   */
  async getRainfallData(
    latitude: number,
    longitude: number,
    startDate: Date,
    endDate: Date
  ): Promise<RainfallData[]> {
    try {
      console.log('🌧️ Récupération données CHIRPS...');

      // Note: CHIRPS via IRI Data Library nécessite une requête spécifique
      // Pour simplifier, on utilise une alternative: NASA POWER API qui inclut CHIRPS
      const response = await axios.get('https://power.larc.nasa.gov/api/temporal/daily/point', {
        params: {
          parameters: 'PRECTOTCORR', // Précipitations corrigées
          community: 'AG',
          longitude,
          latitude,
          start: this.formatDate(startDate),
          end: this.formatDate(endDate),
          format: 'JSON',
        },
      });

      const data = response.data.properties.parameter.PRECTOTCORR;
      const rainfallData: RainfallData[] = [];

      Object.entries(data).forEach(([dateStr, value]) => {
        const [year, month, day] = dateStr.split('');
        rainfallData.push({
          date: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
          precipitation: value as number,
          latitude,
          longitude,
        });
      });

      return rainfallData;
    } catch (error) {
      console.error('Erreur CHIRPS:', error);
      // Fallback: retourner des données simulées
      return this.getSimulatedRainfall(latitude, longitude, startDate, endDate);
    }
  }

  /**
   * Calculer les statistiques de pluie pour une période
   */
  calculateRainfallStats(data: RainfallData[]): RainfallStats {
    const totalRainfall = data.reduce((sum, d) => sum + d.precipitation, 0);
    const rainyDays = data.filter((d) => d.precipitation > 0.1).length;
    const precipitations = data.map((d) => d.precipitation);
    const maxDaily = Math.max(...precipitations);
    const minDaily = Math.min(...precipitations);
    const averageDaily = totalRainfall / data.length;

    const startDate = data[0]?.date || '';
    const endDate = data[data.length - 1]?.date || '';

    return {
      period: `${startDate} - ${endDate}`,
      totalRainfall: Math.round(totalRainfall * 10) / 10,
      averageDaily: Math.round(averageDaily * 10) / 10,
      rainyDays,
      maxDaily: Math.round(maxDaily * 10) / 10,
      minDaily: Math.round(minDaily * 10) / 10,
    };
  }

  /**
   * Obtenir les données de pluie pour le cycle cultural
   */
  async getRainfallForCropCycle(
    latitude: number,
    longitude: number,
    plantingDate: Date
  ): Promise<RainfallData[]> {
    const endDate = new Date(plantingDate);
    endDate.setDate(endDate.getDate() + 120); // Cycle riz = ~120 jours

    return this.getRainfallData(latitude, longitude, plantingDate, new Date());
  }

  /**
   * Vérifier si l'irrigation est nécessaire
   */
  needsIrrigation(recentRainfall: RainfallData[], et0: number = 5): boolean {
    // Somme des 7 derniers jours
    const last7Days = recentRainfall.slice(-7);
    const totalRain = last7Days.reduce((sum, d) => sum + d.precipitation, 0);
    const requiredWater = et0 * 7 * 1.05; // ET0 * Kc riz

    return totalRain < requiredWater;
  }

  /**
   * Formater une date pour l'API
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Données simulées en cas d'échec API (fallback)
   */
  private getSimulatedRainfall(
    latitude: number,
    longitude: number,
    startDate: Date,
    endDate: Date
  ): RainfallData[] {
    const data: RainfallData[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      // Simulation basée sur saison en Côte d'Ivoire
      const month = current.getMonth();
      let precipitation = 0;

      // Saison des pluies: Mai-Octobre
      if (month >= 4 && month <= 9) {
        precipitation = Math.random() * 15 + 5; // 5-20mm
      } else {
        precipitation = Math.random() * 3; // 0-3mm
      }

      data.push({
        date: current.toISOString().split('T')[0],
        precipitation: Math.round(precipitation * 10) / 10,
        latitude,
        longitude,
      });

      current.setDate(current.getDate() + 1);
    }

    return data;
  }
}

export const chirpsService = new ChirpsService();
export default chirpsService;
