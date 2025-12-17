# 📐 ARCHITECTURE FRONTEND SIGIR

## Vue d'ensemble

Application React Native **offline-first** avec synchronisation intelligente.
Architecture Redux Toolkit + Realm Database + React Navigation.

---

## 🏗️ STACK DÉTAILLÉE

### Core
- **React Native** `0.74.5` - Framework mobile
- **Expo** `~51.0.0` - Toolchain & build
- **TypeScript** `5.3.3` - Typage statique

### State Management
- **Redux Toolkit** `2.0.1` - État global
- **Redux Persist** `6.0.0` - Persistance état
- **React Redux** `9.0.4` - Bindings React

### Navigation
- **React Navigation** `6.1.9` - Core navigation
  - Bottom Tabs (5 onglets principaux)
  - Native Stack (modals & détails)

### Database Offline
- **Realm** `12.5.0` - SQLite local
- **@realm/react** `0.6.0` - Hooks React

### UI Components
- **@expo/vector-icons** `14.0.0` - Ionicons
- **expo-linear-gradient** `13.0.2` - Gradients
- **react-native-gesture-handler** `2.16.1` - Gestures

### Maps & Location
- **@rnmapbox/maps** `10.1.30` - Cartes Mapbox
- **expo-location** `17.0.1` - Géolocalisation

### Media & Files
- **expo-image-picker** `15.0.5` - Photos
- **expo-file-system** `17.0.1` - Système fichiers

### Notifications
- **expo-notifications** `0.28.0` - Push notifications

### Utilities
- **date-fns** `3.0.0` - Manipulation dates
- **@react-native-community/netinfo** `11.3.1` - État réseau
- **@react-native-async-storage/async-storage** `1.23.1` - Storage

---

## 📂 STRUCTURE DES DOSSIERS

```
src/
├── components/          # Composants UI réutilisables
│   ├── Button.tsx              # Bouton personnalisé (4 variants)
│   ├── Card.tsx                # Container avec shadow
│   ├── HealthBadge.tsx         # Badge statut santé 🟢🟡🔴
│   ├── Loading.tsx             # Spinner
│   ├── ErrorMessage.tsx        # Message erreur
│   └── EmptyState.tsx          # État vide
│
├── screens/             # Écrans de l'application
│   ├── SplashScreen.tsx        # Splash au démarrage
│   ├── LoginScreen.tsx         # Connexion
│   │
│   # 5 onglets principaux
│   ├── DashboardScreen.tsx     # ✅ Accueil (complet)
│   ├── MapScreen.tsx           # 🗺️ Carte NDVI (placeholder)
│   ├── CalendarScreen.tsx      # 📅 Timeline phéno (complet)
│   ├── JournalScreen.tsx       # 📋 Opérations (complet)
│   ├── SettingsScreen.tsx      # ⚙️ Paramètres (complet)
│   │
│   # Écrans modaux/détails
│   ├── AddFieldScreen.tsx      # Ajouter parcelle (TODO)
│   ├── AddOperationScreen.tsx  # Ajouter opération (TODO)
│   ├── FieldDetailsScreen.tsx  # Détails parcelle (TODO)
│   └── OperationDetailsScreen.tsx # Détails opération (TODO)
│
├── navigation/          # Configuration navigation
│   ├── RootNavigator.tsx       # Stack principal
│   └── MainNavigator.tsx       # Bottom tabs (5 onglets)
│
├── store/               # Redux Toolkit
│   ├── index.ts                # Configuration store + persist
│   ├── hooks.ts                # useAppDispatch, useAppSelector
│   └── slices/                 # Reducers
│       ├── authSlice.ts        # Authentification utilisateur
│       ├── fieldsSlice.ts      # Parcelles de riz
│       ├── operationsSlice.ts  # Opérations agricoles
│       ├── satelliteSlice.ts   # Données NDVI Sentinel-2
│       ├── weatherSlice.ts     # Météo CHIRPS/MODIS
│       ├── alertsSlice.ts      # Alertes système
│       ├── syncSlice.ts        # État synchronisation
│       └── settingsSlice.ts    # Paramètres app
│
├── services/            # Logique métier
│   ├── initialization.ts       # Init permissions, notifications
│   ├── cropwat.ts             # ✅ Calculs irrigation CROPWAT
│   └── database/
│       ├── schemas.ts          # Schémas Realm (7 tables)
│       └── operations.ts       # CRUD Realm
│
├── constants/           # Constantes
│   ├── theme.ts               # COLORS, TYPOGRAPHY, SPACING, etc.
│   └── config.ts              # APP_CONFIG, CROPWAT_CONFIG, STAGES, etc.
│
├── types/               # Types TypeScript
│   └── index.ts               # User, Field, Operation, etc. (50+ types)
│
├── utils/               # Utilitaires (à créer)
├── hooks/               # Custom hooks (à créer)
└── models/              # Modèles métier (à créer)
```

---

## 🔄 FLUX DE DONNÉES

### Architecture Offline-First

```
┌─────────────────┐
│   UI Screens    │ ← React Components
└────────┬────────┘
         │ dispatch actions
         ↓
┌─────────────────┐
│  Redux Store    │ ← État global (8 slices)
└────────┬────────┘
         │ persist
         ↓
┌─────────────────┐
│ AsyncStorage    │ ← Persistance Redux
└─────────────────┘

┌─────────────────┐
│   UI Screens    │
└────────┬────────┘
         │ CRUD operations
         ↓
┌─────────────────┐
│  Realm DB       │ ← Base SQLite locale (7 tables)
└────────┬────────┘
         │ sync (when online)
         ↓
┌─────────────────┐
│  Backend API    │ ← FastAPI (à développer)
└─────────────────┘
```

### Synchronisation

1. **Création offline** :
   - Données sauvegardées dans Realm
   - Flag `isSynced = false`
   - Badge "⏳ En attente" affiché

2. **Détection connexion** :
   - NetInfo écoute changements réseau
   - Store Redux mis à jour (`isOnline`)

3. **Sync automatique** :
   - Récupère données non synchro (`isSynced = false`)
   - POST vers backend API
   - Mise à jour `isSynced = true`
   - Badge devient "✓ Synchronisé"

---

## 🗄️ SCHÉMAS REALM

### 7 Tables (Schemas)

```typescript
User {
  _id: ObjectId
  serverId: string
  name: string
  phone: string
  email?: string
  role: 'agent' | 'admin'
  createdAt: Date
}

Field {
  _id: ObjectId
  serverId: string
  name: string
  area: number
  latitude: number
  longitude: number
  polygonJSON: string          // JSON stringifié
  variety: string              // Ex: "WITA 9"
  sowingDate: Date
  expectedHarvestDate: Date
  currentStage: string         // "TALLAGE", "FLORAISON", etc.
  healthStatus: string         // "healthy" | "warning" | "critical"
  isActive: boolean
  userId: string
  isSynced: boolean
  createdAt: Date
  updatedAt: Date
}

Operation {
  _id: ObjectId
  serverId: string
  fieldId: string
  type: string                 // "IRRIGATION", "SEMIS", etc.
  date: Date
  description: string
  cost?: number
  photosJSON: string           // JSON stringifié
  latitude?: number
  longitude?: number
  quantity?: number
  unit?: string
  isSynced: boolean
  userId: string
  createdAt: Date
  updatedAt: Date
}

SatelliteData {
  _id: ObjectId
  serverId: string
  fieldId: string
  date: Date
  ndviAverage: number          // 0-1
  ndviMin: number
  ndviMax: number
  ndviStdDev: number
  cloudCover: number
  pixelsJSON: string           // JSON stringifié
  source: string               // "sentinel2" | "landsat8"
  isProcessed: boolean
  createdAt: Date
}

Weather {
  _id: ObjectId
  serverId: string
  fieldId: string
  date: Date
  temperatureMin: number
  temperatureMax: number
  temperatureAvg: number
  precipitation: number        // mm
  humidity: number             // %
  windSpeed: number            // km/h
  evapotranspiration: number   // mm
  solarRadiation?: number      // MJ/m²/day
  source: string               // "chirps" | "modis"
  createdAt: Date
}

Alert {
  _id: ObjectId
  serverId: string
  fieldId: string
  type: string                 // "irrigation_urgent", etc.
  severity: string             // "info" | "warning" | "critical"
  title: string
  message: string
  actionRequired?: string
  isRead: boolean
  createdAt: Date
  expiresAt?: Date
}
```

---

## 🧮 SERVICE CROPWAT

### Fonctions principales

```typescript
// Coefficient cultural selon stade
getCropCoefficient(stage: PhenologicalStage): number

// ETc = ET0 × Kc
calculateCropEvapotranspiration(et0: number, kc: number): number

// Pluie efficace = Pluie × 0.8
calculateEffectiveRainfall(precipitation: number): number

// Besoin = ETc + Infiltration - Pluie efficace
calculateIrrigationNeed(etc, precipitation, infiltration): number

// Recommandation = Besoin / Efficacité
calculateRecommendedIrrigation(netNeed: number): number

// Status selon besoin
getIrrigationStatus(needMm: number): HealthStatus

// Calcul complet pour une parcelle
calculateFieldIrrigationNeeds(field, weatherData): IrrigationNeed
```

### Coefficients Kc WITA 9

| Stade               | Jours  | Kc   | Critique |
|---------------------|--------|------|----------|
| Semis               | 0      | 1.05 | Non      |
| Levée               | 0-7    | 1.05 | Non      |
| Tallage             | 7-35   | 1.10 | Non      |
| Init. Panicule      | 35-70  | 1.20 | **OUI**  |
| Floraison           | 70-90  | 1.20 | **OUI**  |
| Maturation          | 90-120 | 0.90 | Non      |
| Récolte             | 120    | -    | **OUI**  |

---

## 🎨 DESIGN SYSTEM

### Couleurs (`COLORS`)

```typescript
primary: '#2E7D32'       // Vert agriculture
primaryLight: '#4CAF50'
primaryDark: '#1B5E20'

secondary: '#FF6F00'     // Orange alerte
healthy: '#4CAF50'       // Sain 🟢
warning: '#FFA726'       // Vigilance 🟡
critical: '#F44336'      // Critique 🔴

background: '#F5F5F5'
surface: '#FFFFFF'
text: '#212121'
textSecondary: '#757575'
```

### Typographie (`TYPOGRAPHY`)

```typescript
fontSize: {
  xs: 10, sm: 12, base: 14, lg: 16,
  xl: 18, xxl: 20, xxxl: 24, huge: 32
}

fontWeight: {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700'
}
```

### Spacing (`SPACING`)

```typescript
xs: 4, sm: 8, md: 12, base: 16,
lg: 20, xl: 24, xxl: 32, xxxl: 48
```

---

## 🔐 AUTHENTIFICATION

### Flow simplifié

1. **LoginScreen** : Saisie téléphone
2. Dispatch `loginStart()`
3. Appel API `/auth/login` (TODO)
4. Dispatch `loginSuccess(user)`
5. Navigation vers `MainNavigator`

### Storage

- User stocké dans Redux (`authSlice`)
- Persisté dans AsyncStorage (redux-persist)
- Accessible via `useAppSelector(state => state.auth.user)`

---

## 🚀 OPTIMISATIONS PERFORMANCES

### Déjà implémenté

- ✅ Redux persist (évite rechargements)
- ✅ Realm database (queries rapides)
- ✅ Memoization composants (React.memo potentiel)
- ✅ Lazy loading images (avec Expo Image)

### À implémenter

- **FlatList virtualisé** : Pour longues listes opérations
- **Image compression** : Avant sauvegarde photos
- **Pagination** : Chargement lazy données historiques
- **Cache API** : Redux middleware pour cache réponses

---

## 📊 METRICS & MONITORING

### À ajouter (Phase 2)

- **Sentry** : Crash reporting
- **Analytics** : Usage tracking (Expo Analytics)
- **Performance** : React Native Performance Monitor
- **Network** : Logs requêtes API (intercepteurs)

---

## 🧪 TESTS (À développer)

### Structure proposée

```
__tests__/
├── components/
│   ├── Button.test.tsx
│   └── Card.test.tsx
├── screens/
│   ├── DashboardScreen.test.tsx
│   └── LoginScreen.test.tsx
├── services/
│   ├── cropwat.test.ts
│   └── database/operations.test.ts
└── store/
    └── slices/
        └── authSlice.test.ts
```

### Outils

- **Jest** : Test runner
- **@testing-library/react-native** : Tests composants
- **React Test Renderer** : Snapshots

---

## 📝 CONVENTIONS CODE

### Naming

- **Composants** : PascalCase (`Button.tsx`)
- **Hooks** : camelCase avec préfixe `use` (`useAppSelector`)
- **Types** : PascalCase avec suffixe (`UserState`, `FieldProps`)
- **Constants** : UPPER_SNAKE_CASE (`APP_CONFIG`)
- **Fonctions** : camelCase (`calculateIrrigationNeed`)

### Structure fichiers

```typescript
// Imports
import React from 'react';
import { View } from 'react-native';

// Types
interface Props { ... }

// Component
export default function MyComponent({ prop }: Props) {
  // Hooks
  // State
  // Functions
  // Render
}

// Styles
const styles = StyleSheet.create({ ... });
```

---

## 🔮 ROADMAP TECHNIQUE

### Phase 1 : MVP (Actuel - 70%)
- ✅ Architecture de base
- ✅ Navigation
- ✅ Redux store
- ✅ Realm schemas
- ✅ Écrans principaux
- 🚧 Formulaires (en cours)

### Phase 2 : Intégrations (À venir)
- Backend API FastAPI
- Mapbox configuration
- Synchronisation offline/online
- Notifications push

### Phase 3 : Fonctionnalités avancées
- Analyse prédictive (ML)
- Recommandations intelligentes
- Mode hors-ligne complet (30j données)
- Export rapports PDF

### Phase 4 : Optimisation
- Performance tuning
- Tests unitaires & E2E
- CI/CD pipeline
- Monitoring production

---

**Version architecture** : 1.0.0  
**Dernière mise à jour** : Décembre 2025
