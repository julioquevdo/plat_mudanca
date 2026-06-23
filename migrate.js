import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        process.env[key] = value;
      }
    });
  }
}

async function run() {
  loadEnv();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Error: DATABASE_URL not found in .env');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const sql = postgres(connectionString);

  try {
    const migrationFiles = [
      'supabase/migrations/001_schema.sql',
      'supabase/migrations/002_rls.sql',
      'supabase/migrations/003_seed.sql',
      'supabase/migrations/004_rewards_and_exceptions.sql',
    ];

    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}...`);
      const filePath = path.join(__dirname, file);
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      
      // Execute the entire SQL script
      await sql.unsafe(sqlContent);
      console.log(`Migration ${file} completed successfully.`);
    }

    console.log('All migrations completed successfully! 🌱');
  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    await sql.end();
  }
}

run();
