# 🚀 SIGIR - Guide de Démarrage Rapide

## 📋 Prérequis

- Python 3.10+
- Node.js 18+
- Expo Go installé sur votre téléphone
- Ordinateur et téléphone sur le même réseau WiFi

---

## ⚡ Démarrage en 3 Étapes

### 1️⃣ Lancer le Backend (Terminal 1)

```bash
cd /home/matrice95/RICE/backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

✅ **Vérification :** Ouvrir http://192.168.10.43:8000/ dans un navigateur
- Vous devriez voir : `{"message":"SIGIR API - Système d'Information pour la Gestion de l'Irrigation"}`

---

### 2️⃣ Lancer le Frontend (Terminal 2)

```bash
cd /home/matrice95/RICE/frontend
npx expo start
```

✅ **Vérification :** Un QR code s'affiche dans le terminal

---

### 3️⃣ Tester sur Mobile

1. **Ouvrir Expo Go** sur votre téléphone
2. **Scanner le QR code** affiché dans le terminal
3. **Attendre le chargement** de l'application (première fois : 1-2 minutes)
4. **Se connecter avec :**
   ```
   Numéro : 0707342607
   Mot de passe : 1234
   ```

---

## ✅ Checklist de Test

### Page de Connexion
- [ ] Voir le logo SIGIR 🌾
- [ ] Champ numéro avec indicatif +225 🇨🇮
- [ ] Champ mot de passe avec icône œil 👁️
- [ ] Bouton "Se connecter" désactivé si formulaire invalide
- [ ] Message d'erreur si mauvais identifiants
- [ ] Chargement pendant l'authentification

### Dashboard
- [ ] Message "Bonjour, Test User 👋"
- [ ] Message "Aucune parcelle" avec bouton "Créer une parcelle"
- [ ] Pull-to-refresh fonctionne

### Création de Parcelle
- [ ] Formulaire avec tous les champs
- [ ] Validation en temps réel
- [ ] Sélecteur de date
- [ ] Message de succès après création
- [ ] Retour au dashboard avec la nouvelle parcelle affichée

---

## 🐛 Résolution de Problèmes

### ❌ Backend ne démarre pas
```bash
# Vérifier si le port 8000 est déjà utilisé
lsof -i :8000

# Tuer le processus existant
kill -9 <PID>

# Relancer le backend
cd /home/matrice95/RICE/backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### ❌ Frontend ne démarre pas
```bash
# Nettoyer le cache
cd /home/matrice95/RICE/frontend
npx expo start --clear

# Si problème de dépendances
npm install --legacy-peer-deps
```

### ❌ Erreur "Network Error" dans l'app
1. Vérifier que le backend tourne : `curl http://192.168.10.43:8000/`
2. Vérifier que le téléphone et l'ordinateur sont sur le même WiFi
3. Vérifier l'adresse IP dans `.env` :
   ```bash
   cat /home/matrice95/RICE/frontend/.env
   # API_BASE_URL devrait être http://192.168.10.43:8000
   ```

### ❌ QR code ne scanne pas
- Redémarrer Expo avec `npx expo start --tunnel`
- Ou utiliser le mode tunnel : `npx expo start --tunnel`

---

## 📊 Vérifications Système

### Backend actif ?
```bash
curl http://localhost:8000/
# Devrait retourner un JSON avec "status": "online"
```

### Base de données OK ?
```bash
cd /home/matrice95/RICE/backend
sqlite3 sigir.db "SELECT * FROM users;"
# Devrait afficher le user de test
```

### Frontend compile ?
```bash
cd /home/matrice95/RICE/frontend
npx tsc --noEmit
# Pas d'erreurs TypeScript
```

---

## 🎯 Scénario de Test Complet

### Test 1 : Authentification
1. Lancer l'app
2. Saisir : `0707342607` / `1234`
3. Cliquer "Se connecter"
4. ✅ Devrait arriver sur le dashboard en ~1-2 secondes

### Test 2 : Création de Parcelle
1. Sur le dashboard, cliquer "Créer une parcelle"
2. Remplir :
   - Nom : `Test Parcelle 1`
   - Superficie : `2.5`
   - Variété : `NERICA 1`
   - Sol : `Argileux`
   - Date : Aujourd'hui
3. Cliquer "Créer"
4. ✅ Devrait voir le message de succès et la parcelle s'afficher

### Test 3 : Rafraîchissement
1. Sur le dashboard avec une parcelle
2. Tirer vers le bas (pull-to-refresh)
3. ✅ Devrait recharger les données depuis l'API

### Test 4 : Déconnexion
1. Aller dans Paramètres (Settings)
2. Cliquer "Déconnexion"
3. ✅ Devrait revenir sur la page de connexion

---

## 📱 Commandes Expo Utiles

Dans le terminal Expo, appuyer sur :
- **`r`** → Recharger l'application
- **`m`** → Ouvrir le menu développeur sur le téléphone
- **`j`** → Ouvrir le debugger
- **`Ctrl+C`** → Arrêter le serveur

---

## 🔧 Configuration IP

Si votre IP change, mettre à jour `.env` :

```bash
cd /home/matrice95/RICE/frontend
nano .env
```

Modifier :
```
API_BASE_URL=http://VOTRE_NOUVELLE_IP:8000
```

Sauvegarder et relancer :
```bash
npx expo start --clear
```

---

## 📞 Support

### Logs Backend
```bash
tail -f /tmp/backend.log
```

### Logs Frontend
Les logs apparaissent dans le terminal Expo en temps réel.

### Base de Données
```bash
cd /home/matrice95/RICE/backend
sqlite3 sigir.db
sqlite> .tables
sqlite> SELECT * FROM users;
sqlite> SELECT * FROM fields;
sqlite> .quit
```

---

## 🎉 Succès !

Si vous pouvez :
1. ✅ Vous connecter avec `0707342607` / `1234`
2. ✅ Voir le dashboard
3. ✅ Créer une parcelle
4. ✅ Voir la parcelle s'afficher

**L'application fonctionne parfaitement !** 🚀

---

## 📚 Documentation Complète

Pour plus de détails, voir :
- `AMELIORATIONS_COMPLETEES.md` → Détails des améliorations
- `README.md` → Documentation générale
- `backend/README.md` → Documentation API backend

---

*Version : 1.0.0*
*Date : 17 décembre 2024*
