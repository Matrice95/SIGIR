/**
 * Service SRTM (Shuttle Radar Topography Mission)
 * Données d'élévation 30m pour calcul de pente et drainage
 * Documentation: https://www2.jpl.nasa.gov/srtm/
 */

import axios from 'axios';

const OPEN_ELEVATION_API = 'https://api.open-elevation.com/api/v1/lookup';
const OPEN_TOPO_API = 'https://portal.opentopography.org/API/globaldem';

export interface ElevationData {
  latitude: number;
  longitude: number;
  elevation: number; // mètres
}

export interface TopographyData {
  elevation: number; // mètres
  slope: number; // degrés
  aspect: number; // degrés (0-360, 0=Nord)
  drainageClass: 'excellent' | 'good' | 'moderate' | 'poor' | 'very-poor';
  floodRisk: 'low' | 'medium' | 'high';
}

class SrtmService {
  /**
   * Récupérer l'élévation d'un point
   */
  async getElevation(latitude: number, longitude: number): Promise<number> {
    try {
      const response = await axios.post(OPEN_ELEVATION_API, {
        locations: [{ latitude, longitude }],
      });

      const elevation = response.data.results[0]?.elevation || 0;
      return Math.round(elevation);
    } catch (error) {
      console.error('Erreur SRTM elevation:', error);
      // Fallback: estimation basée sur la région
      return this.estimateElevation(latitude, longitude);
    }
  }

  /**
   * Récupérer les élévations de plusieurs points (pour calculer la pente)
   */
  async getElevationBatch(
    points: Array<{ latitude: number; longitude: number }>
  ): Promise<ElevationData[]> {
    try {
      const response = await axios.post(OPEN_ELEVATION_API, {
        locations: points,
      });

      return response.data.results.map((result: any, index: number) => ({
        latitude: points[index].latitude,
        longitude: points[index].longitude,
        elevation: Math.round(result.elevation),
      }));
    } catch (error) {
      console.error('Erreur SRTM batch:', error);
      return points.map((point) => ({
        ...point,
        elevation: this.estimateElevation(point.latitude, point.longitude),
      }));
    }
  }

  /**
   * Calculer la topographie complète d'une parcelle
   */
  async getTopography(
    centerLat: number,
    centerLon: number,
    radiusMeters: number = 50
  ): Promise<TopographyData> {
    try {
      // Créer une grille 3x3 autour du centre
      const delta = radiusMeters / 111320; // Conversion mètres -> degrés (approximation)

      const points = [
        { latitude: centerLat, longitude: centerLon }, // Centre
        { latitude: centerLat + delta, longitude: centerLon }, // Nord
        { latitude: centerLat - delta, longitude: centerLon }, // Sud
        { latitude: centerLat, longitude: centerLon + delta }, // Est
        { latitude: centerLat, longitude: centerLon - delta }, // Ouest
        { latitude: centerLat + delta, longitude: centerLon + delta }, // NE
        { latitude: centerLat + delta, longitude: centerLon - delta }, // NW
        { latitude: centerLat - delta, longitude: centerLon + delta }, // SE
        { latitude: centerLat - delta, longitude: centerLon - delta }, // SW
      ];

      const elevations = await this.getElevationBatch(points);

      // Calcul de la pente
      const slope = this.calculateSlope(elevations, radiusMeters);

      // Calcul de l'aspect (orientation)
      const aspect = this.calculateAspect(elevations);

      // Classification du drainage
      const drainageClass = this.classifyDrainage(slope, elevations[0].elevation);

      // Risque d'inondation
      const floodRisk = this.assessFloodRisk(elevations[0].elevation, slope);

      return {
        elevation: elevations[0].elevation,
        slope,
        aspect,
        drainageClass,
        floodRisk,
      };
    } catch (error) {
      console.error('Erreur topographie:', error);
      throw new Error('Impossible de récupérer les données topographiques');
    }
  }

  /**
   * Calculer la pente moyenne (en degrés)
   */
  private calculateSlope(elevations: ElevationData[], distance: number): number {
    const center = elevations[0].elevation;

    // Calcul des gradients
    const gradients = [
      Math.abs(elevations[1].elevation - center), // Nord-Sud
      Math.abs(elevations[3].elevation - center), // Est-Ouest
      Math.abs(elevations[5].elevation - center), // Diagonale NE-SW
      Math.abs(elevations[7].elevation - center), // Diagonale NW-SE
    ];

    const avgGradient = gradients.reduce((sum, g) => sum + g, 0) / gradients.length;
    const slopeRadians = Math.atan(avgGradient / distance);
    const slopeDegrees = (slopeRadians * 180) / Math.PI;

    return Math.round(slopeDegrees * 10) / 10;
  }

  /**
   * Calculer l'aspect (orientation de la pente)
   */
  private calculateAspect(elevations: ElevationData[]): number {
    const center = elevations[0].elevation;
    const north = elevations[1].elevation;
    const south = elevations[2].elevation;
    const east = elevations[3].elevation;
    const west = elevations[4].elevation;

    // Gradients
    const dz_dx = (east - west) / 2;
    const dz_dy = (north - south) / 2;

    // Aspect en radians
    let aspect = Math.atan2(dz_dy, -dz_dx);

    // Conversion en degrés (0-360, 0=Nord)
    aspect = (aspect * 180) / Math.PI;
    if (aspect < 0) aspect += 360;

    return Math.round(aspect);
  }

  /**
   * Classifier le drainage basé sur la pente et l'élévation
   */
  private classifyDrainage(slope: number, elevation: number): TopographyData['drainageClass'] {
    // Riziculture nécessite un bon drainage
    if (slope > 8) return 'excellent'; // Forte pente, drainage rapide
    if (slope > 5) return 'good';
    if (slope > 2) return 'moderate';
    if (slope > 0.5) return 'poor';
    return 'very-poor'; // Risque de stagnation
  }

  /**
   * Évaluer le risque d'inondation
   */
  private assessFloodRisk(elevation: number, slope: number): TopographyData['floodRisk'] {
    // Côte d'Ivoire: zones basses proches des rivières
    if (elevation < 100 && slope < 1) return 'high';
    if (elevation < 200 && slope < 2) return 'medium';
    return 'low';
  }

  /**
   * Estimer l'élévation basée sur la région (fallback)
   */
  private estimateElevation(latitude: number, longitude: number): number {
    // Approximations pour Côte d'Ivoire
    // Bouaké: ~376m, Korhogo: ~381m, Man: ~340m, Gagnoa: ~213m

    const regions = [
      { lat: 7.6944, lon: -5.0328, elevation: 376 }, // Bouaké
      { lat: 9.458, lon: -5.6297, elevation: 381 }, // Korhogo
      { lat: 7.4043, lon: -7.5544, elevation: 340 }, // Man
      { lat: 6.1319, lon: -5.9503, elevation: 213 }, // Gagnoa
    ];

    // Trouver la région la plus proche
    let closest = regions[0];
    let minDistance = this.calculateDistance(
      latitude,
      longitude,
      closest.lat,
      closest.lon
    );

    regions.forEach((region) => {
      const distance = this.calculateDistance(latitude, longitude, region.lat, region.lon);
      if (distance < minDistance) {
        minDistance = distance;
        closest = region;
      }
    });

    return closest.elevation;
  }

  /**
   * Calculer la distance entre deux points (Haversine)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Recommandations basées sur la topographie
   */
  getTopographyRecommendations(topo: TopographyData): string[] {
    const recommendations: string[] = [];

    // Pente
    if (topo.slope > 5) {
      recommendations.push('⚠️ Pente élevée - Prévoir terrasses pour éviter l\'érosion');
    } else if (topo.slope < 0.5) {
      recommendations.push('💧 Terrain plat - Améliorer le drainage pour éviter stagnation');
    }

    // Drainage
    if (topo.drainageClass === 'very-poor' || topo.drainageClass === 'poor') {
      recommendations.push('🚰 Drainage insuffisant - Creuser des canaux de drainage');
    }

    // Inondation
    if (topo.floodRisk === 'high') {
      recommendations.push('🌊 Risque d\'inondation élevé - Construire des digues');
    } else if (topo.floodRisk === 'medium') {
      recommendations.push('⚠️ Risque d\'inondation modéré - Surveiller niveau d\'eau');
    }

    // Altitude
    if (topo.elevation > 500) {
      recommendations.push('🏔️ Altitude élevée - Adapter les variétés de riz');
    }

    return recommendations;
  }
}

export const srtmService = new SrtmService();
export default srtmService;
