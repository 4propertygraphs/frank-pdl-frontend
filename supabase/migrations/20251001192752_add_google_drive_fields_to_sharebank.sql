/*
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
END $$;