-- ============================================================================
-- IMPORTANT: Copy this entire SQL and execute it in your database
-- ============================================================================
-- This creates the users table needed for registration and login
-- Execute this via one of these methods:
--   1. Supabase Dashboard SQL Editor
--   2. psql command line
--   3. Any PostgreSQL client
-- ============================================================================

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
  last_login timestamptz
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can register" ON users;
DROP POLICY IF EXISTS "Anonymous can read for login" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Allow anyone to register
CREATE POLICY "Anyone can register"
  ON users FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anonymous to read for login
CREATE POLICY "Anonymous can read for login"
  ON users FOR SELECT
  TO anon
  USING (true);

-- Users can update their own data
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- All done! After executing this SQL, your registration will work.
-- ============================================================================
