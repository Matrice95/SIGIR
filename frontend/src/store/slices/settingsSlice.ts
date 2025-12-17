import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SettingsState, NotificationSettings, MapSettings } from '@/types';
import { APP_CONFIG } from '@/constants/config';

const initialState: SettingsState = {
  language: APP_CONFIG.DEFAULT_LANGUAGE,
  notifications: {
    irrigationAlerts: true,
    criticalStageReminders: true,
    rainAlerts: true,
    customReminders: true,
    notificationTime: APP_CONFIG.NOTIFICATION_HOUR,
  },
  mapSettings: {
    defaultLayer: 'ndvi',
    showLabels: true,
    autoDownloadOfflineMaps: true,
  },
  storageUsed: 0,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<'fr' | 'dioula'>) => {
      state.language = action.payload;
    },
    updateNotificationSettings: (state, action: PayloadAction<Partial<NotificationSettings>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    updateMapSettings: (state, action: PayloadAction<Partial<MapSettings>>) => {
      state.mapSettings = { ...state.mapSettings, ...action.payload };
    },
    setStorageUsed: (state, action: PayloadAction<number>) => {
      state.storageUsed = action.payload;
    },
    resetSettings: () => initialState,
  },
});

export const {
  setLanguage,
  updateNotificationSettings,
  updateMapSettings,
  setStorageUsed,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
