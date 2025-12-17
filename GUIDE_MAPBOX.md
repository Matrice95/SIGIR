# 🗺️ Guide d'Implémentation Mapbox GL + OpenStreetMap

## ✅ Étapes Complétées

### 1. Installation des Dépendances
- ✅ `@rnmapbox/maps` installé
- ✅ `react-native-maps@1.20.1` installé (version compatible Expo SDK 54)

### 2. Services Créés

#### **MapService** (`src/services/mapService.ts`)
Service unifié pour Mapbox GL et OpenStreetMap avec:
- ✅ Configuration Mapbox (satellite, offline, zoom 2-20)
- ✅ Configuration OSM (tiles OpenStreetMap, zoom 2-19)
- ✅ 6 styles Mapbox (satellite, streets, outdoors, light, dark, navigation)
- ✅ 3 couches OSM (standard, satellite Esri, terrain)
- ✅ Régions rizicoles CI (Bouaké, Korhogo, Man, Gagnoa)
- ✅ Calcul de région, superficie, distance (Haversine)
- ✅ Détection de point dans polygone
- ✅ Support cache offline

### 3. Écrans et Composants

#### **MapScreen** (`src/screens/MapScreen.tsx`)
Écran carte complètement réécrit avec:
- ✅ Affichage parcelles avec markers personnalisés
- ✅ Sélection de type de carte (standard/satellite/hybride/relief)
- ✅ Sélection de couches (aucune/NDVI/NDWI/limites)
- ✅ Actions rapides (centrer parcelles, régions rizicoles)
- ✅ Info provider (Mapbox/OSM)
- ✅ Contrôles flottants cachables
- ✅ EmptyState si aucune parcelle
- ✅ Navigation vers détails parcelle

#### **MapLayers** (`src/components/map/MapLayers.tsx`)
Composants de couches:
- ✅ FieldBoundariesLayer (polygones de parcelles)
- ✅ NDVILayer (placeholder pour Sentinel-2)
- ✅ NDWILayer (placeholder pour humidité)

#### **MapLegend** (`src/components/map/MapLegend.tsx`)
Légendes pour:
- ✅ NDVI (santé végétation, 6 niveaux)
- ✅ NDWI (humidité sol, 6 niveaux)
- ✅ Boundaries (limites parcelles)

---

## 🔧 Configuration Requise

### 1. Token Mapbox (Optionnel)

Pour activer Mapbox GL avec satellite haute résolution:

1. Créer un compte gratuit sur [mapbox.com](https://account.mapbox.com/auth/signup/)
2. Obtenir un **Access Token** (25 000 MAU gratuits)
3. Ajouter dans `frontend/.env`:

```env
MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91cl91c2VybmFtZSIsImEiOiJjbHh4eHh4eHgifQ.xxxxx
```

**Sans token**: L'application utilisera automatiquement OpenStreetMap (100% gratuit).

### 2. Configuration Expo (si utilisation de Mapbox)

Si vous voulez utiliser Mapbox GL Native, ajouter dans `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "@rnmapbox/maps",
        {
          "RNMapboxMapsDownloadToken": "VOTRE_MAPBOX_TOKEN"
        }
      ]
    ]
  }
}
```

---

## 📱 Test de l'Application

### 1. Lancer le Backend
```bash
cd backend
source venv/bin/activate
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Lancer le Frontend
```bash
cd frontend
npm start
```

Scanner le QR code avec Expo Go.

### 3. Tester MapScreen

1. **Connexion**:
   - Utilisateur: `+2250707342607`
   - Mot de passe: `1234`

2. **Créer une parcelle avec localisation**:
   - Aller dans "Ajouter une parcelle"
   - Remplir les informations
   - Cliquer sur "Obtenir ma position" pour capturer GPS
   - Sauvegarder

3. **Naviguer vers la carte**:
   - Aller dans l'onglet "Carte"
   - Voir la parcelle affichée avec marker
   - Tester les contrôles:
     * Type de carte (Plan/Satellite/Hybride/Relief)
     * Couches (Aucune/NDVI/NDWI/Limites)
     * Actions (Centrer parcelles, Régions rizicoles)

4. **Interactions**:
   - Cliquer sur un marker de parcelle → Voir détails
   - Cliquer sur "Voir détails" → Navigation vers FieldDetails
   - Bouton "Centrer parcelles" → Zoom sur toutes les parcelles
   - Bouton "Régions rizicoles" → Vue CI avec zones Bouaké/Korhogo/Man/Gagnoa

---

## 🛠️ Prochaines Étapes

### Phase 1: Intégration NDVI/NDWI Sentinel-2
- [ ] Configurer Google Earth Engine API
- [ ] Créer service Sentinel-2 pour télécharger images
- [ ] Calculer NDVI/NDWI à partir des bandes NIR, Red, Green
- [ ] Afficher couches NDVI/NDWI en overlay
- [ ] Ajouter MapLegend dynamique

### Phase 2: Dessin de Parcelles
- [ ] Activer mode dessin sur carte
- [ ] Permettre de tracer polygone en plaçant des points
- [ ] Calculer superficie automatiquement
- [ ] Sauvegarder coordonnées dans backend

### Phase 3: Cache Offline
- [ ] Télécharger tiles de régions sélectionnées
- [ ] Stocker dans AsyncStorage/FileSystem
- [ ] Afficher tiles en cache en mode offline
- [ ] Gérer expiration et mise à jour

### Phase 4: Analyse Avancée
- [ ] Détection de maladies par NDVI
- [ ] Alertes sur zones à faible NDVI
- [ ] Historique NDVI pour suivre évolution
- [ ] Export de rapports avec cartes

---

## 📊 Fonctionnalités Actuelles

| Fonctionnalité | Status | Provider |
|---|---|---|
| Affichage parcelles | ✅ | react-native-maps |
| Markers personnalisés | ✅ | react-native-maps |
| Types de carte | ✅ | react-native-maps |
| Localisation utilisateur | ✅ | react-native-maps |
| Sélection de couches | ✅ | Interface UI |
| NDVI/NDWI actif | ⚠️ | Placeholder (nécessite Sentinel-2) |
| Polygones de parcelles | ⚠️ | Prêt (nécessite coordonnées) |
| Cache offline | ❌ | À implémenter |
| Dessin de parcelles | ❌ | À implémenter |

---

## 🐛 Problèmes Connus

1. **NDVI/NDWI non fonctionnels**: Nécessitent intégration Sentinel-2 ou Mapbox Satellite
2. **Pas de polygones**: Les parcelles actuelles n'ont que latitude/longitude (pas de boundaries)
3. **Offline non testé**: Fonctionnalité de cache à implémenter et tester

---

## 📚 Documentation

- [Mapbox GL Native](https://docs.mapbox.com/android/maps/guides/)
- [react-native-maps](https://github.com/react-native-maps/react-native-maps)
- [OpenStreetMap Tiles](https://wiki.openstreetmap.org/wiki/Tiles)
- [Sentinel-2 NDVI](https://custom-scripts.sentinel-hub.com/custom-scripts/sentinel-2/ndvi/)
- [Google Earth Engine](https://earthengine.google.com/)

---

## ✅ Validation

Pour valider l'implémentation actuelle:

```bash
# 1. Vérifier les fichiers créés
ls -la frontend/src/services/mapService.ts
ls -la frontend/src/screens/MapScreen.tsx
ls -la frontend/src/components/map/MapLayers.tsx
ls -la frontend/src/components/map/MapLegend.tsx

# 2. Vérifier les dépendances
cd frontend && npm list react-native-maps @rnmapbox/maps

# 3. Lancer l'app et tester la carte
npm start
```

**Résultat attendu**: Carte fonctionnelle avec markers de parcelles, contrôles de type de carte et couches, navigation fluide.
