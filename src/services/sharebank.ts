import { supabase } from './supabase';

export interface ShareBankFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  storage_path?: string;
  google_drive_id?: string;
  google_drive_url?: string;
  size?: number;
  mime_type?: string;
  parent_id?: string;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
}

export interface ShareBankExport {
  id: string;
  name: string;
  type: 'agencies' | 'properties' | 'mixed';
  data: any;
  file_id?: string;
  created_at: Date;
  created_by?: string;
}

class ShareBankService {
  private readonly BUCKET_NAME = 'sharebank';
  private readonly GOOGLE_DRIVE_FOLDER_ID = '1e9caJPRf5P6V26_FET3YhdxSaxrsQxmx';

  async ensureBucketExists(): Promise<void> {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === this.BUCKET_NAME);

    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(this.BUCKET_NAME, {
        public: true,
        fileSizeLimit: 52428800,
      });

      if (error && !error.message.includes('already exists')) {
        console.error('Failed to create bucket:', error);
        throw error;
      }
    }
  }

  private async uploadToGoogleDrive(file: File): Promise<{ id: string; webViewLink: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderId', this.GOOGLE_DRIVE_FOLDER_ID);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/google-drive-upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload to Google Drive');
    }

    return await response.json();
  }

  async listFiles(parentPath: string = '/'): Promise<ShareBankFile[]> {
    const { data, error } = await supabase
      .from('sharebank_files')
      .select('*')
      .eq('path', parentPath)
      .order('type', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Failed to list files:', error);
      throw error;
    }

    return (data || []).map(file => ({
      ...file,
      created_at: new Date(file.created_at),
      updated_at: new Date(file.updated_at),
    }));
  }

  async createFolder(name: string, parentPath: string = '/'): Promise<ShareBankFile> {
    const { data, error } = await supabase
      .from('sharebank_files')
      .insert({
        name,
        type: 'folder',
        path: parentPath,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create folder:', error);
      throw error;
    }

    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  }

  async uploadFile(file: File, parentPath: string = '/'): Promise<ShareBankFile> {
    await this.ensureBucketExists();

    const fileName = `${Date.now()}_${file.name}`;
    const storagePath = `${parentPath === '/' ? '' : parentPath}/${fileName}`;

    let googleDriveId: string | undefined;
    let googleDriveUrl: string | undefined;

    try {
      const driveResult = await this.uploadToGoogleDrive(file);
      googleDriveId = driveResult.id;
      googleDriveUrl = driveResult.webViewLink;
    } catch (error) {
      console.warn('Failed to upload to Google Drive, falling back to Supabase storage:', error);
    }

    const { error: uploadError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(storagePath, file);

    if (uploadError) {
      console.error('Failed to upload file:', uploadError);
      throw uploadError;
    }

    const { data, error } = await supabase
      .from('sharebank_files')
      .insert({
        name: file.name,
        type: 'file',
        path: parentPath,
        storage_path: storagePath,
        google_drive_id: googleDriveId,
        google_drive_url: googleDriveUrl,
        size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (error) {
      await supabase.storage.from(this.BUCKET_NAME).remove([storagePath]);
      console.error('Failed to create file record:', error);
      throw error;
    }

    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  }

  async deleteFile(file: ShareBankFile): Promise<void> {
    if (file.type === 'file' && file.storage_path) {
      const { error: storageError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([file.storage_path]);

      if (storageError) {
        console.error('Failed to delete file from storage:', storageError);
      }
    }

    const { error } = await supabase
      .from('sharebank_files')
      .delete()
      .eq('id', file.id);

    if (error) {
      console.error('Failed to delete file record:', error);
      throw error;
    }
  }

  async deleteFiles(fileIds: string[]): Promise<void> {
    const { data: files } = await supabase
      .from('sharebank_files')
      .select('*')
      .in('id', fileIds);

    if (files) {
      const storageFilesToDelete = files
        .filter(f => f.type === 'file' && f.storage_path)
        .map(f => f.storage_path);

      if (storageFilesToDelete.length > 0) {
        await supabase.storage.from(this.BUCKET_NAME).remove(storageFilesToDelete);
      }
    }

    const { error } = await supabase
      .from('sharebank_files')
      .delete()
      .in('id', fileIds);

    if (error) {
      console.error('Failed to delete files:', error);
      throw error;
    }
  }

  async getFileUrl(file: ShareBankFile): Promise<string | null> {
    if (file.type !== 'file' || !file.storage_path) return null;

    const { data } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(file.storage_path);

    return data.publicUrl;
  }

  async downloadFile(file: ShareBankFile): Promise<Blob | null> {
    if (file.type !== 'file' || !file.storage_path) return null;

    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .download(file.storage_path);

    if (error) {
      console.error('Failed to download file:', error);
      throw error;
    }

    return data;
  }

  async exportData(
    name: string,
    type: 'agencies' | 'properties' | 'mixed',
    data: any
  ): Promise<ShareBankExport> {
    const jsonBlob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });

    const fileName = `${name.replace(/\s+/g, '_')}_${Date.now()}.json`;
    const file = new File([jsonBlob], fileName, { type: 'application/json' });

    const uploadedFile = await this.uploadFile(file, '/exports');

    const { data: exportData, error } = await supabase
      .from('sharebank_exports')
      .insert({
        name,
        type,
        data,
        file_id: uploadedFile.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create export record:', error);
      throw error;
    }

    return {
      ...exportData,
      created_at: new Date(exportData.created_at),
    };
  }

  async listExports(): Promise<ShareBankExport[]> {
    const { data, error } = await supabase
      .from('sharebank_exports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to list exports:', error);
      throw error;
    }

    return (data || []).map(exp => ({
      ...exp,
      created_at: new Date(exp.created_at),
    }));
  }

  async getExport(id: string): Promise<ShareBankExport | null> {
    const { data, error } = await supabase
      .from('sharebank_exports')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Failed to get export:', error);
      throw error;
    }

    if (!data) return null;

    return {
      ...data,
      created_at: new Date(data.created_at),
    };
  }

  async deleteExport(id: string): Promise<void> {
    const { error } = await supabase
      .from('sharebank_exports')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete export:', error);
      throw error;
    }
  }
}

export const shareBankService = new ShareBankService();
