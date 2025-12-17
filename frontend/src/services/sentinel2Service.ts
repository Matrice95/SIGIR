/**
 * Service d'intégration Sentinel-2 pour NDVI/NDWI
 * Utilise Google Earth Engine ou Sentinel Hub
 */

import { MAPBOX_ACCESS_TOKEN } from '@env';

// Types
export interface SatelliteImagery {
  date: string;
  cloudCoverage: number;
  ndvi: number[][];
  ndwi: number[][];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface NDVIStats {
  mean: number;
  min: number;
  max: number;
  stdDev: number;
  healthStatus: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
}

/**
 * Service Sentinel-2
 */
class Sentinel2Service {
  private readonly baseUrl = 'https://services.sentinel-hub.com/ogc';
  private readonly geeUrl = 'https://earthengine.googleapis.com';
  
  /**
   * Récupérer les images Sentinel-2 pour une zone
   */
  async getImagery(
    latitude: number,
    longitude: number,
    radiusKm: number = 1,
    startDate?: Date,
    endDate?: Date
  ): Promise<SatelliteImagery | null> {
    try {
      console.log('🛰️ Récupération images Sentinel-2...');
      
      // TODO: Implémenter l'appel à Sentinel Hub ou Google Earth Engine
      // Pour l'instant, retourne null (placeholder)
      
      return null;
    } catch (error) {
      console.error('Erreur récupération imagery:', error);
      return null;
    }
  }

  /**
   * Calculer NDVI à partir des bandes NIR et Red
   * NDVI = (NIR - Red) / (NIR + Red)
   */
  calculateNDVI(nir: number[][], red: number[][]): number[][] {
    const rows = nir.length;
    const cols = nir[0].length;
    const ndvi: number[][] = [];

    for (let i = 0; i < rows; i++) {
      ndvi[i] = [];
      for (let j = 0; j < cols; j++) {
        const nirValue = nir[i][j];
        const redValue = red[i][j];
        const sum = nirValue + redValue;
        
        if (sum === 0) {
          ndvi[i][j] = 0;
        } else {
          ndvi[i][j] = (nirValue - redValue) / sum;
        }
      }
    }

    return ndvi;
  }

  /**
   * Calculer NDWI à partir des bandes Green et NIR
   * NDWI = (Green - NIR) / (Green + NIR)
   */
  calculateNDWI(green: number[][], nir: number[][]): number[][] {
    const rows = green.length;
    const cols = green[0].length;
    const ndwi: number[][] = [];

    for (let i = 0; i < rows; i++) {
      ndwi[i] = [];
      for (let j = 0; j < cols; j++) {
        const greenValue = green[i][j];
        const nirValue = nir[i][j];
        const sum = greenValue + nirValue;
        
        if (sum === 0) {
          ndwi[i][j] = 0;
        } else {
          ndwi[i][j] = (greenValue - nirValue) / sum;
        }
      }
    }

    return ndwi;
  }

  /**
   * Calculer les statistiques NDVI pour une parcelle
   */
  calculateNDVIStats(ndvi: number[][]): NDVIStats {
    const values: number[] = [];
    
    for (let i = 0; i < ndvi.length; i++) {
      for (let j = 0; j < ndvi[i].length; j++) {
        values.push(ndvi[i][j]);
      }
    }

    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Déterminer le statut de santé
    let healthStatus: NDVIStats['healthStatus'];
    if (mean >= 0.7) {
      healthStatus = 'excellent';
    } else if (mean >= 0.5) {
      healthStatus = 'good';
    } else if (mean >= 0.3) {
      healthStatus = 'moderate';
    } else if (mean >= 0.1) {
      healthStatus = 'poor';
    } else {
      healthStatus = 'critical';
    }

    return {
      mean,
      min,
      max,
      stdDev,
      healthStatus,
    };
  }

  /**
   * Obtenir la couleur pour une valeur NDVI
   */
  getNDVIColor(ndvi: number): string {
    if (ndvi >= 0.8) return '#006400'; // Vert foncé
    if (ndvi >= 0.6) return '#228B22'; // Vert forêt
    if (ndvi >= 0.4) return '#90EE90'; // Vert clair
    if (ndvi >= 0.2) return '#FFFF00'; // Jaune
    if (ndvi >= 0.0) return '#FF8C00'; // Orange
    return '#8B4513'; // Brun
  }

  /**
   * Obtenir la couleur pour une valeur NDWI
   */
  getNDWIColor(ndwi: number): string {
    if (ndwi >= 0.5) return '#000080'; // Bleu marine
    if (ndwi >= 0.3) return '#0000FF'; // Bleu
    if (ndwi >= 0.1) return '#87CEEB'; // Bleu ciel
    if (ndwi >= -0.1) return '#90EE90'; // Vert clair
    if (ndwi >= -0.3) return '#FFD700'; // Or
    return '#8B4513'; // Brun
  }

  /**
   * Vérifier si Mapbox est disponible pour les couches satellite
   */
  isMapboxAvailable(): boolean {
    return !!MAPBOX_ACCESS_TOKEN;
  }

  /**
   * Obtenir l'URL de tile Mapbox pour NDVI
   * Utilise Mapbox Satellite avec formule NDVI
   */
  getMapboxNDVITileUrl(z: number, x: number, y: number): string | null {
    if (!this.isMapboxAvailable()) return null;
    
    // TODO: Configurer custom style Mapbox avec NDVI
    // https://docs.mapbox.com/help/tutorials/create-a-custom-style/
    
    return `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.jpg?access_token=${MAPBOX_ACCESS_TOKEN}`;
  }

  /**
   * Obtenir l'URL de tile Sentinel Hub pour NDVI
   */
  getSentinelHubNDVITileUrl(
    latitude: number,
    longitude: number,
    z: number,
    x: number,
    y: number
  ): string | null {
    // TODO: Configurer Sentinel Hub avec instance ID
    // https://www.sentinel-hub.com/
    
    return null;
  }
}

export const sentinel2Service = new Sentinel2Service();
export default sentinel2Service;
