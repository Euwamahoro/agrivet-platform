// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import graduateReducer from './slices/graduateSlice';
import serviceRequestReducer from './slices/serviceRequestSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    graduates: graduateReducer,
    serviceRequests: serviceRequestReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;