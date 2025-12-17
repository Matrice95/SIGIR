import api from './api';

export interface Field {
  id: string;
  name: string;
  area: number;
  crop_type: string;
  variety?: string;
  planting_date?: string;
  expected_harvest_date?: string;
  latitude?: number;
  longitude?: number;
  soil_type?: string;
  status: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFieldData {
  name: string;
  area: number;
  crop_type: string;
  variety?: string;
  planting_date?: string;
  expected_harvest_date?: string;
  latitude?: number;
  longitude?: number;
  soil_type?: string;
}

export interface UpdateFieldData extends Partial<CreateFieldData> {
  health_status?: string;
}

export const fieldService = {
  /**
   * Récupérer toutes les parcelles de l'utilisateur connecté
   */
  async getFields(): Promise<Field[]> {
    try {
      const response = await api.get<Field[]>('/api/fields/');
      return response.data;
    } catch (error: any) {
      if (error.message === 'Network Error') {
        throw new Error('Impossible de se connecter au serveur');
      }
      throw new Error('Erreur lors de la récupération des parcelles');
    }
  },

  /**
   * Récupérer une parcelle spécifique
   */
  async getField(fieldId: number): Promise<Field> {
    try {
      const response = await api.get<Field>(`/api/fields/${fieldId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Parcelle introuvable');
      }
      throw new Error('Erreur lors de la récupération de la parcelle');
    }
  },

  /**
   * Créer une nouvelle parcelle
   */
  async createField(data: CreateFieldData): Promise<Field> {
    try {
      const response = await api.post<Field>('/api/fields/', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error('Données invalides. Vérifiez les informations saisies');
      }
      throw new Error('Erreur lors de la création de la parcelle');
    }
  },

  /**
   * Mettre à jour une parcelle
   */
  async updateField(fieldId: number, data: UpdateFieldData): Promise<Field> {
    try {
      const response = await api.put<Field>(`/api/fields/${fieldId}`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Parcelle introuvable');
      } else if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas accès à cette parcelle');
      }
      throw new Error('Erreur lors de la mise à jour de la parcelle');
    }
  },

  /**
   * Supprimer une parcelle
   */
  async deleteField(fieldId: number): Promise<void> {
    try {
      await api.delete(`/api/fields/${fieldId}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Parcelle introuvable');
      } else if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas accès à cette parcelle');
      }
      throw new Error('Erreur lors de la suppression de la parcelle');
    }
  },

  /**
   * Récupérer les statistiques d'une parcelle
   */
  async getFieldStats(fieldId: number) {
    try {
      const response = await api.get(`/api/fields/${fieldId}/stats`);
      return response.data;
    } catch (error) {
      throw new Error('Erreur lors de la récupération des statistiques');
    }
  },
};
