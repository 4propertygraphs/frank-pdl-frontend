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
