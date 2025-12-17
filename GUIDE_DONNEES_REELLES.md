# 📊 Guide des Sources de Données Réelles - SIGIR

## Vue d'ensemble

L'application SIGIR intègre **5 sources de données satellites et météorologiques** pour fournir des informations précises sur vos parcelles de riz en Côte d'Ivoire.

---

## 1. 🌦️ Open-Meteo (Météo 7 jours)

### Description
- **Provider**: Open-Meteo API
- **Gratuit**: ✅ Oui (15,000 appels/jour)
- **Données**: Température, pluie, humidité, vent, ET0
- **Résolution**: Point précis (latitude/longitude)
- **Mise à jour**: Horaire

### Configuration
**Aucune clé API requise** ✅

### Données disponibles
- Température max/min/moyenne (°C)
- Précipitations (mm)
- Probabilité de pluie (%)
- Vitesse du vent (km/h)
- Humidité relative (%)
- **ET0 FAO** calculé automatiquement (mm/jour)

### Utilisation dans l'app
```typescript
import { openMeteoService } from '@/services/weather';

const weather = await openMeteoService.getForecast(latitude, longitude);
console.log(weather.daily[0].et0_fao_evapotranspiration); // ET0 du jour
```

### Endpoint backend
```
GET /api/weather/weather/{field_id}
```

**Réponse exemple**:
```json
{
  "latitude": 7.6944,
  "longitude": -5.0328,
  "timezone": "Africa/Abidjan",
  "current": {
    "temperature": 28.5,
    "humidity": 75,
    "wind_speed": 12.5,
    "precipitation": 0
  },
  "daily": [
    {
      "date": "2025-12-17",
      "temperature_max": 32.1,
      "temperature_min": 22.3,
      "temperature_mean": 27.2,
      "precipitation_sum": 0,
      "precipitation_probability_max": 20,
      "wind_speed_max": 18.5,
      "relative_humidity_mean": 75.5,
      "et0_fao_evapotranspiration": 5.2
    }
  ]
}
```

---

## 2. 🌧️ NASA POWER (Historique pluies)

### Description
- **Provider**: NASA POWER API (inclut CHIRPS)
- **Gratuit**: ✅ Oui (illimité)
- **Données**: Précipitations historiques depuis 1981
- **Résolution**: 0.5° x 0.625° (~50km)
- **Fiabilité**: Excellente en Afrique de l'Ouest

### Configuration
**Aucune clé API requise** ✅

### Données disponibles
- Précipitations quotidiennes corrigées (PRECTOTCORR)
- Historique complet depuis la plantation
- Calcul de déficit hydrique

### Utilisation dans l'app
```typescript
import { chirpsService } from '@/services/weather';

const rainfall = await chirpsService.getRainfallForCropCycle(
  latitude, 
  longitude, 
  plantingDate
);

const stats = chirpsService.calculateRainfallStats(rainfall);
console.log(`Total pluie: ${stats.totalRainfall}mm`);
```

### Endpoint backend
```
GET /api/weather/rainfall/{field_id}?days=30
```

**Réponse exemple**:
```json
[
  {
    "date": "2025-12-17",
    "precipitation": 5.2
  },
  {
    "date": "2025-12-16",
    "precipitation": 0.0
  }
]
```

---

## 3. 💧 Penman-Monteith FAO-56 (ET0)

### Description
- **Méthode**: Calcul FAO Irrigation Paper 56
- **Gratuit**: ✅ Oui (calcul local)
- **Données**: Évapotranspiration de référence
- **Standard**: International agriculture

### Configuration
**Aucune configuration requise** ✅

### Données calculées
- **ET0**: Évapotranspiration de référence (mm/jour)
- **ETc**: ET0 × Kc (coefficient cultural riz)
- **Besoin irrigation**: ETc - Pluie

### Coefficients culturaux (Kc) riz
- 0-20 jours: **Kc = 1.05** (Initial)
- 20-60 jours: **Kc = 1.10** (Développement)
- 60-90 jours: **Kc = 1.20** (Mi-saison)
- 90-120 jours: **Kc = 0.90** (Fin)

### Utilisation dans l'app
```typescript
import { penmanMonteithService } from '@/services/weather';

const et0 = penmanMonteithService.calculateET0({
  temperature_max: 32,
  temperature_min: 22,
  humidity_mean: 75,
  wind_speed: 2.5, // m/s
  latitude: 7.6944,
  altitude: 376,
  date: new Date(),
}, cropCoefficient);

console.log(`ET0: ${et0.et0}mm, ETc: ${et0.etc}mm`);
```

### Formules utilisées
1. **Penman-Monteith**: Méthode complète avec radiation solaire
2. **Hargreaves**: Alternative simplifiée (température uniquement)

---

## 4. 🏔️ SRTM (Topographie)

### Description
- **Provider**: Open-Elevation API (données SRTM)
- **Gratuit**: ✅ Oui
- **Résolution**: 30m (SRTM 1 Arc-Second)
- **Données**: Élévation, pente, drainage

### Configuration
**Aucune clé API requise** ✅

### Données disponibles
- Élévation (mètres)
- Pente (degrés)
- Aspect (orientation 0-360°)
- Classe de drainage (excellent → very-poor)
- Risque d'inondation (low/medium/high)

### Utilisation dans l'app
```typescript
import { srtmService } from '@/services/weather';

const topography = await srtmService.getTopography(latitude, longitude, 50);

console.log(`Élévation: ${topography.elevation}m`);
console.log(`Pente: ${topography.slope}°`);
console.log(`Drainage: ${topography.drainageClass}`);
console.log(`Risque inondation: ${topography.floodRisk}`);
```

### Endpoint backend
```
GET /api/weather/topography/{field_id}
```

**Réponse exemple**:
```json
{
  "elevation": 376,
  "slope": 2.5,
  "aspect": 180,
  "drainageClass": "moderate",
  "floodRisk": "low"
}
```

### Classes de drainage
- **excellent**: Pente > 8° (drainage rapide)
- **good**: Pente 5-8°
- **moderate**: Pente 2-5°
- **poor**: Pente 0.5-2° (risque stagnation)
- **very-poor**: Pente < 0.5° (mauvais drainage)

---

## 5. 🛰️ Google Earth Engine (NDVI Sentinel-2)

### Description
- **Provider**: Google Earth Engine / Sentinel-2
- **Gratuit**: ✅ Oui (mais nécessite compte)
- **Résolution**: 10m (bandes visibles/NIR)
- **Fréquence**: ~5 jours (Sentinel-2A+2B)

### Configuration
**OPTIONNEL** - Compte Google Earth Engine

1. Créer un compte: [signup.earthengine.google.com](https://signup.earthengine.google.com)
2. Obtenir une **Service Account Key**
3. Ajouter dans `frontend/.env`:
```env
GEE_API_KEY=your_api_key_here
```

**Sans clé**: L'app utilise des données NDVI simulées basées sur le cycle de croissance 🌾

### Données disponibles
- **NDVI**: Normalized Difference Vegetation Index (-1 à 1)
- Historique depuis plantation
- Couverture nuageuse
- Tendance santé végétation

### Formule NDVI
```
NDVI = (NIR - Red) / (NIR + Red)
```

### Interprétation NDVI
- **0.8 - 1.0**: 🟢 Excellente végétation
- **0.6 - 0.8**: 🟢 Bonne végétation
- **0.4 - 0.6**: 🟡 Végétation modérée
- **0.2 - 0.4**: 🟠 Végétation faible
- **0.0 - 0.2**: 🔴 Végétation rare
- **< 0.0**: 🟤 Sol nu / Eau

### Utilisation dans l'app
```typescript
import { geeService } from '@/services/weather';

const ndviHistory = await geeService.getNDVI(
  latitude, 
  longitude, 
  100, // radius 100m
  plantingDate
);

const health = geeService.analyzeVegetationHealth(ndviHistory);
console.log(`Statut: ${health.status}`);
console.log(`NDVI actuel: ${health.ndvi}`);
console.log(`Tendance: ${health.trend}`);
```

### Endpoint backend
```
GET /api/weather/ndvi/{field_id}
```

**Réponse exemple**:
```json
[
  {
    "date": "2025-12-17",
    "ndvi_mean": 0.75,
    "ndvi_min": 0.70,
    "ndvi_max": 0.80,
    "cloud_coverage": 10.0
  }
]
```

---

## 🔄 Service d'Agrégation

### RealDataAggregator
Combine automatiquement toutes les sources pour une vue complète.

```typescript
import { realDataAggregator } from '@/services/weather';

const snapshot = await realDataAggregator.getFieldData(
  fieldId,
  latitude,
  longitude,
  plantingDate
);

// Données complètes disponibles
console.log(snapshot.weather);         // Météo 7j
console.log(snapshot.rainfall);        // Historique pluies
console.log(snapshot.et0);             // ET0 calculé
console.log(snapshot.irrigationNeed);  // Besoin irrigation
console.log(snapshot.topography);      // Élévation, pente
console.log(snapshot.vegetation);      // NDVI, santé
console.log(snapshot.recommendations); // Recommandations consolidées
```

### Résumé Dashboard
```typescript
const summary = realDataAggregator.getDashboardSummary(snapshot);

console.log(summary.health);       // "✅ Bonne"
console.log(summary.waterStatus);  // "💧 Irrigation nécessaire"
console.log(summary.nextAction);   // "Irriguer avant le 20/12"
console.log(summary.priority);     // "high" | "medium" | "low"
```

---

## 📱 Intégration Frontend

### 1. DashboardScreen
Afficher météo + santé + irrigation:
```typescript
import { realDataAggregator } from '@/services/weather';

const loadFieldData = async () => {
  const snapshot = await realDataAggregator.getFieldData(
    field.id,
    field.location.latitude,
    field.location.longitude,
    new Date(field.sowingDate)
  );
  
  const summary = realDataAggregator.getDashboardSummary(snapshot);
  // Afficher dans Dashboard
};
```

### 2. MapScreen
Overlay NDVI sur Mapbox:
```typescript
import { geeService } from '@/services/weather';

const ndviData = await geeService.getNDVI(lat, lon, 100, plantingDate);
// Afficher comme couche sur la carte
```

### 3. WeatherScreen
Prévisions 7 jours:
```typescript
import { openMeteoService } from '@/services/weather';

const weather = await openMeteoService.getForecast(lat, lon);
weather.daily.forEach(day => {
  console.log(`${day.date}: ${day.temperature_max}°C, ${day.precipitation_sum}mm`);
});
```

---

## 🚀 Test des APIs

### Tester Open-Meteo (Terminal)
```bash
curl "https://api.open-meteo.com/v1/forecast?latitude=7.6944&longitude=-5.0328&daily=temperature_2m_max,precipitation_sum,et0_fao_evapotranspiration&timezone=Africa/Abidjan&forecast_days=7"
```

### Tester NASA POWER (Terminal)
```bash
curl "https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR&community=AG&longitude=-5.0328&latitude=7.6944&start=20251117&end=20251217&format=JSON"
```

### Tester Open-Elevation (Terminal)
```bash
curl -X POST "https://api.open-elevation.com/api/v1/lookup" \
  -H "Content-Type: application/json" \
  -d '{"locations":[{"latitude":7.6944,"longitude":-5.0328}]}'
```

### Tester Backend
```bash
# Météo
curl "http://192.168.10.43:8000/api/weather/weather/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Pluie
curl "http://192.168.10.43:8000/api/weather/rainfall/1?days=30" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Topographie
curl "http://192.168.10.43:8000/api/weather/topography/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# NDVI
curl "http://192.168.10.43:8000/api/weather/ndvi/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## ✅ Checklist Configuration

- [ ] **Backend lancé**: `python -m uvicorn main:app --reload`
- [ ] **Frontend lancé**: `npm start`
- [ ] **Parcelle avec GPS**: Latitude/Longitude renseignés
- [ ] **Date de plantation**: Nécessaire pour NDVI et calculs
- [ ] **(Optionnel) GEE API**: Pour NDVI Sentinel-2 réel

---

## 📊 Résumé des Sources

| Source | Gratuit | Clé API | Résolution | Fréquence | Status |
|--------|---------|---------|------------|-----------|--------|
| **Open-Meteo** | ✅ | ❌ | Point | Horaire | ✅ Actif |
| **NASA POWER** | ✅ | ❌ | ~50km | Quotidien | ✅ Actif |
| **Penman-Monteith** | ✅ | ❌ | Calcul local | Temps réel | ✅ Actif |
| **SRTM** | ✅ | ❌ | 30m | Statique | ✅ Actif |
| **GEE Sentinel-2** | ✅ | ⚠️ Optionnel | 10m | ~5 jours | ⚠️ Simulé |

---

## 🎯 Prochaines Étapes

1. **Intégrer dans Dashboard**: Afficher données réelles au lieu de mock
2. **Créer WeatherScreen**: Écran dédié météo 7 jours
3. **Afficher NDVI sur carte**: Overlay coloré selon santé
4. **Alertes automatiques**: Notifier si NDVI < 0.3 ou irrigation > 30mm
5. **Historique graphiques**: Charts pour NDVI, pluie, ET0

---

## 📚 Documentation Externe

- [Open-Meteo Docs](https://open-meteo.com/en/docs)
- [NASA POWER Docs](https://power.larc.nasa.gov/docs/)
- [FAO-56 Penman-Monteith](http://www.fao.org/3/x0490e/x0490e00.htm)
- [Open-Elevation API](https://open-elevation.com/)
- [Google Earth Engine](https://developers.google.com/earth-engine)
- [Sentinel-2 Bands](https://sentinels.copernicus.eu/web/sentinel/user-guides/sentinel-2-msi/resolutions/spatial)

---

**Tout est prêt pour alimenter l'application avec des données réelles** 🎉

Pour tester, connectez-vous et naviguez vers une parcelle avec GPS !
