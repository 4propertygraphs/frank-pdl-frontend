import axios from 'axios';

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
  private readonly HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Referer': 'https://www.myhome.ie/',
    'X-Requested-With': 'XMLHttpRequest',
  };

  async searchProperties(params: MyHomeSearchParams = {}): Promise<MyHomeProperty[]> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.county) searchParams.append('county', params.county);
      if (params.minPrice) searchParams.append('minPrice', params.minPrice.toString());
      if (params.maxPrice) searchParams.append('maxPrice', params.maxPrice.toString());
      if (params.propertyType) searchParams.append('propertyType', params.propertyType);
      if (params.minBeds) searchParams.append('minBeds', params.minBeds.toString());
      if (params.maxBeds) searchParams.append('maxBeds', params.maxBeds.toString());
      
      searchParams.append('page', (params.page || 1).toString());
      searchParams.append('pageSize', (params.pageSize || 50).toString());

      const response = await axios.get(`${this.BASE_URL}/search`, {
        params: Object.fromEntries(searchParams),
        headers: this.HEADERS,
        timeout: 15000,
      });

      return this.transformMyHomeResponse(response.data);
    } catch (error: any) {
      console.error('MyHome API error:', error);
      if (error.response?.status === 403) {
        throw new Error('Access denied. MyHome API may require authentication.');
      }
      throw new Error(`Failed to fetch from MyHome: ${error.message}`);
    }
  }

  async getPropertyById(myHomeId: string): Promise<MyHomeProperty | null> {
    try {
      const response = await axios.get(`${this.BASE_URL}/properties/${myHomeId}`, {
        headers: this.HEADERS,
        timeout: 10000,
      });

      const properties = this.transformMyHomeResponse([response.data]);
      return properties[0] || null;
    } catch (error: any) {
      console.error('MyHome property fetch error:', error);
      return null;
    }
  }

  async searchByAddress(address: string): Promise<MyHomeProperty[]> {
    try {
      // Extract county from address for better search
      const addressParts = address.split(',').map(s => s.trim());
      const possibleCounty = addressParts[addressParts.length - 1];
      
      return await this.searchProperties({
        county: possibleCounty,
        pageSize: 20,
      });
    } catch (error) {
      console.error('MyHome address search error:', error);
      return [];
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