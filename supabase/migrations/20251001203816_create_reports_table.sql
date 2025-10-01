/*
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
  USING (true);