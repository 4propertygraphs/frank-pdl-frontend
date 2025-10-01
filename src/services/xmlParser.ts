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

      let propertyList: any[] = [];

      if (result.data?.properties?.property) {
        propertyList = Array.isArray(result.data.properties.property)
          ? result.data.properties.property
          : [result.data.properties.property];
      } else if (result.properties?.property) {
        propertyList = Array.isArray(result.properties.property)
          ? result.properties.property
          : [result.properties.property];
      } else if (result.data?.property) {
        propertyList = Array.isArray(result.data.property)
          ? result.data.property
          : [result.data.property];
      } else if (result.property) {
        propertyList = Array.isArray(result.property)
          ? result.property
          : [result.property];
      }

      if (propertyList.length === 0) {
        console.warn('No properties found in XML for', agencyId);
        console.log('XML structure:', Object.keys(result));
        if (result.data) {
          console.log('data keys:', Object.keys(result.data));
        }
        return [];
      }

      console.log(`✅ Found ${propertyList.length} properties for ${agencyId}`);
      return propertyList.map((prop: any) => this.convertToProperty(prop, agencyId));
    } catch (error) {
      console.error('Error parsing XML:', error);
      throw error;
    }
  }

  private convertToProperty(xmlProp: any, agencyId: string): Property {
    const images: string[] = [];

    if (xmlProp.pictures) {
      for (let i = 1; i <= 50; i++) {
        const picKey = `picture${i}`;
        const picValue = xmlProp.pictures[picKey];

        if (picValue) {
          const url = typeof picValue === 'string' ? picValue : picValue['#text'];
          if (url && url.trim()) {
            images.push(url.trim());
          }
        } else {
          break;
        }
      }
    }

    if (images.length === 0 && xmlProp.imageurl) {
      if (Array.isArray(xmlProp.imageurl)) {
        images.push(...xmlProp.imageurl.filter((url: string) => url));
      } else if (xmlProp.imageurl) {
        images.push(xmlProp.imageurl);
      }
    }

    const title = xmlProp.displayaddress
      || [xmlProp.propertyname, xmlProp.street].filter(Boolean).join(' ')
      || xmlProp.descriptionbrief
      || xmlProp.address1
      || 'Untitled Property';

    return {
      id: xmlProp.referencenumber || xmlProp.id || `xml-${Date.now()}-${Math.random()}`,
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
      status: this.mapStatus(xmlProp.status, xmlProp.category),
      description: xmlProp.descriptionfull || xmlProp.descriptionbrief || '',
      images: images,
      agent_name: xmlProp.username || undefined,
      agent_email: xmlProp.useremail || undefined,
      agent_phone: xmlProp.usertelephone || undefined,
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

  private mapStatus(status: any, category: any): string {
    const statusStr = typeof status === 'string' ? status : (status?.['#text'] || '');
    const categoryStr = typeof category === 'string' ? category : (category?.['#text'] || '');

    const statusLower = statusStr.toLowerCase();
    const categoryLower = categoryStr.toLowerCase();

    if (statusLower.includes('sold')) return 'sold';
    if (statusLower.includes('let')) return 'let';

    if (categoryLower.includes('sale')) return 'for_sale';
    if (categoryLower.includes('let') || categoryLower.includes('rent')) return 'for_rent';

    if (statusLower.includes('sale')) return 'for_sale';
    if (statusLower.includes('rent')) return 'for_rent';

    return 'active';
  }
}

export const xmlParser = new XMLPropertyParser();
