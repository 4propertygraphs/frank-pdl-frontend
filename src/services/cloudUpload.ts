import { supabase } from './supabase';
import { Property } from '../types';
import { xmlParser } from './xmlParser';

export class CloudUploadService {
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

  async uploadAllXMLFiles(): Promise<{ total: number; success: number; failed: number; errors: string[] }> {
    let totalSuccess = 0;
    let totalFailed = 0;
    const allErrors: string[] = [];

    try {
      const response = await fetch('/agencies.json');
      const agencies = await response.json();

      console.log(`📋 Found ${agencies.length} agencies, loading all XML files...`);

      for (const agency of agencies) {
        const sitePrefix = agency.SitePrefix?.toLowerCase();
        if (!sitePrefix) continue;

        const xmlFile = `${sitePrefix}-0.xml`;

        try {
          const checkResponse = await fetch(`/${xmlFile}`, { method: 'HEAD' });
          if (!checkResponse.ok) {
            console.log(`⏭️  Skipping ${xmlFile} (file not found)`);
            continue;
          }

          console.log(`📤 Processing ${xmlFile} for ${agency.SiteName}...`);
          const result = await this.uploadPropertiesFromXML(xmlFile);
          totalSuccess += result.success;
          totalFailed += result.failed;
          allErrors.push(...result.errors);

          if (result.success > 0) {
            console.log(`✅ ${xmlFile}: ${result.success} properties loaded`);
          }
        } catch (error: any) {
          console.log(`⏭️  Skipping ${xmlFile}: ${error.message}`);
        }
      }
    } catch (error: any) {
      console.error('Failed to load agencies.json:', error);
      allErrors.push(`Failed to load agencies: ${error.message}`);
    }

    console.log(`\n🎉 Total loaded: ${totalSuccess} properties from all XML files`);

    return {
      total: totalSuccess + totalFailed,
      success: totalSuccess,
      failed: totalFailed,
      errors: allErrors,
    };
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

  async getPropertyCountsByAgency(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};

    try {
      const { data, error } = await supabase
        .from('properties')
        .select('agency_id');

      if (error) {
        console.warn('Failed to fetch property counts:', error);
        return counts;
      }

      for (const prop of data || []) {
        const agencyId = (prop.agency_id || 'unknown').toLowerCase();
        counts[agencyId] = (counts[agencyId] || 0) + 1;
      }

      console.log('📊 Property counts by agency:', counts);
      return counts;
    } catch (error: any) {
      console.warn('Error getting property counts:', error);
      return counts;
    }
  }
}

export const cloudUploadService = new CloudUploadService();
