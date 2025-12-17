import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AlertsState, Alert } from '@/types';

const initialState: AlertsState = {
  alerts: [],
  unreadCount: 0,
};

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    setAlerts: (state, action: PayloadAction<Alert[]>) => {
      state.alerts = action.payload;
      state.unreadCount = action.payload.filter(a => !a.isRead).length;
    },
    addAlert: (state, action: PayloadAction<Alert>) => {
      state.alerts.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount++;
      }
    },
    markAlertRead: (state, action: PayloadAction<string>) => {
      const alert = state.alerts.find(a => a.id === action.payload);
      if (alert && !alert.isRead) {
        alert.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAlertsRead: (state) => {
      state.alerts.forEach(alert => {
        alert.isRead = true;
      });
      state.unreadCount = 0;
    },
    deleteAlert: (state, action: PayloadAction<string>) => {
      const alert = state.alerts.find(a => a.id === action.payload);
      if (alert && !alert.isRead) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.alerts = state.alerts.filter(a => a.id !== action.payload);
    },
    clearExpiredAlerts: (state) => {
      const now = new Date();
      state.alerts = state.alerts.filter(a => !a.expiresAt || a.expiresAt > now);
      state.unreadCount = state.alerts.filter(a => !a.isRead).length;
    },
  },
});

export const {
  setAlerts,
  addAlert,
  markAlertRead,
  markAllAlertsRead,
  deleteAlert,
  clearExpiredAlerts,
} = alertsSlice.actions;

export default alertsSlice.reducer;
