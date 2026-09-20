import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databaseUrl = process.env.DATABASE_URL || 'postgresql://betoch_admin@localhost:5433/betoch_dev';

console.log(`[DB Migrate] Connecting to PostgreSQL at: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);

const client = new pg.Client({ connectionString: databaseUrl });

async function runMigrations() {
  try {
    await client.connect();
    console.log('[DB Migrate] Successfully connected to database.');

    // Create migrations tracker table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      const res = await client.query('SELECT name FROM _migrations WHERE name = $1', [file]);
      if (res.rows.length === 0) {
        console.log(`[DB Migrate] Applying migration: ${file}...`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
          await client.query('COMMIT');
          console.log(`[DB Migrate] Successfully applied: ${file}`);
        } catch (err) {
          await client.query('ROLLBACK');
          console.error(`[DB Migrate] Error applying migration ${file}:`, err);
          throw err;
        }
      } else {
        console.log(`[DB Migrate] Already applied: ${file}`);
      }
    }

    console.log('[DB Migrate] All migrations completed successfully.');
  } catch (err) {
    console.error('[DB Migrate] Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
