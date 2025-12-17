# 🔑 Guide Rapide: Obtenir les Credentials Google Earth Engine

## ⚡ Étapes Rapides (5 minutes)

### 1. Aller sur Google Cloud Console
👉 [https://console.cloud.google.com/](https://console.cloud.google.com/)

### 2. Créer/Sélectionner le Projet
- Cliquer sur le sélecteur de projet en haut
- Chercher: **ee-metamatrice95**
- Si le projet n'existe pas, le créer

### 3. Activer l'API Earth Engine
1. Menu ☰ → **APIs & Services** → **Library**
2. Chercher: "**Earth Engine API**"
3. Cliquer sur **Enable**

### 4. Créer un Service Account
1. Menu ☰ → **IAM & Admin** → **Service Accounts**
2. Cliquer **+ CREATE SERVICE ACCOUNT**
3. Remplir:
   - **Name**: `sigir-backend`
   - **Description**: `Service account pour backend SIGIR`
4. Cliquer **CREATE AND CONTINUE**
5. Rôle: Sélectionner **Editor** (ou **Earth Engine Resource Admin**)
6. Cliquer **CONTINUE** → **DONE**

### 5. Générer la Clé JSON
1. Cliquer sur le service account créé (email: `sigir-backend@ee-metamatrice95.iam.gserviceaccount.com`)
2. Onglet **KEYS**
3. **ADD KEY** → **Create new key**
4. Choisir **JSON**
5. Cliquer **CREATE**
6. Le fichier JSON se télécharge automatiquement 💾

### 6. Enregistrer dans Earth Engine
1. Aller sur [Earth Engine Code Editor](https://code.earthengine.google.com/)
2. Se connecter avec le compte **ee-metamatrice95**
3. Accepter les conditions si demandé
4. Cliquer sur **Assets** (panneau gauche)
5. Vérifier que le projet **ee-metamatrice95** est sélectionné

### 7. Installer le Fichier dans le Backend
```bash
# Copier le fichier téléchargé dans backend/credentials/
cp ~/Downloads/ee-metamatrice95-xxxxx.json /home/matrice95/RICE/backend/credentials/gee-private-key.json
```

### 8. Tester la Configuration
```bash
cd /home/matrice95/RICE/backend
python setup_gee.py
```

**Résultat attendu**:
```
============================================================
🛰️  Configuration Google Earth Engine - SIGIR
============================================================

📦 Étape 1: Vérification installation...
✅ earthengine-api installé (version 1.7.4)

🔑 Étape 2: Vérification credentials...
✅ Fichier credentials trouvé: .../credentials/gee-private-key.json

🔌 Étape 3: Test connexion GEE...
✅ GEE initialisé avec succès
✅ Test réussi - Image ID: COPERNICUS/S2_SR_HARMONIZED/...

🌿 Étape 4: Test calcul NDVI...
✅ Récupéré 6 images NDVI

📊 Dernières données NDVI:
  - 2025-12-05: NDVI = 0.752 (nuages: 8.5%)
  - 2025-12-10: NDVI = 0.768 (nuages: 12.3%)
  - 2025-12-15: NDVI = 0.781 (nuages: 5.1%)

============================================================
✅ Configuration Google Earth Engine terminée avec succès!
============================================================
```

---

## 🔧 Alternative: Utiliser un Compte Personnel

Si vous préférez utiliser votre compte personnel Google:

### 1. Authentification Interactive
```bash
earthengine authenticate
```

Suivre les instructions pour autoriser l'accès.

### 2. Modifier le Service Backend
Dans `backend/app/services/gee_service.py`, remplacer:
```python
# Authentification service account
credentials = ee.ServiceAccountCredentials(
    GEE_SERVICE_ACCOUNT, 
    GEE_PRIVATE_KEY_PATH
)
ee.Initialize(credentials)
```

Par:
```python
# Authentification par défaut
ee.Initialize()
```

---

## 📊 Vérifier l'Accès aux Données

### Test Sentinel-2
```python
import ee

ee.Initialize()

# Point de test (Bouaké, Côte d'Ivoire)
point = ee.Geometry.Point([-5.0328, 7.6944])

# Collection Sentinel-2
collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
    .filterBounds(point) \
    .filterDate('2025-01-01', '2025-12-31') \
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))

print(f"Nombre d'images: {collection.size().getInfo()}")

# Première image
first = collection.first()
print(f"Image ID: {first.id().getInfo()}")
print(f"Date: {first.date().format('YYYY-MM-dd').getInfo()}")
```

---

## 🚨 Problèmes Fréquents

### "Project is not registered with Earth Engine"
**Solution**: Aller sur [code.earthengine.google.com](https://code.earthengine.google.com/) et accepter les conditions

### "Permission denied"
**Solution**: Vérifier que le service account a le rôle **Editor** dans le projet

### "Invalid JSON"
**Solution**: Vérifier que le fichier JSON n'est pas corrompu. Télécharger à nouveau si nécessaire.

### "Quota exceeded"
**Solution**: Attendre quelques heures. Quota GEE gratuit: 10M unités/jour (largement suffisant)

---

## 📚 Ressources

- [Earth Engine Guide](https://developers.google.com/earth-engine/guides)
- [Service Account Auth](https://developers.google.com/earth-engine/guides/service_account)
- [Sentinel-2 Dataset](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED)

---

## ✅ Validation Finale

Une fois configuré, l'endpoint `/api/weather/ndvi/{field_id}` retournera des **données NDVI Sentinel-2 réelles** au lieu de données simulées.

**Test avec curl**:
```bash
curl "http://192.168.10.43:8000/api/weather/ndvi/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Résultat attendu**: Images NDVI avec couverture nuageuse réelle et ID Sentinel-2.
