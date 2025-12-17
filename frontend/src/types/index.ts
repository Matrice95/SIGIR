/**
 * Types TypeScript pour l'application SIGIR
 */

import { PHENOLOGICAL_STAGES, OPERATION_TYPES } from './config';

/**
 * Utilisateur
 */
export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'agent' | 'admin';
  organization?: string;
  createdAt: Date;
  lastSyncAt?: Date;
}

/**
 * Parcelle de riz
 */
export interface Field {
  id: string;
  name: string;
  area: number; // hectares
  location: GeoLocation;
  polygon: GeoCoordinate[]; // Contour de la parcelle
  variety: string; // Ex: "WITA 9"
  sowingDate: Date;
  expectedHarvestDate: Date;
  currentStage: keyof typeof PHENOLOGICAL_STAGES;
  healthStatus: HealthStatus;
  isActive: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Géolocalisation
 */
export interface GeoLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
}

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

/**
 * Statut santé parcelle
 */
export type HealthStatus = 'healthy' | 'good' | 'warning' | 'moderate' | 'critical' | 'bad';

/**
 * Opération agricole
 */
export interface Operation {
  id: string;
  fieldId: string;
  type: keyof typeof OPERATION_TYPES;
  date: Date;
  description: string;
  cost?: number;
  photos: Photo[];
  location?: GeoLocation;
  quantity?: number; // L, kg, heures, etc.
  unit?: string;
  isSynced: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Photo
 */
export interface Photo {
  id: string;
  uri: string;
  localUri?: string; // Pour offline
  timestamp: Date;
  location?: GeoLocation;
  isSynced: boolean;
}

/**
 * Données satellitaires NDVI
 */
export interface SatelliteData {
  id: string;
  fieldId: string;
  date: Date;
  ndviAverage: number; // 0-1
  ndviMin: number;
  ndviMax: number;
  ndviStdDev: number;
  cloudCover: number; // %
  pixels: NDVIPixel[];
  source: 'sentinel2' | 'landsat8' | 'modis';
  isProcessed: boolean;
  createdAt: Date;
}

export interface NDVIPixel {
  latitude: number;
  longitude: number;
  ndvi: number;
  healthStatus: HealthStatus;
}

/**
 * Données météo
 */
export interface Weather {
  id: string;
  fieldId: string;
  date: Date;
  temperatureMin: number; // °C
  temperatureMax: number; // °C
  temperatureAvg: number; // °C
  precipitation: number; // mm
  humidity: number; // %
  windSpeed: number; // km/h
  evapotranspiration: number; // mm
  solarRadiation?: number; // MJ/m²/day
  source: 'chirps' | 'modis' | 'local';
  createdAt: Date;
}

/**
 * Prévisions météo
 */
export interface WeatherForecast {
  date: Date;
  temperatureMin: number;
  temperatureMax: number;
  precipitation: number; // mm
  precipitationProbability: number; // %
  icon: string;
  description: string;
}

/**
 * Calcul besoins irrigation (CROPWAT)
 */
export interface IrrigationNeed {
  fieldId: string;
  date: Date;
  etc: number; // Évapotranspiration culture (mm)
  effectiveRain: number; // Pluie efficace (mm)
  infiltration: number; // Infiltration (mm)
  irrigationNeed: number; // Besoin irrigation net (mm)
  recommendedAmount: number; // Recommandation (mm)
  status: HealthStatus;
  nextIrrigationDate?: Date;
}

/**
 * Alerte
 */
export interface Alert {
  id: string;
  fieldId: string;
  type: AlertType;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  actionRequired?: string;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export type AlertType = 
  | 'irrigation_urgent'
  | 'critical_stage_approaching'
  | 'ndvi_low'
  | 'no_rain_forecast'
  | 'disease_risk'
  | 'harvest_ready';

/**
 * Notification locale
 */
export interface LocalNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
  trigger: Date | 'immediate';
  isScheduled: boolean;
}

/**
 * État de synchronisation
 */
export interface SyncStatus {
  lastSyncAt?: Date;
  isSyncing: boolean;
  pendingOperations: number;
  pendingPhotos: number;
  hasError: boolean;
  errorMessage?: string;
  nextSyncAt?: Date;
}

/**
 * État Redux global
 */
export interface RootState {
  auth: AuthState;
  fields: FieldsState;
  operations: OperationsState;
  satellite: SatelliteState;
  weather: WeatherState;
  alerts: AlertsState;
  sync: SyncState;
  settings: SettingsState;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface FieldsState {
  fields: Field[];
  activeFieldId: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface OperationsState {
  operations: Operation[];
  isLoading: boolean;
  error: string | null;
}

export interface SatelliteState {
  data: SatelliteData[];
  isLoading: boolean;
  error: string | null;
}

export interface WeatherState {
  current: Weather[];
  forecast: WeatherForecast[];
  isLoading: boolean;
  error: string | null;
}

export interface AlertsState {
  alerts: Alert[];
  unreadCount: number;
}

export interface SyncState {
  status: SyncStatus;
  isOnline: boolean;
}

export interface SettingsState {
  language: 'fr' | 'dioula';
  notifications: NotificationSettings;
  mapSettings: MapSettings;
  storageUsed: number; // MB
}

export interface NotificationSettings {
  irrigationAlerts: boolean;
  criticalStageReminders: boolean;
  rainAlerts: boolean;
  customReminders: boolean;
  notificationTime: number; // Heure (0-23)
}

export interface MapSettings {
  defaultLayer: 'ndvi' | 'satellite' | 'terrain';
  showLabels: boolean;
  autoDownloadOfflineMaps: boolean;
}

/**
 * Props de navigation
 */
export type RootStackParamList = {
  Dashboard: undefined;
  Map: { fieldId?: string };
  Calendar: { fieldId?: string };
  Journal: { fieldId?: string };
  Settings: undefined;
  FieldDetails: { fieldId: string };
  OperationDetails: { operationId: string };
  AddOperation: { fieldId: string };
  AddField: undefined;
};
