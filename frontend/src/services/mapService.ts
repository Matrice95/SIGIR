/**
 * Service de gestion des cartes
 * Intégration Mapbox GL + OpenStreetMap avec fallback automatique
 */

import { Platform } from 'react-native';
import { MAPBOX_ACCESS_TOKEN } from '@env';

export interface MapConfig {
  provider: 'mapbox' | 'osm';
  styleUrl: string;
  offlineSupport: boolean;
  maxZoom: number;
  minZoom: number;
}

export interface TileLayer {
  id: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
  type: 'satellite' | 'terrain' | 'street' | 'ndvi';
}

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface MapPolygon {
  id: string;
  coordinates: Array<{ latitude: number; longitude: number }>;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  title?: string;
}

/**
 * Configuration Mapbox GL
 */
export const MAPBOX_CONFIG: MapConfig = {
  provider: 'mapbox',
  styleUrl: 'mapbox://styles/mapbox/satellite-streets-v12',
  offlineSupport: true,
  maxZoom: 20,
  minZoom: 2,
};

/**
 * Configuration OpenStreetMap (Fallback)
 */
export const OSM_CONFIG: MapConfig = {
  provider: 'osm',
  styleUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  offlineSupport: true,
  maxZoom: 19,
  minZoom: 2,
};

/**
 * Styles de cartes Mapbox disponibles
 */
export const MAPBOX_STYLES = {
  SATELLITE: 'mapbox://styles/mapbox/satellite-v9',
  SATELLITE_STREETS: 'mapbox://styles/mapbox/satellite-streets-v12',
  STREETS: 'mapbox://styles/mapbox/streets-v12',
  OUTDOORS: 'mapbox://styles/mapbox/outdoors-v12',
  LIGHT: 'mapbox://styles/mapbox/light-v11',
  DARK: 'mapbox://styles/mapbox/dark-v11',
};

/**
 * Couches de tuiles OpenStreetMap
 */
export const OSM_TILE_LAYERS: TileLayer[] = [
  {
    id: 'osm-standard',
    name: 'Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
    type: 'street',
  },
  {
    id: 'osm-satellite',
    name: 'Satellite (Esri)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri',
    maxZoom: 19,
    type: 'satellite',
  },
  {
    id: 'osm-terrain',
    name: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap',
    maxZoom: 17,
    type: 'terrain',
  },
];

/**
 * Couches satellite Sentinel-2 (via Mapbox)
 */
export const SENTINEL_LAYERS = {
  TRUE_COLOR: 'mapbox://styles/mapbox/satellite-v9',
  NDVI: 'custom-ndvi-layer', // À implémenter avec Mapbox Tilesets
  NDWI: 'custom-ndwi-layer', // Indice d'eau
};

/**
 * Coordonnées par défaut (Côte d'Ivoire - Abidjan)
 */
export const DEFAULT_COORDINATES = {
  latitude: 5.3600,
  longitude: -4.0083,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

/**
 * Coordonnées des principales régions rizicoles de Côte d'Ivoire
 */
export const RICE_REGIONS = [
  {
    id: 'bouake',
    name: 'Bouaké',
    latitude: 7.6900,
    longitude: -5.0300,
    description: 'Principale zone de production',
  },
  {
    id: 'korhogo',
    name: 'Korhogo',
    latitude: 9.4580,
    longitude: -5.6297,
    description: 'Nord - Savane',
  },
  {
    id: 'man',
    name: 'Man',
    latitude: 7.4125,
    longitude: -7.5547,
    description: 'Ouest montagneux',
  },
  {
    id: 'gagnoa',
    name: 'Gagnoa',
    latitude: 6.1319,
    longitude: -5.9506,
    description: 'Centre-Ouest',
  },
];

export class MapService {
  private static instance: MapService;
  private currentProvider: 'mapbox' | 'osm' = 'mapbox';
  private mapboxAvailable: boolean = true;

  private constructor() {
    this.checkMapboxAvailability();
  }

  static getInstance(): MapService {
    if (!MapService.instance) {
      MapService.instance = new MapService();
    }
    return MapService.instance;
  }

  /**
   * Vérifier si Mapbox est disponible
   */
  private checkMapboxAvailability(): void {
    if (!MAPBOX_ACCESS_TOKEN || MAPBOX_ACCESS_TOKEN === 'your_mapbox_token_here') {
      console.warn('⚠️ Mapbox token manquant, utilisation de OpenStreetMap');
      this.mapboxAvailable = false;
      this.currentProvider = 'osm';
    } else {
      this.mapboxAvailable = true;
      this.currentProvider = 'mapbox';
    }
  }

  /**
   * Obtenir la configuration actuelle
   */
  getConfig(): MapConfig {
    return this.currentProvider === 'mapbox' ? MAPBOX_CONFIG : OSM_CONFIG;
  }

  /**
   * Obtenir le provider actuel
   */
  getProvider(): 'mapbox' | 'osm' {
    return this.currentProvider;
  }

  /**
   * Vérifier si Mapbox est disponible
   */
  isMapboxAvailable(): boolean {
    return this.mapboxAvailable;
  }

  /**
   * Basculer vers OpenStreetMap (fallback)
   */
  switchToOSM(): void {
    console.log('🔄 Basculement vers OpenStreetMap');
    this.currentProvider = 'osm';
  }

  /**
   * Calculer la région pour afficher plusieurs points
   */
  calculateRegion(points: Array<{ latitude: number; longitude: number }>) {
    if (points.length === 0) {
      return DEFAULT_COORDINATES;
    }

    let minLat = points[0].latitude;
    let maxLat = points[0].latitude;
    let minLng = points[0].longitude;
    let maxLng = points[0].longitude;

    points.forEach(point => {
      minLat = Math.min(minLat, point.latitude);
      maxLat = Math.max(maxLat, point.latitude);
      minLng = Math.min(minLng, point.longitude);
      maxLng = Math.max(maxLng, point.longitude);
    });

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDelta = (maxLat - minLat) * 1.5; // Ajout de marge
    const lngDelta = (maxLng - minLng) * 1.5;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01),
    };
  }

  /**
   * Calculer la superficie d'un polygone (en hectares)
   * Formule de Shoelace + projection sphérique
   */
  calculatePolygonArea(coordinates: Array<{ latitude: number; longitude: number }>): number {
    if (coordinates.length < 3) return 0;

    // Conversion en radians
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371000; // Rayon de la Terre en mètres

    let area = 0;
    const n = coordinates.length;

    for (let i = 0; i < n; i++) {
      const p1 = coordinates[i];
      const p2 = coordinates[(i + 1) % n];

      const lat1 = toRad(p1.latitude);
      const lat2 = toRad(p2.latitude);
      const lng1 = toRad(p1.longitude);
      const lng2 = toRad(p2.longitude);

      area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }

    area = Math.abs((area * R * R) / 2);
    return area / 10000; // Conversion en hectares
  }

  /**
   * Calculer le centroïde d'un polygone
   */
  calculatePolygonCentroid(coordinates: Array<{ latitude: number; longitude: number }>) {
    if (coordinates.length === 0) {
      return DEFAULT_COORDINATES;
    }

    const sum = coordinates.reduce(
      (acc, coord) => ({
        latitude: acc.latitude + coord.latitude,
        longitude: acc.longitude + coord.longitude,
      }),
      { latitude: 0, longitude: 0 }
    );

    return {
      latitude: sum.latitude / coordinates.length,
      longitude: sum.longitude / coordinates.length,
    };
  }

  /**
   * Calculer la distance entre deux points (en mètres)
   * Formule de Haversine
   */
  calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371000; // Rayon de la Terre en mètres

    const dLat = toRad(point2.latitude - point1.latitude);
    const dLon = toRad(point2.longitude - point1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(point1.latitude)) *
        Math.cos(toRad(point2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Vérifier si un point est dans un polygone
   */
  isPointInPolygon(
    point: { latitude: number; longitude: number },
    polygon: Array<{ latitude: number; longitude: number }>
  ): boolean {
    let inside = false;
    const x = point.longitude;
    const y = point.latitude;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].longitude;
      const yi = polygon[i].latitude;
      const xj = polygon[j].longitude;
      const yj = polygon[j].latitude;

      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
  }

  /**
   * Obtenir l'URL des tuiles pour le mode offline
   */
  getOfflineTileURL(provider: 'mapbox' | 'osm', z: number, x: number, y: number): string {
    if (provider === 'mapbox') {
      return `https://api.mapbox.com/v4/mapbox.satellite/${z}/${x}/${y}.png?access_token=${MAPBOX_ACCESS_TOKEN}`;
    } else {
      return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
    }
  }

  /**
   * Formater les coordonnées pour l'affichage
   */
  formatCoordinates(lat: number, lng: number): string {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'O';
    return `${Math.abs(lat).toFixed(6)}° ${latDir}, ${Math.abs(lng).toFixed(6)}° ${lngDir}`;
  }
}

export const mapService = MapService.getInstance();
