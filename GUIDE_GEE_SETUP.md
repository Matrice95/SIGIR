# 🛰️ Configuration Google Earth Engine

## Étapes de Configuration

### 1. Créer un Service Account

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionner le projet **ee-metamatrice95**
3. Aller dans **IAM & Admin → Service Accounts**
4. Créer un nouveau service account:
   - Nom: `gee-service-account`
   - Description: `Service account pour SIGIR backend`
5. Cliquer sur le service account créé
6. Aller dans **Keys → Add Key → Create new key**
7. Choisir **JSON** et télécharger

### 2. Enregistrer le Service Account dans GEE

1. Aller sur [Google Earth Engine](https://code.earthengine.google.com/)
2. Cliquer sur **Assets** dans le panneau de gauche
3. Cliquer sur **New → Cloud Project**
4. Sélectionner **ee-metamatrice95**
5. Dans les paramètres du projet:
   - Aller dans **Permissions**
   - Ajouter le service account email: `ee-metamatrice95@ee-metamatrice95.iam.gserviceaccount.com`
   - Donner le rôle **Editor**

### 3. Configurer le Backend

1. Copier le fichier JSON téléchargé dans:
```bash
backend/credentials/gee-private-key.json
```

2. Installer la bibliothèque Earth Engine:
```bash
cd backend
pip install earthengine-api
```

3. Vérifier l'installation:
```bash
python -c "import ee; print(ee.__version__)"
```

### 4. Tester la Connexion

```python
import ee

# Authentification
credentials = ee.ServiceAccountCredentials(
    'ee-metamatrice95@ee-metamatrice95.iam.gserviceaccount.com',
    'credentials/gee-private-key.json'
)
ee.Initialize(credentials)

# Test
print("✅ GEE connecté!")
```

## Utilisation dans l'API

### Endpoint NDVI

Le endpoint `/api/weather/ndvi/{field_id}` utilise automatiquement GEE si configuré.

**Avec GEE configuré**: Données Sentinel-2 réelles (10m résolution)  
**Sans GEE**: Données simulées basées sur cycle de croissance

### Exemple de Requête

```bash
curl "http://192.168.10.43:8000/api/weather/ndvi/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Réponse avec GEE**:
```json
[
  {
    "date": "2025-12-17",
    "ndvi_mean": 0.752,
    "ndvi_min": 0.682,
    "ndvi_max": 0.834,
    "ndvi_std": 0.045,
    "cloud_coverage": 8.5,
    "image_id": "COPERNICUS/S2_SR_HARMONIZED/20251217T094031_20251217T094027_T30NXM"
  }
]
```

## Données Disponibles

### Collections Sentinel-2

- **COPERNICUS/S2_SR_HARMONIZED**: Level-2A (atmosphériquement corrigée) ✅ **Recommandé**
- **COPERNICUS/S2**: Level-1C (Top of Atmosphere)

### Bandes Utilisées

- **B4 (Red)**: 665nm, 10m résolution
- **B8 (NIR)**: 842nm, 10m résolution
- **NDVI**: (B8 - B4) / (B8 + B4)

### Fréquence

- **Sentinel-2A + 2B**: ~5 jours de revisite
- **Filtrage nuages**: < 30% couverture nuageuse

## Résolution des Problèmes

### Erreur: "Project not registered"

1. Vérifier que le projet existe sur [Google Cloud Console](https://console.cloud.google.com/)
2. Enregistrer le projet dans [Earth Engine](https://code.earthengine.google.com/)
3. Activer l'API Earth Engine:
   ```
   APIs & Services → Enable APIs → Earth Engine API
   ```

### Erreur: "Permission denied"

1. Vérifier les permissions du service account
2. S'assurer que le service account a le rôle **Editor** dans le projet GEE
3. Attendre quelques minutes pour la propagation des permissions

### Erreur: "Invalid credentials"

1. Vérifier que le fichier JSON est valide
2. S'assurer que le chemin est correct: `backend/credentials/gee-private-key.json`
3. Vérifier que l'email correspond: `ee-metamatrice95@ee-metamatrice95.iam.gserviceaccount.com`

## Quotas et Limites

- **Requêtes**: Illimité pour les comptes non-commerciaux
- **Calcul**: 10 000 000 d'unités de calcul/jour
- **Export**: 10 To/jour
- **Asset storage**: 250 Go

## Alternative: Sentinel Hub

Si GEE ne fonctionne pas, alternative payante mais simple:

1. Créer un compte sur [Sentinel Hub](https://www.sentinel-hub.com/)
2. Obtenir un **Instance ID** et **OAuth credentials**
3. Utiliser l'API Sentinel Hub directement

## Documentation

- [GEE Service Account Auth](https://developers.google.com/earth-engine/guides/service_account)
- [Sentinel-2 Collection](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED)
- [NDVI Calculation](https://custom-scripts.sentinel-hub.com/custom-scripts/sentinel-2/ndvi/)
