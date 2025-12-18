/**
 * Configuration de l'application SIGIR
 */

export const APP_CONFIG = {
  // Nom et version
  APP_NAME: 'SIGIR',
  VERSION: '1.0.0',
  
  // Langues disponibles
  LANGUAGES: ['fr', 'dioula'] as const,
  DEFAULT_LANGUAGE: 'fr',
  
  // Sync
  SYNC_INTERVAL_MINUTES: 30,
  MAX_RETRY_ATTEMPTS: 3,
  OFFLINE_STORAGE_DAYS: 30,
  
  // Cartes
  MAP_DEFAULT_ZOOM: 14,
  MAP_MIN_ZOOM: 10,
  MAP_MAX_ZOOM: 18,
  MAP_TILE_SIZE: 256,
  
  // Photos
  MAX_PHOTO_SIZE_MB: 5,
  PHOTO_QUALITY: 0.8,
  MAX_PHOTOS_PER_OPERATION: 5,
  
  // Cache
  CACHE_EXPIRY_HOURS: 24,
  MAX_CACHE_SIZE_MB: 500,
  
  // Notifications
  NOTIFICATION_HOUR: 8, // 8h du matin
  ALERT_BEFORE_CRITICAL_STAGE_DAYS: 3,
};

/**
 * Configuration CROPWAT
 */
export const CROPWAT_CONFIG = {
  // Coefficient cultural riz (Kc) par stade
  KC_INITIAL: 1.05,        // Semis → Tallage
  KC_DEVELOPMENT: 1.10,    // Tallage → Initiation Panicule
  KC_MID: 1.20,           // Initiation Panicule → Floraison
  KC_LATE: 0.90,          // Floraison → Maturation
  
  // Besoins en eau journaliers (mm/jour)
  MIN_WATER_NEED: 5,
  MAX_WATER_NEED: 12,
  
  // Efficacité irrigation
  IRRIGATION_EFFICIENCY: 0.75, // 75%
  
  // Infiltration
  INFILTRATION_RATE: 5, // mm/jour
  
  // Pluie efficace (% de pluie utilisable)
  EFFECTIVE_RAIN_FACTOR: 0.8, // 80%
};

/**
 * Stades phénologiques WITA 9 (variété de riz)
 */
export const PHENOLOGICAL_STAGES = {
  SEMIS: {
    name: 'Semis',
    nameEn: 'Sowing',
    duration: 0,
    dayStart: 0,
    dayEnd: 0,
    icon: '🌱',
    critical: false,
  },
  LEVEE: {
    name: 'Levée',
    nameEn: 'Germination',
    duration: 7,
    dayStart: 0,
    dayEnd: 7,
    icon: '🌿',
    critical: false,
  },
  TALLAGE: {
    name: 'Tallage',
    nameEn: 'Tillering',
    duration: 28,
    dayStart: 7,
    dayEnd: 35,
    icon: '🌾',
    critical: false,
  },
  INITIATION_PANICULE: {
    name: 'Initiation Panicule',
    nameEn: 'Panicle Initiation',
    duration: 35,
    dayStart: 35,
    dayEnd: 70,
    icon: '🌿',
    critical: true, // STADE CRITIQUE
  },
  FLORAISON: {
    name: 'Floraison',
    nameEn: 'Flowering',
    duration: 20,
    dayStart: 70,
    dayEnd: 90,
    icon: '🌸',
    critical: true, // STADE CRITIQUE
  },
  MATURATION: {
    name: 'Maturation',
    nameEn: 'Maturation',
    duration: 30,
    dayStart: 90,
    dayEnd: 120,
    icon: '🌾',
    critical: false,
  },
  RECOLTE: {
    name: 'Récolte',
    nameEn: 'Harvest',
    duration: 0,
    dayStart: 120,
    dayEnd: 120,
    icon: '🚜',
    critical: true, // MOMENT CRITIQUE
  },
} as const;

/**
 * Types d'opérations
 */
export const OPERATION_TYPES = {
  IRRIGATION: {
    name: 'Irrigation',
    icon: '💧',
    color: '#2196F3',
  },
  LABOURAGE: {
    name: 'Labourage',
    icon: '🚜',
    color: '#8D6E63',
  },
  SEMIS: {
    name: 'Semis',
    icon: '🌱',
    color: '#4CAF50',
  },
  ENGRAIS: {
    name: 'Engrais',
    icon: '🧪',
    color: '#FF9800',
  },
  PESTICIDE: {
    name: 'Lutte ravageurs',
    icon: '🛡️',
    color: '#F44336',
  },
  DESHERBAGE: {
    name: 'Désherbage',
    icon: '🌿',
    color: '#8BC34A',
  },
  OBSERVATION: {
    name: 'Observation',
    icon: '👁️',
    color: '#9C27B0',
  },
} as const;

/**
 * Seuils NDVI pour classification santé
 */
export const NDVI_THRESHOLDS = {
  EXCELLENT: 0.6,  // > 0.6 = Excellent 🟢
  GOOD: 0.4,       // 0.4-0.6 = Bon 🟢
  MODERATE: 0.2,   // 0.2-0.4 = Moyen 🟡
  POOR: 0.1,       // 0.1-0.2 = Faible 🟡
  CRITICAL: 0,     // < 0.1 = Critique 🔴
};

/**
 * Seuils humidité sol
 */
export const SOIL_MOISTURE_THRESHOLDS = {
  SATURATED: 90,   // > 90% = Saturé
  OPTIMAL: 60,     // 60-90% = Optimal 🟢
  MODERATE: 40,    // 40-60% = Modéré 🟡
  DRY: 20,         // 20-40% = Sec 🟡
  CRITICAL: 0,     // < 20% = Critique 🔴
};

/**
 * Variétés de riz disponibles
 */
export const RICE_VARIETIES = [
  { 
    id: 'wita_9',
    name: 'WITA 9', 
    cycle: 120,
    type: 'Standard national',
    description: 'Variété standard, cycle long'
  },
  { 
    id: 'nerica_1',
    name: 'NERICA 1', 
    cycle: 100,
    type: 'Résilient',
    description: 'Résistant sécheresse, adapté pluvial'
  },
  { 
    id: 'wita_8',
    name: 'WITA 8', 
    cycle: 90,
    type: '2 cycles possibles',
    description: 'Cycle court, 2 récoltes/an'
  },
  { 
    id: 'nerica_2',
    name: 'NERICA 2', 
    cycle: 90,
    type: 'Décrue rapide',
    description: 'Adapté décrue, cycle court'
  },
  { 
    id: 'ir_841',
    name: 'IR 841', 
    cycle: 110,
    type: 'Irrigué',
    description: 'Pour riz irrigué, haut rendement'
  },
];

/**
 * Types de sols
 */
export const SOIL_TYPES = [
  { 
    id: 'clay_loam',
    name: 'Argilo-limoneux',
    description: 'Défaut Côte d\'Ivoire - Rétention eau optimale'
  },
  { 
    id: 'clay',
    name: 'Argileux',
    description: 'Bonne rétention eau, drainage lent'
  },
  { 
    id: 'loam',
    name: 'Limoneux',
    description: 'Équilibré, fertilité moyenne'
  },
  { 
    id: 'sandy_loam',
    name: 'Sablo-limoneux',
    description: 'Drainage rapide, irrigation fréquente'
  },
  { 
    id: 'sandy',
    name: 'Sableux',
    description: 'Drainage très rapide, faible rétention'
  },
];

/**
 * Régimes d'irrigation
 */
export const IRRIGATION_REGIMES = [
  {
    id: 'rainfed',
    name: 'Riz pluvial',
    description: 'Dépend des pluies - Standard Côte d\'Ivoire',
    icon: '🌧️',
  },
  {
    id: 'irrigated',
    name: 'Riz irrigué',
    description: 'Eau maîtrisée - Meilleurs rendements',
    icon: '💧',
  },
  {
    id: 'lowland',
    name: 'Riz bas-fond',
    description: 'Humidité naturelle - Semi-aquatique',
    icon: '🌊',
  },
];

/**
 * Sources d'eau disponibles
 */
export const WATER_SOURCES = [
  { id: 'well', name: 'Puits / Forage', icon: '⚫' },
  { id: 'river', name: 'Cours d\'eau', icon: '🌊' },
  { id: 'network', name: 'Réseau irrigation collectif', icon: '🚰' },
  { id: 'rainwater', name: 'Eau de pluie uniquement', icon: '🌧️' },
  { id: 'none', name: 'Aucun accès eau', icon: '❌' },
];

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  AUTH: '/auth',
  FIELDS: '/fields',
  OPERATIONS: '/operations',
  SATELLITE_DATA: '/satellite',
  WEATHER: '/weather',
  SYNC: '/sync',
  NOTIFICATIONS: '/notifications',
};
