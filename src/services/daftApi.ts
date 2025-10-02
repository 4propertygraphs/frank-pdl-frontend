import axios from 'axios';

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
  private readonly HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Referer': 'https://www.daft.ie/',
  };

  async searchProperties(params: DaftSearchParams = {}): Promise<DaftProperty[]> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.location) searchParams.append('location', params.location);
      if (params.minPrice) searchParams.append('priceFrom', params.minPrice.toString());
      if (params.maxPrice) searchParams.append('priceTo', params.maxPrice.toString());
      if (params.propertyType) searchParams.append('propertyType', params.propertyType);
      if (params.minBeds) searchParams.append('numBedsFrom', params.minBeds.toString());
      if (params.maxBeds) searchParams.append('numBedsTo', params.maxBeds.toString());
      if (params.sort) searchParams.append('sort', params.sort);
      
      searchParams.append('limit', (params.limit || 50).toString());

      const response = await axios.get(`${this.BASE_URL}/v1/listings`, {
        params: Object.fromEntries(searchParams),
        headers: this.HEADERS,
        timeout: 10000,
      });

      return this.transformDaftResponse(response.data);
    } catch (error: any) {
      console.error('Daft API error:', error);
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw new Error(`Failed to fetch from Daft: ${error.message}`);
    }
  }

  async getPropertyById(daftId: string): Promise<DaftProperty | null> {
    try {
      const response = await axios.get(`${this.BASE_URL}/v1/listings/${daftId}`, {
        headers: this.HEADERS,
        timeout: 10000,
      });

      const properties = this.transformDaftResponse([response.data]);
      return properties[0] || null;
    } catch (error: any) {
      console.error('Daft property fetch error:', error);
      return null;
    }
  }

  async searchByAddress(address: string): Promise<DaftProperty[]> {
    try {
      // Clean and format address for search
      const cleanAddress = address
        .replace(/[^\w\s,]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      return await this.searchProperties({
        location: cleanAddress,
        limit: 10,
        sort: 'relevance'
      });
    } catch (error) {
      console.error('Daft address search error:', error);
      return [];
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