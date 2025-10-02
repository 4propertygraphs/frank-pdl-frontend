import pg from 'pg';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;

// Extract project ref from URL
const projectRef = supabaseUrl.split('//')[1].split('.')[0];

// Standard Supabase connection string format
const connectionString = process.env.DATABASE_URL;

console.log('🔧 Attempting to apply users table migration...\n');
console.log(`Project ref: ${projectRef}`);

if (!connectionString) {
  console.log('\n❌ ERROR: Database connection string not configured!\n');
  console.log('To fix this:');
  console.log('1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/settings/database');
  console.log('2. Copy the "Connection string" (Connection pooling > Transaction mode)');
  console.log('3. Add it to your .env file as:');
  console.log('   DATABASE_URL=postgresql://postgres.xxx:PASSWORD@xxx.pooler.supabase.com:6543/postgres\n');
  console.log('Or run the SQL manually at:');
  console.log('   https://supabase.com/dashboard/project/' + projectRef + '/sql/new\n');

  console.log('=' .repeat(80));
  console.log(readFileSync('supabase/migrations/20251002100000_create_users_table.sql', 'utf8'));
  console.log('=' .repeat(80));
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

try {
  await client.connect();
  console.log('✅ Connected to database\n');

  // Read migration file
  const sql = readFileSync('supabase/migrations/20251002100000_create_users_table.sql', 'utf8');

  // Remove comments and split by semicolons
  const statements = sql
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/--[^\n]*/g, '') // Remove line comments
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`📝 Executing ${statements.length} SQL statements...\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.trim()) {
      try {
        await client.query(statement);
        console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
      } catch (error) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`⚠️  Statement ${i + 1}/${statements.length} skipped (already exists)`);
        } else {
          throw error;
        }
      }
    }
  }

  console.log('\n✅ Migration completed successfully!\n');

} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\nPlease run the SQL manually in Supabase Dashboard:');
  console.log('https://supabase.com/dashboard/project/' + projectRef + '/sql/new\n');
  process.exit(1);
} finally {
  await client.end();
}
