import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://0ec90b57d6e95fcbda19832f.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const migration = readFileSync('./supabase/migrations/20251002081137_create_kyra_chat_history.sql', 'utf-8');

console.log('Applying migration...');
console.log('Note: This will execute via multiple statements');

// Split by semicolons and execute each statement
const statements = migration
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('/*') && !s.startsWith('--'));

for (const statement of statements) {
  if (statement) {
    console.log('\nExecuting:', statement.substring(0, 100) + '...');
    try {
      const { error } = await supabase.rpc('exec', { sql: statement });
      if (error) {
        console.error('Error:', error.message);
      } else {
        console.log('✓ Success');
      }
    } catch (e) {
      console.log('Note: Direct SQL execution not available via anon key');
      console.log('Please apply migration manually via Supabase Dashboard');
      break;
    }
  }
}
