import { configureStore } from '@reduxjs/toolkit';

// Reducers
import authReducer from './slices/authSlice';
import fieldsReducer from './slices/fieldsSlice';
import operationsReducer from './slices/operationsSlice';
import satelliteReducer from './slices/satelliteSlice';
import weatherReducer from './slices/weatherSlice';
import alertsReducer from './slices/alertsSlice';
import syncReducer from './slices/syncSlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    fields: fieldsReducer,
    operations: operationsReducer,
    satellite: satelliteReducer,
    weather: weatherReducer,
    alerts: alertsReducer,
    sync: syncReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
