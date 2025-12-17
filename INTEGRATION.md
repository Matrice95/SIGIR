# Intégration Frontend-Backend SIGIR

## 🔗 Configuration de connexion

### Backend
- **URL**: http://192.168.10.43:8000
- **Documentation**: http://192.168.10.43:8000/docs

### Frontend (.env)
```
API_BASE_URL=http://192.168.10.43:8000
```

---

## 🔄 Services à modifier dans le frontend

### 1. Auth Service (`src/services/authService.ts`)

```typescript
import axios from 'axios';
import { API_BASE_URL } from '@env';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Register
export const register = async (phone: string, name: string, password: string) => {
  const response = await api.post('/api/auth/register', {
    phone,
    name,
    password,
  });
  return response.data;
};

// Login
export const login = async (phone: string, password: string) => {
  const response = await api.post('/api/auth/login', {
    phone,
    password,
  });
  // Stocker le token
  const { access_token, user } = response.data;
  await AsyncStorage.setItem('token', access_token);
  await AsyncStorage.setItem('user', JSON.stringify(user));
  return response.data;
};

// Get current user
export const getCurrentUser = async () => {
  const token = await AsyncStorage.getItem('token');
  const response = await api.get('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
```

### 2. Field Service (`src/services/fieldService.ts`)

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

// Create field
export const createField = async (fieldData: any) => {
  const headers = await getAuthHeaders();
  const response = await axios.post(
    `${API_BASE_URL}/api/fields/`,
    fieldData,
    headers
  );
  return response.data;
};

// Get all fields
export const getFields = async () => {
  const headers = await getAuthHeaders();
  const response = await axios.get(
    `${API_BASE_URL}/api/fields/`,
    headers
  );
  return response.data;
};

// Get field by ID
export const getFieldById = async (fieldId: string) => {
  const headers = await getAuthHeaders();
  const response = await axios.get(
    `${API_BASE_URL}/api/fields/${fieldId}`,
    headers
  );
  return response.data;
};

// Update field
export const updateField = async (fieldId: string, fieldData: any) => {
  const headers = await getAuthHeaders();
  const response = await axios.put(
    `${API_BASE_URL}/api/fields/${fieldId}`,
    fieldData,
    headers
  );
  return response.data;
};

// Delete field
export const deleteField = async (fieldId: string) => {
  const headers = await getAuthHeaders();
  await axios.delete(
    `${API_BASE_URL}/api/fields/${fieldId}`,
    headers
  );
};
```

### 3. Operation Service (`src/services/operationService.ts`)

```typescript
// Create operation
export const createOperation = async (operationData: any) => {
  const headers = await getAuthHeaders();
  const response = await axios.post(
    `${API_BASE_URL}/api/operations/`,
    operationData,
    headers
  );
  return response.data;
};

// Get operations (with optional field filter)
export const getOperations = async (fieldId?: string) => {
  const headers = await getAuthHeaders();
  const url = fieldId 
    ? `${API_BASE_URL}/api/operations/?field_id=${fieldId}`
    : `${API_BASE_URL}/api/operations/`;
  
  const response = await axios.get(url, headers);
  return response.data;
};
```

### 4. Weather Service (`src/services/weatherService.ts`)

```typescript
// Get current weather
export const getCurrentWeather = async (lat: number, lon: number) => {
  const headers = await getAuthHeaders();
  const response = await axios.get(
    `${API_BASE_URL}/api/weather/current?lat=${lat}&lon=${lon}`,
    headers
  );
  return response.data;
};

// Get forecast
export const getWeatherForecast = async (lat: number, lon: number, days: number = 7) => {
  const headers = await getAuthHeaders();
  const response = await axios.get(
    `${API_BASE_URL}/api/weather/forecast?lat=${lat}&lon=${lon}&days=${days}`,
    headers
  );
  return response.data;
};
```

### 5. ETP Service (`src/services/etpService.ts`)

```typescript
// Calculate ETP for a field
export const calculateFieldETP = async (
  fieldId: string,
  days: number = 7,
  irrigationEfficiency: number = 0.75
) => {
  const headers = await getAuthHeaders();
  const response = await axios.get(
    `${API_BASE_URL}/api/etp/${fieldId}?days=${days}&irrigation_efficiency=${irrigationEfficiency}`,
    headers
  );
  return response.data;
};

// Manual ETP calculation
export const calculateManualETP = async (params: {
  temp_max: number;
  temp_min: number;
  humidity: number;
  wind_speed: number;
  latitude: number;
  days_since_planting: number;
}) => {
  const headers = await getAuthHeaders();
  const queryString = new URLSearchParams(params as any).toString();
  const response = await axios.get(
    `${API_BASE_URL}/api/etp/calculate/manual?${queryString}`,
    headers
  );
  return response.data;
};
```

### 6. Alert Service (`src/services/alertService.ts`)

```typescript
// Get alerts
export const getAlerts = async (unreadOnly: boolean = false) => {
  const headers = await getAuthHeaders();
  const url = unreadOnly
    ? `${API_BASE_URL}/api/alerts/?unread_only=true`
    : `${API_BASE_URL}/api/alerts/`;
  
  const response = await axios.get(url, headers);
  return response.data;
};

// Mark alert as read
export const markAlertAsRead = async (alertId: string) => {
  const headers = await getAuthHeaders();
  const response = await axios.patch(
    `${API_BASE_URL}/api/alerts/${alertId}`,
    { is_read: true },
    headers
  );
  return response.data;
};

// Delete alert
export const deleteAlert = async (alertId: string) => {
  const headers = await getAuthHeaders();
  await axios.delete(
    `${API_BASE_URL}/api/alerts/${alertId}`,
    headers
  );
};
```

---

## 🔐 Gestion de l'authentification

### Middleware Axios avec intercepteurs

```typescript
// src/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - ajouter le token automatiquement
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - gérer les erreurs 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      // Rediriger vers login
      // navigation.navigate('Login');
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 📱 Modification des Redux Slices

### authSlice.ts

```typescript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authService from '../services/authService';

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ phone, password }: { phone: string; password: string }) => {
    const response = await authService.login(phone, password);
    return response;
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ phone, name, password }: { phone: string; name: string; password: string }) => {
    const response = await authService.register(phone, name, password);
    return response;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  },
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.access_token;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    initializeAuth: (state) => {
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.access_token;
        state.isAuthenticated = true;
        state.isLoading = false;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.access_token;
        state.isAuthenticated = true;
        state.isLoading = false;
      });
  },
});
```

### fieldsSlice.ts

```typescript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as fieldService from '../services/fieldService';

export const fetchFields = createAsyncThunk(
  'fields/fetchAll',
  async () => {
    return await fieldService.getFields();
  }
);

export const addField = createAsyncThunk(
  'fields/add',
  async (fieldData: any) => {
    return await fieldService.createField(fieldData);
  }
);

const fieldsSlice = createSlice({
  name: 'fields',
  initialState: {
    fields: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFields.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchFields.fulfilled, (state, action) => {
        state.fields = action.payload;
        state.isLoading = false;
      })
      .addCase(addField.fulfilled, (state, action) => {
        state.fields.push(action.payload);
      });
  },
});
```

---

## 🧪 Tests d'intégration

### Test de connexion

```bash
# Dans le terminal
curl -X POST http://192.168.10.43:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+2250707342607", "password": "1234"}'
```

### Test depuis l'app React Native

```typescript
// src/screens/LoginScreen.tsx
const handleLogin = async () => {
  try {
    const response = await dispatch(loginUser({ phone, password })).unwrap();
    console.log('✅ Login successful:', response);
    // Navigation automatique gérée par RootNavigator
  } catch (error) {
    console.error('❌ Login failed:', error);
    Alert.alert('Erreur', 'Identifiants incorrects');
  }
};
```

---

## 🚀 Démarrage complet

### 1. Backend
```bash
cd /home/matrice95/RICE/backend
./start.sh
```

### 2. Frontend
```bash
cd /home/matrice95/RICE/frontend
npx expo start
```

### 3. Tester la connexion
```bash
# Dans l'app mobile
# 1. Ouvrir l'app avec Expo Go
# 2. Tester la connexion avec +2250707342607 / 1234
# 3. Créer une parcelle
# 4. Voir les données synchronisées
```

---

## 📊 Checklist d'intégration

### Configuration
- [ ] Mettre à jour `API_BASE_URL` dans frontend/.env
- [ ] Vérifier que le backend est accessible depuis le téléphone
- [ ] Installer axios dans le frontend si nécessaire

### Services
- [ ] Créer/Modifier authService.ts
- [ ] Créer/Modifier fieldService.ts
- [ ] Créer/Modifier operationService.ts
- [ ] Créer/Modifier weatherService.ts
- [ ] Créer/Modifier etpService.ts
- [ ] Créer/Modifier alertService.ts

### Redux
- [ ] Modifier authSlice pour utiliser les vraies API
- [ ] Modifier fieldsSlice pour utiliser les vraies API
- [ ] Modifier operationsSlice pour utiliser les vraies API
- [ ] Modifier alertsSlice pour utiliser les vraies API

### Tests
- [ ] Tester inscription
- [ ] Tester connexion
- [ ] Tester création de parcelle
- [ ] Tester création d'opération
- [ ] Tester récupération de la météo
- [ ] Tester calcul ETP
- [ ] Tester gestion des alertes

---

## 🎯 Résumé

✅ **Backend opérationnel** : http://192.168.10.43:8000
✅ **Frontend fonctionnel** : exp://192.168.10.43:8081
📱 **Prêt pour l'intégration complète !**

**Prochaine étape** : Modifier les services du frontend pour utiliser les vraies API au lieu des données simulées.
