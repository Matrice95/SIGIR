/**
 * Dashboard Utils - Fonctions utilitaires pour le dashboard
 */

import { PHENOLOGICAL_STAGES } from '@/constants/config';
import { SMIData, WeatherData, ETPData } from '@/services/backendService';

export interface PhenologyInfo {
  stage: keyof typeof PHENOLOGICAL_STAGES;
  stageName: string;
  stageIcon: string;
  daysSincePlanting: number;
  totalDays: number;
  progress: number;
  daysRemaining: number;
  harvestDate: Date;
  isCritical: boolean;
}

export interface IrrigationStatus {
  needsIrrigation: boolean;
  waterDeficit: number; // mm
  dailyNeed: number; // mm/jour
  totalNeed: number; // mm sur 7 jours
  status: 'healthy' | 'caution' | 'warning' | 'critical';
  statusText: string;
  recommendation: string;
}

export interface Alert {
  id: string;
  level: 'success' | 'info' | 'warning' | 'danger' | 'critical';
  title: string;
  message: string;
  icon?: string;
  timestamp: Date;
}

/**
 * Calcule les informations phénologiques
 */
export function calculatePhenology(plantingDate: string | Date): PhenologyInfo {
  const planting = new Date(plantingDate);
  const now = new Date();
  const daysSincePlanting = Math.floor((now.getTime() - planting.getTime()) / (1000 * 60 * 60 * 24));
  const totalDays = 120; // Cycle WITA 9
  
  // Déterminer le stade actuel
  let stage: keyof typeof PHENOLOGICAL_STAGES = 'SEMIS';
  if (daysSincePlanting >= 90) stage = 'MATURATION';
  else if (daysSincePlanting >= 70) stage = 'FLORAISON';
  else if (daysSincePlanting >= 35) stage = 'INITIATION_PANICULE';
  else if (daysSincePlanting >= 7) stage = 'TALLAGE';
  else if (daysSincePlanting > 0) stage = 'LEVEE';
  
  const stageInfo = PHENOLOGICAL_STAGES[stage];
  const progress = Math.min(100, Math.round((daysSincePlanting / totalDays) * 100));
  const daysRemaining = Math.max(0, totalDays - daysSincePlanting);
  
  const harvestDate = new Date(planting);
  harvestDate.setDate(harvestDate.getDate() + totalDays);
  
  return {
    stage,
    stageName: stageInfo.name,
    stageIcon: stageInfo.icon,
    daysSincePlanting,
    totalDays,
    progress,
    daysRemaining,
    harvestDate,
    isCritical: stageInfo.critical,
  };
}

/**
 * Calcule le statut d'irrigation basé sur SMI et ETP
 */
export function calculateIrrigationStatus(
  smiData: SMIData | null,
  etpData: ETPData | null,
  weatherData: WeatherData | null
): IrrigationStatus {
  // Valeurs par défaut
  let needsIrrigation = false;
  let waterDeficit = 0;
  let dailyNeed = 0;
  let totalNeed = 0;
  let status: IrrigationStatus['status'] = 'healthy';
  let statusText = 'SITUATION SAINE';
  let recommendation = 'Aucune action nécessaire';

  // Analyse SMI - Basée sur les données réelles Sentinel-2
  if (smiData) {
    const smiPercent = smiData.smi * 100;
    const swdi = smiData.swdi;
    
    // Calcul du déficit hydrique réel basé sur SMI
    if (smiPercent < 15) {
      status = 'critical';
      statusText = 'CRITIQUE - IRRIGATION URGENTE';
      needsIrrigation = true;
      waterDeficit = Math.round((50 - smiPercent) * 0.8); // Déficit estimé en mm
      dailyNeed = 8; // Besoin élevé pour riz
      recommendation = `SOL TRÈS SEC (${smiPercent.toFixed(0)}%). Irriguer immédiatement ${dailyNeed}mm/jour`;
    } else if (smiPercent < 30) {
      status = 'warning';
      statusText = 'ATTENTION - SOL SEC';
      needsIrrigation = true;
      waterDeficit = Math.round((45 - smiPercent) * 0.7);
      dailyNeed = 6;
      recommendation = `SMI bas (${smiPercent.toFixed(0)}%). Planifier irrigation de ${dailyNeed}mm/jour`;
    } else if (smiPercent < 40) {
      status = 'caution';
      statusText = 'SURVEILLANCE NÉCESSAIRE';
      waterDeficit = Math.round((45 - smiPercent) * 0.5);
      dailyNeed = 5;
      recommendation = `SMI acceptable (${smiPercent.toFixed(0)}%). Surveiller l'évolution`;
    } else if (smiPercent > 80) {
      status = 'warning';
      statusText = 'ATTENTION - SOL SATURÉ';
      needsIrrigation = false;
      recommendation = `SMI élevé (${smiPercent.toFixed(0)}%). Risque d'engorgement - Améliorer drainage`;
    } else {
      status = 'healthy';
      statusText = 'SITUATION OPTIMALE';
      dailyNeed = 5; // Besoin normal
      recommendation = `SMI optimal (${smiPercent.toFixed(0)}%). Maintenir le suivi`;
    }
    
    totalNeed = dailyNeed * 7;
  }

  // Analyse ETP si disponible
  if (etpData && Array.isArray(etpData) && etpData.length > 0) {
    dailyNeed = 5; // Estimation moyenne mm/jour pour riz
    totalNeed = dailyNeed * 7;
    
    // Prendre en compte les prévisions de pluie
    let expectedRain = 0;
    if (weatherData?.daily && Array.isArray(weatherData.daily)) {
      expectedRain = weatherData.daily
        .slice(0, 3) // 3 prochains jours
        .reduce((sum: number, day) => sum + (day.precipitation_sum || 0), 0);
    }
    
    // Si pluie attendue, ajuster les besoins
    if (expectedRain > 20) {
      needsIrrigation = false;
      recommendation = `Pluie attendue (${Math.round(expectedRain)}mm). Reporter l'irrigation.`;
    } else if (needsIrrigation) {
      recommendation = `Irriguer ${Math.round(dailyNeed)}mm/jour. Total 7j: ${Math.round(totalNeed)}mm`;
    }
  } else if (needsIrrigation && !etpData) {
    // Estimation basique sans ETP
    dailyNeed = 5; // mm/jour (estimation conservatrice pour riz)
    totalNeed = dailyNeed * 7;
    recommendation = `Estimation: Irriguer ~${dailyNeed}mm/jour`;
  }

  return {
    needsIrrigation,
    waterDeficit,
    dailyNeed,
    totalNeed,
    status,
    statusText,
    recommendation,
  };
}

/**
 * Génère les alertes critiques
 */
export function generateAlerts(
  smiData: SMIData | null,
  weatherData: WeatherData | null,
  etpData: ETPData | null,
  phenology: PhenologyInfo
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  // Alerte stade critique
  if (phenology.isCritical) {
    alerts.push({
      id: 'critical-stage',
      level: 'warning',
      title: 'Stade critique',
      message: `${phenology.stageName} : surveillance accrue nécessaire`,
      icon: 'alert-circle',
      timestamp: now,
    });
  }

  // Alerte SMI critique - Besoin en eau urgent
  if (smiData && smiData.smi * 100 < 20) {
    alerts.push({
      id: 'smi-critical',
      level: 'critical',
      title: '🚨 Déficit hydrique sévère',
      message: `SMI à ${(smiData.smi * 100).toFixed(0)}% - Irrigation immédiate requise pour éviter stress hydrique. Apporter 40-50mm d'eau rapidement.`,
      icon: 'water',
      timestamp: now,
    });
  } else if (smiData && smiData.smi * 100 < 35) {
    alerts.push({
      id: 'smi-low',
      level: 'warning',
      title: '⚠️ Sol en déficit hydrique',
      message: `SMI à ${(smiData.smi * 100).toFixed(0)}% - Planifier irrigation dans les 24-48h. Besoin estimé: 30-40mm`,
      icon: 'water',
      timestamp: now,
    });
  }

  // Alerte excès eau - Risque engorgement
  if (smiData && smiData.smi * 100 > 85) {
    alerts.push({
      id: 'smi-excess',
      level: 'danger',
      title: '💧 Excès eau détecté',
      message: `SMI à ${(smiData.smi * 100).toFixed(0)}% - Sol saturé. Vérifier drainage et éviter irrigation. Risque asphyxie racinaire.`,
      icon: 'warning',
      timestamp: now,
    });
  }

  // Analyse climatique actuelle et future
  if (weatherData) {
    const currentTemp = weatherData.current?.temperature_2m;
    const futureRain = weatherData.daily?.slice(0, 3).reduce((sum: number, d) => sum + d.precipitation_sum, 0) || 0;
    const futureMaxTemp = Math.max(...(weatherData.daily?.slice(0, 3).map(d => d.temperature_max) || [0]));

    // Alerte forte chaleur combinée avec SMI
    if (currentTemp && currentTemp > 35) {
      const smiPercent = smiData ? smiData.smi * 100 : 50;
      if (smiPercent < 40) {
        alerts.push({
          id: 'heat-stress',
          level: 'critical',
          title: '🌡️ Risque stress thermique élevé',
          message: `${Math.round(currentTemp)}°C + SMI ${smiPercent.toFixed(0)}% - Combiner irrigation et ombrage si possible. Éviter traitements phyto.`,
          icon: 'sunny',
          timestamp: now,
        });
      } else {
        alerts.push({
          id: 'high-temp',
          level: 'warning',
          title: '☀️ Forte chaleur',
          message: `${Math.round(currentTemp)}°C - Surveiller SMI. Augmenter fréquence contrôle. Irrigation le soir recommandée.`,
          icon: 'sunny',
          timestamp: now,
        });
      }
    }

    // Alerte sécheresse prolongée prévue
    if (futureRain < 5 && futureMaxTemp > 32) {
      alerts.push({
        id: 'drought-forecast',
        level: 'warning',
        title: '🌵 Période sèche prévue',
        message: `Moins de 5mm attendus sur 3 jours avec T°>${Math.round(futureMaxTemp)}°C. Prévoir irrigation. Besoin estimé: 15-20mm.`,
        icon: 'warning-outline',
        timestamp: now,
      });
    }

    // Alerte forte pluie - Risque d'inondation
    if (weatherData.daily && Array.isArray(weatherData.daily)) {
      const maxRain = Math.max(...weatherData.daily.slice(0, 3).map(d => d.precipitation_sum));
      const totalRain3j = weatherData.daily.slice(0, 3).reduce((sum: number, d) => sum + d.precipitation_sum, 0);
      
      if (maxRain > 80) {
        alerts.push({
          id: 'flood-critical',
          level: 'critical',
          title: '⛈️ Alerte inondation majeure',
          message: `${Math.round(maxRain)}mm attendus en 24h - Risque submersion. Vérifier évacuation eau. Reporter traitements et fertilisation.`,
          icon: 'rainy',
          timestamp: now,
        });
      } else if (maxRain > 50 || totalRain3j > 100) {
        alerts.push({
          id: 'heavy-rain',
          level: 'warning',
          title: '🌧️ Fortes pluies prévues',
          message: `${Math.round(maxRain)}mm attendus - Risque d'excès d'eau. Arrêter irrigation. Surveiller drainage et risque maladies.`,
          icon: 'rainy',
          timestamp: now,
        });
      } else if (totalRain3j > 30 && smiData && smiData.smi * 100 < 35) {
        // Pluie bénéfique pour sol sec
        alerts.push({
          id: 'beneficial-rain',
          level: 'info',
          title: '🌦️ Pluie bénéfique attendue',
          message: `${Math.round(totalRain3j)}mm prévus sur 3 jours - Excellente nouvelle pour le sol sec. Reporter irrigation prévue.`,
          icon: 'rainy',
          timestamp: now,
        });
      }
    }
  }

  // Alerte récolte proche
  if (phenology.daysRemaining <= 7 && phenology.daysRemaining > 0) {
    alerts.push({
      id: 'harvest-soon',
      level: 'info',
      title: 'Récolte imminente',
      message: `Plus que ${phenology.daysRemaining} jours - Préparer le matériel`,
      icon: 'calendar',
      timestamp: now,
    });
  }

  return alerts;
}

/**
 * Formate une date en français
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

/**
 * Obtient l'emoji météo
 */
export function getWeatherEmoji(precipMm: number): string {
  if (precipMm > 10) return '🌧️';
  if (precipMm > 2) return '🌦️';
  return '☀️';
}
