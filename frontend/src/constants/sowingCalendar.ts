/**
 * Calendriers optimaux de semis du riz en Côte d'Ivoire
 * Basé sur recherche scientifique (1980-2017)
 * Sources: Kouassi et al. 2022, Kouakou et al. 2013
 */

export interface SowingWindow {
  id: string;
  label: string;
  startDate: string; // Format: 'MM-DD'
  endDate: string;   // Format: 'MM-DD'
  cycle: 'CYCLE_1' | 'CYCLE_2';
  cycleLabel: string;
  varieties: string[]; // Variétés recommandées
  successProbability: number; // Pourcentage
  criticalStages: {
    flowering: string; // Période floraison
    harvest: string;   // Période récolte
  };
  recommendations: string[];
  warning?: string;
}

export interface Zone {
  id: string;
  name: string;
  localities: string[];
  cyclesPerYear: number;
  regime: 'unimodal' | 'bimodal';
  sowingWindows: SowingWindow[];
  description: string;
  irrigationType: 'pluvial' | 'irrigue' | 'both';
}

export const COTE_IVOIRE_ZONES: Zone[] = [
  {
    id: 'centre',
    name: 'Centre (Yamoussoukro)',
    localities: ['Yamoussoukro', 'Bouaké', 'Toumodi', 'Dimbokro'],
    cyclesPerYear: 1,
    regime: 'unimodal',
    irrigationType: 'pluvial',
    description: '1 SEUL CYCLE/AN - 2e cycle impossible (pluies insuffisantes août-nov)',
    sowingWindows: [
      {
        id: 'centre_wita9',
        label: 'WITA 9 (120j)',
        startDate: '03-22',
        endDate: '04-26',
        cycle: 'CYCLE_1',
        cycleLabel: 'Cycle Principal',
        varieties: ['WITA 9'],
        successProbability: 80,
        criticalStages: {
          flowering: '10-20 Juin (STADE CRITIQUE eau!)',
          harvest: '~20 Août',
        },
        recommendations: [
          'Semis optimal: 22 mars → 26 avril',
          'Levée: 1-10 avril',
          'Floraison: 10-20 juin (BESOIN EAU ÉLEVÉ)',
          'Récolte: ~20 août',
        ],
      },
      {
        id: 'centre_nerica1',
        label: 'NERICA 1 (100j)',
        startDate: '03-27',
        endDate: '05-11',
        cycle: 'CYCLE_1',
        cycleLabel: 'Cycle Principal',
        varieties: ['NERICA 1', 'NERICA 2'],
        successProbability: 80,
        criticalStages: {
          flowering: 'Mi-juin',
          harvest: 'Début août',
        },
        recommendations: [
          'Plus flexible (fenêtre de 20 jours)',
          'Variété résiliente',
          'Cycle court adapté à la zone',
        ],
      },
    ],
  },
  {
    id: 'centre_ouest',
    name: 'Centre-Ouest (Man, Danané, Touba)',
    localities: ['Man', 'Danané', 'Touba', 'Séguéla'],
    cyclesPerYear: 2,
    regime: 'bimodal',
    irrigationType: 'pluvial',
    description: 'RÉGIME BIMODAL NATUREL → 2 RÉCOLTES/AN possibles',
    sowingWindows: [
      {
        id: 'co_cycle1_wita9',
        label: 'WITA 9 (120j) - Cycle 1',
        startDate: '03-01',
        endDate: '04-20',
        cycle: 'CYCLE_1',
        cycleLabel: 'Cycle Principal (Avril-Juillet)',
        varieties: ['WITA 9'],
        successProbability: 85,
        criticalStages: {
          flowering: 'Juin',
          harvest: 'Juillet',
        },
        recommendations: [
          'Cycle principal recommandé',
          'Meilleure probabilité de succès (85%)',
          'Conditions optimales',
        ],
      },
      {
        id: 'co_cycle1_wita8',
        label: 'WITA 8 (90j) - Cycle 1',
        startDate: '04-11',
        endDate: '04-30',
        cycle: 'CYCLE_1',
        cycleLabel: 'Cycle Principal (Avril-Juillet)',
        varieties: ['WITA 8'],
        successProbability: 82,
        criticalStages: {
          flowering: 'Mi-juin',
          harvest: 'Fin juillet',
        },
        recommendations: [
          'Cycle court adapté',
          'Bonne probabilité (82%)',
        ],
      },
      {
        id: 'co_cycle2_nerica2',
        label: 'NERICA 2 (90j) - Cycle 2',
        startDate: '07-21',
        endDate: '08-20',
        cycle: 'CYCLE_2',
        cycleLabel: 'Cycle Décrue (Juillet-Septembre)',
        varieties: ['NERICA 2', 'NERICA 1'],
        successProbability: 78,
        criticalStages: {
          flowering: 'Août-Septembre',
          harvest: 'Septembre-Octobre',
        },
        recommendations: [
          'Cycle de décrue',
          'Moins sûr que cycle 1 (78%)',
          '2ème récolte possible',
        ],
        warning: 'Moins fiable que le cycle principal',
      },
    ],
  },
  {
    id: 'nord',
    name: 'Nord (Korhogo, Odienné)',
    localities: ['Korhogo', 'Odienné', 'Ferkessédougou', 'Boundiali'],
    cyclesPerYear: 1,
    regime: 'unimodal',
    irrigationType: 'irrigue',
    description: '⚠️ DÉCONSEILLÉ pour riz pluvial - Régime unimodal strict',
    sowingWindows: [
      {
        id: 'nord_pluvial',
        label: 'Riz pluvial (SI ABSOLUMENT)',
        startDate: '05-25',
        endDate: '06-15',
        cycle: 'CYCLE_1',
        cycleLabel: 'Unique saison',
        varieties: ['NERICA 1', 'NERICA 2'],
        successProbability: 55,
        criticalStages: {
          flowering: 'Juillet-Août',
          harvest: 'Septembre',
        },
        recommendations: [
          'TROP RISQUÉ (50-60% succès)',
          'Privilégier riz irrigué',
        ],
        warning: '⚠️ DÉCONSEILLÉ - Probabilité succès: 50-60% TROP RISQUÉE',
      },
    ],
  },
  {
    id: 'sud',
    name: 'Sud/Sud-Ouest (Gagnoa, Abidjan, San-Pédro)',
    localities: [
      'Gagnoa',
      'Abidjan',
      'San-Pédro',
      'Divo',
      'Soubré',
      'Sassandra',
      'Grand-Bassam',
      'Dabou',
    ],
    cyclesPerYear: 2,
    regime: 'bimodal',
    irrigationType: 'both',
    description: '1-2 cycles selon localité - Irrigation possible pour 2-3 cycles/an',
    sowingWindows: [
      // Riz pluvial
      {
        id: 'sud_pluvial_cycle1',
        label: 'WITA 9 (120j) - Pluvial',
        startDate: '03-15',
        endDate: '04-30',
        cycle: 'CYCLE_1',
        cycleLabel: 'Cycle 1 Pluvial',
        varieties: ['WITA 9'],
        successProbability: 83,
        criticalStages: {
          flowering: 'Juin',
          harvest: 'Juillet-Août',
        },
        recommendations: [
          'Riz pluvial cycle principal',
          'Bonne probabilité (83%)',
          'Rendements: 3-5 t/ha',
        ],
      },
      {
        id: 'sud_pluvial_cycle2',
        label: 'NERICA 2 (90j) - Décrue',
        startDate: '07-01',
        endDate: '07-31',
        cycle: 'CYCLE_2',
        cycleLabel: 'Cycle 2 Décrue',
        varieties: ['NERICA 2', 'NERICA 1'],
        successProbability: 75,
        criticalStages: {
          flowering: 'Août-Septembre',
          harvest: 'Septembre-Octobre',
        },
        recommendations: [
          'Cycle décrue pluvial',
          'Probabilité: 75%',
        ],
      },
      // Riz irrigué
      {
        id: 'sud_irrigue_cycle1',
        label: 'Riz Irrigué - Cycle 1',
        startDate: '11-01',
        endDate: '12-31',
        cycle: 'CYCLE_1',
        cycleLabel: 'Repiquage Nov-Déc',
        varieties: ['WITA 9', 'WITA 8', 'IR 841'],
        successProbability: 95,
        criticalStages: {
          flowering: 'Février-Mars',
          harvest: 'Avril-Mai',
        },
        recommendations: [
          'Bas-fonds aménagés',
          '2-3 cycles/an possibles',
          'Rendements élevés: 6-10 t/ha',
          'Eau maîtrisée',
        ],
      },
      {
        id: 'sud_irrigue_cycle2',
        label: 'Riz Irrigué - Cycle 2',
        startDate: '07-01',
        endDate: '08-31',
        cycle: 'CYCLE_2',
        cycleLabel: 'Repiquage Juil-Août',
        varieties: ['WITA 9', 'WITA 8', 'IR 841'],
        successProbability: 95,
        criticalStages: {
          flowering: 'Septembre-Octobre',
          harvest: 'Décembre-Janvier',
        },
        recommendations: [
          'Cycle irrigué secondaire',
          'Rendements: 6-10 t/ha',
          'Nécessite aménagement',
        ],
      },
    ],
  },
];

/**
 * Obtenir les zones disponibles
 */
export function getAvailableZones(): { id: string; name: string; localities: string[] }[] {
  return COTE_IVOIRE_ZONES.map(zone => ({
    id: zone.id,
    name: zone.name,
    localities: zone.localities,
  }));
}

/**
 * Obtenir les fenêtres de semis pour une zone donnée
 */
export function getSowingWindowsForZone(zoneId: string): SowingWindow[] {
  const zone = COTE_IVOIRE_ZONES.find(z => z.id === zoneId);
  return zone?.sowingWindows || [];
}

/**
 * Obtenir les informations complètes d'une zone
 */
export function getZoneInfo(zoneId: string): Zone | undefined {
  return COTE_IVOIRE_ZONES.find(z => z.id === zoneId);
}

/**
 * Vérifier si une date est dans une fenêtre de semis
 */
export function isDateInSowingWindow(
  date: Date,
  window: SowingWindow,
  year?: number
): boolean {
  const checkYear = year || date.getFullYear();
  const [startMonth, startDay] = window.startDate.split('-').map(Number);
  const [endMonth, endDay] = window.endDate.split('-').map(Number);

  const windowStart = new Date(checkYear, startMonth - 1, startDay);
  const windowEnd = new Date(checkYear, endMonth - 1, endDay);

  return date >= windowStart && date <= windowEnd;
}

/**
 * Trouver quelle fenêtre de semis correspond à une date
 */
export function findSowingWindowForDate(
  date: Date,
  zoneId: string
): SowingWindow | undefined {
  const windows = getSowingWindowsForZone(zoneId);
  return windows.find(window => isDateInSowingWindow(date, window));
}

/**
 * Obtenir les fenêtres de semis compatibles avec une variété
 */
export function getSowingWindowsForVariety(
  zoneId: string,
  variety: string
): SowingWindow[] {
  const windows = getSowingWindowsForZone(zoneId);
  return windows.filter(window => window.varieties.includes(variety));
}

/**
 * Formater une fenêtre de semis pour affichage
 */
export function formatSowingWindow(window: SowingWindow, year: number): string {
  const [startMonth, startDay] = window.startDate.split('-').map(Number);
  const [endMonth, endDay] = window.endDate.split('-').map(Number);

  const startDate = new Date(year, startMonth - 1, startDay);
  const endDate = new Date(year, endMonth - 1, endDay);

  const formatDate = (date: Date) =>
    date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  return `${formatDate(startDate)} → ${formatDate(endDate)}`;
}

/**
 * Obtenir les prochaines fenêtres de semis disponibles
 */
export function getUpcomingSowingWindows(
  zoneId: string,
  fromDate: Date = new Date()
): Array<SowingWindow & { dateRange: string; year: number }> {
  const windows = getSowingWindowsForZone(zoneId);
  const currentYear = fromDate.getFullYear();
  const upcomingWindows: Array<SowingWindow & { dateRange: string; year: number }> = [];

  // Vérifier l'année courante et l'année suivante
  [currentYear, currentYear + 1].forEach(year => {
    windows.forEach(window => {
      const [startMonth, startDay] = window.startDate.split('-').map(Number);
      const windowStart = new Date(year, startMonth - 1, startDay);

      if (windowStart >= fromDate) {
        upcomingWindows.push({
          ...window,
          dateRange: formatSowingWindow(window, year),
          year,
        });
      }
    });
  });

  // Trier par date
  return upcomingWindows.sort((a, b) => {
    const [aMonth, aDay] = a.startDate.split('-').map(Number);
    const [bMonth, bDay] = b.startDate.split('-').map(Number);
    const aDate = new Date(a.year, aMonth - 1, aDay);
    const bDate = new Date(b.year, bMonth - 1, bDay);
    return aDate.getTime() - bDate.getTime();
  });
}
