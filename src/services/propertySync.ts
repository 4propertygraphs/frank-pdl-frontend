import { supabase } from './supabase';
import { apiService } from './api';

export interface Property {
  id: string;
  agency_id: string | null;
  title: string;
  address: string;
  city: string;
  county: string;
  country: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  type: string;
  status: string;
  description: string;
  images: string[];
  raw_data: any;
  created_at: string;
  updated_at: string;
  synced_at: string;
}

export interface SyncMetadata {
  id: string;
  agency_id: string;
  last_sync_at: string;
  next_sync_at: string;
  sync_status: 'pending' | 'success' | 'failed' | 'in_progress';
  sync_error: string | null;
  properties_count: number;
  created_at: string;
  updated_at: string;
}

class PropertySyncService {
  private readonly SYNC_INTERVAL_DAYS = 2;

  async needsSync(agencyId: string): Promise<boolean> {
    const { data: metadata } = await supabase
      .from('agency_sync_metadata')
      .select('next_sync_at')
      .eq('agency_id', agencyId)
      .maybeSingle();

    if (!metadata) {
      return true;
    }

    const nextSync = new Date(metadata.next_sync_at);
    return nextSync <= new Date();
  }

  async getPropertiesFromDb(agencyId: string): Promise<Property[]> {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('agency_id', agencyId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch properties from DB:', error);
      return [];
    }

    return data || [];
  }

  async getAllPropertiesFromDb(): Promise<Property[]> {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch all properties from DB:', error);
      return [];
    }

    return data || [];
  }

  async syncAgencyProperties(agencyId: string): Promise<Property[]> {
    try {
      console.log(`🔄 Starting sync for agency ${agencyId} - checking database first`);

      await this.updateSyncStatus(agencyId, 'in_progress', null);

      const { data: existingProps } = await supabase
        .from('properties')
        .select('*')
        .eq('agency_id', agencyId);

      if (existingProps && existingProps.length > 0) {
        console.log(`✅ Found ${existingProps.length} properties in database for ${agencyId}`);
        await this.updateSyncStatus(agencyId, 'success', null, existingProps.length);
        return existingProps as Property[];
      }

      console.log(`📭 No properties in database for ${agencyId}`);
      await this.updateSyncStatus(agencyId, 'success', null, 0);
      return [];
    } catch (err: any) {
      console.error(`Sync failed for ${agencyId}:`, err);
      await this.updateSyncStatus(agencyId, 'failed', err.message, 0);
      throw err;
    }
  }

  private async updateSyncStatus(
    agencyId: string,
    status: SyncMetadata['sync_status'],
    error: string | null,
    count?: number
  ): Promise<void> {
    const now = new Date();
    const nextSync = new Date(now);
    nextSync.setDate(nextSync.getDate() + this.SYNC_INTERVAL_DAYS);

    const updateData: any = {
      agency_id: agencyId,
      last_sync_at: now.toISOString(),
      next_sync_at: nextSync.toISOString(),
      sync_status: status,
      sync_error: error,
      updated_at: now.toISOString(),
    };

    if (count !== undefined) {
      updateData.properties_count = count;
    }

    const { error: upsertError } = await supabase
      .from('agency_sync_metadata')
      .upsert(updateData, {
        onConflict: 'agency_id',
      });

    if (upsertError) {
      console.error('Failed to update sync metadata:', upsertError);
    }
  }

  async getPropertiesWithAutoSync(agencyId: string): Promise<Property[]> {
    const cachedProperties = await this.getPropertiesFromDb(agencyId);

    if (cachedProperties.length > 0) {
      console.log(`✨ Found ${cachedProperties.length} cached properties for agency ${agencyId}`);

      const shouldSync = await this.needsSync(agencyId);

      if (shouldSync) {
        console.log(`⏰ Agency ${agencyId} needs sync, attempting background update...`);
        this.syncAgencyProperties(agencyId).catch((error) => {
          console.warn('Background sync failed:', error);
        });
      }

      return cachedProperties;
    }

    console.log(`🔄 No cached data for agency ${agencyId}, fetching from API...`);
    try {
      return await this.syncAgencyProperties(agencyId);
    } catch (error) {
      console.error('Initial sync failed:', error);
      return [];
    }
  }

  async getSyncMetadata(agencyId: string): Promise<SyncMetadata | null> {
    const { data } = await supabase
      .from('agency_sync_metadata')
      .select('*')
      .eq('agency_id', agencyId)
      .maybeSingle();

    return data;
  }

  async getAllSyncMetadata(): Promise<SyncMetadata[]> {
    const { data, error } = await supabase
      .from('agency_sync_metadata')
      .select('*')
      .order('last_sync_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch sync metadata:', error);
      return [];
    }

    return data || [];
  }

  async forceSync(agencyId: string): Promise<Property[]> {
    console.log(`🔨 Force syncing agency ${agencyId}`);

    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('agency_id', agencyId);

      if (error) {
        console.error('Database query error:', error);
        return [];
      }

      if (data && data.length > 0) {
        console.log(`✅ Found ${data.length} properties in database for ${agencyId}`);
        await this.updateSyncStatus(agencyId, 'success', null, data.length);
        return data as Property[];
      }

      console.log(`📭 No properties found in database for ${agencyId}`);
      return [];
    } catch (err: any) {
      console.error(`Failed to force sync ${agencyId}:`, err);
      return [];
    }
  }
}

export const propertySyncService = new PropertySyncService();
export default propertySyncService;
