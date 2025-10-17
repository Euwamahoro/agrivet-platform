// src/store/slices/graduateSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { GraduateState, Graduate } from '../../types';
import { graduateService } from '../../services/graduateService';

const initialState: GraduateState = {
  graduates: [],
  currentGraduate: null,
  isLoading: false,
};

export const fetchGraduates = createAsyncThunk(
  'graduates/fetchAll',
  async (filters?: { specialization?: string; location?: string }) => {
    const response = await graduateService.getGraduates(filters);
    return response;
  }
);

export const fetchGraduateProfile = createAsyncThunk(
  'graduates/fetchProfile',
  async (graduateId: string) => {
    const response = await graduateService.getGraduateProfile(graduateId);
    return response;
  }
);

export const updateGraduateProfile = createAsyncThunk(
  'graduates/updateProfile',
  async (updates: Partial<Graduate>) => {
    const response = await graduateService.updateProfile(updates);
    return response;
  }
);

export const updateGraduateAvailability = createAsyncThunk(
  'graduates/updateAvailability',
  async (isAvailable: boolean) => {
    const response = await graduateService.updateAvailability(isAvailable);
    return response;
  }
);

const graduateSlice = createSlice({
  name: 'graduates',
  initialState,
  reducers: {
    clearCurrentGraduate: (state) => {
      state.currentGraduate = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGraduates.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchGraduates.fulfilled, (state, action: PayloadAction<Graduate[]>) => {
        state.isLoading = false;
        state.graduates = action.payload;
      })
      .addCase(fetchGraduateProfile.fulfilled, (state, action: PayloadAction<Graduate>) => {
        state.currentGraduate = action.payload;
      })
      .addCase(updateGraduateProfile.fulfilled, (state, action: PayloadAction<Graduate>) => {
        state.currentGraduate = action.payload;
        // Also update in the graduates list if exists
        const index = state.graduates.findIndex(g => g.id === action.payload.id);
        if (index !== -1) {
          state.graduates[index] = action.payload;
        }
      })
      .addCase(updateGraduateAvailability.fulfilled, (state, action: PayloadAction<Graduate>) => {
        if (state.currentGraduate) {
          state.currentGraduate.isAvailable = action.payload.isAvailable;
        }
      });
  },
});

export const { clearCurrentGraduate } = graduateSlice.actions;
export default graduateSlice.reducer;