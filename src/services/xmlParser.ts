import { Property } from '../types';
import { XMLParser } from 'fast-xml-parser';

export class XMLPropertyParser {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      trimValues: true,
    });
  }

  async loadXMLFile(filename: string): Promise<Property[]> {
    try {
      const response = await fetch(`/${filename}`);
      if (!response.ok) {
        throw new Error(`Failed to load ${filename}`);
      }

      const xmlText = await response.text();
      const agencyId = this.extractAgencyIdFromFilename(filename);
      return this.parseXML(xmlText, agencyId);
    } catch (error) {
      console.error(`Error loading XML file ${filename}:`, error);
      throw error;
    }
  }

  private extractAgencyIdFromFilename(filename: string): string {
    const match = filename.match(/([a-zA-Z0-9]+)-\d+\.xml/i);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
    return 'unknown';
  }

  parseXML(xmlText: string, agencyId: string = 'unknown'): Property[] {
    try {
      const result = this.parser.parse(xmlText);

      if (!result.data || !result.data.properties || !result.data.properties.property) {
        console.warn('No properties found in XML');
        return [];
      }

      const properties = Array.isArray(result.data.properties.property)
        ? result.data.properties.property
        : [result.data.properties.property];

      return properties.map((prop: any) => this.convertToProperty(prop, agencyId));
    } catch (error) {
      console.error('Error parsing XML:', error);
      throw error;
    }
  }

  private convertToProperty(xmlProp: any, agencyId: string): Property {
    const images: string[] = [];

    if (xmlProp.imageurl) {
      if (Array.isArray(xmlProp.imageurl)) {
        images.push(...xmlProp.imageurl.filter((url: string) => url));
      } else if (xmlProp.imageurl) {
        images.push(xmlProp.imageurl);
      }
    }

    const titleParts = [xmlProp.propertyname, xmlProp.street].filter(Boolean);
    const title = titleParts.length > 0
      ? titleParts.join(' ')
      : xmlProp.descriptionbrief || xmlProp.address1 || 'Untitled Property';

    return {
      id: xmlProp.referencenumber || `xml-${Date.now()}-${Math.random()}`,
      agency_id: agencyId,
      title: title,
      address: [xmlProp.address1, xmlProp.address2, xmlProp.address3]
        .filter(Boolean)
        .join(', '),
      city: xmlProp.address2 || xmlProp.town || '',
      county: xmlProp.address3 || '',
      postcode: xmlProp.address4 || '',
      country: xmlProp.country || 'Ireland',
      price: this.parsePrice(xmlProp.price),
      bedrooms: this.parseNumber(xmlProp.bedrooms),
      bathrooms: this.parseNumber(xmlProp.bathrooms),
      type: xmlProp.type || 'Unknown',
      status: this.mapStatus(xmlProp.status),
      description: xmlProp.descriptionfull || xmlProp.descriptionbrief || '',
      images: images,
      created_at: xmlProp.addeddate || new Date().toISOString(),
      updated_at: xmlProp.updateddate || new Date().toISOString(),
    };
  }

  private parsePrice(price: any): number {
    if (typeof price === 'number') return price;
    if (typeof price === 'string') {
      const cleaned = price.replace(/[^0-9.]/g, '');
      return parseFloat(cleaned) || 0;
    }
    return 0;
  }

  private parseNumber(value: any): number | null {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  private mapStatus(status: any): string {
    if (!status) return 'active';
    const statusStr = String(status).toLowerCase();

    if (statusStr.includes('sale')) return 'for_sale';
    if (statusStr.includes('rent')) return 'for_rent';
    if (statusStr.includes('sold')) return 'sold';
    if (statusStr.includes('let')) return 'let';

    return 'active';
  }
}

export const xmlParser = new XMLPropertyParser();
