# SIGIR Backend API

API FastAPI pour le système SIGIR (Système d'Information pour la Gestion de l'Irrigation du Riz).

## 🚀 Installation

1. Créer un environnement virtuel :
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
```

2. Installer les dépendances :
```bash
pip install -r requirements.txt
```

3. Configurer les variables d'environnement :
```bash
cp .env.example .env
# Éditer .env avec vos valeurs
```

4. Initialiser la base de données :
```bash
python init_db.py
```

5. Lancer le serveur :
```bash
python main.py
# ou
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📚 Documentation API

Une fois le serveur lancé, accédez à :
- Swagger UI : http://localhost:8000/docs
- ReDoc : http://localhost:8000/redoc

## 🔑 Endpoints principaux

### Authentication
- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter
- `GET /api/auth/me` - Info utilisateur

### Fields (Parcelles)
- `POST /api/fields` - Créer une parcelle
- `GET /api/fields` - Liste des parcelles
- `GET /api/fields/{id}` - Détails d'une parcelle
- `PUT /api/fields/{id}` - Modifier une parcelle
- `DELETE /api/fields/{id}` - Supprimer une parcelle

### Operations
- `POST /api/operations` - Créer une opération
- `GET /api/operations` - Liste des opérations
- `GET /api/operations/{id}` - Détails d'une opération

### Weather
- `GET /api/weather/current` - Météo actuelle
- `GET /api/weather/forecast` - Prévisions 7 jours

### ETP (Évapotranspiration)
- `GET /api/etp/{field_id}` - Calcul ETP pour une parcelle
- `GET /api/etp/calculate/manual` - Calcul ETP manuel

### Alerts
- `GET /api/alerts` - Liste des alertes
- `PATCH /api/alerts/{id}` - Marquer comme lu

## 🗄️ Base de données

Par défaut, l'API utilise PostgreSQL. Configuration dans `.env` :

```
DATABASE_URL=postgresql://user:password@localhost:5432/sigir_db
```

Pour SQLite (dev uniquement) :
```
DATABASE_URL=sqlite:///./sigir.db
```

## 🔐 Authentification

Toutes les routes (sauf `/api/auth/register` et `/api/auth/login`) nécessitent un token JWT dans le header :

```
Authorization: Bearer <votre_token>
```

## 📊 Services

### Weather Service
Intégration avec OpenWeatherMap API pour les prévisions météo.

### ETP Service
Calcul de l'évapotranspiration avec l'équation FAO Penman-Monteith :
- ET₀ : Évapotranspiration de référence
- Kc : Coefficient cultural (par stade de croissance)
- ETc : Évapotranspiration de la culture
- Recommandations d'irrigation

## 🌾 Coefficients culturaux (Riz)

- Initial (0-20 jours) : Kc = 1.05
- Développement (20-40 jours) : Kc = 1.10
- Mi-saison (40-90 jours) : Kc = 1.20
- Fin de saison (90-120 jours) : Kc = 0.90

## 🧪 Tests

```bash
pytest
```

## 📝 License

MIT
