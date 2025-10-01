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
    const xmlFiles = ['knam-0.xml'];
    let totalSuccess = 0;
    let totalFailed = 0;
    const allErrors: string[] = [];

    for (const file of xmlFiles) {
      try {
        const result = await this.uploadPropertiesFromXML(file);
        totalSuccess += result.success;
        totalFailed += result.failed;
        allErrors.push(...result.errors);
      } catch (error: any) {
        console.error(`Failed to process ${file}:`, error);
        allErrors.push(`File ${file}: ${error.message}`);
      }
    }

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
}

export const cloudUploadService = new CloudUploadService();
