# 🌾 SIGIR - Système d'Information pour la Gestion de l'Irrigation du Riz

Application mobile AgriTech pour optimiser la gestion de l'irrigation des parcelles de riz en Côte d'Ivoire.

## 📱 Fonctionnalités

### ✅ Actuellement Implémentées

- **🔐 Authentification sécurisée** avec JWT
- **📊 Dashboard intelligent** avec suivi en temps réel
- **🌾 Gestion des parcelles** (CRUD complet)
- **💧 Calcul des besoins en eau** (CROPWAT simplifié)
- **�� Calendrier cultural** avec stades phénologiques
- **🗺️ Cartographie** des parcelles (Mapbox GL)
- **🌤️ Données météo** intégrées
- **📈 Calcul ETP** (Évapotranspiration)
- **🔔 Système d'alertes** intelligent
- **📱 Mode hors-ligne** avec synchronisation

## 🏗️ Architecture

```
SIGIR/
├── backend/           # API FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── api/      # Routes API
│   │   ├── models/   # Modèles SQLAlchemy
│   │   ├── schemas/  # Schémas Pydantic
│   │   └── services/ # Logique métier
│   └── main.py
│
├── frontend/          # React Native + Expo
│   ├── src/
│   │   ├── components/  # Composants réutilisables
│   │   ├── screens/     # Écrans de l'app
│   │   ├── navigation/  # Navigation
│   │   ├── services/    # Services API
│   │   ├── store/       # Redux Toolkit
│   │   └── utils/       # Utilitaires
│   └── App.tsx
│
└── pipelines/         # Pipelines ML (futur)
```

## 🚀 Démarrage Rapide

### Prérequis

- Python 3.10+
- Node.js 18+
- Expo Go (sur mobile)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npx expo start
```

Scannez le QR code avec Expo Go.

## 📚 Documentation

- [Guide de démarrage](GUIDE_DEMARRAGE.md)
- [Améliorations complétées](AMELIORATIONS_COMPLETEES.md)
- [API Documentation](backend/README.md)

## 🔧 Technologies

### Backend
- **FastAPI** - Framework web moderne
- **SQLAlchemy** - ORM Python
- **SQLite** - Base de données
- **JWT** - Authentification sécurisée
- **Pydantic** - Validation des données

### Frontend
- **React Native** - Framework mobile
- **Expo** - Plateforme de développement
- **Redux Toolkit** - Gestion d'état
- **Axios** - Client HTTP
- **React Navigation** - Navigation
- **Mapbox GL** - Cartographie

## 📊 Données de Test

**Utilisateur :**
- Numéro : `0707342607`
- Mot de passe : `1234`

## 🎯 Roadmap

### Phase 1 (✅ Complétée)
- [x] Backend API complet
- [x] Frontend mobile fonctionnel
- [x] Authentification sécurisée
- [x] Gestion des parcelles
- [x] Calcul CROPWAT

### Phase 2 (En cours)
- [ ] Machine Learning pour prédictions
- [ ] Notifications push
- [ ] Export PDF des rapports
- [ ] Mode multi-utilisateur

### Phase 3 (Futur)
- [ ] Intégration capteurs IoT
- [ ] Analyse satellite (Google Earth Engine)
- [ ] Dashboard web admin
- [ ] API publique

## 👥 Contributeurs

- **Matrice95** - Développeur principal

## 📄 Licence

Ce projet est sous licence MIT.

## 🙏 Remerciements

- **CROPWAT** pour les formules de calcul
- **Mapbox** pour la cartographie
- **Expo** pour la plateforme mobile
- **FastAPI** pour le framework backend

---

**Version:** 1.0.0  
**Date:** 17 décembre 2024  
**Statut:** ✅ Production Ready
