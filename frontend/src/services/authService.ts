import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface RegisterData {
  name: string;
  phone: string;
  password: string;
  role: string;
  region?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    name: string;
    phone: string;
    is_active: boolean;
    created_at: string;
  };
}

export const authService = {
  /**
   * Connexion de l'utilisateur
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/api/auth/login', credentials);
      
      // Stocker le token et les données utilisateur
      await AsyncStorage.setItem('authToken', response.data.access_token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Numéro de téléphone ou mot de passe incorrect');
      } else if (error.response?.status === 403) {
        throw new Error('Compte désactivé. Contactez votre administrateur');
      } else if (error.message === 'Network Error') {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion');
      }
      throw new Error('Une erreur est survenue lors de la connexion');
    }
  },

  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/api/auth/register', data);
      
      // Stocker le token et les données utilisateur
      await AsyncStorage.setItem('authToken', response.data.access_token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error('Ce numéro de téléphone est déjà utilisé');
      } else if (error.message === 'Network Error') {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion');
      }
      throw new Error("Une erreur est survenue lors de l'inscription");
    }
  },

  /**
   * Récupération de l'utilisateur actuel
   */
  async getCurrentUser() {
    try {
      const response = await api.get('/api/auth/me');
      await AsyncStorage.setItem('userData', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      throw new Error('Impossible de récupérer les informations utilisateur');
    }
  },

  /**
   * Déconnexion de l'utilisateur
   */
  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  },

  /**
   * Vérification de l'état de connexion
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return token !== null;
    } catch {
      return false;
    }
  },

  /**
   * Récupération du token stocké
   */
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch {
      return null;
    }
  },
};
