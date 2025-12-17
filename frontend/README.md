# SIGIR - Système d'Information pour la Gestion de l'Irrigation du Riz 🌾

Application mobile AgriTech pour agents d'extension agricole en Côte d'Ivoire.
Gestion de l'irrigation du riz via données satellitaires + modèles climatiques.
**Fonctionne 100% OFFLINE** (zones rurales sans internet).

## 📱 STACK TECHNIQUE

### Frontend
- **React Native 0.74+** + Expo
- **Redux Toolkit** (state management)
- **React Navigation** (routing - 5 onglets)
- **Mapbox GL Native** (cartes satellites NDVI) ⚠️ *À configurer*
- **Realm** (base de données SQLite locale offline)
- **TypeScript**

### Backend (à développer)
- FastAPI (Python)
- PostgreSQL + PostGIS
- Redis (cache)
- Google Earth Engine (Sentinel-2 NDVI)
- CHIRPS (pluies), MODIS (évapotranspiration)

---

## 🚀 INSTALLATION

### Prérequis
- Node.js 18+ & npm
- Expo CLI : `npm install -g expo-cli`
- Compte Expo : https://expo.dev
- **Compte Mapbox** : https://mapbox.com (pour cartes satellites)

### Étapes

1. **Installation des dépendances**
```bash
cd frontend
npm install
```

2. **Configuration environnement**
```bash
cp .env.example .env
```

Éditez `.env` et ajoutez vos tokens :
```
MAPBOX_ACCESS_TOKEN=pk.ey...  # Token public Mapbox
MAPBOX_DOWNLOAD_TOKEN=sk.ey...  # Token download Mapbox
API_BASE_URL=http://localhost:8000/api/v1
```

3. **Lancer l'application**
```bash
npm start
```

Scannez le QR code avec :
- **iOS** : App Expo Go
- **Android** : App Expo Go

---

## 📂 STRUCTURE DU PROJET

```
frontend/
├── App.tsx                      # Point d'entrée
├── app.json                     # Config Expo
├── package.json                 # Dépendances
│
├── src/
│   ├── components/              # Composants réutilisables
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── HealthBadge.tsx
│   │   ├── Loading.tsx
│   │   ├── ErrorMessage.tsx
│   │   └── EmptyState.tsx
│   │
│   ├── screens/                 # Écrans de l'app
│   │   ├── SplashScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx       # ✅ Complet
│   │   ├── MapScreen.tsx             # ⚠️ Mapbox à configurer
│   │   ├── CalendarScreen.tsx        # ✅ Complet
│   │   ├── JournalScreen.tsx         # ✅ Complet
│   │   ├── SettingsScreen.tsx        # ✅ Complet
│   │   ├── AddFieldScreen.tsx        # 🚧 À développer
│   │   ├── AddOperationScreen.tsx    # 🚧 À développer
│   │   ├── FieldDetailsScreen.tsx    # 🚧 À développer
│   │   └── OperationDetailsScreen.tsx # 🚧 À développer
│   │
│   ├── navigation/              # Navigation React Navigation
│   │   ├── RootNavigator.tsx    # Stack principal
│   │   └── MainNavigator.tsx    # 5 onglets bottom tabs
│   │
│   ├── store/                   # Redux Toolkit
│   │   ├── index.ts             # Configuration store
│   │   ├── hooks.ts             # Hooks typés
│   │   └── slices/
│   │       ├── authSlice.ts
│   │       ├── fieldsSlice.ts
│   │       ├── operationsSlice.ts
│   │       ├── satelliteSlice.ts
│   │       ├── weatherSlice.ts
│   │       ├── alertsSlice.ts
│   │       ├── syncSlice.ts
│   │       └── settingsSlice.ts
│   │
│   ├── services/                # Services métier
│   │   ├── initialization.ts    # Init permissions, notifs
│   │   ├── cropwat.ts          # ✅ Calculs CROPWAT irrigation
│   │   └── database/
│   │       ├── schemas.ts       # Schémas Realm
│   │       └── operations.ts    # CRUD Realm
│   │
│   ├── constants/               # Constantes
│   │   ├── theme.ts            # Couleurs, typo, spacing
│   │   └── config.ts           # Config app, CROPWAT, stades phéno
│   │
│   ├── types/                   # Types TypeScript
│   │   └── index.ts
│   │
│   ├── utils/                   # Utilitaires
│   ├── hooks/                   # Custom hooks
│   └── models/                  # Modèles métier
│
└── assets/                      # Images, icônes
```

---

## 🎯 FONCTIONNALITÉS PRINCIPALES

### ✅ Implémenté (MVP)

#### 1️⃣ **Dashboard (Accueil)**
- ✅ Affichage parcelle active + situation
- ✅ Stade phénologique WITA 9 (timeline visuelle)
- ✅ Besoin irrigation (CROPWAT simplifié)
- ✅ Status santé (🟢 SAIN | 🟡 VIGILANCE | 🔴 CRITIQUE)
- ✅ Météo 7 jours preview
- ✅ Alertes urgentes

#### 2️⃣ **Carte Interactive**
- ⚠️ Placeholder (Mapbox à configurer)
- Fonctionnalités prévues :
  - Fond satellite NDVI (Sentinel-2)
  - Code couleur santé parcelles
  - Tap sur pixel → détails
  - Couches : NDVI | Humidité | Pluie CHIRPS

#### 3️⃣ **Calendrier Cultural**
- ✅ Timeline phénologique WITA 9 (120 jours)
- ✅ Dates clés : Semis → Levée → Tallage → Init Panicule → Floraison → Récolte
- ✅ Indication stades CRITIQUES

#### 4️⃣ **Journal de Bord**
- ✅ Liste chronologique opérations
- ✅ Types : Irrigation | Labourage | Semis | Engrais | Lutte ravageurs
- ✅ Filtres (7j / 30j / Tous)
- ✅ Badge "Synchronisé ✓" vs "⏳ En attente"

#### 5️⃣ **Paramètres**
- ✅ Gérer notifications
- ✅ Sync manuelle + statut
- ✅ Espace stockage utilisé
- ✅ Déconnexion

### 🚧 À Développer

- **Formulaires d'ajout** (parcelles, opérations)
- **Prise de photos** (avec géolocalisation)
- **Intégration API backend**
- **Synchronisation offline/online**
- **Carte Mapbox avec NDVI**
- **Notifications push locales**
- **Traduction Dioula** (V2)

---

## 📊 SERVICE CROPWAT

Le service `src/services/cropwat.ts` implémente les calculs d'irrigation :

### Formules
```
ETc = ET0 × Kc
Besoin net = ETc + Infiltration - Pluie efficace
Recommandation = Besoin net / Efficacité irrigation
```

### Coefficients culturaux (Kc) WITA 9
- **Semis → Tallage** : Kc = 1.05
- **Tallage → Init Panicule** : Kc = 1.10
- **Init Panicule → Floraison** : Kc = 1.20 (CRITIQUE)
- **Floraison → Maturation** : Kc = 0.90

### Paramètres
- Infiltration : 5 mm/jour
- Pluie efficace : 80% de la pluie
- Efficacité irrigation : 75%

---

## 🗄️ BASE DE DONNÉES OFFLINE (Realm)

### Schémas principaux
- **User** : Utilisateur authentifié
- **Field** : Parcelle de riz
- **Operation** : Opération agricole (irrigation, semis, etc.)
- **SatelliteData** : Données NDVI Sentinel-2
- **Weather** : Données météo CHIRPS/MODIS
- **Alert** : Alertes système

### Synchronisation
1. Données stockées localement (Realm SQLite)
2. Badge "⏳ En attente" si non synchro
3. Sync auto/manuelle vers backend (quand online)
4. Historique 30 jours gardé offline

---

## 🎨 DESIGN SYSTEM

### Couleurs
- **Primary** : `#2E7D32` (Vert agriculture)
- **Secondary** : `#FF6F00` (Orange alerte)
- **Healthy** : `#4CAF50` 🟢
- **Warning** : `#FFA726` 🟡
- **Critical** : `#F44336` 🔴

### Composants réutilisables
- `<Button>` : 4 variants (primary, secondary, outline, danger)
- `<Card>` : Container avec shadow
- `<HealthBadge>` : Badge statut santé
- `<Loading>` : Spinner
- `<ErrorMessage>` : Message d'erreur
- `<EmptyState>` : État vide

---

## 🔧 CONFIGURATION MAPBOX (Requis)

1. **Créer compte** : https://mapbox.com
2. **Obtenir tokens** :
   - Public token (pk.ey...) → `.env`
   - Download token (sk.ey...) → `.env` + `app.json`

3. **Éditer `app.json`** :
```json
{
  "plugins": [
    [
      "@rnmapbox/maps",
      {
        "RNMapboxMapsDownloadToken": "sk.ey..."
      }
    ]
  ]
}
```

4. **Installer dépendances natives** :
```bash
expo install @rnmapbox/maps
```

---

## 🚀 COMPILATION & DÉPLOIEMENT

### Build Android APK
```bash
eas build --platform android --profile preview
```

### Build iOS (nécessite compte Apple Developer)
```bash
eas build --platform ios --profile preview
```

### Configuration EAS Build
Créer `eas.json` :
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  }
}
```

---

## 📝 PROCHAINES ÉTAPES

### Phase 1 - Formulaires (Priorité haute)
1. ✅ Formulaire ajout parcelle
2. ✅ Formulaire ajout opération (avec photos)
3. ✅ Écrans détails (parcelle, opération)

### Phase 2 - Intégration backend
1. Service API (fetch, post, sync)
2. Authentification JWT
3. Synchronisation bidirectionnelle

### Phase 3 - Carte Mapbox
1. Configuration Mapbox
2. Affichage NDVI layer
3. Interactions (tap, zoom)

### Phase 4 - Notifications
1. Alertes locales (irrigation urgente)
2. Rappels stades critiques
3. Notifications pluie

---

## 🐛 DEBUGGING

### Logs
```bash
# Logs React Native
npx react-native log-android  # Android
npx react-native log-ios      # iOS

# Logs Expo
expo start --dev-client
```

### Erreurs communes

**Erreur Mapbox** :
```
Error: Mapbox token not configured
```
→ Vérifier `.env` et `app.json`

**Erreur Realm** :
```
Error: Realm not initialized
```
→ Attendre `getRealmInstance()` avant d'utiliser

**Erreur permissions** :
```
Error: Location permission denied
```
→ Activer localisation dans paramètres téléphone

---

## 📚 RESSOURCES

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Mapbox GL Native](https://github.com/rnmapbox/maps)
- [Realm Database](https://www.mongodb.com/docs/realm/)
- [CROPWAT FAO](http://www.fao.org/land-water/databases-and-software/cropwat/en/)

---

## 👨‍💻 DÉVELOPPEMENT

```bash
# Installer dépendances
npm install

# Lancer dev
npm start

# Type checking
npm run type-check

# Linter
npm run lint
```

---

## 📄 LICENSE

Propriétaire - Côte d'Ivoire 🇨🇮

---

**Version** : 1.0.0  
**Date** : Décembre 2025  
**Contact** : [Votre contact]
