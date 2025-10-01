/*
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
  USING (true);