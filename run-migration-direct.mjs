import fetch from 'node-fetch';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// SQL statements to execute
const sqlStatements = [
  // Create users table
  `CREATE TABLE IF NOT EXISTS users (
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
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')
  )`,

  // Create indexes
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
  `CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin)`,

  // Enable RLS
  `ALTER TABLE users ENABLE ROW LEVEL SECURITY`,

  // Create policies
  `CREATE POLICY IF NOT EXISTS "Anyone can register" ON users FOR INSERT TO anon, authenticated WITH CHECK (true)`,
  `CREATE POLICY IF NOT EXISTS "Anonymous can read for login" ON users FOR SELECT TO anon USING (true)`,
  `CREATE POLICY IF NOT EXISTS "Users can update own data" ON users FOR UPDATE TO authenticated USING (true) WITH CHECK (true)`,

  // Create function
  `CREATE OR REPLACE FUNCTION update_updated_at_column()
   RETURNS TRIGGER AS $$
   BEGIN
     NEW.updated_at = now();
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql`,

  // Create trigger
  `DROP TRIGGER IF EXISTS update_users_updated_at ON users`,
  `CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`
];

console.log('🚀 Attempting to create users table via Supabase REST API...\n');

// Try to check if table exists first
async function checkTable() {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/users?select=id&limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (response.status === 404) {
      console.log('❌ Table "users" does not exist yet.\n');
      return false;
    }

    console.log('✅ Table "users" already exists!\n');
    return true;
  } catch (error) {
    console.log('❌ Error checking table:', error.message);
    return false;
  }
}

const exists = await checkTable();

if (!exists) {
  console.log('📝 To create the users table, run this SQL in Supabase Dashboard:');
  console.log(`   ${supabaseUrl.replace('0ec90b57d6e95fcbda19832f', 'bmccujcrlyvpjfyarrfv')}/sql/new\n`);
  console.log('=' .repeat(80));
  console.log(readFileSync('supabase/migrations/20251002100000_create_users_table.sql', 'utf8'));
  console.log('=' .repeat(80));
  console.log('\n⚠️  Supabase REST API cannot execute DDL statements (CREATE TABLE, etc.)');
  console.log('   You must run the SQL manually in the Supabase Dashboard SQL Editor.\n');
}
