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
    // Add this reducer to directly set requests if needed
    setRequests: (state, action: PayloadAction<ServiceRequest[]>) => {
      state.requests = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAvailableRequests.pending, (state) => {
        state.isLoading = true;
        state.error = null; // Clear any previous errors
      })
      .addCase(fetchAvailableRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch requests';
      })
      .addCase(fetchAvailableRequests.fulfilled, (state, action: PayloadAction<ServiceRequest[]>) => {
        state.isLoading = false;
        state.availableRequests = action.payload;
        // Also populate the general requests array if you want to use it
        state.requests = action.payload;
      })
      .addCase(acceptRequest.fulfilled, (state, action: PayloadAction<ServiceRequest>) => {
        // Remove from available and add to assigned
        state.availableRequests = state.availableRequests.filter(req => req.id !== action.payload.id);
        state.assignedRequests.push(action.payload);
        // Also update the general requests array
        state.requests = state.requests.filter(req => req.id !== action.payload.id);
      })
      .addCase(updateRequestStatus.fulfilled, (state, action: PayloadAction<ServiceRequest>) => {
        const index = state.assignedRequests.findIndex(req => req.id === action.payload.id);
        if (index !== -1) {
          state.assignedRequests[index] = action.payload;
        }
        // Also update in the general requests array
        const reqIndex = state.requests.findIndex(req => req.id === action.payload.id);
        if (reqIndex !== -1) {
          state.requests[reqIndex] = action.payload;
        }
      });
  },
});

export const { clearError, setRequests } = serviceRequestSlice.actions;
export default serviceRequestSlice.reducer;