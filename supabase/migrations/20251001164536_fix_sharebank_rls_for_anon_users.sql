/*
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
  USING (true);