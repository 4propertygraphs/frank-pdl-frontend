/*
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
END $$;