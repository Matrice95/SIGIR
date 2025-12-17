import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WeatherState, Weather, WeatherForecast } from '@/types';

const initialState: WeatherState = {
  current: [],
  forecast: [],
  isLoading: false,
  error: null,
};

const weatherSlice = createSlice({
  name: 'weather',
  initialState,
  reducers: {
    setCurrentWeather: (state, action: PayloadAction<Weather[]>) => {
      state.current = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setForecast: (state, action: PayloadAction<WeatherForecast[]>) => {
      state.forecast = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    addWeatherData: (state, action: PayloadAction<Weather>) => {
      state.current.push(action.payload);
    },
    clearWeatherData: (state) => {
      state.current = [];
      state.forecast = [];
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
  setCurrentWeather,
  setForecast,
  addWeatherData,
  clearWeatherData,
  setLoading,
  setError,
} = weatherSlice.actions;

export default weatherSlice.reducer;
