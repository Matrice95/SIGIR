# 🎉 BACKEND SIGIR - ENTIÈREMENT FONCTIONNEL

## ✅ État Actuel

Le backend est maintenant **100% opérationnel** avec :

- ✅ **Authentification** : Login/Register avec JWT
- ✅ **Base de données** : SQLite avec utilisateur et parcelle test
- ✅ **5 Sources de données réelles** :
  - Open-Meteo (météo)
  - NASA POWER (pluviométrie)
  - SRTM (topographie)
  - Google Earth Engine (NDVI Sentinel-2)
  - Penman-Monteith (ETP)
- ✅ **SMI (Soil Moisture Index)** : Calcul humidité du sol + recommandations irrigation
- ✅ **Évaluation risque inondation**
- ✅ **Recommandations intelligentes** basées sur stade phénologique

---

## 📋 Informations de Connexion Test

```
Phone: +2250707342607
Password: 1234
Field ID: a2027a84-37d5-45f7-a686-51aba6e90add
```

**Parcelle Test** : Bouaké, Côte d'Ivoire (7.6944°N, -5.0328°W, 340m)

---

## 🚀 Démarrage du Backend

### Option 1 : Démarrage Simple
```bash
cd /home/matrice95/RICE/backend
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Option 2 : Démarrage en Arrière-Plan
```bash
cd /home/matrice95/RICE/backend
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &
```

### Option 3 : Redémarrage Complet
```bash
cd /home/matrice95/RICE/backend
pkill -9 uvicorn
sleep 2
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🧪 Tests

### Test Complet de Tous les Endpoints
```bash
cd /home/matrice95/RICE/backend
python3 test_all_endpoints.py
```

### Test SMI Uniquement
```bash
cd /home/matrice95/RICE/backend
python3 test_smi.py
```

### Test Login Manuel
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+2250707342607", "password": "1234"}'
```

### Test SMI Manuel
```bash
# 1. Login et récupérer le token
TOKEN=$(curl -s -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+2250707342607", "password": "1234"}' \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# 2. Appeler SMI
curl -s "http://localhost:8000/api/weather/smi/a2027a84-37d5-45f7-a686-51aba6e90add" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

---

## 📡 Endpoints Disponibles

### Authentification
- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter
- `GET /api/auth/me` - Profil utilisateur

### Utilisateurs
- `GET /api/users/me` - Mon profil
- `PUT /api/users/me` - Mettre à jour profil

### Parcelles
- `GET /api/fields` - Liste de mes parcelles
- `POST /api/fields` - Créer une parcelle
- `GET /api/fields/{id}` - Détails parcelle
- `PUT /api/fields/{id}` - Modifier parcelle
- `DELETE /api/fields/{id}` - Supprimer parcelle

### Météo & Satellite
- `GET /api/weather/weather/{field_id}` - Prévisions 7 jours (Open-Meteo)
- `GET /api/weather/rainfall/{field_id}` - Pluviométrie (NASA POWER)
- `GET /api/weather/topography/{field_id}` - Topographie (SRTM)
- `GET /api/weather/ndvi/{field_id}` - NDVI Sentinel-2 (GEE)

### SMI & Irrigation
- `GET /api/weather/smi/{field_id}` - **SMI complet + Recommandations**
- `GET /api/weather/smi-test/{field_id}` - SMI sans authentification (debug)

### ETP
- `GET /api/etp/calculate/{field_id}` - Évapotranspiration Penman-Monteith

### Système
- `GET /` - Informations API
- `GET /health` - Health check
- `GET /docs` - Documentation Swagger

---

## 📊 Exemple Réponse SMI

```json
{
  "smi": 0.29,
  "smi_class": "SEC",
  "swdi": -1.00,
  "swdi_class": "STRESS_HYDRIQUE",
  "components": {
    "ndvi_contribution": 40.0,
    "ndwi_contribution": 35.0,
    "rainfall_contribution": 15.0,
    "temperature_contribution": 10.0
  },
  "confidence": 100,
  "flood_risk": {
    "risk_level": "MODÉRÉ",
    "risk_score": 30,
    "warnings": ["Terrain plat: drainage lent"],
    "days_until_saturation": null
  },
  "recommendation": {
    "action": "IRRIGUER_SOUS_48H",
    "priority": "HAUTE",
    "volume_mm": 30,
    "reason": "SMI=0.29 < seuil critique 0.40 pour tallage",
    "details": [
      "Stade tallage: Formation des talles",
      "SMI actuel: 0.29 (sec)",
      "SMI requis: >0.40",
      "Pluies insuffisantes prévues: 0.0mm"
    ],
    "next_actions": [
      "Planifier irrigation de 30mm dans 24-48h",
      "Vérifier disponibilité eau",
      "Surveiller évolution SMI"
    ],
    "next_check_hours": 48
  },
  "field_info": {
    "phenology_stage": "tallage",
    "soil_type": "sol_argilo_limoneux",
    "elevation": 340.0,
    "rainfall_7d": 20.9,
    "rainfall_forecast_7d": 0.0,
    "temperature_avg": 26.0,
    "ndvi": 0.177,
    "ndwi": -0.100
  },
  "timestamp": "2025-12-18T13:35:00.000000"
}
```

---

## 🔧 Maintenance

### Réinitialiser la Base de Données
```bash
cd /home/matrice95/RICE/backend
python3 fix_backend.py
```

Ce script :
- Supprime l'ancienne base SQLite
- Recrée toutes les tables
- Crée l'utilisateur test (+2250707342607 / 1234)
- Crée la parcelle test Bouaké

### Voir les Logs
```bash
# Logs en temps réel
tail -f /tmp/backend.log

# Dernières 50 lignes
tail -50 /tmp/backend.log

# Erreurs uniquement
grep ERROR /tmp/backend.log
```

### Arrêter le Backend
```bash
pkill -9 uvicorn
```

---

## 🌾 Stades Phénologiques du Riz

| Stade | Jours après plantation | SMI Min | SMI Optimal | Priorité |
|-------|------------------------|---------|-------------|----------|
| Semis | 0-10 | 0.50 | 0.70 | HAUTE |
| Levée | 10-20 | 0.45 | 0.65 | HAUTE |
| Tallage | 20-40 | 0.40 | 0.60 | MOYENNE |
| **Montaison** | 40-65 | 0.50 | 0.70 | **CRITIQUE** |
| **Épiaison** | 65-90 | 0.60 | 0.75 | **CRITIQUE** |
| Maturation | 90-120 | 0.35 | 0.50 | BASSE |

---

## 💧 Classes SMI

| SMI | Classe | Description | Action |
|-----|--------|-------------|---------|
| 0.0 - 0.2 | TRÈS_SEC | Sol très sec, stress sévère | IRRIGUER_IMMÉDIATEMENT |
| 0.2 - 0.4 | SEC | Sol sec, irrigation nécessaire | IRRIGUER_SOUS_48H |
| 0.4 - 0.6 | NORMAL | Humidité correcte | SURVEILLANCE |
| 0.6 - 0.8 | HUMIDE | Sol humide | NE_PAS_IRRIGUER |
| 0.8 - 1.0 | TRÈS_HUMIDE | Saturation, risque asphyxie | RISQUE_ASPHYXIE |

---

## 🌊 Niveaux Risque Inondation

| Niveau | Score | Actions |
|--------|-------|---------|
| FAIBLE | 0-25 | Surveillance normale |
| MODÉRÉ | 25-50 | Vérifier drainage |
| ÉLEVÉ | 50-75 | Préparer évacuation eau |
| CRITIQUE | 75-100 | NE PAS IRRIGUER, creuser rigoles |

---

## 📁 Structure Backend

```
backend/
├── app/
│   ├── api/routes/          # Endpoints API
│   │   ├── auth.py          # Authentification
│   │   ├── fields.py        # Parcelles
│   │   ├── users.py         # Utilisateurs
│   │   ├── weather.py       # Météo + SMI
│   │   └── etp.py           # Évapotranspiration
│   ├── core/                # Configuration
│   │   ├── config.py        # Settings
│   │   └── security.py      # JWT, hashing
│   ├── db/                  # Base de données
│   │   └── database.py      # SQLAlchemy
│   ├── models/              # Modèles SQLAlchemy
│   │   ├── user.py
│   │   └── field.py
│   ├── schemas/             # Schémas Pydantic
│   │   └── user.py
│   └── services/            # Logique métier
│       ├── soil_moisture.py              # Calcul SMI/SWDI
│       └── irrigation_recommendations.py # Recommandations
├── main.py                  # Application FastAPI
├── rice.db                  # Base SQLite
├── fix_backend.py           # Script réinitialisation
├── test_all_endpoints.py    # Tests complets
└── test_smi.py             # Test SMI
```

---

## ✨ Prochaines Étapes

### Backend
- [ ] Créer modèle `Operation` (irrigation, fertilisation, etc.)
- [ ] Créer modèle `Alert` (alertes inondation, sécheresse)
- [ ] Historique SMI (stocker dans DB, graphiques)
- [ ] API SoilGrids pour types de sol réels
- [ ] Calcul pente via DEM (Digital Elevation Model)

### Frontend React Native
- [ ] Créer `SMICard.tsx` - Affichage SMI avec gauge
- [ ] Créer `FloodRiskCard.tsx` - Alertes inondation
- [ ] Intégrer SMI dans `WeatherScreen.tsx`
- [ ] Graphiques historiques SMI (30/60/90 jours)
- [ ] Notifications push pour irrigation urgente
- [ ] Dashboard avec résumé multi-parcelles

---

## 🆘 Dépannage

### Erreur "Address already in use"
```bash
pkill -9 uvicorn
lsof -ti:8000 | xargs kill -9
```

### Erreur "IntegrityError: UNIQUE constraint"
```bash
python3 fix_backend.py  # Réinitialise la DB
```

### GEE Timeout
- Normal si première requête (initialisation)
- Augmenter timeout à 60s
- Vérifier connexion internet

### Token JWT invalide
- Re-login pour obtenir nouveau token
- Token expire après 30 jours

---

## 📞 Support

Backend créé le : **18 décembre 2025**  
Python : 3.13  
FastAPI : 0.109.0  
SQLite : 3.x  

Tout fonctionne parfaitement ! 🎉
