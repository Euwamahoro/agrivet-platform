// src/types/index.ts
export interface User {
  id: string;
  phoneNumber: string;
  name: string;
  email?: string;
  role: 'graduate' | 'admin' | 'farmer';
  createdAt: string;
}

export interface Graduate extends User {
  expertise: 'agronomy' | 'veterinary' | 'both';
  province: string;
  district: string;
  sector: string;
  cell: string;
  isAvailable: boolean;
  qualifications: string[];
  experience: number;
  rating?: number;
}

export interface Farmer {
  id: string;
  phoneNumber: string;
  name: string;
  province: string;
  district: string;
  sector: string;
  cell: string;
  locationText: string;
  createdAt: string;
}

export interface ServiceRequest {
  id: string;
  farmerId: string;
  graduateId?: string;
  serviceType: 'agronomy' | 'veterinary';
  description: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'no_match';
  location: {
    province: string;
    district: string;
    sector: string;
    cell: string;
  };
  createdAt: string;
  updatedAt: string;
  farmer?: Farmer;
  graduate?: Graduate;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface GraduateState {
  graduates: Graduate[];
  currentGraduate: Graduate | null;
  isLoading: boolean;
}

export interface ServiceRequestState {
  requests: ServiceRequest[];
  availableRequests: ServiceRequest[];
  assignedRequests: ServiceRequest[];
  isLoading: boolean;
  error: string | null;
}