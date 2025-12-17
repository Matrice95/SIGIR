/**
 * Service CROPWAT Simplifié
 * Calcul des besoins en eau pour le riz
 */

import { CROPWAT_CONFIG, PHENOLOGICAL_STAGES } from '@/constants/config';
import type { Field, Weather, IrrigationNeed } from '@/types';

/**
 * Calcule le coefficient cultural (Kc) selon le stade phénologique
 */
export function getCropCoefficient(stage: keyof typeof PHENOLOGICAL_STAGES): number {
  switch (stage) {
    case 'SEMIS':
    case 'LEVEE':
      return CROPWAT_CONFIG.KC_INITIAL;
    case 'TALLAGE':
      return CROPWAT_CONFIG.KC_DEVELOPMENT;
    case 'INITIATION_PANICULE':
    case 'FLORAISON':
      return CROPWAT_CONFIG.KC_MID;
    case 'MATURATION':
    case 'RECOLTE':
      return CROPWAT_CONFIG.KC_LATE;
    default:
      return CROPWAT_CONFIG.KC_INITIAL;
  }
}

/**
 * Calcule l'évapotranspiration de la culture (ETc)
 * ETc = ETo × Kc
 */
export function calculateCropEvapotranspiration(
  et0: number, // Évapotranspiration de référence (mm/jour)
  kc: number   // Coefficient cultural
): number {
  return et0 * kc;
}

/**
 * Calcule la pluie efficace
 * Pluie qui pénètre réellement dans le sol
 */
export function calculateEffectiveRainfall(precipitation: number): number {
  return precipitation * CROPWAT_CONFIG.EFFECTIVE_RAIN_FACTOR;
}

/**
 * Calcule le besoin net en irrigation
 * Besoin = ETc + Infiltration - Pluie Efficace
 */
export function calculateIrrigationNeed(
  etc: number,              // Évapotranspiration culture (mm)
  precipitation: number,    // Pluie (mm)
  infiltration: number = CROPWAT_CONFIG.INFILTRATION_RATE
): number {
  const effectiveRain = calculateEffectiveRainfall(precipitation);
  const need = etc + infiltration - effectiveRain;
  
  // Le besoin ne peut pas être négatif
  return Math.max(0, need);
}

/**
 * Calcule la recommandation d'irrigation ajustée
 * Prend en compte l'efficacité du système
 */
export function calculateRecommendedIrrigation(netNeed: number): number {
  return netNeed / CROPWAT_CONFIG.IRRIGATION_EFFICIENCY;
}

/**
 * Détermine le statut de santé selon le besoin en eau
 */
export function getIrrigationStatus(needMm: number): 'healthy' | 'warning' | 'critical' {
  if (needMm <= 5) return 'healthy';
  if (needMm <= 10) return 'warning';
  return 'critical';
}

/**
 * Calcule les besoins en irrigation complets pour une parcelle
 */
export function calculateFieldIrrigationNeeds(
  field: Field,
  weatherData: Weather[]
): IrrigationNeed | null {
  if (weatherData.length === 0) return null;
  
  // Données météo les plus récentes
  const latestWeather = weatherData[0];
  
  // Coefficient cultural selon le stade
  const kc = getCropCoefficient(field.currentStage);
  
  // ETc = ETo × Kc
  const etc = calculateCropEvapotranspiration(latestWeather.evapotranspiration, kc);
  
  // Pluie efficace
  const effectiveRain = calculateEffectiveRainfall(latestWeather.precipitation);
  
  // Besoin net
  const irrigationNeed = calculateIrrigationNeed(
    etc,
    latestWeather.precipitation,
    CROPWAT_CONFIG.INFILTRATION_RATE
  );
  
  // Recommandation ajustée
  const recommendedAmount = calculateRecommendedIrrigation(irrigationNeed);
  
  // Statut
  const status = getIrrigationStatus(irrigationNeed);
  
  // Prochaine irrigation (si besoin critique)
  let nextIrrigationDate: Date | undefined;
  if (status === 'critical') {
    nextIrrigationDate = new Date();
    nextIrrigationDate.setDate(nextIrrigationDate.getDate() + 1); // Demain
  } else if (status === 'warning') {
    nextIrrigationDate = new Date();
    nextIrrigationDate.setDate(nextIrrigationDate.getDate() + 2); // Dans 2 jours
  }
  
  return {
    fieldId: field.id,
    date: new Date(),
    etc,
    effectiveRain,
    infiltration: CROPWAT_CONFIG.INFILTRATION_RATE,
    irrigationNeed,
    recommendedAmount,
    status,
    nextIrrigationDate,
  };
}

/**
 * Calcule le nombre de jours depuis le semis
 */
export function getDaysSinceSowing(sowingDate: Date | string): number {
  const now = new Date();
  const sowing = typeof sowingDate === 'string' ? new Date(sowingDate) : sowingDate;
  
  // Vérifier que la date est valide
  if (isNaN(sowing.getTime())) {
    console.error('Date de semis invalide:', sowingDate);
    return 0;
  }
  
  const diff = now.getTime() - sowing.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Détermine le stade phénologique actuel selon les jours depuis semis
 */
export function getCurrentPhenologicalStage(
  daysSinceSowing: number
): keyof typeof PHENOLOGICAL_STAGES {
  if (daysSinceSowing >= 120) return 'RECOLTE';
  if (daysSinceSowing >= 90) return 'MATURATION';
  if (daysSinceSowing >= 70) return 'FLORAISON';
  if (daysSinceSowing >= 35) return 'INITIATION_PANICULE';
  if (daysSinceSowing >= 7) return 'TALLAGE';
  if (daysSinceSowing > 0) return 'LEVEE';
  return 'SEMIS';
}

/**
 * Calcule le pourcentage de progression dans le cycle
 */
export function getCycleProgress(daysSinceSowing: number): number {
  const totalDays = 120; // Cycle WITA 9
  return Math.min(100, Math.round((daysSinceSowing / totalDays) * 100));
}

/**
 * Calcule les jours restants avant la récolte
 */
export function getDaysUntilHarvest(sowingDate: Date | string): number {
  const totalDays = 120;
  const daysSinceSowing = getDaysSinceSowing(sowingDate);
  return Math.max(0, totalDays - daysSinceSowing);
}

/**
 * Vérifie si un stade est critique (nécessite attention particulière)
 */
export function isCriticalStage(stage: keyof typeof PHENOLOGICAL_STAGES): boolean {
  return PHENOLOGICAL_STAGES[stage].critical;
}

/**
 * Calcule le besoin en eau total sur une période (pour historique)
 */
export function calculateTotalWaterNeed(
  weatherData: Weather[],
  stage: keyof typeof PHENOLOGICAL_STAGES
): number {
  if (weatherData.length === 0) return 0;
  
  const kc = getCropCoefficient(stage);
  
  return weatherData.reduce((total, weather) => {
    const etc = calculateCropEvapotranspiration(weather.evapotranspiration, kc);
    const need = calculateIrrigationNeed(etc, weather.precipitation);
    return total + need;
  }, 0);
}
