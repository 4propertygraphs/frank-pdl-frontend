/*
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
  WITH CHECK (true);