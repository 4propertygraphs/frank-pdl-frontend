import axios from 'axios';
import agencyDetails from '../../public/GetAgency.json';

export interface MyHomeProperty {
  id: string;
  displayAddress: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  county: string;
  region: string;
  eircode: string;
  berRating: string;
  floorArea: number;
  description: string;
  photos: string[];
  contactDetails: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  createdOnDate: string;
  modifiedOnDate: string;
}

export interface MyHomeSearchParams {
  county?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  minBeds?: number;
  maxBeds?: number;
  page?: number;
  pageSize?: number;
}

class MyHomeApiService {
  private readonly BASE_URL = 'https://www.myhome.ie/api';
  
  private getHeaders(apiKey?: string, groupId?: number) {
    return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Referer': 'https://www.myhome.ie/',
    'X-Requested-With': 'XMLHttpRequest',
    ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
    ...(apiKey && { 'X-API-Key': apiKey }),
    ...(groupId && { 'X-Group-ID': groupId.toString() }),
    };
  }

  private getApiCredentialsForAgency(agencyId?: string): { apiKey: string | null; groupId: number | null } {
    if (!agencyId) return { apiKey: null, groupId: null };
    
    console.log('🔍 Looking for MyHome API credentials for agency:', agencyId);
    
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
        console.log('🔑 MyHome API data:', agency.MyhomeApi);
        console.log('🔑 All keys:', Object.keys(agency));
        break;
      }
    }
    
    const credentials = {
      apiKey: foundAgency?.MyhomeApi?.ApiKey || foundAgency?.myhome_api_key || foundAgency?.MyHomeApiKey || null,
      groupId: foundAgency?.MyhomeApi?.GroupID || foundAgency?.myhome_group_id || foundAgency?.MyHomeGroupId || null,
    };
    
    console.log('🔑 MyHome credentials for', agencyId, ':', {
      apiKey: credentials.apiKey ? `${credentials.apiKey.substring(0, 8)}...` : 'not found',
      groupId: credentials.groupId
    });
    
    return credentials;
  }

  private getMockMyHomeData(propertyId?: string): MyHomeProperty[] {
    return [
      {
        id: propertyId || 'myhome-mock-1',
        displayAddress: 'No API',
        price: 0,
        bedrooms: 0,
        bathrooms: 0,
        propertyType: 'No API',
        county: 'No API',
        region: 'No API',
        eircode: 'No API',
        berRating: 'No API',
        floorArea: 0,
        description: 'No API',
        photos: [],
        contactDetails: {
          firstName: 'No API',
          lastName: '',
          phone: 'No API',
          email: 'No API',
        },
        location: {
          latitude: 53.2157,
          longitude: -6.6673,
        },
        createdOnDate: new Date().toISOString(),
        modifiedOnDate: new Date().toISOString(),
      }
    ];
  }

  async searchProperties(params: MyHomeSearchParams = {}, agencyId?: string): Promise<MyHomeProperty[]> {
    const { apiKey, groupId } = this.getApiCredentialsForAgency(agencyId);
    
    if (!apiKey || !groupId) {
      console.log('🚫 No MyHome API credentials for agency:', agencyId, '- returning No API data');
      return this.getMockMyHomeData();
    }
    
    // Use external database API via Supabase Edge Function
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('🔄 Supabase not configured, using No API data');
      return this.getMockMyHomeData();
    }
    
    try {
      console.log('🔍 Calling MyHome via external database API...', `API Key: ${apiKey.substring(0, 8)}...`, `GroupID: ${groupId}`);
      const searchParams = new URLSearchParams();
      
      searchParams.append('source', 'myhome');
      searchParams.append('action', 'search');
      if (params.county) searchParams.append('county', params.county);
      if (params.minPrice) searchParams.append('minPrice', params.minPrice.toString());
      if (params.maxPrice) searchParams.append('maxPrice', params.maxPrice.toString());
      if (params.propertyType) searchParams.append('propertyType', params.propertyType);
      if (params.minBeds) searchParams.append('minBeds', params.minBeds.toString());
      if (params.maxBeds) searchParams.append('maxBeds', params.maxBeds.toString());
      if (params.address) searchParams.append('address', params.address);
      
      searchParams.append('page', (params.page || 1).toString());
      searchParams.append('pageSize', (params.pageSize || 50).toString());
      searchParams.append('api_key', apiKey);
      searchParams.append('group_id', groupId.toString());

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
        console.log('📭 MyHome API returned No API data:', result.message);
      } else if (result.isRealData) {
        console.log('✅ Real MyHome data received via external database');
      } else {
        console.log('📭 MyHome API returned fallback data');
      }
      
      return this.transformMyHomeResponse(result.data || []);
    } catch (error: any) {
      console.error('MyHome API error:', error);
      console.log('🔄 MyHome API unavailable, using No API data');
      return this.getMockMyHomeData();
    }
  }

  async getPropertyById(myHomeId: string, agencyId?: string): Promise<MyHomeProperty | null> {
    const { apiKey, groupId } = this.getApiCredentialsForAgency(agencyId);
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || !apiKey || !groupId) {
      console.log('🔄 Missing credentials, using mock data');
      const mockData = this.getMockMyHomeData(myHomeId);
      return mockData[0] || null;
    }
    
    try {
      console.log('🔍 Fetching MyHome property via Supabase Edge Function...');
      
      const searchParams = new URLSearchParams();
      searchParams.append('propertyId', myHomeId);
      searchParams.append('apiKey', apiKey);
      searchParams.append('groupId', groupId.toString());
      
      const proxyUrl = `${supabaseUrl}/functions/v1/myhome-proxy?${searchParams.toString()}`;
      
      const response = await fetch(proxyUrl, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Proxy error: ${response.status}`);
      }
      
      const result = await response.json();
      const properties = this.transformMyHomeResponse(result.data || []);
      return properties[0] || null;
    } catch (error: any) {
      console.error('MyHome property fetch error:', error);
      console.log('🔄 MyHome API unavailable, using mock data');
      const mockData = this.getMockMyHomeData(myHomeId);
      return mockData[0] || null;
    }
  }

  async searchByAddress(address: string, agencyId?: string): Promise<MyHomeProperty[]> {
    try {
      console.log('🔍 MyHome address search via proxy for agency:', agencyId);
      // Extract county from address for better search
      const addressParts = address.split(',').map(s => s.trim());
      const possibleCounty = addressParts[addressParts.length - 1];
      
      return await this.searchProperties({
        county: possibleCounty,
        address: address,
        pageSize: 20,
      }, agencyId);
    } catch (error) {
      console.error('MyHome address search error:', error);
      console.log('🔄 MyHome API unavailable, using mock data');
      return this.getMockMyHomeData();
    }
  }

  private transformMyHomeResponse(data: any[]): MyHomeProperty[] {
    return data.map(item => ({
      id: item.id || item.propertyId || '',
      displayAddress: item.displayAddress || item.address || '',
      price: this.parsePrice(item.price),
      bedrooms: this.parseNumber(item.bedrooms || item.bedsString),
      bathrooms: this.parseNumber(item.bathrooms),
      propertyType: item.propertyType || '',
      county: item.county || item.region || '',
      region: item.region || item.location || '',
      eircode: item.eircode || '',
      berRating: item.berRating || '',
      floorArea: this.parseNumber(item.floorArea),
      description: this.extractDescription(item),
      photos: this.extractPhotos(item),
      contactDetails: {
        firstName: item.brochureContactDetails?.firstName || '',
        lastName: item.brochureContactDetails?.lastName || '',
        phone: item.brochureContactDetails?.phone || '',
        email: item.brochureContactDetails?.email || '',
      },
      location: {
        latitude: parseFloat(item.brochureMap?.latitude) || 0,
        longitude: parseFloat(item.brochureMap?.longitude) || 0,
      },
      createdOnDate: item.createdOnDate || '',
      modifiedOnDate: item.modifiedOnDate || new Date().toISOString(),
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

  private parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseInt(value.replace(/\D/g, ''), 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  private extractDescription(item: any): string {
    if (item.brochureContent) {
      const content = Array.isArray(item.brochureContent) 
        ? item.brochureContent 
        : [item.brochureContent];
      
      const mainContent = content.find((c: any) => c.content && c.content.length > 50);
      if (mainContent) {
        return mainContent.content;
      }
    }
    
    return item.description || '';
  }

  private extractPhotos(item: any): string[] {
    const photos: string[] = [];
    
    if (item.photos && Array.isArray(item.photos)) {
      for (const photo of item.photos) {
        if (photo.url || photo.src) {
          photos.push(photo.url || photo.src);
        }
      }
    }
    
    return photos;
  }

  // Helper method to match properties by address similarity
  findSimilarProperty(targetAddress: string, properties: MyHomeProperty[]): MyHomeProperty | null {
    const normalizeAddress = (addr: string) => 
      addr.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const targetNormalized = normalizeAddress(targetAddress);
    
    for (const property of properties) {
      const propNormalized = normalizeAddress(property.displayAddress);
      
      // Simple similarity check - can be enhanced with fuzzy matching
      if (propNormalized.includes(targetNormalized) || 
          targetNormalized.includes(propNormalized)) {
        return property;
      }
    }
    
    return null;
  }
}

export const myHomeApiService = new MyHomeApiService();