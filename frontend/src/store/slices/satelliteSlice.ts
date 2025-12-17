import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SatelliteState, SatelliteData } from '@/types';

const initialState: SatelliteState = {
  data: [],
  isLoading: false,
  error: null,
};

const satelliteSlice = createSlice({
  name: 'satellite',
  initialState,
  reducers: {
    setSatelliteData: (state, action: PayloadAction<SatelliteData[]>) => {
      state.data = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    addSatelliteData: (state, action: PayloadAction<SatelliteData>) => {
      const existingIndex = state.data.findIndex(
        d => d.fieldId === action.payload.fieldId && 
        d.date.toString() === action.payload.date.toString()
      );
      
      if (existingIndex !== -1) {
        state.data[existingIndex] = action.payload;
      } else {
        state.data.push(action.payload);
      }
    },
    clearSatelliteData: (state) => {
      state.data = [];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const {
  setSatelliteData,
  addSatelliteData,
  clearSatelliteData,
  setLoading,
  setError,
} = satelliteSlice.actions;

export default satelliteSlice.reducer;
