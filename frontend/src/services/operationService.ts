import api from './api';

export interface Operation {
  id: number;
  field_id: number;
  type: string;
  date: string;
  duration?: number;
  water_amount?: number;
  fertilizer_type?: string;
  fertilizer_quantity?: number;
  pesticide_type?: string;
  pesticide_quantity?: number;
  notes?: string;
  cost?: number;
  created_at: string;
}

export interface CreateOperationData {
  field_id: number;
  type: string;
  date: string;
  duration?: number;
  water_amount?: number;
  fertilizer_type?: string;
  fertilizer_quantity?: number;
  pesticide_type?: string;
  pesticide_quantity?: number;
  notes?: string;
  cost?: number;
}

export const operationService = {
  /**
   * Récupérer toutes les opérations d'une parcelle
   */
  async getOperations(fieldId: number): Promise<Operation[]> {
    try {
      const response = await api.get<Operation[]>(`/api/operations/?field_id=${fieldId}`);
      return response.data;
    } catch (error) {
      throw new Error('Erreur lors de la récupération des opérations');
    }
  },

  /**
   * Récupérer une opération spécifique
   */
  async getOperation(operationId: number): Promise<Operation> {
    try {
      const response = await api.get<Operation>(`/api/operations/${operationId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Opération introuvable');
      }
      throw new Error('Erreur lors de la récupération de l\'opération');
    }
  },

  /**
   * Créer une nouvelle opération
   */
  async createOperation(data: CreateOperationData): Promise<Operation> {
    try {
      const response = await api.post<Operation>('/api/operations/', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error('Données invalides');
      }
      throw new Error('Erreur lors de la création de l\'opération');
    }
  },

  /**
   * Mettre à jour une opération
   */
  async updateOperation(operationId: number, data: Partial<CreateOperationData>): Promise<Operation> {
    try {
      const response = await api.put<Operation>(`/api/operations/${operationId}`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Opération introuvable');
      }
      throw new Error('Erreur lors de la mise à jour de l\'opération');
    }
  },

  /**
   * Supprimer une opération
   */
  async deleteOperation(operationId: number): Promise<void> {
    try {
      await api.delete(`/api/operations/${operationId}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Opération introuvable');
      }
      throw new Error('Erreur lors de la suppression de l\'opération');
    }
  },
};
