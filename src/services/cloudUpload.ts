import { supabase } from './supabase';
import { Property } from '../types';
import { xmlParser } from './xmlParser';

export class CloudUploadService {
  private cachedProperties: Property[] = [];
  private propertiesByAgency: Record<string, Property[]> = {};
  private isLoaded = false;
  async uploadPropertiesFromXML(xmlFilename: string): Promise<{ success: number; failed: number; errors: string[] }> {
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    try {
      console.log(`📤 Loading properties from ${xmlFilename}...`);
      const properties = await xmlParser.loadXMLFile(xmlFilename);
      console.log(`📦 Found ${properties.length} properties in XML`);

      for (const property of properties) {
        try {
          const { error } = await supabase
            .from('properties')
            .upsert(property, {
              onConflict: 'id',
              ignoreDuplicates: false,
            });

          if (error) {
            console.error(`❌ Failed to upload property ${property.id}:`, error);
            errors.push(`Property ${property.id}: ${error.message}`);
            failed++;
          } else {
            success++;
          }
        } catch (err: any) {
          console.error(`❌ Error uploading property ${property.id}:`, err);
          errors.push(`Property ${property.id}: ${err.message}`);
          failed++;
        }
      }

      console.log(`✅ Upload complete: ${success} successful, ${failed} failed`);
      return { success, failed, errors };
    } catch (error: any) {
      console.error('❌ Failed to load XML file:', error);
      throw new Error(`Failed to load XML file: ${error.message}`);
    }
  }

  async loadAllXMLFiles(): Promise<{ total: number; loaded: number; errors: string[] }> {
    const allErrors: string[] = [];
    this.cachedProperties = [];
    this.propertiesByAgency = {};

    try {
      const response = await fetch('/A-data.json');
      const agencyUrls = await response.json();

      console.log(`📋 Loading properties from ${agencyUrls.length} agency XML URLs...`);

      for (const agencyData of agencyUrls) {
        const sitePrefix = agencyData.SitePrefix?.toLowerCase();
        const xmlUrl = agencyData.url;

        if (!sitePrefix || !xmlUrl) continue;

        try {
          const xmlResponse = await fetch(xmlUrl);
          if (!xmlResponse.ok) {
            console.log(`⏭️  Skipping ${sitePrefix.toUpperCase()}: HTTP ${xmlResponse.status}`);
            continue;
          }

          const xmlText = await xmlResponse.text();
          const properties = xmlParser.parseXML(xmlText, sitePrefix.toUpperCase());

          if (properties.length > 0) {
            this.cachedProperties.push(...properties);
            this.propertiesByAgency[sitePrefix] = properties;
            console.log(`✅ ${sitePrefix.toUpperCase()}: ${properties.length} properties`);
          }
        } catch (error: any) {
          console.log(`⏭️  Skipping ${sitePrefix.toUpperCase()}: ${error.message}`);
        }
      }

      this.isLoaded = true;
      console.log(`\n🎉 Total loaded: ${this.cachedProperties.length} properties from ${Object.keys(this.propertiesByAgency).length} agencies`);

    } catch (error: any) {
      console.error('Failed to load A-data.json:', error);
      allErrors.push(`Failed to load agencies: ${error.message}`);
    }

    return {
      total: this.cachedProperties.length,
      loaded: Object.keys(this.propertiesByAgency).length,
      errors: allErrors,
    };
  }

  async uploadAllXMLFiles(): Promise<{ total: number; success: number; failed: number; errors: string[] }> {
    if (!this.isLoaded) {
      await this.loadAllXMLFiles();
    }

    let totalSuccess = 0;
    let totalFailed = 0;
    const allErrors: string[] = [];

    console.log(`📤 Uploading ${this.cachedProperties.length} properties to Supabase...`);

    for (const property of this.cachedProperties) {
      try {
        const { error } = await supabase
          .from('properties')
          .upsert(property, {
            onConflict: 'id',
            ignoreDuplicates: false,
          });

        if (error) {
          console.error(`❌ Failed to upload property ${property.id}:`, error);
          allErrors.push(`Property ${property.id}: ${error.message}`);
          totalFailed++;
        } else {
          totalSuccess++;
        }
      } catch (err: any) {
        console.error(`❌ Error uploading property ${property.id}:`, err);
        allErrors.push(`Property ${property.id}: ${err.message}`);
        totalFailed++;
      }
    }

    console.log(`✅ Upload complete: ${totalSuccess} successful, ${totalFailed} failed`);

    return {
      total: totalSuccess + totalFailed,
      success: totalSuccess,
      failed: totalFailed,
      errors: allErrors,
    };
  }

  async getAllProperties(): Promise<Property[]> {
    if (!this.isLoaded) {
      await this.loadAllXMLFiles();
    }
    return this.cachedProperties;
  }

  async getPropertiesByAgency(agencyKey: string): Promise<Property[]> {
    if (!this.isLoaded) {
      await this.loadAllXMLFiles();
    }
    return this.propertiesByAgency[agencyKey.toLowerCase()] || [];
  }

  getPropertyCountsByAgency(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const [agencyKey, properties] of Object.entries(this.propertiesByAgency)) {
      counts[agencyKey] = properties.length;
    }
    console.log('📊 Property counts by agency:', counts);
    return counts;
  }

  async getPropertiesFromDatabase(): Promise<Property[]> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Database fetch error (this is normal if table is empty):', error.message);
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.warn('Error fetching properties (returning empty array):', error.message);
      return [];
    }
  }

  async clearAllProperties(): Promise<void> {
    const { error } = await supabase
      .from('properties')
      .delete()
      .neq('id', '');

    if (error) {
      throw error;
    }
  }

}

export const cloudUploadService = new CloudUploadService();
