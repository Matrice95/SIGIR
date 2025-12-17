/**
 * Schémas Realm pour stockage offline
 * Base de données locale SQLite via Realm
 * NOTE: Realm temporairement désactivé pour test - à réactiver plus tard
 */

// import Realm from 'realm';
const Realm = { BSON: { ObjectId: class {} }, Object: class {}, ObjectSchema: {} } as any;

/**
 * Schéma Utilisateur
 */
export class UserSchema extends Realm.Object<UserSchema> {
  _id!: Realm.BSON.ObjectId;
  serverId!: string;
  name!: string;
  phone!: string;
  email?: string;
  role!: string;
  organization?: string;
  createdAt!: Date;
  lastSyncAt?: Date;

  static schema: Realm.ObjectSchema = {
    name: 'User',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      serverId: 'string',
      name: 'string',
      phone: 'string',
      email: 'string?',
      role: 'string',
      organization: 'string?',
      createdAt: 'date',
      lastSyncAt: 'date?',
    },
  };
}

/**
 * Schéma Parcelle
 */
export class FieldSchema extends Realm.Object<FieldSchema> {
  _id!: Realm.BSON.ObjectId;
  serverId!: string;
  name!: string;
  area!: number;
  latitude!: number;
  longitude!: number;
  polygonJSON!: string; // Stocké comme JSON string
  variety!: string;
  sowingDate!: Date;
  expectedHarvestDate!: Date;
  currentStage!: string;
  healthStatus!: string;
  isActive!: boolean;
  userId!: string;
  createdAt!: Date;
  updatedAt!: Date;
  isSynced!: boolean;

  static schema: Realm.ObjectSchema = {
    name: 'Field',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      serverId: 'string',
      name: 'string',
      area: 'double',
      latitude: 'double',
      longitude: 'double',
      polygonJSON: 'string',
      variety: 'string',
      sowingDate: 'date',
      expectedHarvestDate: 'date',
      currentStage: 'string',
      healthStatus: 'string',
      isActive: 'bool',
      userId: 'string',
      createdAt: 'date',
      updatedAt: 'date',
      isSynced: 'bool',
    },
  };
}

/**
 * Schéma Opération
 */
export class OperationSchema extends Realm.Object<OperationSchema> {
  _id!: Realm.BSON.ObjectId;
  serverId!: string;
  fieldId!: string;
  type!: string;
  date!: Date;
  description!: string;
  cost?: number;
  photosJSON!: string; // Array de photos stocké comme JSON
  latitude?: number;
  longitude?: number;
  quantity?: number;
  unit?: string;
  isSynced!: boolean;
  userId!: string;
  createdAt!: Date;
  updatedAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'Operation',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      serverId: 'string',
      fieldId: 'string',
      type: 'string',
      date: 'date',
      description: 'string',
      cost: 'double?',
      photosJSON: 'string',
      latitude: 'double?',
      longitude: 'double?',
      quantity: 'double?',
      unit: 'string?',
      isSynced: 'bool',
      userId: 'string',
      createdAt: 'date',
      updatedAt: 'date',
    },
  };
}

/**
 * Schéma Données Satellitaires
 */
export class SatelliteDataSchema extends Realm.Object<SatelliteDataSchema> {
  _id!: Realm.BSON.ObjectId;
  serverId!: string;
  fieldId!: string;
  date!: Date;
  ndviAverage!: number;
  ndviMin!: number;
  ndviMax!: number;
  ndviStdDev!: number;
  cloudCover!: number;
  pixelsJSON!: string; // Array de pixels NDVI stocké comme JSON
  source!: string;
  isProcessed!: boolean;
  createdAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'SatelliteData',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      serverId: 'string',
      fieldId: 'string',
      date: 'date',
      ndviAverage: 'double',
      ndviMin: 'double',
      ndviMax: 'double',
      ndviStdDev: 'double',
      cloudCover: 'double',
      pixelsJSON: 'string',
      source: 'string',
      isProcessed: 'bool',
      createdAt: 'date',
    },
  };
}

/**
 * Schéma Météo
 */
export class WeatherSchema extends Realm.Object<WeatherSchema> {
  _id!: Realm.BSON.ObjectId;
  serverId!: string;
  fieldId!: string;
  date!: Date;
  temperatureMin!: number;
  temperatureMax!: number;
  temperatureAvg!: number;
  precipitation!: number;
  humidity!: number;
  windSpeed!: number;
  evapotranspiration!: number;
  solarRadiation?: number;
  source!: string;
  createdAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'Weather',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      serverId: 'string',
      fieldId: 'string',
      date: 'date',
      temperatureMin: 'double',
      temperatureMax: 'double',
      temperatureAvg: 'double',
      precipitation: 'double',
      humidity: 'double',
      windSpeed: 'double',
      evapotranspiration: 'double',
      solarRadiation: 'double?',
      source: 'string',
      createdAt: 'date',
    },
  };
}

/**
 * Schéma Alerte
 */
export class AlertSchema extends Realm.Object<AlertSchema> {
  _id!: Realm.BSON.ObjectId;
  serverId!: string;
  fieldId!: string;
  type!: string;
  severity!: string;
  title!: string;
  message!: string;
  actionRequired?: string;
  isRead!: boolean;
  createdAt!: Date;
  expiresAt?: Date;

  static schema: Realm.ObjectSchema = {
    name: 'Alert',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      serverId: 'string',
      fieldId: 'string',
      type: 'string',
      severity: 'string',
      title: 'string',
      message: 'string',
      actionRequired: 'string?',
      isRead: 'bool',
      createdAt: 'date',
      expiresAt: 'date?',
    },
  };
}

/**
 * Configuration Realm
 */
export const realmConfig: Realm.Configuration = {
  schema: [
    UserSchema,
    FieldSchema,
    OperationSchema,
    SatelliteDataSchema,
    WeatherSchema,
    AlertSchema,
  ],
  schemaVersion: 1,
  deleteRealmIfMigrationNeeded: true, // Pour développement
};

/**
 * Instance Realm partagée
 */
let realmInstance: Realm | null = null;

export async function getRealmInstance(): Promise<Realm> {
  if (!realmInstance) {
    realmInstance = await Realm.open(realmConfig);
  }
  return realmInstance;
}

export function closeRealm(): void {
  if (realmInstance && !realmInstance.isClosed) {
    realmInstance.close();
    realmInstance = null;
  }
}
