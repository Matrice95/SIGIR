/**
 * Service Penman-Monteith FAO-56
 * Calcul de l'évapotranspiration de référence (ET0)
 * Documentation: FAO Irrigation and Drainage Paper 56
 */

export interface ClimateData {
  temperature_max: number; // °C
  temperature_min: number; // °C
  humidity_mean: number; // %
  wind_speed: number; // m/s
  solar_radiation?: number; // MJ/m²/day (optionnel)
  latitude: number; // degrés
  altitude?: number; // mètres
  date: Date;
}

export interface ET0Result {
  et0: number; // mm/jour
  etc: number; // mm/jour (ETc = ET0 * Kc)
  method: 'penman-monteith' | 'hargreaves';
}

class PenmanMonteithService {
  // Constantes
  private readonly SOLAR_CONSTANT = 0.0820; // MJ m-2 min-1
  private readonly STEFAN_BOLTZMANN = 4.903e-9; // MJ K-4 m-2 day-1

  /**
   * Calculer ET0 selon méthode Penman-Monteith FAO-56
   */
  calculateET0(data: ClimateData, cropCoefficient: number = 1.0): ET0Result {
    const {
      temperature_max,
      temperature_min,
      humidity_mean,
      wind_speed,
      solar_radiation,
      latitude,
      altitude = 100,
      date,
    } = data;

    // Température moyenne
    const t_mean = (temperature_max + temperature_min) / 2;

    // Pression atmosphérique (kPa)
    const p = 101.3 * Math.pow((293 - 0.0065 * altitude) / 293, 5.26);

    // Constante psychrométrique (kPa/°C)
    const gamma = 0.665e-3 * p;

    // Pente de la courbe de pression de vapeur saturante (kPa/°C)
    const delta = (4098 * this.saturatedVaporPressure(t_mean)) / Math.pow(t_mean + 237.3, 2);

    // Pression de vapeur saturante (kPa)
    const e_s =
      (this.saturatedVaporPressure(temperature_max) +
        this.saturatedVaporPressure(temperature_min)) /
      2;

    // Pression de vapeur actuelle (kPa)
    const e_a = (e_s * humidity_mean) / 100;

    // Déficit de pression de vapeur (kPa)
    const vpd = e_s - e_a;

    // Radiation solaire (si non fournie, estimer)
    const r_s = solar_radiation || this.estimateSolarRadiation(latitude, date, temperature_max, temperature_min);

    // Radiation nette (MJ/m²/day)
    const r_n = this.netRadiation(r_s, t_mean, e_a, latitude, date);

    // Flux de chaleur du sol (négligeable pour calcul journalier)
    const g = 0;

    // Conversion vitesse du vent à 2m de hauteur (si mesuré à 10m)
    const u_2 = wind_speed * (4.87 / Math.log(67.8 * 10 - 5.42));

    // Équation Penman-Monteith FAO-56
    const numerator = 0.408 * delta * (r_n - g) + (gamma * 900 * u_2 * vpd) / (t_mean + 273);
    const denominator = delta + gamma * (1 + 0.34 * u_2);

    const et0 = numerator / denominator;

    // ETc = ET0 * Kc
    const etc = et0 * cropCoefficient;

    return {
      et0: Math.max(0, Math.round(et0 * 10) / 10),
      etc: Math.max(0, Math.round(etc * 10) / 10),
      method: 'penman-monteith',
    };
  }

  /**
   * Méthode Hargreaves (alternative simplifiée)
   */
  calculateET0Hargreaves(data: ClimateData, cropCoefficient: number = 1.0): ET0Result {
    const { temperature_max, temperature_min, latitude, date } = data;

    const t_mean = (temperature_max + temperature_min) / 2;
    const t_range = temperature_max - temperature_min;

    // Radiation extraterrestre (MJ/m²/day)
    const r_a = this.extraterrestrialRadiation(latitude, date);

    // ET0 = 0.0023 * (Tmean + 17.8) * (Tmax - Tmin)^0.5 * Ra
    const et0 = 0.0023 * (t_mean + 17.8) * Math.pow(t_range, 0.5) * r_a;

    const etc = et0 * cropCoefficient;

    return {
      et0: Math.max(0, Math.round(et0 * 10) / 10),
      etc: Math.max(0, Math.round(etc * 10) / 10),
      method: 'hargreaves',
    };
  }

  /**
   * Obtenir le coefficient cultural (Kc) selon stade phénologique
   */
  getCropCoefficient(daysAfterPlanting: number, cropType: string = 'rice'): number {
    if (cropType === 'rice') {
      // Riz irrigué - FAO-56 Table 11
      if (daysAfterPlanting < 20) return 1.05; // Initial
      if (daysAfterPlanting < 60) return 1.10; // Développement
      if (daysAfterPlanting < 90) return 1.20; // Mi-saison
      if (daysAfterPlanting < 120) return 0.90; // Fin de saison
      return 0.60; // Maturité
    }
    return 1.0; // Défaut
  }

  /**
   * Pression de vapeur saturante (kPa)
   */
  private saturatedVaporPressure(temperature: number): number {
    return 0.6108 * Math.exp((17.27 * temperature) / (temperature + 237.3));
  }

  /**
   * Radiation solaire nette (MJ/m²/day)
   */
  private netRadiation(
    r_s: number,
    t_mean: number,
    e_a: number,
    latitude: number,
    date: Date
  ): number {
    // Radiation nette courte longueur d'onde
    const albedo = 0.23; // Albedo pour herbe de référence
    const r_ns = (1 - albedo) * r_s;

    // Radiation nette grande longueur d'onde
    const r_a = this.extraterrestrialRadiation(latitude, date);
    const r_so = (0.75 + 2e-5 * 100) * r_a; // Radiation par ciel clair

    const t_mean_k = t_mean + 273.16;
    const r_nl =
      this.STEFAN_BOLTZMANN *
      Math.pow(t_mean_k, 4) *
      (0.34 - 0.14 * Math.sqrt(e_a)) *
      (1.35 * (r_s / r_so) - 0.35);

    return r_ns - r_nl;
  }

  /**
   * Radiation extraterrestre (MJ/m²/day)
   */
  private extraterrestrialRadiation(latitude: number, date: Date): number {
    const lat_rad = (latitude * Math.PI) / 180;
    const j = this.dayOfYear(date);

    // Déclinaison solaire
    const delta = 0.409 * Math.sin((2 * Math.PI * j) / 365 - 1.39);

    // Distance inverse Terre-Soleil
    const dr = 1 + 0.033 * Math.cos((2 * Math.PI * j) / 365);

    // Angle horaire au coucher du soleil
    const omega_s = Math.acos(-Math.tan(lat_rad) * Math.tan(delta));

    // Radiation extraterrestre
    const r_a =
      (24 * 60 * this.SOLAR_CONSTANT * dr) /
      Math.PI *
      (omega_s * Math.sin(lat_rad) * Math.sin(delta) +
        Math.cos(lat_rad) * Math.cos(delta) * Math.sin(omega_s));

    return r_a;
  }

  /**
   * Estimer radiation solaire à partir de température
   */
  private estimateSolarRadiation(
    latitude: number,
    date: Date,
    t_max: number,
    t_min: number
  ): number {
    const r_a = this.extraterrestrialRadiation(latitude, date);
    const krs = 0.17; // Coefficient pour zones côtières
    return krs * Math.sqrt(t_max - t_min) * r_a;
  }

  /**
   * Jour de l'année (1-365)
   */
  private dayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }
}

export const penmanMonteithService = new PenmanMonteithService();
export default penmanMonteithService;
