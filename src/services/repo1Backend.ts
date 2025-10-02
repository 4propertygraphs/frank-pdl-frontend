import axios, { AxiosInstance } from 'axios';

export interface Repo1Config {
  baseUrl: string;
  apiKey?: string;
}

export interface Repo1PropertyResponse {
  id: string;
  data: any;
  source: 'myhome' | 'daft' | 'acquaint' | '4pm' | 'wordpress';
  timestamp: string;
}

class Repo1BackendService {
  private axiosInstance: AxiosInstance;
  private baseUrl: string;
  private apiKey: string | null = null;

  constructor() {
    this.baseUrl = import.meta.env.VITE_REPO1_BACKEND_URL || 'http://localhost:3000/api';
    this.apiKey = import.meta.env.VITE_REPO1_API_KEY || null;

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (this.apiKey) {
      this.axiosInstance.defaults.headers.common['x-api-key'] = this.apiKey;
    }
  }

  setConfig(config: Repo1Config) {
    this.baseUrl = config.baseUrl;
    this.axiosInstance.defaults.baseURL = config.baseUrl;

    if (config.apiKey) {
      this.apiKey = config.apiKey;
      this.axiosInstance.defaults.headers.common['x-api-key'] = config.apiKey;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing Repo1 backend connection...');
      const response = await this.axiosInstance.get('/health');
      console.log('✅ Repo1 backend connected');
      return response.status === 200;
    } catch (error) {
      console.error('Repo1 backend connection test failed:', error);
      console.log('🔄 Repo1 backend not available');
      return false;
    }
  }

  async fetchFromMyHome(propertyId: string): Promise<any> {
    try {
      console.log('🔍 Fetching from MyHome via Repo1...');
      const response = await this.axiosInstance.get('/myhome', {
        params: { propertyId },
      });
      console.log('✅ MyHome data received via Repo1');
      return response.data;
    } catch (error: any) {
      console.error('MyHome API error via repo1:', error);
      if (error.response?.status === 404) {
        console.log('📭 MyHome property not found');
        return null;
      }
      console.log('🔄 MyHome via Repo1 failed, returning null');
      return null;
    }
  }

  async fetchFromDaft(propertyId?: string): Promise<any> {
    try {
      console.log('🔍 Fetching from Daft via Repo1...');
      const endpoint = propertyId ? '/daft' : '/daft/all';
      const response = await this.axiosInstance.get(endpoint, {
        params: propertyId ? { propertyId } : {},
      });
      console.log('✅ Daft data received via Repo1');
      return response.data;
    } catch (error: any) {
      console.error('Daft API error via repo1:', error);
      if (error.response?.status === 404) {
        console.log('📭 Daft property not found');
        return null;
      }
      console.log('🔄 Daft via Repo1 failed, returning null');
      return null;
    }
  }

  async searchDaftByAddress(address: string): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get('/daft/search', {
        params: { address },
      });
      return response.data;
    } catch (error: any) {
      console.error('Daft search error via repo1:', error);
      return [];
    }
  }

  async searchMyHomeByAddress(address: string): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get('/myhome/search', {
        params: { address },
      });
      return response.data;
    } catch (error: any) {
      console.error('MyHome search error via repo1:', error);
      return [];
    }
  }

  async fetchFromAcquaint(propertyId?: string): Promise<any> {
    try {
      const endpoint = propertyId ? '/acquaint' : '/acquaint/all';
      const response = await this.axiosInstance.get(endpoint, {
        params: propertyId ? { propertyId } : {},
      });
      return response.data;
    } catch (error: any) {
      console.error('Acquaint API error via repo1:', error);
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch from Acquaint: ${error.message}`);
    }
  }

  async fetch4PMProperties(): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/properties');
      return response.data;
    } catch (error: any) {
      console.error('4PM API error via repo1:', error);
      throw new Error(`Failed to fetch from 4PM: ${error.message}`);
    }
  }

  async getExternalAgencies(): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get('/external-agencies');
      return response.data;
    } catch (error: any) {
      console.error('External agencies fetch error via repo1:', error);
      return [];
    }
  }

  async getFieldMappings(): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/field-mappings');
      return response.data;
    } catch (error: any) {
      console.error('Field mappings fetch error via repo1:', error);
      return null;
    }
  }

  async searchPropertyAcrossSources(query: {
    address?: string;
    propertyId?: string;
    county?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<{
    myhome: any[];
    daft: any[];
    acquaint: any[];
  }> {
    const results = {
      myhome: [] as any[],
      daft: [] as any[],
      acquaint: [] as any[],
    };

    const promises: Promise<void>[] = [];

    if (query.address) {
      promises.push(
        this.searchMyHomeByAddress(query.address)
          .then(data => { results.myhome = data; })
          .catch(() => { results.myhome = []; })
      );

      promises.push(
        this.searchDaftByAddress(query.address)
          .then(data => { results.daft = data; })
          .catch(() => { results.daft = []; })
      );
    }

    await Promise.all(promises);

    return results;
  }

  async comparePropertyAcrossSources(propertyId: string, address: string): Promise<{
    acquaint: any | null;
    myhome: any | null;
    daft: any | null;
  }> {
    const [acquaintData, myhomeResults, daftResults] = await Promise.all([
      this.fetchFromAcquaint(propertyId).catch(() => null),
      this.searchMyHomeByAddress(address).catch(() => []),
      this.searchDaftByAddress(address).catch(() => []),
    ]);

    return {
      acquaint: acquaintData,
      myhome: myhomeResults.length > 0 ? myhomeResults[0] : null,
      daft: daftResults.length > 0 ? daftResults[0] : null,
    };
  }
}

export const repo1BackendService = new Repo1BackendService();
