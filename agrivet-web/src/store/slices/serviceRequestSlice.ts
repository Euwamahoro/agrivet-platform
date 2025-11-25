// src/store/slices/serviceRequestSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ServiceRequestState, ServiceRequest } from '../../types';
import { serviceRequestService } from '../../services/serviceRequestService';

const initialState: ServiceRequestState = {
  requests: [],
  availableRequests: [],
  assignedRequests: [],
  isLoading: false,
  error: null,
};

export const fetchAvailableRequests = createAsyncThunk(
  'serviceRequests/fetchAvailable',
  async (filters?: { serviceType?: string; location?: string }) => {
    const response = await serviceRequestService.getAvailableRequests(filters);
    return response;
  }
);

export const acceptRequest = createAsyncThunk(
  'serviceRequests/accept',
  async (requestId: string) => {
    const response = await serviceRequestService.acceptRequest(requestId);
    return response;
  }
);

export const updateRequestStatus = createAsyncThunk(
  'serviceRequests/updateStatus',
  async ({ requestId, status, notes }: { requestId: string; status: string; notes?: string }) => {
    const response = await serviceRequestService.updateStatus(requestId, status, notes);
    return response;
  }
);

const serviceRequestSlice = createSlice({
  name: 'serviceRequests',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAvailableRequests.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAvailableRequests.fulfilled, (state, action: PayloadAction<ServiceRequest[]>) => {
        state.isLoading = false;
        state.availableRequests = action.payload;
      })
      .addCase(acceptRequest.fulfilled, (state, action: PayloadAction<ServiceRequest>) => {
        state.availableRequests = state.availableRequests.filter(req => req._id !== action.payload._id);
        state.assignedRequests.push(action.payload);
      })
      .addCase(updateRequestStatus.fulfilled, (state, action: PayloadAction<ServiceRequest>) => {
        const index = state.assignedRequests.findIndex(req => req._id === action.payload._id);
        if (index !== -1) {
          state.assignedRequests[index] = action.payload;
        }
      });
  },
});

export const { clearError } = serviceRequestSlice.actions;
export default serviceRequestSlice.reducer;