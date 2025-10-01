/*
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
CREATE INDEX IF NOT EXISTS idx_agencies_is_active ON agencies(is_active);