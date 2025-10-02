import { Property } from '../types';

export interface DataSource {
  name: string;
  endpoint?: string;
  color: string;
  icon: string;
}

export interface ComparisonField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'date';
  sources: Record<string, any>;
  hasDifferences: boolean;
}

export interface PropertyComparison {
  property: Property;
  fields: ComparisonField[];
  sources: DataSource[];
  lastUpdated: string;
}

export class DataComparisonService {
  private readonly dataSources: DataSource[] = [
    { name: 'Acquaint', color: '#3b82f6', icon: '🏢' },
    { name: 'Daft', color: '#10b981', icon: '🏠' },
    { name: 'MyHome', color: '#f59e0b', icon: '🏡' },
    { name: 'WordPress', color: '#8b5cf6', icon: '📝' },
  ];

  async comparePropertyData(property: Property): Promise<PropertyComparison> {
    // Simulate fetching data from different sources
    const acquaintData = await this.fetchFromAcquaint(property.id);
    const daftData = await this.fetchFromDaft(property.id);
    const myhomeData = await this.fetchFromMyHome(property.id);
    const wordpressData = await this.fetchFromWordPress(property.id);

    const fields = this.buildComparisonFields({
      acquaint: acquaintData,
      daft: daftData,
      myhome: myhomeData,
      wordpress: wordpressData,
    });

    return {
      property,
      fields,
      sources: this.dataSources,
      lastUpdated: new Date().toISOString(),
    };
  }

  private async fetchFromAcquaint(propertyId: string): Promise<any> {
    // Simulate API call to Acquaint
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      price: 450000,
      bedrooms: 3,
      bathrooms: 2,
      type: 'Semi-Detached House',
      address: '123 Main Street, Dublin',
      ber_rating: 'B3',
      floor_area: 120,
      status: 'For Sale',
      agent_name: 'John Smith',
      agent_phone: '+353 1 234 5678',
      description: 'Beautiful family home in prime location...',
      last_updated: '2024-01-15T10:30:00Z',
    };
  }

  private async fetchFromDaft(propertyId: string): Promise<any> {
    // Simulate API call to Daft
    await new Promise(resolve => setTimeout(resolve, 400));
    return {
      price: 448000, // Slightly different price
      bedrooms: 3,
      bathrooms: 2,
      type: 'House', // Different type format
      address: '123 Main St, Dublin 4',
      ber_rating: 'B3',
      floor_area: 118, // Different area
      status: 'Available',
      agent_name: 'John Smith',
      agent_phone: '+353 1 234 5678',
      description: 'Stunning family residence with modern amenities...',
      last_updated: '2024-01-14T15:45:00Z',
    };
  }

  private async fetchFromMyHome(propertyId: string): Promise<any> {
    // Simulate API call to MyHome
    await new Promise(resolve => setTimeout(resolve, 350));
    return {
      price: 450000,
      bedrooms: 3,
      bathrooms: 2,
      type: 'Semi-Detached House',
      address: '123 Main Street, Dublin 4',
      ber_rating: 'B3',
      floor_area: 120,
      status: 'For Sale',
      agent_name: 'J. Smith', // Different name format
      agent_phone: '01 234 5678', // Different phone format
      description: 'Beautiful family home in prime location...',
      last_updated: '2024-01-15T09:15:00Z',
    };
  }

  private async fetchFromWordPress(propertyId: string): Promise<any> {
    // Simulate API call to WordPress
    await new Promise(resolve => setTimeout(resolve, 250));
    return {
      price: 455000, // Different price
      bedrooms: 3,
      bathrooms: 2,
      type: 'Semi-Detached', // Shortened type
      address: '123 Main Street, Dublin',
      ber_rating: 'B2', // Different BER
      floor_area: 120,
      status: 'Active',
      agent_name: 'John Smith',
      agent_phone: '+353 1 234 5678',
      description: 'Beautiful family home in prime location...',
      last_updated: '2024-01-16T08:20:00Z',
    };
  }

  private buildComparisonFields(sourceData: Record<string, any>): ComparisonField[] {
    const fieldMappings = [
      { key: 'price', label: 'Price', type: 'currency' as const },
      { key: 'bedrooms', label: 'Bedrooms', type: 'number' as const },
      { key: 'bathrooms', label: 'Bathrooms', type: 'number' as const },
      { key: 'type', label: 'Property Type', type: 'text' as const },
      { key: 'address', label: 'Address', type: 'text' as const },
      { key: 'ber_rating', label: 'BER Rating', type: 'text' as const },
      { key: 'floor_area', label: 'Floor Area (m²)', type: 'number' as const },
      { key: 'status', label: 'Status', type: 'text' as const },
      { key: 'agent_name', label: 'Agent Name', type: 'text' as const },
      { key: 'agent_phone', label: 'Agent Phone', type: 'text' as const },
      { key: 'last_updated', label: 'Last Updated', type: 'date' as const },
    ];

    return fieldMappings.map(field => {
      const sources: Record<string, any> = {};
      const values: any[] = [];

      // Collect values from all sources
      Object.entries(sourceData).forEach(([sourceName, data]) => {
        const value = data[field.key];
        sources[sourceName] = value;
        if (value !== undefined && value !== null) {
          values.push(value);
        }
      });

      // Check if there are differences
      const hasDifferences = this.checkForDifferences(values, field.type);

      return {
        key: field.key,
        label: field.label,
        type: field.type,
        sources,
        hasDifferences,
      };
    });
  }

  private checkForDifferences(values: any[], type: string): boolean {
    if (values.length <= 1) return false;

    switch (type) {
      case 'currency':
      case 'number':
        // For numbers, consider differences > 1% as significant
        const numbers = values.map(v => Number(v)).filter(n => !isNaN(n));
        if (numbers.length <= 1) return false;
        const min = Math.min(...numbers);
        const max = Math.max(...numbers);
        return (max - min) / min > 0.01; // 1% threshold

      case 'text':
        // For text, normalize and compare
        const normalized = values.map(v => 
          String(v || '').toLowerCase().trim().replace(/\s+/g, ' ')
        );
        return new Set(normalized).size > 1;

      case 'date':
        // For dates, compare timestamps
        const dates = values.map(v => new Date(v).getTime()).filter(d => !isNaN(d));
        return new Set(dates).size > 1;

      default:
        return new Set(values.map(v => String(v))).size > 1;
    }
  }

  formatValue(value: any, type: string): string {
    if (value === undefined || value === null || value === '') {
      return '-';
    }

    switch (type) {
      case 'currency':
        return `€${Number(value).toLocaleString()}`;
      case 'number':
        return Number(value).toLocaleString();
      case 'date':
        return new Date(value).toLocaleDateString();
      default:
        return String(value);
    }
  }

  getDifferencePercentage(value1: any, value2: any, type: string): number | null {
    if (type !== 'currency' && type !== 'number') return null;
    
    const num1 = Number(value1);
    const num2 = Number(value2);
    
    if (isNaN(num1) || isNaN(num2) || num2 === 0) return null;
    
    return Math.round(((num1 - num2) / num2) * 100);
  }
}

export const dataComparisonService = new DataComparisonService();