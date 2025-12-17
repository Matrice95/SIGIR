import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SyncState, SyncStatus } from '@/types';

const initialState: SyncState = {
  status: {
    lastSyncAt: undefined,
    isSyncing: false,
    pendingOperations: 0,
    pendingPhotos: 0,
    hasError: false,
    errorMessage: undefined,
    nextSyncAt: undefined,
  },
  isOnline: true,
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    startSync: (state) => {
      state.status.isSyncing = true;
      state.status.hasError = false;
      state.status.errorMessage = undefined;
    },
    syncSuccess: (state) => {
      state.status.isSyncing = false;
      state.status.lastSyncAt = new Date();
      state.status.pendingOperations = 0;
      state.status.pendingPhotos = 0;
      state.status.hasError = false;
      state.status.errorMessage = undefined;
    },
    syncFailure: (state, action: PayloadAction<string>) => {
      state.status.isSyncing = false;
      state.status.hasError = true;
      state.status.errorMessage = action.payload;
    },
    updatePendingCounts: (state, action: PayloadAction<{ operations: number; photos: number }>) => {
      state.status.pendingOperations = action.payload.operations;
      state.status.pendingPhotos = action.payload.photos;
    },
    setNextSyncTime: (state, action: PayloadAction<Date>) => {
      state.status.nextSyncAt = action.payload;
    },
    clearSyncError: (state) => {
      state.status.hasError = false;
      state.status.errorMessage = undefined;
    },
  },
});

export const {
  setOnlineStatus,
  startSync,
  syncSuccess,
  syncFailure,
  updatePendingCounts,
  setNextSyncTime,
  clearSyncError,
} = syncSlice.actions;

export default syncSlice.reducer;
