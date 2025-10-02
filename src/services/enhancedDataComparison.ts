import { Property } from '../types';
import { daftApiService, DaftProperty } from './daftApi';
import { myHomeApiService, MyHomeProperty } from './myhomeApi';
import { myHomeApiService as wpApiService, WordPressProperty } from './wordpressApi';
import { repo1BackendService } from './repo1Backend';

export interface EnhancedDataSource {
  name: string;
  endpoint?: string;
  color: string;
  icon: string;
  status: 'connected' | 'error' | 'loading' | 'not_configured';
  lastSync?: string;
  errorMessage?: string;
}

export interface EnhancedComparisonField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'date' | 'rating';
  sources: Record<string, any>;
  hasDifferences: boolean;
  significantDifference: boolean;
  confidenceScore: number; // 0-100
  recommendations?: string[];
}

export interface EnhancedPropertyComparison {
  property: Property;
  fields: EnhancedComparisonField[];
  sources: EnhancedDataSource[];
  lastUpdated: string;
  overallConsistency: number; // 0-100
  criticalIssues: string[];
  suggestions: string[];
}

export class EnhancedDataComparisonService {
  private readonly dataSources: EnhancedDataSource[] = [
    { 
      name: 'Acquaint', 
      color: '#3b82f6', 
      icon: '🏢',
      status: 'connected',
      endpoint: 'https://www.acquaintcrm.co.uk/datafeeds/standardxml/'
    },
    { 
      name: 'Daft', 
      color: '#10b981', 
      icon: '🏠',
      status: 'not_configured',
      endpoint: 'https://www.daft.ie/api'
    },
    { 
      name: 'MyHome', 
      color: '#f59e0b', 
      icon: '🏡',
      status: 'not_configured',
      endpoint: 'https://www.myhome.ie/api'
    },
    { 
      name: 'WordPress', 
      color: '#8b5cf6', 
      icon: '📝',
      status: 'not_configured'
    },
  ];

  async comparePropertyDataEnhanced(property: Property): Promise<EnhancedPropertyComparison> {
    const sources = [...this.dataSources];

    sources[0].status = 'connected';

    let daftData = null;
    let myhomeData = null;
    let wordpressData = null;

    const useRepo1Backend = import.meta.env.VITE_USE_REPO1_BACKEND === 'true';

    if (useRepo1Backend) {
      try {
        sources[1].status = 'loading';
        sources[2].status = 'loading';

        const results = await repo1BackendService.comparePropertyAcrossSources(
          property.id,
          property.address || property.title
        );

        daftData = results.daft;
        myhomeData = results.myhome;

        sources[1].status = daftData ? 'connected' : 'error';
        sources[1].lastSync = new Date().toISOString();
        sources[1].errorMessage = daftData ? undefined : 'No data found';

        sources[2].status = myhomeData ? 'connected' : 'error';
        sources[2].lastSync = new Date().toISOString();
        sources[2].errorMessage = myhomeData ? undefined : 'No data found';
      } catch (error: any) {
        sources[1].status = 'error';
        sources[1].errorMessage = error.message;
        sources[2].status = 'error';
        sources[2].errorMessage = error.message;
      }
    } else {
      try {
        sources[1].status = 'loading';
        daftData = await this.fetchFromDaftEnhanced(property);
        sources[1].status = daftData ? 'connected' : 'error';
        sources[1].lastSync = new Date().toISOString();
      } catch (error: any) {
        sources[1].status = 'error';
        sources[1].errorMessage = error.message;
      }

      try {
        sources[2].status = 'loading';
        myhomeData = await this.fetchFromMyHomeEnhanced(property);
        sources[2].status = myhomeData ? 'connected' : 'error';
        sources[2].lastSync = new Date().toISOString();
      } catch (error: any) {
        sources[2].status = 'error';
        sources[2].errorMessage = error.message;
      }
    }

    wordpressData = await this.fetchFromWordPressEnhanced(property);
    sources[3].status = wordpressData ? 'connected' : 'not_configured';
    if (wordpressData) {
      sources[3].lastSync = new Date().toISOString();
    }

    const acquaintData = this.extractAcquaintData(property);

    const fields = this.buildEnhancedComparisonFields({
      acquaint: acquaintData,
      daft: daftData,
      myhome: myhomeData,
      wordpress: wordpressData,
    });

    const overallConsistency = this.calculateOverallConsistency(fields);
    const criticalIssues = this.identifyCriticalIssues(fields);
    const suggestions = this.generateSuggestions(fields, sources);

    return {
      property,
      fields,
      sources,
      lastUpdated: new Date().toISOString(),
      overallConsistency,
      criticalIssues,
      suggestions,
    };
  }

  private async fetchFromDaftEnhanced(property: Property): Promise<DaftProperty | null> {
    try {
      // Search by address first
      const searchResults = await daftApiService.searchByAddress(property.address || property.title);
      
      if (searchResults.length > 0) {
        // Find best match based on price and location similarity
        const bestMatch = this.findBestMatch(property, searchResults, 'daft');
        return bestMatch as DaftProperty;
      }
      
      return null;
    } catch (error) {
      console.error('Enhanced Daft fetch error:', error);
      return null;
    }
  }

  private async fetchFromMyHomeEnhanced(property: Property): Promise<MyHomeProperty | null> {
    try {
      const searchResults = await myHomeApiService.searchByAddress(property.address || property.title);
      
      if (searchResults.length > 0) {
        const bestMatch = this.findBestMatch(property, searchResults, 'myhome');
        return bestMatch as MyHomeProperty;
      }
      
      return null;
    } catch (error) {
      console.error('Enhanced MyHome fetch error:', error);
      return null;
    }
  }

  private async fetchFromWordPressEnhanced(property: Property): Promise<WordPressProperty | null> {
    try {
      // This would need to be configured per agency
      const wpBaseUrl = this.getWordPressUrlForAgency(property.agency_id);
      if (!wpBaseUrl) return null;

      wpApiService.setBaseUrl(wpBaseUrl);
      const searchResults = await wpApiService.searchByTitle(property.title);
      
      if (searchResults.length > 0) {
        const bestMatch = this.findBestMatch(property, searchResults, 'wordpress');
        return bestMatch as WordPressProperty;
      }
      
      return null;
    } catch (error) {
      console.error('Enhanced WordPress fetch error:', error);
      return null;
    }
  }

  private extractAcquaintData(property: Property): any {
    return {
      id: property.id,
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      type: property.type,
      address: property.address,
      city: property.city,
      county: property.county,
      postcode: property.postcode,
      description: property.description,
      images: property.images,
      agent_name: property.agent_name,
      agent_phone: property.agent_phone,
      agent_email: property.agent_email,
      status: property.status,
      created_at: property.created_at,
      updated_at: property.updated_at,
    };
  }

  private findBestMatch(targetProperty: Property, candidates: any[], sourceType: string): any | null {
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];

    // Score each candidate based on similarity
    const scoredCandidates = candidates.map(candidate => {
      let score = 0;
      
      // Price similarity (40% weight)
      const priceDiff = Math.abs((candidate.price || 0) - (targetProperty.price || 0));
      const priceScore = Math.max(0, 100 - (priceDiff / (targetProperty.price || 1)) * 100);
      score += priceScore * 0.4;
      
      // Bedroom similarity (20% weight)
      const bedroomDiff = Math.abs((candidate.bedrooms || 0) - (targetProperty.bedrooms || 0));
      const bedroomScore = Math.max(0, 100 - bedroomDiff * 25);
      score += bedroomScore * 0.2;
      
      // Address similarity (40% weight)
      const addressScore = this.calculateAddressSimilarity(
        targetProperty.address || targetProperty.title,
        this.getAddressFromCandidate(candidate, sourceType)
      );
      score += addressScore * 0.4;
      
      return { candidate, score };
    });

    // Return the best match
    const bestMatch = scoredCandidates.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    return bestMatch.score > 50 ? bestMatch.candidate : null; // Minimum 50% similarity
  }

  private getAddressFromCandidate(candidate: any, sourceType: string): string {
    switch (sourceType) {
      case 'daft':
        return candidate.address || candidate.displayAddress || '';
      case 'myhome':
        return candidate.displayAddress || candidate.address || '';
      case 'wordpress':
        return candidate.address || candidate.title || '';
      default:
        return '';
    }
  }

  private calculateAddressSimilarity(address1: string, address2: string): number {
    const normalize = (addr: string) => 
      addr.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const norm1 = normalize(address1);
    const norm2 = normalize(address2);

    if (norm1 === norm2) return 100;
    if (norm1.includes(norm2) || norm2.includes(norm1)) return 80;

    // Simple word overlap scoring
    const words1 = norm1.split(' ');
    const words2 = norm2.split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    
    return (commonWords.length / Math.max(words1.length, words2.length)) * 100;
  }

  private buildEnhancedComparisonFields(sourceData: Record<string, any>): EnhancedComparisonField[] {
    const fieldMappings = [
      { key: 'price', label: 'Price', type: 'currency' as const, weight: 0.3 },
      { key: 'bedrooms', label: 'Bedrooms', type: 'number' as const, weight: 0.2 },
      { key: 'bathrooms', label: 'Bathrooms', type: 'number' as const, weight: 0.15 },
      { key: 'type', label: 'Property Type', type: 'text' as const, weight: 0.1 },
      { key: 'address', label: 'Address', type: 'text' as const, weight: 0.1 },
      { key: 'county', label: 'County', type: 'text' as const, weight: 0.05 },
      { key: 'ber_rating', label: 'BER Rating', type: 'rating' as const, weight: 0.1 },
    ];

    return fieldMappings.map(field => {
      const sources: Record<string, any> = {};
      const values: any[] = [];

      // Map field names for each source
      Object.entries(sourceData).forEach(([sourceName, data]) => {
        if (!data) {
          sources[sourceName] = null;
          return;
        }

        let value;
        switch (sourceName) {
          case 'acquaint':
            value = data[field.key];
            break;
          case 'daft':
            value = this.mapDaftField(data, field.key);
            break;
          case 'myhome':
            value = this.mapMyHomeField(data, field.key);
            break;
          case 'wordpress':
            value = this.mapWordPressField(data, field.key);
            break;
        }

        sources[sourceName] = value;
        if (value !== undefined && value !== null && value !== '') {
          values.push(value);
        }
      });

      const hasDifferences = this.checkForDifferences(values, field.type);
      const significantDifference = this.checkForSignificantDifferences(values, field.type, field.weight);
      const confidenceScore = this.calculateConfidenceScore(values, field.type);
      const recommendations = this.generateFieldRecommendations(field.key, sources, hasDifferences);

      return {
        key: field.key,
        label: field.label,
        type: field.type,
        sources,
        hasDifferences,
        significantDifference,
        confidenceScore,
        recommendations,
      };
    });
  }

  private mapDaftField(daftData: DaftProperty, fieldKey: string): any {
    const mapping: Record<string, string> = {
      'price': 'price',
      'bedrooms': 'bedrooms',
      'bathrooms': 'bathrooms',
      'type': 'propertyType',
      'address': 'address',
      'county': 'county',
      'ber_rating': 'berRating',
    };
    
    const daftKey = mapping[fieldKey];
    return daftKey ? daftData[daftKey as keyof DaftProperty] : null;
  }

  private mapMyHomeField(myhomeData: MyHomeProperty, fieldKey: string): any {
    const mapping: Record<string, string> = {
      'price': 'price',
      'bedrooms': 'bedrooms',
      'bathrooms': 'bathrooms',
      'type': 'propertyType',
      'address': 'displayAddress',
      'county': 'county',
      'ber_rating': 'berRating',
    };
    
    const myhomeKey = mapping[fieldKey];
    return myhomeKey ? myhomeData[myhomeKey as keyof MyHomeProperty] : null;
  }

  private mapWordPressField(wpData: WordPressProperty, fieldKey: string): any {
    const mapping: Record<string, string> = {
      'price': 'price',
      'bedrooms': 'bedrooms',
      'bathrooms': 'bathrooms',
      'type': 'propertyType',
      'address': 'address',
      'county': 'propertyCounty',
      'ber_rating': 'berRating',
    };
    
    const wpKey = mapping[fieldKey];
    return wpKey ? wpData[wpKey as keyof WordPressProperty] : null;
  }

  private checkForDifferences(values: any[], type: string): boolean {
    if (values.length <= 1) return false;

    switch (type) {
      case 'currency':
      case 'number':
        const numbers = values.map(v => Number(v)).filter(n => !isNaN(n));
        if (numbers.length <= 1) return false;
        const min = Math.min(...numbers);
        const max = Math.max(...numbers);
        return (max - min) / min > 0.01; // 1% threshold

      case 'rating':
        // BER ratings: A1, A2, B1, etc.
        const ratings = values.filter(v => v && v.trim());
        return new Set(ratings.map(r => r.toUpperCase().trim())).size > 1;

      case 'text':
        const normalized = values.map(v => 
          String(v || '').toLowerCase().trim().replace(/\s+/g, ' ')
        );
        return new Set(normalized).size > 1;

      case 'date':
        const dates = values.map(v => new Date(v).getTime()).filter(d => !isNaN(d));
        return new Set(dates).size > 1;

      default:
        return new Set(values.map(v => String(v))).size > 1;
    }
  }

  private checkForSignificantDifferences(values: any[], type: string, weight: number): boolean {
    if (!this.checkForDifferences(values, type)) return false;

    switch (type) {
      case 'currency':
        const prices = values.map(v => Number(v)).filter(n => !isNaN(n));
        if (prices.length <= 1) return false;
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const percentDiff = (max - min) / min;
        return percentDiff > 0.05 && weight > 0.15; // 5% price diff + important field

      case 'number':
        const numbers = values.map(v => Number(v)).filter(n => !isNaN(n));
        if (numbers.length <= 1) return false;
        return new Set(numbers).size > 1 && weight > 0.1;

      default:
        return weight > 0.2; // Only significant for important text fields
    }
  }

  private calculateConfidenceScore(values: any[], type: string): number {
    const validValues = values.filter(v => v !== null && v !== undefined && v !== '');
    if (validValues.length === 0) return 0;

    const uniqueValues = new Set(validValues.map(v => String(v).toLowerCase().trim())).size;
    const totalValues = validValues.length;

    // Higher confidence when more sources agree
    const agreementRatio = (totalValues - uniqueValues + 1) / totalValues;
    return Math.round(agreementRatio * 100);
  }

  private generateFieldRecommendations(fieldKey: string, sources: Record<string, any>, hasDifferences: boolean): string[] {
    const recommendations: string[] = [];

    if (!hasDifferences) {
      recommendations.push('✅ Data is consistent across all sources');
      return recommendations;
    }

    switch (fieldKey) {
      case 'price':
        recommendations.push('🔍 Verify current market price with agent');
        recommendations.push('📊 Check recent comparable sales');
        break;
      case 'bedrooms':
      case 'bathrooms':
        recommendations.push('🏠 Confirm room count with property inspection');
        recommendations.push('📋 Update listing descriptions for clarity');
        break;
      case 'ber_rating':
        recommendations.push('⚡ Request latest BER certificate');
        recommendations.push('🔄 Update all platforms with correct rating');
        break;
      case 'address':
        recommendations.push('📍 Standardize address format across platforms');
        recommendations.push('🗺️ Verify with official postal service');
        break;
      default:
        recommendations.push('🔄 Synchronize data across all platforms');
    }

    return recommendations;
  }

  private calculateOverallConsistency(fields: EnhancedComparisonField[]): number {
    if (fields.length === 0) return 100;

    const consistentFields = fields.filter(f => !f.hasDifferences).length;
    return Math.round((consistentFields / fields.length) * 100);
  }

  private identifyCriticalIssues(fields: EnhancedComparisonField[]): string[] {
    const issues: string[] = [];

    const priceField = fields.find(f => f.key === 'price');
    if (priceField?.significantDifference) {
      issues.push('🚨 Significant price differences detected across platforms');
    }

    const addressField = fields.find(f => f.key === 'address');
    if (addressField?.hasDifferences) {
      issues.push('📍 Address inconsistencies may affect property visibility');
    }

    const bedroomField = fields.find(f => f.key === 'bedrooms');
    if (bedroomField?.hasDifferences) {
      issues.push('🛏️ Bedroom count discrepancies may mislead buyers');
    }

    return issues;
  }

  private generateSuggestions(fields: EnhancedComparisonField[], sources: EnhancedDataSource[]): string[] {
    const suggestions: string[] = [];

    const inconsistentFields = fields.filter(f => f.hasDifferences).length;
    const totalFields = fields.length;
    const consistencyRatio = (totalFields - inconsistentFields) / totalFields;

    if (consistencyRatio < 0.7) {
      suggestions.push('🔄 Consider implementing automated data synchronization');
      suggestions.push('📋 Review data entry processes across all platforms');
    }

    const connectedSources = sources.filter(s => s.status === 'connected').length;
    if (connectedSources < 3) {
      suggestions.push('🔗 Connect additional data sources for better comparison');
    }

    const errorSources = sources.filter(s => s.status === 'error');
    if (errorSources.length > 0) {
      suggestions.push(`⚠️ Fix connection issues with: ${errorSources.map(s => s.name).join(', ')}`);
    }

    return suggestions;
  }

  private getWordPressUrlForAgency(agencyId: string | null): string | null {
    // This would be configured per agency
    const agencyUrls: Record<string, string> = {
      'KNAM': 'https://caseykennedy.ie',
      'BSKY': 'https://blueskyproperties.ie',
      // Add more agency WordPress URLs as needed
    };

    return agencyId ? agencyUrls[agencyId.toUpperCase()] || null : null;
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
      case 'rating':
        return String(value).toUpperCase();
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

export const enhancedDataComparisonService = new EnhancedDataComparisonService();