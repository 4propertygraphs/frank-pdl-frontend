// Global type definitions
declare global {
  interface Window {
    electron?: {
      fetchAcquaintData: (sitePrefix: string, siteId?: number | string) => Promise<string>
    };
    electronAPI?: {
      apiCall: (requestData: {
        url: string;
        method: string;
        headers: Record<string, string>;
        body?: string;
      }) => Promise<any>;
    };
  }
}

export interface Agency {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Property {
  id: number;
  title: string;
  price?: number;
  address?: string;
  description?: string;
  agency_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FieldMapping {
  id: number;
  source_field: string;
  target_field: string;
  transformation?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: number;
}

export interface LoginResponse {
  token: string;
  apiKey?: string;
  key?: string;
  user?: {
    id: number;
    email: string;
    name?: string;
  };
}