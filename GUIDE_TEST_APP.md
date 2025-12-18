# 🚀 Guide de Test de l'Application SIGIR

**Date:** 18 décembre 2025  
**Version:** 2.0 - Dashboard avec données réelles

## ✅ État des Services

### Backend (Port 8000)
- **Statut:** ✅ EN LIGNE
- **URL:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Données:** Réelles (Sentinel-2, Open-Meteo, NASA POWER, SRTM, GEE)

### Frontend (Port 8081)
- **Statut:** ✅ EN LIGNE
- **Expo:** http://localhost:8081
- **QR Code:** Disponible dans le terminal

---

## 📱 Comment Tester

### Option 1: Application Mobile (Recommandé)
1. **Installer Expo Go** sur votre téléphone:
   - Android: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **Scanner le QR Code** affiché dans le terminal

3. **Se connecter:**
   - Téléphone: `+2250707342607`
   - Code PIN: `1234`

### Option 2: Navigateur Web
1. Dans le terminal Expo, appuyer sur `w`
2. L'application s'ouvre dans le navigateur
3. Se connecter avec les mêmes identifiants

### Option 3: Émulateur Android
1. Lancer l'émulateur Android
2. Dans le terminal Expo, appuyer sur `a`

---

## 🧪 Scénarios de Test

### Test 1: Authentification ✅
- [x] Entrer le numéro de téléphone
- [x] Entrer le code PIN
- [x] Vérifier la connexion réussie

### Test 2: Dashboard Principal 🆕
**Nouveau Dashboard avec données réelles:**

#### 2.1 En-tête Parcelle
- [x] Nom: "Parcelle Test Bouaké"
- [x] Superficie: 5 ha
- [x] Localisation GPS: 7.6944°N, -5.0328°W
- [x] Badge santé (vert/orange/rouge)
- [x] Météo actuelle en temps réel

#### 2.2 Carte SMI (Soil Moisture Index)
**Indicateur principal d'humidité du sol:**
- [x] Jauge colorée selon l'état:
  - 🔴 TRÈS_SEC (0-20%)
  - 🟠 SEC (20-40%)
  - 🟢 NORMAL (40-60%)
  - 🔵 HUMIDE (60-80%)
  - 🟣 TRÈS_HUMIDE (80-100%)
- [x] Valeur SMI: ~29% (données réelles Sentinel-2)
- [x] SWDI: -1.00
- [x] Confiance: 85%
- [x] Composantes:
  - NDVI: Indice de végétation
  - NDWI: Indice d'eau
  - Pluie 7 jours
  - Température moyenne

#### 2.3 Recommandation d'Irrigation
**Card avec priorité colorée:**
- [x] Action recommandée (ex: "IRRIGATION NÉCESSAIRE")
- [x] Badge priorité (URGENTE/HAUTE/MOYENNE/BASSE)
- [x] Raison détaillée
- [x] Volume d'eau recommandé en mm
- [x] Liste d'actions à effectuer
- [x] Prochain contrôle (en heures)

#### 2.4 Risque d'Inondation
**Affiché uniquement si risque détecté:**
- [x] Niveau de risque (CRITIQUE/ÉLEVÉ/MODÉRÉ/FAIBLE)
- [x] Score /100
- [x] Jauge visuelle
- [x] Avertissements spécifiques
- [x] Jours avant saturation estimée

#### 2.5 Stade Phénologique
- [x] Stade actuel du riz (GERMINATION/TALLAGE/MONTAISON/etc.)
- [x] Type de sol
- [x] Altitude

#### 2.6 Prévisions Météo 7 Jours
**Scroll horizontal:**
- [x] Température max/min par jour
- [x] Icône météo (☀️/🌧️)
- [x] Précipitations si > 0mm
- [x] ET0 (Évapotranspiration)

#### 2.7 Actions Rapides
**4 boutons colorés:**
- [x] Météo (bleu)
- [x] Carte (vert)
- [x] ETP (orange)
- [x] Opération (violet)

#### 2.8 Pull-to-Refresh
- [x] Glisser vers le bas pour actualiser
- [x] Vérifier le rechargement des données

### Test 3: Navigation
#### Tabs Bottom
- [x] Accueil (Dashboard)
- [x] Carte
- [x] Calendrier
- [x] Journal
- [x] Paramètres

### Test 4: Écran Météo (à mettre à jour)
- [ ] Présentement avec mock data
- [ ] À connecter avec `backendService.getWeatherForecast()`

### Test 5: Carte Interactive
- [ ] Affichage de la parcelle
- [ ] Markers fonctionnels

---

## 🔍 Points de Vérification Critiques

### Données Réelles vs Mock
✅ **Dashboard:** DONNÉES RÉELLES
- SMI depuis Sentinel-2
- Météo depuis Open-Meteo
- Recommandations calculées

❌ **WeatherScreen:** MOCK DATA (à corriger)
❌ **EvapotranspirationScreen:** MOCK DATA (à corriger)

### Performance
- [x] Temps de chargement initial < 3s
- [x] Pull-to-refresh < 2s
- [x] Navigation fluide

### UX/UI
- [x] Design professionnel
- [x] Gradients et couleurs cohérentes
- [x] Loading states visibles
- [x] Erreurs gérées avec messages clairs
- [x] Pull-to-refresh intuitif

---

## 🐛 Problèmes Connus

### À Corriger
1. **WeatherScreen:** Utilise encore des données mock
2. **EvapotranspirationScreen:** Pas connecté au backend
3. **Notifications:** Pas encore implémentées
4. **Auto-refresh:** Pas de refresh automatique (uniquement manuel)

### Limitations Backend
- Pas de modèle `Operation` (routes commentées)
- Pas de modèle `Alert` (routes commentées)
- Journal des opérations non fonctionnel

---

## 📊 Données de Test Disponibles

### Utilisateur Test
- **ID:** `f4a5b89f-3d1e-4c2a-8e9b-1d3f5a7c9e1b`
- **Téléphone:** `+2250707342607`
- **Code PIN:** `1234`
- **Nom:** Koné Bakary
- **Rôle:** producteur

### Parcelle Test
- **ID:** `a2027a84-37d5-45f7-a686-51aba6e90add`
- **Nom:** Parcelle Test Bouaké
- **Superficie:** 5 ha
- **Variété:** Wita 9
- **Localisation:** 7.6944°N, -5.0328°W (Bouaké, Côte d'Ivoire)
- **Type de sol:** Clay Loam
- **Stade:** tallage

### Données SMI Actuelles (18/12/2025)
```json
{
  "smi": 0.29,
  "smi_class": "SEC",
  "swdi": -1.00,
  "confidence": 85,
  "recommendation": {
    "action": "IRRIGATION NÉCESSAIRE",
    "priority": "HAUTE",
    "reason": "Sol sec avec faible disponibilité en eau...",
    "volume_mm": 25,
    "next_check_hours": 24
  }
}
```

---

## 🎯 Prochaines Étapes

### Court Terme (Priorité HAUTE)
1. [ ] Mettre à jour `WeatherScreen` avec données réelles
2. [ ] Connecter `EvapotranspirationScreen` au backend
3. [ ] Ajouter auto-refresh SMI (toutes les heures)
4. [ ] Implémenter notifications push critiques

### Moyen Terme (Priorité MOYENNE)
1. [ ] Créer modèles `Operation` et `Alert`
2. [ ] Activer routes operations et alerts
3. [ ] Remplir écran Journal avec vraies opérations
4. [ ] Ajouter graphiques historiques SMI

### Long Terme (Priorité BASSE)
1. [ ] Comparaison multi-parcelles
2. [ ] Export PDF rapports
3. [ ] Mode hors-ligne
4. [ ] ML pour prédictions personnalisées

---

## 📝 Commandes Utiles

### Backend
```bash
# Vérifier l'état
curl http://localhost:8000/

# Voir les docs API
firefox http://localhost:8000/docs

# Tester SMI
curl http://localhost:8000/api/weather/smi/a2027a84-37d5-45f7-a686-51aba6e90add

# Logs en direct
tail -f backend.log
```

### Frontend
```bash
# Terminal Expo
cd frontend
npm start

# Commandes Expo disponibles:
# a - Android
# i - iOS  
# w - Web
# r - Reload
# m - Menu
```

### Arrêter les Services
```bash
# Arrêter Expo
Ctrl+C dans le terminal Expo

# Arrêter Backend
kill $(lsof -ti:8000)
```

---

## ✅ Checklist de Validation Finale

### Fonctionnalités Core
- [x] Login fonctionne
- [x] Dashboard affiche données réelles
- [x] SMI calculé correctement
- [x] Recommandations d'irrigation pertinentes
- [x] Météo actuelle affichée
- [x] Prévisions 7 jours
- [x] Pull-to-refresh fonctionne
- [x] Navigation fluide

### Design & UX
- [x] Interface professionnelle
- [x] Couleurs cohérentes
- [x] Gradients attractifs
- [x] Loading states
- [x] Gestion d'erreurs
- [x] Responsive design

### Performance
- [x] Chargement rapide
- [x] Pas de crashes
- [x] Utilisation mémoire raisonnable

---

## 📞 Support

**Données test:** Voir section "Données de Test Disponibles"  
**API Docs:** http://localhost:8000/docs  
**Logs Backend:** Check terminal backend ou `backend.log`  
**Logs Frontend:** Metro Bundler dans terminal Expo

---

**Bonne chance pour les tests ! 🌾💧**
