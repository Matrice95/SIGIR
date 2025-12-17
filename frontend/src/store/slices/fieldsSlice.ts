import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FieldsState, Field } from '@/types';

const initialState: FieldsState = {
  fields: [],
  activeFieldId: null,
  isLoading: false,
  error: null,
};

const fieldsSlice = createSlice({
  name: 'fields',
  initialState,
  reducers: {
    setFields: (state, action: PayloadAction<Field[]>) => {
      state.fields = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    addField: (state, action: PayloadAction<Field>) => {
      state.fields.push(action.payload);
    },
    updateField: (state, action: PayloadAction<Field>) => {
      const index = state.fields.findIndex(f => f.id === action.payload.id);
      if (index !== -1) {
        state.fields[index] = action.payload;
      }
    },
    deleteField: (state, action: PayloadAction<string>) => {
      state.fields = state.fields.filter(f => f.id !== action.payload);
      if (state.activeFieldId === action.payload) {
        state.activeFieldId = null;
      }
    },
    setActiveField: (state, action: PayloadAction<string | null>) => {
      state.activeFieldId = action.payload;
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
  setFields,
  addField,
  updateField,
  deleteField,
  setActiveField,
  setLoading,
  setError,
} = fieldsSlice.actions;

export default fieldsSlice.reducer;
