import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { OperationsState, Operation } from '@/types';

const initialState: OperationsState = {
  operations: [],
  isLoading: false,
  error: null,
};

const operationsSlice = createSlice({
  name: 'operations',
  initialState,
  reducers: {
    setOperations: (state, action: PayloadAction<Operation[]>) => {
      state.operations = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    addOperation: (state, action: PayloadAction<Operation>) => {
      state.operations.unshift(action.payload); // Ajouter au début
    },
    updateOperation: (state, action: PayloadAction<Operation>) => {
      const index = state.operations.findIndex(op => op.id === action.payload.id);
      if (index !== -1) {
        state.operations[index] = action.payload;
      }
    },
    deleteOperation: (state, action: PayloadAction<string>) => {
      state.operations = state.operations.filter(op => op.id !== action.payload);
    },
    markOperationSynced: (state, action: PayloadAction<string>) => {
      const operation = state.operations.find(op => op.id === action.payload);
      if (operation) {
        operation.isSynced = true;
      }
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
  setOperations,
  addOperation,
  updateOperation,
  deleteOperation,
  markOperationSynced,
  setLoading,
  setError,
} = operationsSlice.actions;

export default operationsSlice.reducer;
