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
  USING (true);