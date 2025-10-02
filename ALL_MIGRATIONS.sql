/*
  # Create Properties and Sync Metadata Tables

  1. New Tables
    - `properties`
      - `id` (text, primary key) - Property ID from Acquaint
      - `agency_id` (text) - Agency identifier
      - `title` (text) - Property title/address
      - `address` (text) - Street address
      - `city` (text) - City name
      - `county` (text) - County/region
      - `country` (text) - Country (default Ireland)
      - `price` (numeric) - Property price
      - `bedrooms` (integer) - Number of bedrooms
      - `bathrooms` (integer) - Number of bathrooms
      - `type` (text) - Property type (Semi-Detached, etc.)
      - `status` (text) - Property status (For Sale, Sold, etc.)
      - `description` (text) - Full description
      - `images` (jsonb) - Array of image URLs
      - `raw_data` (jsonb) - Complete raw data from XML
      - `created_at` (timestamptz) - When property was created
      - `updated_at` (timestamptz) - When property was last updated
      - `synced_at` (timestamptz) - When property was last synced from API
    
    - `agency_sync_metadata`
      - `id` (uuid, primary key)
      - `agency_id` (text, unique) - Agency identifier
      - `last_sync_at` (timestamptz) - Last successful sync timestamp
      - `next_sync_at` (timestamptz) - When next sync should happen
      - `sync_status` (text) - Status: success, failed, in_progress
      - `sync_error` (text) - Error message if sync failed
      - `properties_count` (integer) - Number of properties synced
      - `created_at` (timestamptz) - Record creation time
      - `updated_at` (timestamptz) - Record update time

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read their data
    - Public read access for properties (for public website)

  3. Indexes
    - Index on agency_id for fast filtering
    - Index on synced_at for checking stale data
    - Index on status for filtering active properties
*/

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id text PRIMARY KEY,
  agency_id text NOT NULL,
  title text NOT NULL,
  address text DEFAULT '',
  city text DEFAULT 'Unknown',
  county text DEFAULT '',
  country text DEFAULT 'Ireland',
  price numeric DEFAULT 0,
  bedrooms integer,
  bathrooms integer,
  type text DEFAULT 'Unknown',
  status text DEFAULT 'active',
  description text DEFAULT '',
  images jsonb DEFAULT '[]'::jsonb,
  raw_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  synced_at timestamptz DEFAULT now()
);

-- Create agency sync metadata table
CREATE TABLE IF NOT EXISTS agency_sync_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id text UNIQUE NOT NULL,
  last_sync_at timestamptz DEFAULT now(),
  next_sync_at timestamptz DEFAULT now() + interval '2 days',
  sync_status text DEFAULT 'pending',
  sync_error text,
  properties_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_agency_id ON properties(agency_id);
CREATE INDEX IF NOT EXISTS idx_properties_synced_at ON properties(synced_at);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_sync_next_sync_at ON agency_sync_metadata(next_sync_at);

-- Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_sync_metadata ENABLE ROW LEVEL SECURITY;

-- Properties policies - public read access for website
CREATE POLICY "Anyone can read properties"
  ON properties
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert properties"
  ON properties
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update properties"
  ON properties
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete properties"
  ON properties
  FOR DELETE
  TO authenticated
  USING (true);

-- Agency sync metadata policies - authenticated users only
CREATE POLICY "Authenticated users can read sync metadata"
  ON agency_sync_metadata
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sync metadata"
  ON agency_sync_metadata
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sync metadata"
  ON agency_sync_metadata
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sync metadata"
  ON agency_sync_metadata
  FOR DELETE
  TO authenticated
  USING (true);/*
  # Fix RLS Policies for Public Access

  1. Changes
    - Drop existing restrictive policies
    - Add public access policies for both properties and agency_sync_metadata
    - Allow anonymous users to read and write data
  
  2. Security Note
    - This is appropriate for internal/prototype applications
    - For production, implement proper authentication
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can insert properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can update properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can delete properties" ON properties;

DROP POLICY IF EXISTS "Authenticated users can read sync metadata" ON agency_sync_metadata;
DROP POLICY IF EXISTS "Authenticated users can insert sync metadata" ON agency_sync_metadata;
DROP POLICY IF EXISTS "Authenticated users can update sync metadata" ON agency_sync_metadata;
DROP POLICY IF EXISTS "Authenticated users can delete sync metadata" ON agency_sync_metadata;

-- Create public policies for properties
CREATE POLICY "Public can read properties"
  ON properties
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can insert properties"
  ON properties
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can update properties"
  ON properties
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete properties"
  ON properties
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create public policies for agency_sync_metadata
CREATE POLICY "Public can read sync metadata"
  ON agency_sync_metadata
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can insert sync metadata"
  ON agency_sync_metadata
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can update sync metadata"
  ON agency_sync_metadata
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete sync metadata"
  ON agency_sync_metadata
  FOR DELETE
  TO anon, authenticated
  USING (true);/*
  # Add Missing Columns to Properties Table

  1. Changes
    - Add `postcode` column (text) - Postal/Zip code
    - Modify table to include postcode field that was missing from initial migration

  2. Notes
    - This fixes PGRST204 error: "Could not find the 'postcode' column"
    - Postcode is extracted from XML address4 field
    - Default value is empty string for consistency
*/

-- Add postcode column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'postcode'
  ) THEN
    ALTER TABLE properties ADD COLUMN postcode text DEFAULT '';
  END IF;
END $$;/*
  # Create Agencies Table

  1. New Tables
    - `agencies`
      - `id` (uuid, primary key)
      - `site_prefix` (text, unique, agency code like KNAM, BSKY)
      - `name` (text, agency full name)
      - `is_active` (boolean, whether agency has properties)
      - `property_count` (integer, number of properties)
      - `last_sync` (timestamptz, last time properties were synced)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `agencies` table
    - Add policy for public read access (agencies list is public)
    - Add policy for authenticated users to update sync status

  3. Indexes
    - Index on site_prefix for fast lookups
    - Index on is_active for filtering
*/

CREATE TABLE IF NOT EXISTS agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_prefix text UNIQUE NOT NULL,
  name text,
  is_active boolean DEFAULT true,
  property_count integer DEFAULT 0,
  last_sync timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read agencies"
  ON agencies
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can update agencies"
  ON agencies
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert agencies"
  ON agencies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_agencies_site_prefix ON agencies(site_prefix);
CREATE INDEX IF NOT EXISTS idx_agencies_is_active ON agencies(is_active);/*
  # Fix Agencies RLS for Anonymous Access

  1. Changes
    - Drop existing restrictive policies
    - Add new policies allowing anonymous users to insert/update agencies
    - This is safe because agencies data is public information

  2. Security
    - Anyone can read agencies (already in place)
    - Anyone can insert/update agencies for sync purposes
    - No sensitive data in agencies table
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can update agencies" ON agencies;
DROP POLICY IF EXISTS "Authenticated users can insert agencies" ON agencies;

-- Create new policies allowing anonymous access
CREATE POLICY "Anyone can insert agencies"
  ON agencies
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update agencies"
  ON agencies
  FOR UPDATE
  USING (true)
  WITH CHECK (true);/*
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
END $$;/*
  # Fix ShareBank RLS for Anonymous Users

  1. Changes
    - Drop existing restrictive policies
    - Create new policies allowing anonymous users to manage files
    - Allow both anon and authenticated users full access

  2. Security Notes
    - This is a public share bank accessible to all users
    - No authentication required for the application
    - Files are publicly accessible
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can insert files" ON sharebank_files;
DROP POLICY IF EXISTS "Authenticated users can update files" ON sharebank_files;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON sharebank_files;
DROP POLICY IF EXISTS "Authenticated users can insert exports" ON sharebank_exports;
DROP POLICY IF EXISTS "Authenticated users can delete exports" ON sharebank_exports;

-- Create new policies for sharebank_files (allow anon + authenticated)
CREATE POLICY "Anyone can insert files"
  ON sharebank_files
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update files"
  ON sharebank_files
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete files"
  ON sharebank_files
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create new policies for sharebank_exports (allow anon + authenticated)
CREATE POLICY "Anyone can insert exports"
  ON sharebank_exports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can delete exports"
  ON sharebank_exports
  FOR DELETE
  TO anon, authenticated
  USING (true);/*
  # Add Google Drive Integration Fields

  1. Changes
    - Add `google_drive_id` column to `sharebank_files` table
    - Add `google_drive_url` column to `sharebank_files` table
  
  2. Purpose
    - Store Google Drive file ID for files uploaded to Google Drive
    - Store Google Drive web view link for easy access
    - Enable dual storage (Supabase + Google Drive)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sharebank_files' AND column_name = 'google_drive_id'
  ) THEN
    ALTER TABLE sharebank_files ADD COLUMN google_drive_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sharebank_files' AND column_name = 'google_drive_url'
  ) THEN
    ALTER TABLE sharebank_files ADD COLUMN google_drive_url text;
  END IF;
END $$;/*
  # Create reports table

  1. New Tables
    - `reports`
      - `id` (uuid, primary key)
      - `title` (text) - Report title
      - `type` (text) - Type of report (market-analysis, property-report, investment-summary, trends)
      - `agency_id` (text) - Agency site_prefix
      - `property_id` (uuid, nullable) - Specific property if applicable
      - `data` (jsonb) - Report data and statistics
      - `html_content` (text) - Generated HTML content
      - `status` (text) - Status: completed, generating, error
      - `file_size` (text) - File size display
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `reports` table
    - Add policy for anonymous users to read all reports
    - Add policy for anonymous users to insert reports
    - Add policy for anonymous users to update their reports
*/

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('market-analysis', 'property-report', 'investment-summary', 'trends')),
  agency_id text NOT NULL,
  property_id uuid,
  data jsonb DEFAULT '{}'::jsonb,
  html_content text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'generating', 'error')),
  file_size text DEFAULT '0 KB',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous users to read reports"
  ON reports
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous users to insert reports"
  ON reports
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous users to update reports"
  ON reports
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous users to delete reports"
  ON reports
  FOR DELETE
  TO anon
  USING (true);/*
  # Create Kyra Chat History Tables

  1. New Tables
    - `kyra_conversations`
      - `id` (uuid, primary key)
      - `title` (text) - auto-generated from first message
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `kyra_messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key)
      - `role` (text) - 'user' or 'assistant'
      - `content` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for anonymous users to read/write their own data
*/

-- Create conversations table
CREATE TABLE IF NOT EXISTS kyra_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'New Conversation',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS kyra_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES kyra_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE kyra_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyra_messages ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
CREATE POLICY "Anyone can view conversations"
  ON kyra_conversations FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can create conversations"
  ON kyra_conversations FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update conversations"
  ON kyra_conversations FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete conversations"
  ON kyra_conversations FOR DELETE
  TO anon
  USING (true);

-- Policies for messages
CREATE POLICY "Anyone can view messages"
  ON kyra_messages FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can create messages"
  ON kyra_messages FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can delete messages"
  ON kyra_messages FOR DELETE
  TO anon
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_kyra_messages_conversation_id ON kyra_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_kyra_conversations_updated_at ON kyra_conversations(updated_at DESC);
/*
  # Create Users Table with Admin Support

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - unique user ID
      - `email` (text, unique) - user email for login
      - `password_hash` (text) - hashed password
      - `name` (text) - first name
      - `surname` (text) - last name
      - `company` (text) - company name
      - `site_prefix` (text) - website prefix/domain
      - `is_admin` (boolean) - admin status
      - `is_verified` (boolean) - email verification status
      - `created_at` (timestamptz) - account creation date
      - `updated_at` (timestamptz) - last update date
      - `last_login` (timestamptz) - last login timestamp

  2. Security
    - Enable RLS on `users` table
    - Users can read their own data
    - Users can update their own data
    - Only admins can read all users
    - Public can create users (registration)
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  surname text NOT NULL,
  company text DEFAULT '',
  site_prefix text DEFAULT '',
  is_admin boolean DEFAULT false,
  is_verified boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz,
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to register (insert)
CREATE POLICY "Anyone can register"
  ON users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Users can read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = (current_setting('app.user_id', true))::uuid OR is_admin = true);

-- Allow anonymous to read user data for login verification
CREATE POLICY "Anonymous can read for login"
  ON users
  FOR SELECT
  TO anon
  USING (true);

-- Users can update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = (current_setting('app.user_id', true))::uuid)
  WITH CHECK (id = (current_setting('app.user_id', true))::uuid);

-- Admins can read all users
CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (current_setting('app.user_id', true))::uuid
      AND is_admin = true
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123 - should be changed!)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (email, password_hash, name, surname, company, site_prefix, is_admin, is_verified)
VALUES (
  'admin@4property.com',
  '$2a$10$rqZPQQWxKqh0Y3K8yZ5LZeQ3h3mU8yVjJ5XKJhBQxGYXvZLKJHQZK',
  'Admin',
  'User',
  '4Property',
  'admin',
  true,
  true
)
ON CONFLICT (email) DO NOTHING;
