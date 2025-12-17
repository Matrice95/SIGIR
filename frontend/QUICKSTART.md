# 🚀 DÉMARRAGE RAPIDE - SIGIR Frontend

## Installation (5 minutes)

### 1. Prérequis
```bash
# Vérifier Node.js (18+)
node --version

# Vérifier npm
npm --version
```

### 2. Installer dépendances
```bash
cd /home/matrice95/RICE/frontend
npm install
```

### 3. Configuration environnement
```bash
# Copier le fichier exemple
cp .env.example .env

# Éditer .env (optionnel pour tester)
nano .env
```

**Configuration minimale pour démarrer** :
```
API_BASE_URL=http://localhost:8000/api/v1
MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw
```
*Note: Token Mapbox public par défaut (limité). Créez votre compte sur https://mapbox.com pour un token personnel.*

### 4. Lancer l'application
```bash
npm start
```

Un QR code apparaîtra dans le terminal.

### 5. Tester sur smartphone

**Android :**
1. Installer [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. Ouvrir Expo Go → Scanner le QR code

**iOS :**
1. Installer [Expo Go](https://apps.apple.com/app/expo-go/id982107779)
2. Ouvrir Camera → Scanner le QR code

---

## 🎯 Ce qui fonctionne actuellement

### ✅ Écrans implémentés
- **Login** : Connexion avec numéro de téléphone
- **Dashboard** : Vue d'ensemble parcelle + irrigation + météo
- **Calendrier** : Timeline phénologique WITA 9
- **Journal** : Liste des opérations agricoles
- **Paramètres** : Configuration app, notifications, sync

### ✅ Fonctionnalités core
- Redux store configuré (8 slices)
- Navigation React Navigation (5 onglets)
- Base de données Realm offline (schemas créés)
- Service CROPWAT (calculs irrigation)
- Composants réutilisables (Button, Card, Badge, etc.)
- Système de thème (couleurs, typo, spacing)

### ⚠️ À configurer
- **Mapbox** : Carte satellite (token requis)
- **Backend API** : Connexion serveur FastAPI
- **Notifications push** : Alertes locales

---

## 🐛 Dépannage

### Erreur : "Cannot find module 'expo'"
```bash
npm install
```

### Erreur : "Metro bundler failed"
```bash
# Nettoyer cache
npm start -- --clear

# ou
expo start -c
```

### Erreur : "Network response timed out"
```bash
# Utiliser tunnel (plus lent mais fonctionne toujours)
npm start -- --tunnel
```

### L'app ne se charge pas
1. Vérifier que smartphone et PC sont sur le même réseau WiFi
2. Désactiver VPN si actif
3. Utiliser `--tunnel` si problème persiste

---

## 📱 Test rapide des écrans

Une fois l'app lancée :

1. **Login** : Entrer n'importe quel numéro (ex: +225 12 34 56 78)
2. **Dashboard** : Voir les données mockées
3. **Onglets** : Naviguer entre les 5 écrans
4. **Paramètres** : Tester les switches notifications

---

## 🔥 Commandes utiles

```bash
# Lancer app
npm start

# Lancer directement sur Android (émulateur)
npm run android

# Lancer directement sur iOS (simulateur Mac uniquement)
npm run ios

# Type checking TypeScript
npm run type-check

# Linter
npm run lint

# Nettoyer cache
expo start -c
```

---

## 📊 État du projet

**Phase actuelle** : MVP Frontend (70% complété)

**Prochaines étapes prioritaires** :
1. Formulaires ajout parcelle/opération
2. Intégration API backend
3. Configuration Mapbox
4. Synchronisation offline/online

---

## 💡 Remarques importantes

- **Données mockées** : Pour l'instant, aucune vraie donnée (backend pas encore connecté)
- **Offline** : La base Realm est configurée mais pas encore remplie
- **Mapbox** : Carte affiche un placeholder (token requis)
- **Photos** : Service prêt mais formulaire pas implémenté

---

## 🆘 Besoin d'aide ?

1. Vérifier le fichier `README.md` complet
2. Consulter les logs : `expo start` affiche les erreurs
3. Documentation Expo : https://docs.expo.dev

---

Bon développement ! 🌾
