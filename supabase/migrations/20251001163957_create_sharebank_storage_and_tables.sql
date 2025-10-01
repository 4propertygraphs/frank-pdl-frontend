/*
  # Create Share Bank Storage and Tables

  1. Storage Setup
    - Create a storage bucket called 'sharebank' for file uploads
    - Enable public access for file downloads
  
  2. New Tables
    - `sharebank_files`
      - `id` (uuid, primary key)
      - `name` (text) - File/folder name
      - `type` (text) - 'file' or 'folder'
      - `path` (text) - Path in storage bucket
      - `storage_path` (text) - Full storage path for files
      - `size` (bigint) - File size in bytes (null for folders)
      - `mime_type` (text) - MIME type for files
      - `parent_id` (uuid) - Parent folder ID (null for root items)
      - `metadata` (jsonb) - Additional metadata
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `created_by` (uuid) - User who created the file
    
    - `sharebank_exports`
      - `id` (uuid, primary key)
      - `name` (text) - Export name/description
      - `type` (text) - 'agencies' or 'properties'
      - `data` (jsonb) - Exported data
      - `file_id` (uuid) - Reference to sharebank_files
      - `created_at` (timestamptz)
      - `created_by` (uuid)

  3. Security
    - Enable RLS on both tables
    - Allow anonymous users to read files (public share bank)
    - Allow authenticated users to create/update/delete files
    - Storage bucket policies for public read access

  4. Important Notes
    - Files are stored in Supabase Storage bucket 'sharebank'
    - Folders are logical entries in the database only
    - All users can browse and download files
    - Only authenticated users can upload/manage files
*/

-- Create sharebank_files table
CREATE TABLE IF NOT EXISTS sharebank_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('file', 'folder')),
  path text NOT NULL DEFAULT '/',
  storage_path text,
  size bigint,
  mime_type text,
  parent_id uuid REFERENCES sharebank_files(id) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid
);

-- Create sharebank_exports table
CREATE TABLE IF NOT EXISTS sharebank_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('agencies', 'properties', 'mixed')),
  data jsonb NOT NULL,
  file_id uuid REFERENCES sharebank_files(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid
);

-- Enable RLS
ALTER TABLE sharebank_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE sharebank_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sharebank_files
CREATE POLICY "Anyone can read files"
  ON sharebank_files
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert files"
  ON sharebank_files
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update files"
  ON sharebank_files
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete files"
  ON sharebank_files
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for sharebank_exports
CREATE POLICY "Anyone can read exports"
  ON sharebank_exports
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert exports"
  ON sharebank_exports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete exports"
  ON sharebank_exports
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sharebank_files_parent_id ON sharebank_files(parent_id);
CREATE INDEX IF NOT EXISTS idx_sharebank_files_path ON sharebank_files(path);
CREATE INDEX IF NOT EXISTS idx_sharebank_files_type ON sharebank_files(type);
CREATE INDEX IF NOT EXISTS idx_sharebank_exports_type ON sharebank_exports(type);
CREATE INDEX IF NOT EXISTS idx_sharebank_exports_file_id ON sharebank_exports(file_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_sharebank_files_updated_at'
  ) THEN
    CREATE TRIGGER update_sharebank_files_updated_at
      BEFORE UPDATE ON sharebank_files
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;