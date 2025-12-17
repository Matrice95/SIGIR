/**
 * Export centralisé des services de données réelles
 */

export { openMeteoService, type WeatherData, type WeatherForecast } from './openMeteoService';
export { chirpsService, type RainfallData, type RainfallStats } from './chirpsService';
export { penmanMonteithService, type ClimateData, type ET0Result } from './penmanMonteithService';
export { srtmService, type ElevationData, type TopographyData } from './srtmService';
export { geeService, type NDVIData, type VegetationHealth } from './geeService';
export { realDataAggregator, type FieldDataSnapshot } from './realDataAggregator';
