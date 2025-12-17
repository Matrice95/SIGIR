/**
 * Service de gestion des opérations Realm
 * CRUD pour toutes les entités offline
 * NOTE: Realm temporairement désactivé pour test - à réactiver plus tard
 */

// import Realm from 'realm';
// import { getRealmInstance } from './schemas';
import type { Field, Operation, SatelliteData, Weather, Alert } from '@/types';

// Placeholder functions for now
const getRealmInstance = async (): Promise<any> => null;

/**
 * CRUD Parcelles
 */
export const FieldsDB = {
  /**
   * Récupère toutes les parcelles
   */
  async getAll(): Promise<Field[]> {
    const realm = await getRealmInstance();
    const fields = realm.objects('Field').sorted('createdAt', true);
    return JSON.parse(JSON.stringify(fields));
  },

  /**
   * Récupère une parcelle par ID
   */
  async getById(id: string): Promise<Field | null> {
    const realm = await getRealmInstance();
    const field = realm.objectForPrimaryKey('Field', new Realm.BSON.ObjectId(id));
    return field ? JSON.parse(JSON.stringify(field)) : null;
  },

  /**
   * Crée une nouvelle parcelle
   */
  async create(field: Omit<Field, 'id' | 'createdAt' | 'updatedAt'>): Promise<Field> {
    const realm = await getRealmInstance();
    let created: any;
    
    realm.write(() => {
      created = realm.create('Field', {
        _id: new Realm.BSON.ObjectId(),
        serverId: field.id || '',
        name: field.name,
        area: field.area,
        latitude: field.location.latitude,
        longitude: field.location.longitude,
        polygonJSON: JSON.stringify(field.polygon),
        variety: field.variety,
        sowingDate: field.sowingDate,
        expectedHarvestDate: field.expectedHarvestDate,
        currentStage: field.currentStage,
        healthStatus: field.healthStatus,
        isActive: field.isActive,
        userId: field.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isSynced: false,
      });
    });
    
    return JSON.parse(JSON.stringify(created));
  },

  /**
   * Met à jour une parcelle
   */
  async update(id: string, updates: Partial<Field>): Promise<void> {
    const realm = await getRealmInstance();
    
    realm.write(() => {
      const field = realm.objectForPrimaryKey('Field', new Realm.BSON.ObjectId(id));
      if (field) {
        Object.assign(field, {
          ...updates,
          updatedAt: new Date(),
          isSynced: false,
        });
      }
    });
  },

  /**
   * Supprime une parcelle
   */
  async delete(id: string): Promise<void> {
    const realm = await getRealmInstance();
    
    realm.write(() => {
      const field = realm.objectForPrimaryKey('Field', new Realm.BSON.ObjectId(id));
      if (field) {
        realm.delete(field);
      }
    });
  },

  /**
   * Récupère les parcelles non synchronisées
   */
  async getUnsyncedFields(): Promise<Field[]> {
    const realm = await getRealmInstance();
    const fields = realm.objects('Field').filtered('isSynced == false');
    return JSON.parse(JSON.stringify(fields));
  },
};

/**
 * CRUD Opérations
 */
export const OperationsDB = {
  /**
   * Récupère toutes les opérations
   */
  async getAll(fieldId?: string): Promise<Operation[]> {
    const realm = await getRealmInstance();
    let operations;
    
    if (fieldId) {
      operations = realm.objects('Operation')
        .filtered('fieldId == $0', fieldId)
        .sorted('date', true);
    } else {
      operations = realm.objects('Operation').sorted('date', true);
    }
    
    return JSON.parse(JSON.stringify(operations));
  },

  /**
   * Crée une nouvelle opération
   */
  async create(operation: Omit<Operation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Operation> {
    const realm = await getRealmInstance();
    let created: any;
    
    realm.write(() => {
      created = realm.create('Operation', {
        _id: new Realm.BSON.ObjectId(),
        serverId: '',
        fieldId: operation.fieldId,
        type: operation.type,
        date: operation.date,
        description: operation.description,
        cost: operation.cost || 0,
        photosJSON: JSON.stringify(operation.photos || []),
        latitude: operation.location?.latitude,
        longitude: operation.location?.longitude,
        quantity: operation.quantity,
        unit: operation.unit,
        isSynced: false,
        userId: operation.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
    
    return JSON.parse(JSON.stringify(created));
  },

  /**
   * Supprime une opération
   */
  async delete(id: string): Promise<void> {
    const realm = await getRealmInstance();
    
    realm.write(() => {
      const operation = realm.objectForPrimaryKey('Operation', new Realm.BSON.ObjectId(id));
      if (operation) {
        realm.delete(operation);
      }
    });
  },

  /**
   * Récupère les opérations non synchronisées
   */
  async getUnsyncedOperations(): Promise<Operation[]> {
    const realm = await getRealmInstance();
    const operations = realm.objects('Operation').filtered('isSynced == false');
    return JSON.parse(JSON.stringify(operations));
  },
};

/**
 * CRUD Données Satellitaires
 */
export const SatelliteDB = {
  /**
   * Récupère les données satellite pour une parcelle
   */
  async getByFieldId(fieldId: string): Promise<SatelliteData[]> {
    const realm = await getRealmInstance();
    const data = realm.objects('SatelliteData')
      .filtered('fieldId == $0', fieldId)
      .sorted('date', true);
    return JSON.parse(JSON.stringify(data));
  },

  /**
   * Sauvegarde des données satellite
   */
  async save(data: SatelliteData): Promise<void> {
    const realm = await getRealmInstance();
    
    realm.write(() => {
      realm.create('SatelliteData', {
        _id: new Realm.BSON.ObjectId(),
        serverId: data.id,
        fieldId: data.fieldId,
        date: data.date,
        ndviAverage: data.ndviAverage,
        ndviMin: data.ndviMin,
        ndviMax: data.ndviMax,
        ndviStdDev: data.ndviStdDev,
        cloudCover: data.cloudCover,
        pixelsJSON: JSON.stringify(data.pixels),
        source: data.source,
        isProcessed: data.isProcessed,
        createdAt: new Date(),
      }, Realm.UpdateMode.Modified);
    });
  },
};

/**
 * CRUD Météo
 */
export const WeatherDB = {
  /**
   * Récupère les données météo pour une parcelle
   */
  async getByFieldId(fieldId: string, days: number = 30): Promise<Weather[]> {
    const realm = await getRealmInstance();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const data = realm.objects('Weather')
      .filtered('fieldId == $0 AND date >= $1', fieldId, startDate)
      .sorted('date', true);
    return JSON.parse(JSON.stringify(data));
  },

  /**
   * Sauvegarde des données météo
   */
  async save(weather: Weather): Promise<void> {
    const realm = await getRealmInstance();
    
    realm.write(() => {
      realm.create('Weather', {
        _id: new Realm.BSON.ObjectId(),
        serverId: weather.id,
        fieldId: weather.fieldId,
        date: weather.date,
        temperatureMin: weather.temperatureMin,
        temperatureMax: weather.temperatureMax,
        temperatureAvg: weather.temperatureAvg,
        precipitation: weather.precipitation,
        humidity: weather.humidity,
        windSpeed: weather.windSpeed,
        evapotranspiration: weather.evapotranspiration,
        solarRadiation: weather.solarRadiation,
        source: weather.source,
        createdAt: new Date(),
      }, Realm.UpdateMode.Modified);
    });
  },
};

/**
 * CRUD Alertes
 */
export const AlertsDB = {
  /**
   * Récupère toutes les alertes actives
   */
  async getActive(): Promise<Alert[]> {
    const realm = await getRealmInstance();
    const now = new Date();
    
    const alerts = realm.objects('Alert')
      .filtered('expiresAt == null OR expiresAt > $0', now)
      .sorted('createdAt', true);
    return JSON.parse(JSON.stringify(alerts));
  },

  /**
   * Crée une alerte
   */
  async create(alert: Omit<Alert, 'id' | 'createdAt'>): Promise<void> {
    const realm = await getRealmInstance();
    
    realm.write(() => {
      realm.create('Alert', {
        _id: new Realm.BSON.ObjectId(),
        serverId: '',
        fieldId: alert.fieldId,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        actionRequired: alert.actionRequired,
        isRead: false,
        createdAt: new Date(),
        expiresAt: alert.expiresAt,
      });
    });
  },

  /**
   * Marque une alerte comme lue
   */
  async markRead(id: string): Promise<void> {
    const realm = await getRealmInstance();
    
    realm.write(() => {
      const alert = realm.objectForPrimaryKey('Alert', new Realm.BSON.ObjectId(id));
      if (alert) {
        (alert as any).isRead = true;
      }
    });
  },
};
