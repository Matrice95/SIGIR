/**
 * Service Google Earth Engine
 * NDVI (Sentinel-2) pour surveillance de la végétation
 * Documentation: https://developers.google.com/earth-engine
 * 
 * NOTE: Nécessite authentification GEE
 * Alternative: Utiliser Sentinel Hub ou Planet Labs
 */

import axios from 'axios';
import { GEE_API_KEY } from '@env';

// Types
export interface NDVIData {
  date: string;
  ndvi_mean: number; // -1 à 1
  ndvi_min: number;
  ndvi_max: number;
  ndvi_std: number;
  cloud_coverage: number; // %
  image_id: string;
}

export interface VegetationHealth {
  status: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
  ndvi: number;
  trend: 'improving' | 'stable' | 'declining';
  recommendation: string[];
}

class GoogleEarthEngineService {
  private readonly baseUrl = 'https://earthengine.googleapis.com/v1';
  private readonly sentinelCollection = 'COPERNICUS/S2_SR_HARMONIZED';

  /**
   * Vérifier si GEE est disponible
   */
  isAvailable(): boolean {
    return !!GEE_API_KEY;
  }

  /**
   * Récupérer les données NDVI Sentinel-2 pour une parcelle
   */
  async getNDVI(
    latitude: number,
    longitude: number,
    radiusMeters: number = 100,
    startDate: Date,
    endDate: Date = new Date()
  ): Promise<NDVIData[]> {
    if (!this.isAvailable()) {
      console.warn('⚠️ Google Earth Engine non configuré - Utilisation de données simulées');
      return this.getSimulatedNDVI(startDate, endDate);
    }

    try {
      // TODO: Implémenter l'appel à GEE API
      // Pour l'instant, retourner des données simulées
      console.log('🛰️ Récupération NDVI Sentinel-2...');
      return this.getSimulatedNDVI(startDate, endDate);
    } catch (error) {
      console.error('Erreur GEE:', error);
      return this.getSimulatedNDVI(startDate, endDate);
    }
  }

  /**
   * Calculer le NDVI à partir des bandes Red et NIR
   * NDVI = (NIR - Red) / (NIR + Red)
   */
  calculateNDVI(nir: number, red: number): number {
    if (nir + red === 0) return 0;
    return (nir - red) / (nir + red);
  }

  /**
   * Analyser la santé de la végétation basée sur NDVI
   */
  analyzeVegetationHealth(ndviData: NDVIData[]): VegetationHealth {
    if (ndviData.length === 0) {
      return {
        status: 'critical',
        ndvi: 0,
        trend: 'stable',
        recommendation: ['Aucune donnée disponible'],
      };
    }

    // NDVI moyen récent
    const recentNDVI = ndviData[ndviData.length - 1].ndvi_mean;

    // Déterminer le statut
    let status: VegetationHealth['status'];
    if (recentNDVI >= 0.7) status = 'excellent';
    else if (recentNDVI >= 0.5) status = 'good';
    else if (recentNDVI >= 0.3) status = 'moderate';
    else if (recentNDVI >= 0.1) status = 'poor';
    else status = 'critical';

    // Calculer la tendance (sur 3 dernières mesures)
    let trend: VegetationHealth['trend'] = 'stable';
    if (ndviData.length >= 3) {
      const recent = ndviData.slice(-3).map((d) => d.ndvi_mean);
      const slope = (recent[2] - recent[0]) / 2;
      if (slope > 0.05) trend = 'improving';
      else if (slope < -0.05) trend = 'declining';
    }

    // Recommandations
    const recommendation: string[] = [];
    if (status === 'excellent') {
      recommendation.push('✅ Végétation en excellente santé');
      recommendation.push('Continuer les pratiques actuelles');
    } else if (status === 'good') {
      recommendation.push('✅ Végétation en bonne santé');
      recommendation.push('Maintenir irrigation et fertilisation');
    } else if (status === 'moderate') {
      recommendation.push('⚠️ Végétation modérée');
      recommendation.push('Vérifier irrigation et nutriments');
    } else if (status === 'poor') {
      recommendation.push('⚠️ Végétation faible');
      recommendation.push('Augmenter irrigation');
      recommendation.push('Appliquer engrais NPK');
    } else {
      recommendation.push('🚨 Végétation critique');
      recommendation.push('Intervention urgente requise');
      recommendation.push('Vérifier maladies et ravageurs');
    }

    if (trend === 'declining') {
      recommendation.push('📉 Tendance à la baisse - Action rapide nécessaire');
    } else if (trend === 'improving') {
      recommendation.push('📈 Tendance à la hausse - Bon signe');
    }

    return {
      status,
      ndvi: recentNDVI,
      trend,
      recommendation,
    };
  }

  /**
   * Obtenir l'URL de tile Sentinel-2 pour Mapbox
   */
  getSentinel2TileUrl(
    latitude: number,
    longitude: number,
    date: string,
    bands: string = 'TCI' // True Color Image
  ): string | null {
    if (!this.isAvailable()) return null;

    // TODO: Configurer avec GEE pour générer tiles
    return null;
  }

  /**
   * Données NDVI simulées (fallback)
   */
  private getSimulatedNDVI(startDate: Date, endDate: Date): NDVIData[] {
    const data: NDVIData[] = [];
    const current = new Date(startDate);
    let daysSinceStart = 0;

    // Simulation d'un cycle de croissance du riz (120 jours)
    while (current <= endDate) {
      // Tous les 10 jours (fréquence Sentinel-2)
      if (daysSinceStart % 10 === 0) {
        let ndvi_mean = 0.2; // Valeur de base

        // Courbe de croissance
        if (daysSinceStart < 20) {
          // Germination
          ndvi_mean = 0.2 + (daysSinceStart / 20) * 0.2;
        } else if (daysSinceStart < 60) {
          // Tallage + Montaison
          ndvi_mean = 0.4 + ((daysSinceStart - 20) / 40) * 0.3;
        } else if (daysSinceStart < 90) {
          // Floraison + Remplissage
          ndvi_mean = 0.7 + ((daysSinceStart - 60) / 30) * 0.1;
        } else if (daysSinceStart < 120) {
          // Maturation
          ndvi_mean = 0.8 - ((daysSinceStart - 90) / 30) * 0.3;
        } else {
          // Récolte
          ndvi_mean = 0.5 - ((daysSinceStart - 120) / 10) * 0.3;
        }

        // Ajouter du bruit
        const noise = (Math.random() - 0.5) * 0.1;
        ndvi_mean = Math.max(0.1, Math.min(1.0, ndvi_mean + noise));

        data.push({
          date: current.toISOString().split('T')[0],
          ndvi_mean: Math.round(ndvi_mean * 100) / 100,
          ndvi_min: Math.round((ndvi_mean - 0.05) * 100) / 100,
          ndvi_max: Math.round((ndvi_mean + 0.05) * 100) / 100,
          ndvi_std: 0.05,
          cloud_coverage: Math.random() * 20, // 0-20% nuages
          image_id: `SIM_${current.toISOString().split('T')[0]}`,
        });
      }

      current.setDate(current.getDate() + 1);
      daysSinceStart++;
    }

    return data;
  }

  /**
   * Alternative: Utiliser Sentinel Hub (payant mais plus simple)
   * https://www.sentinel-hub.com/
   */
  async getNDVIFromSentinelHub(
    latitude: number,
    longitude: number,
    bbox: number[],
    date: string
  ): Promise<any> {
    // TODO: Implémenter Sentinel Hub API
    console.log('📡 Sentinel Hub non configuré');
    return null;
  }
}

export const geeService = new GoogleEarthEngineService();
export default geeService;
