/**
 * Export centralisé des services de données réelles
 */

// Services frontend (appels directs aux APIs)
export { openMeteoService, type WeatherData, type WeatherForecast } from './openMeteoService';
export { chirpsService, type RainfallData, type RainfallStats } from './chirpsService';
export { penmanMonteithService, type ClimateData, type ET0Result } from './penmanMonteithService';
export { srtmService, type ElevationData, type TopographyData } from './srtmService';
export { geeService, type NDVIData, type VegetationHealth } from './geeService';
export { realDataAggregator, type FieldDataSnapshot } from './realDataAggregator';

// Service backend (recommandé - utilise les endpoints backend)
export {
  backendWeatherService,
  type BackendWeatherResponse,
  type BackendWeatherDay,
  type BackendRainfallData,
  type BackendTopography,
  type BackendNDVI,
  type FieldDataFromBackend,
} from './backendWeatherService';
