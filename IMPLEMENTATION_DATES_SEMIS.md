# 📅 SYSTÈME DE DATES DE SEMIS OPTIMALES - IMPLÉMENTÉ ✅

## 🎯 VUE D'ENSEMBLE

Le système de dates de semis optimales a été entièrement implémenté pour restreindre la création de champs aux périodes scientifiquement validées selon les zones géographiques de Côte d'Ivoire.

## 📂 FICHIERS CRÉÉS/MODIFIÉS

### ✅ Nouveau fichier: `src/constants/sowingCalendar.ts`
**Contenu**: Base de données complète des fenêtres de semis optimales

**Zones configurées**:
1. **Centre (Yamoussoukro)** - 1 cycle/an
   - WITA 9 (120j): 22 mars → 26 avril (80% succès)
   - NERICA 1 (100j): 27 mars → 11 mai (80% succès)
   - ⚠️ 2e cycle impossible (pluies insuffisantes)

2. **Centre-Ouest (Man, Danané, Touba)** - 2 cycles/an possibles
   - Cycle 1: WITA 9 (1 mars → 20 avril, 85% succès)
   - Cycle 1: WITA 8 (11-30 avril, 82% succès)
   - Cycle 2: NERICA 2 (21 juil → 20 août, 78% succès)

3. **Nord (Korhogo, Odienné)** - DÉCONSEILLÉ pour riz pluvial
   - Riz pluvial: 25 mai → 15 juin (55% succès ⚠️ RISQUÉ)
   - Recommandation: Privilégier riz irrigué

4. **Sud/Sud-Ouest (Gagnoa, Abidjan, San-Pédro)** - 1-2 cycles
   - Pluvial Cycle 1: WITA 9 (15 mars → 30 avril, 83% succès)
   - Pluvial Cycle 2: NERICA 2 (1-31 juillet, 75% succès)
   - Irrigué Cycle 1: Nov-Déc repiquage (95% succès, 6-10 t/ha)
   - Irrigué Cycle 2: Juil-Août repiquage (95% succès)

**Fonctions utilitaires**:
- `getAvailableZones()` - Liste des zones disponibles
- `getSowingWindowsForZone(zoneId)` - Fenêtres par zone
- `getZoneInfo(zoneId)` - Infos complètes zone
- `isDateInSowingWindow(date, window)` - Validation date
- `findSowingWindowForDate(date, zoneId)` - Trouver fenêtre
- `getSowingWindowsForVariety(zoneId, variety)` - Fenêtres par variété
- `formatSowingWindow(window, year)` - Formatage affichage
- `getUpcomingSowingWindows(zoneId)` - Prochaines fenêtres

### ✅ Modifié: `src/screens/AddFieldScreen.tsx`

**Nouveaux états ajoutés**:
```typescript
const [zone, setZone] = useState('');
const [locality, setLocality] = useState('');
const [sowingWindow, setSowingWindow] = useState<SowingWindow | null>(null);
```

**Validation renforcée**:
- Zone géographique obligatoire
- Localité obligatoire
- Fenêtre de semis optimale obligatoire
- Date doit être dans la fenêtre sélectionnée

**Nouvelles sections UI**:

1. **📍 Zone géographique**
   - Sélection zone (Centre, Centre-Ouest, Nord, Sud/Sud-Ouest)
   - Sélection localité (liste dépend de la zone)
   - Info-box: Description régime pluviométrique et cycles/an

2. **📅 Fenêtre de semis optimale**
   - Cartes cliquables pour chaque fenêtre disponible
   - Affichage:
     * Nom (ex: "WITA 9 (120j) - Cycle 1")
     * Badge probabilité succès (couleur: vert ≥80%, jaune <80%)
     * Cycle (Principal / Décrue)
     * Dates (ex: "22 mars → 26 avril")
     * Avertissements si risqué (⚠️)
     * 2 recommandations clés
   - Filtrage automatique selon variété sélectionnée
   - Date par défaut définie au début de la fenêtre

3. **📅 Date de semis précise**
   - DatePicker avec validation
   - Alerte si date hors fenêtre:
     ```
     "La date doit être dans la fenêtre de semis optimale:
     22 mars → 26 avril
     
     Probabilité de succès: 80%"
     ```

**Logique de validation**:
```typescript
handleDateChange() {
  if (!isDateInSowingWindow(selectedDate, sowingWindow)) {
    Alert.alert('Date invalide', ...);
    return;
  }
  // Date acceptée
}
```

## 🎨 INTERFACE UTILISATEUR

### Workflow utilisateur:
1. **Étape 1**: Remplir nom, superficie
2. **Étape 2**: Choisir variété de riz
3. **Étape 3**: ⭐ **NOUVEAU** Sélectionner zone géographique
4. **Étape 4**: ⭐ **NOUVEAU** Sélectionner localité
5. **Étape 5**: ⭐ **NOUVEAU** Choisir fenêtre de semis optimale
   - Seules les fenêtres compatibles avec la variété sont affichées
   - Probabilité de succès visible
   - Avertissements si risqué
6. **Étape 6**: Choisir date précise dans la fenêtre
7. **Étape 7**: Compléter sol, localisation, notes
8. **Étape 8**: Soumettre (validation stricte)

### Exemple visuel d'une carte de fenêtre:
```
┌─────────────────────────────────────────────┐
│ WITA 9 (120j) - Cycle 1      [80% succès] │
│                                              │
│ Cycle Principal                              │
│ 📅 22 mars → 26 avril                        │
│                                              │
│ • Semis optimal: 22 mars → 26 avril         │
│ • Levée: 1-10 avril                         │
└─────────────────────────────────────────────┘
```

### Exemple avec avertissement:
```
┌─────────────────────────────────────────────┐
│ Riz pluvial (SI ABSOLUMENT)   [55% succès]│
│                                              │
│ Unique saison                                │
│ 📅 25 mai → 15 juin                          │
│                                              │
│ ⚠️ DÉCONSEILLÉ - Probabilité: 50-60%       │
│                                              │
│ • TROP RISQUÉ (50-60% succès)               │
│ • Privilégier riz irrigué                   │
└─────────────────────────────────────────────┘
```

## ✅ RESTRICTIONS IMPLÉMENTÉES

### ❌ Impossible de créer un champ si:
1. Aucune zone géographique sélectionnée
2. Aucune localité sélectionnée
3. Aucune fenêtre de semis optimale choisie
4. Date de semis hors de la fenêtre sélectionnée

### ⚠️ Avertissements affichés:
- Zone Nord + riz pluvial → "DÉCONSEILLÉ - 50-60% succès"
- Cycle 2 décrue → "Moins fiable que le cycle principal"
- Date invalide → Alert bloquante avec info fenêtre

## 📊 DONNÉES SCIENTIFIQUES INTÉGRÉES

**Source**: Recherches 1980-2017 (Kouassi et al. 2022, Kouakou et al. 2013)

**Paramètres par fenêtre**:
- Dates début/fin (format MM-DD)
- Variétés recommandées
- Probabilité succès (%)
- Stades critiques (floraison, récolte)
- Type cycle (principal, décrue)
- Recommandations agricoles
- Avertissements si risqué

**Calculs automatiques**:
- Dates réelles basées sur l'année de semis
- Validation stricte (date ∈ fenêtre)
- Filtrage selon variété choisie
- Tri chronologique des prochaines fenêtres

## 🔧 FONCTIONS DISPONIBLES

### Validation
```typescript
isDateInSowingWindow(date: Date, window: SowingWindow): boolean
```

### Recherche
```typescript
findSowingWindowForDate(date: Date, zoneId: string): SowingWindow | undefined
getSowingWindowsForVariety(zoneId: string, variety: string): SowingWindow[]
```

### Affichage
```typescript
formatSowingWindow(window: SowingWindow, year: number): string
// Retourne: "22 mars → 26 avril"

getUpcomingSowingWindows(zoneId: string, fromDate?: Date): Array<...>
// Retourne prochaines fenêtres disponibles (année courante + suivante)
```

## 🎯 IMPACT SUR L'APPLICATION

### Avant:
- ❌ Date de semis libre (n'importe quand)
- ❌ Pas de prise en compte zone géographique
- ❌ Risque élevé échec culture

### Après:
- ✅ Dates restreintes aux fenêtres optimales
- ✅ Zone et localité obligatoires
- ✅ Probabilités succès affichées (55%-95%)
- ✅ Avertissements pour fenêtres risquées
- ✅ Validation stricte avant création
- ✅ Basé sur données scientifiques 1980-2017

## 📱 EXPÉRIENCE UTILISATEUR

### Scénario 1: Agriculteur à Yamoussoukro (Centre)
1. Sélectionne "Centre (Yamoussoukro)"
2. Choisit localité "Yamoussoukro"
3. Voit info: "1 SEUL CYCLE/AN - 2e cycle impossible"
4. Sélectionne WITA 9
5. Voit 1 fenêtre: "22 mars → 26 avril (80% succès)"
6. Choisit date 5 avril 2024
7. ✅ Champ créé avec succès

### Scénario 2: Agriculteur à Man (Centre-Ouest)
1. Sélectionne "Centre-Ouest (Man, Danané, Touba)"
2. Choisit "Man"
3. Voit: "RÉGIME BIMODAL → 2 RÉCOLTES/AN"
4. Sélectionne NERICA 2
5. Voit 1 fenêtre: "Cycle 2 Décrue - 21 juil → 20 août (78%)"
6. Voit avertissement: "Moins fiable que cycle principal"
7. Décide de créer quand même
8. ✅ Champ créé (agriculteur informé du risque)

### Scénario 3: Tentative date invalide
1. Configure tout correctement
2. Sélectionne fenêtre "22 mars → 26 avril"
3. Tente de choisir date "15 mai"
4. ❌ **Alert bloquante**:
   ```
   Date invalide
   
   La date doit être dans la fenêtre de semis optimale:
   22 mars → 26 avril
   
   Probabilité de succès: 80%
   ```
5. Doit choisir date valide pour continuer

## 🚀 STATUT

✅ **COMPLÈTEMENT IMPLÉMENTÉ**

- [x] Base de données zones/fenêtres (4 zones, 11 fenêtres)
- [x] Fonctions utilitaires complètes
- [x] Interface utilisateur AddFieldScreen
- [x] Validation stricte dates
- [x] Affichage probabilités succès
- [x] Avertissements zones risquées
- [x] Filtrage par variété
- [x] Styles responsive
- [x] Compilation TypeScript OK
- [x] Messages d'erreur clairs

## 📝 NOTES TECHNIQUES

**TypeScript**: Tous les types exportés correctement
**Performances**: Calculs légers (pas de backend requis)
**Maintenance**: Facile d'ajouter nouvelles zones/fenêtres
**Extensibilité**: Système modulaire et réutilisable

**Format dates interne**: 'MM-DD' (indépendant de l'année)
**Format affichage**: Locale français ('22 mars → 26 avril')
**Validation**: Stricte avec messages explicites
