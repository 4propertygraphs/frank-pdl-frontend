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
  id: string;
  agency_id: string;
  title: string;
  address?: string;
  city?: string;
  county?: string;
  postcode?: string;
  country?: string;
  price?: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  type?: string;
  status?: string;
  description?: string;
  images?: string[];
  agent_name?: string;
  agent_email?: string;
  agent_phone?: string;
  created_at?: string;
  updated_at?: string;
  synced_at?: string;
  raw_data?: any;
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