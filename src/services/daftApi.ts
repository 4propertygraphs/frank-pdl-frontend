import axios from 'axios';
import agencyDetails from '../../public/GetAgency.json';

export interface DaftProperty {
  id: string;
  title: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  address: string;
  county: string;
  eircode: string;
  berRating: string;
  floorArea: number;
  description: string;
  images: string[];
  contactName: string;
  phone: string;
  latitude: number;
  longitude: number;
  publishDate: string;
  lastUpdated: string;
}

export interface DaftSearchParams {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  minBeds?: number;
  maxBeds?: number;
  sort?: 'price' | 'date' | 'relevance';
  limit?: number;
}

class DaftApiService {
  private readonly BASE_URL = 'https://www.daft.ie/api';
  private getHeaders(apiKey?: string) {
    return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Referer': 'https://www.daft.ie/',
    ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
    ...(apiKey && { 'X-API-Key': apiKey }),
    };
  }

  private getApiKeyForAgency(agencyId?: string): string | null {
    if (!agencyId) return null;
    
    console.log('🔍 Looking for Daft API key for agency:', agencyId);
    
    // GetAgency.json is an array of agencies, search through all
    let foundAgency = null;
    
    for (const agency of agencyDetails) {
      // Check all possible site prefix fields
      const sitePrefixes = [
        agency.sitePrefix,
        agency.SitePrefix,
        agency.Key,
        agency.unique_key,
        agency.UUID,
        agency.AcquiantCustomer?.SitePrefix
      ].filter(Boolean).map(s => String(s).toLowerCase());
      
      if (sitePrefixes.includes(agencyId.toLowerCase())) {
        foundAgency = agency;
        console.log('✅ Found agency in GetAgency.json:', agency.Name || agency.name || agency.OfficeName);
        console.log('🔑 Full agency object:', agency);
        console.log('🔑 DaftApiKey field:', agency.DaftApiKey);
        console.log('🔑 All keys:', Object.keys(agency));
        break;
      }
    }
    
    const apiKey = foundAgency?.DaftApiKey || foundAgency?.daftApiKey || foundAgency?.daft_api_key || null;
    console.log('🔑 Daft API key for', agencyId, ':', apiKey ? `${apiKey.substring(0, 8)}...` : 'not found');
    return apiKey;
  }

  private getMockDaftData(propertyId?: string): DaftProperty[] {
    return [
      {
        id: propertyId || 'daft-mock-1',
        title: 'No API',
        price: 0,
        bedrooms: 0,
        bathrooms: 0,
        propertyType: 'No API',
        address: 'No API',
        county: 'No API',
        eircode: 'No API',
        berRating: 'No API',
        floorArea: 0,
        description: 'No API',
        images: [],
        contactName: 'No API',
        phone: 'No API',
        latitude: 53.3331,
        longitude: -6.2267,
        publishDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      }
    ];
  }

  async searchProperties(params: DaftSearchParams = {}, agencyId?: string): Promise<DaftProperty[]> {
    const apiKey = this.getApiKeyForAgency(agencyId);
    
    if (!apiKey) {
      console.log('🚫 No Daft API key for agency:', agencyId, '- returning No API data');
      return this.getMockDaftData();
    }
    
    // Use external database API via Supabase Edge Function
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('🔄 Supabase not configured, using No API data');
      return this.getMockDaftData();
    }
    
    try {
      console.log('🔍 Calling Daft via external database API...', `API Key: ${apiKey.substring(0, 8)}...`);
      const searchParams = new URLSearchParams();
      
      searchParams.append('source', 'daft');
      searchParams.append('action', 'search');
      if (params.location) searchParams.append('location', params.location);
      if (params.minPrice) searchParams.append('minPrice', params.minPrice.toString());
      if (params.maxPrice) searchParams.append('maxPrice', params.maxPrice.toString());
      if (params.propertyType) searchParams.append('propertyType', params.propertyType);
      if (params.minBeds) searchParams.append('minBeds', params.minBeds.toString());
      if (params.maxBeds) searchParams.append('maxBeds', params.maxBeds.toString());
      if (params.sort) searchParams.append('sort', params.sort);
      if (params.address) searchParams.append('address', params.address);
      
      searchParams.append('limit', (params.limit || 10).toString());
      searchParams.append('api_key', apiKey);

      const proxyUrl = `${supabaseUrl}/functions/v1/external-data-proxy?${searchParams.toString()}`;
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Proxy error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.isNoApiData) {
        console.log('📭 Daft API returned No API data:', result.message);
      } else if (result.isRealData) {
        console.log('✅ Real Daft data received via external database');
      } else {
        console.log('📭 Daft API returned fallback data');
      }
      
      return this.transformDaftResponse(result.data || []);
    } catch (error: any) {
      console.error('Daft API error:', error);
      console.log('🔄 Daft API unavailable, using No API data');
      return this.getMockDaftData();
    }
  }

  async getPropertyById(daftId: string, agencyId?: string): Promise<DaftProperty | null> {
    const apiKey = this.getApiKeyForAgency(agencyId);
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('🔄 Supabase not configured, using mock data');
      const mockData = this.getMockDaftData(daftId);
      return mockData[0] || null;
    }
    
    try {
      console.log('🔍 Fetching Daft property via Supabase Edge Function...', apiKey ? 'with API key' : 'without API key');
      
      const searchParams = new URLSearchParams();
      searchParams.append('propertyId', daftId);
      if (apiKey) searchParams.append('apiKey', apiKey);
      
      const proxyUrl = `${supabaseUrl}/functions/v1/daft-proxy?${searchParams.toString()}`;
      
      const response = await fetch(proxyUrl, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Proxy error: ${response.status}`);
      }
      
      const result = await response.json();
      const properties = this.transformDaftResponse(result.data || []);
      return properties[0] || null;
    } catch (error: any) {
      console.error('Daft property fetch error:', error);
      console.log('🔄 Daft API unavailable, using mock data');
      const mockData = this.getMockDaftData(daftId);
      return mockData[0] || null;
    }
  }

  async searchByAddress(address: string, agencyId?: string): Promise<DaftProperty[]> {
    try {
      console.log('🔍 Daft address search via proxy for agency:', agencyId);
      // Clean and format address for search
      const cleanAddress = address
        .replace(/[^\w\s,]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      return await this.searchProperties({
        address: cleanAddress,
        limit: 10,
        sort: 'relevance'
      }, agencyId);
    } catch (error) {
      console.error('Daft address search error:', error);
      console.log('🔄 Daft API unavailable, using mock data');
      return this.getMockDaftData();
    }
  }

  private transformDaftResponse(data: any[]): DaftProperty[] {
    return data.map(item => ({
      id: item.id || item.daftShortcode || '',
      title: item.title || item.displayAddress || '',
      price: this.parsePrice(item.price),
      bedrooms: parseInt(item.numBedrooms) || 0,
      bathrooms: parseInt(item.numBathrooms) || 0,
      propertyType: item.propertyType || '',
      address: item.displayAddress || '',
      county: item.county || '',
      eircode: item.eircode || '',
      berRating: item.berRating || '',
      floorArea: parseInt(item.floorArea) || 0,
      description: item.description || '',
      images: this.extractImages(item),
      contactName: item.seller?.name || '',
      phone: item.seller?.phone || '',
      latitude: parseFloat(item.point?.coordinates?.[1]) || 0,
      longitude: parseFloat(item.point?.coordinates?.[0]) || 0,
      publishDate: item.publishDate || '',
      lastUpdated: item.lastUpdateDate || new Date().toISOString(),
    }));
  }

  private parsePrice(price: any): number {
    if (typeof price === 'number') return price;
    if (typeof price === 'string') {
      const cleaned = price.replace(/[^\d.]/g, '');
      return parseFloat(cleaned) || 0;
    }
    return 0;
  }

  private extractImages(item: any): string[] {
    const images: string[] = [];
    
    if (item.media?.images) {
      for (const img of item.media.images) {
        if (img.url) {
          images.push(img.url);
        }
      }
    }
    
    if (item.images) {
      if (Array.isArray(item.images)) {
        images.push(...item.images.filter(Boolean));
      }
    }

    return images;
  }

  // Rate limiting helper
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async batchSearch(addresses: string[], delayMs: number = 1000): Promise<Map<string, DaftProperty[]>> {
    const results = new Map<string, DaftProperty[]>();
    
    for (const address of addresses) {
      try {
        const properties = await this.searchByAddress(address);
        results.set(address, properties);
        
        // Rate limiting
        if (delayMs > 0) {
          await this.delay(delayMs);
        }
      } catch (error) {
        console.error(`Failed to search for ${address}:`, error);
        results.set(address, []);
      }
    }
    
    return results;
  }
}

export const daftApiService = new DaftApiService();