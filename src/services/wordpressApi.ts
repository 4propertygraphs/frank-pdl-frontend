import axios from 'axios';

export interface WordPressProperty {
  id: string;
  title: string;
  content: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  propertyCounty: string;
  address: string;
  berRating: string;
  floorArea: number;
  images: string[];
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  publishDate: string;
  modifiedDate: string;
  status: string;
  featured: boolean;
}

export interface WordPressSearchParams {
  search?: string;
  county?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  per_page?: number;
  page?: number;
}

class WordPressApiService {
  private baseUrl: string = '';
  private readonly DEFAULT_HEADERS = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  private getMockWordPressData(propertyId?: string): WordPressProperty[] {
    return [
      {
        id: propertyId || 'wp-mock-1',
        title: '2 Bed Apartment, Cork City Centre',
        content: 'Modern apartment in the heart of Cork city...',
        price: 295000,
        bedrooms: 2,
        bathrooms: 1,
        propertyType: 'Apartment',
        propertyCounty: 'Cork',
        address: 'Patrick Street, Cork',
        berRating: 'A3',
        floorArea: 85,
        images: ['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'],
        agentName: 'Mary Collins',
        agentPhone: '+353 21 123 456',
        agentEmail: 'mary@example.ie',
        publishDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        status: 'publish',
        featured: true,
      }
    ];
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, ''); // Remove trailing slash
  }

  async searchProperties(params: WordPressSearchParams = {}): Promise<WordPressProperty[]> {
    if (!this.baseUrl) {
      console.log('🔄 WordPress not configured, using mock data');
      return this.getMockWordPressData();
    }

    try {
      console.log('🔍 Attempting WordPress API search...');
      const searchParams = new URLSearchParams();
      
      if (params.search) searchParams.append('search', params.search);
      if (params.county) searchParams.append('meta_query[county]', params.county);
      if (params.propertyType) searchParams.append('meta_query[type]', params.propertyType);
      if (params.minPrice) searchParams.append('meta_query[min_price]', params.minPrice.toString());
      if (params.maxPrice) searchParams.append('meta_query[max_price]', params.maxPrice.toString());
      if (params.status) searchParams.append('status', params.status);
      
      searchParams.append('per_page', (params.per_page || 50).toString());
      searchParams.append('page', (params.page || 1).toString());
      searchParams.append('_embed', 'true'); // Include featured images

      const response = await axios.get(`${this.baseUrl}/wp-json/wp/v2/properties`, {
        params: Object.fromEntries(searchParams),
        headers: this.DEFAULT_HEADERS,
        timeout: 15000,
      });

      return this.transformWordPressResponse(response.data);
    } catch (error: any) {
      console.error('WordPress API error:', error);
      console.log('🔄 WordPress API unavailable, using mock data');
      return this.getMockWordPressData();
    }
  }

  async getPropertyById(wpId: string): Promise<WordPressProperty | null> {
    if (!this.baseUrl) {
      console.log('🔄 WordPress not configured, using mock data');
      const mockData = this.getMockWordPressData(wpId);
      return mockData[0] || null;
    }

    try {
      console.log('🔍 Attempting WordPress property fetch...');
      const response = await axios.get(`${this.baseUrl}/wp-json/wp/v2/properties/${wpId}`, {
        params: { _embed: true },
        headers: this.DEFAULT_HEADERS,
        timeout: 10000,
      });

      const properties = this.transformWordPressResponse([response.data]);
      return properties[0] || null;
    } catch (error: any) {
      console.error('WordPress property fetch error:', error);
      console.log('🔄 WordPress API unavailable, using mock data');
      const mockData = this.getMockWordPressData(wpId);
      return mockData[0] || null;
    }
  }

  async searchByTitle(title: string): Promise<WordPressProperty[]> {
    try {
      console.log('🔍 Attempting WordPress title search...');
      return await this.searchProperties({
        search: title,
        per_page: 10,
      });
    } catch (error) {
      console.error('WordPress title search error:', error);
      console.log('🔄 WordPress API unavailable, using mock data');
      return this.getMockWordPressData();
    }
  }

  private transformWordPressResponse(data: any[]): WordPressProperty[] {
    return data.map(item => ({
      id: item.id?.toString() || '',
      title: item.title?.rendered || '',
      content: item.content?.rendered || '',
      price: this.parsePrice(item.meta?.price || item.acf?.price),
      bedrooms: parseInt(item.meta?.bedrooms || item.acf?.bedrooms) || 0,
      bathrooms: parseInt(item.meta?.bathrooms || item.acf?.bathrooms) || 0,
      propertyType: item.meta?.property_type || item.acf?.property_type || '',
      propertyCounty: item.meta?.property_county || item.acf?.property_county || '',
      address: item.meta?.address || item.acf?.address || '',
      berRating: item.meta?.ber_rating || item.acf?.ber_rating || '',
      floorArea: parseInt(item.meta?.floor_area || item.acf?.floor_area) || 0,
      images: this.extractWordPressImages(item),
      agentName: item.meta?.agent_name || item.acf?.agent_name || '',
      agentPhone: item.meta?.agent_phone || item.acf?.agent_phone || '',
      agentEmail: item.meta?.agent_email || item.acf?.agent_email || '',
      publishDate: item.date || '',
      modifiedDate: item.modified || '',
      status: item.status || 'publish',
      featured: item.featured || false,
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

  private extractWordPressImages(item: any): string[] {
    const images: string[] = [];
    
    // Featured image
    if (item._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
      images.push(item._embedded['wp:featuredmedia'][0].source_url);
    }
    
    // Gallery images from ACF or meta
    const gallery = item.acf?.gallery || item.meta?.gallery;
    if (gallery && Array.isArray(gallery)) {
      for (const img of gallery) {
        if (typeof img === 'string') {
          images.push(img);
        } else if (img.url) {
          images.push(img.url);
        }
      }
    }
    
    return images;
  }

  // Configuration helper
  async testConnection(): Promise<boolean> {
    if (!this.baseUrl) return false;
    
    try {
      const response = await axios.get(`${this.baseUrl}/wp-json/wp/v2/properties`, {
        params: { per_page: 1 },
        headers: this.DEFAULT_HEADERS,
        timeout: 5000,
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('WordPress connection test failed:', error);
      return false;
    }
  }
}

export const wordpressApiService = new WordPressApiService();