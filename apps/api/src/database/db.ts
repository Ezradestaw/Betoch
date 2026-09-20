import pg from 'pg';
import { config } from '@betoch/config';

export const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  max: config.DB_MAX_CONNECTIONS,
  connectionTimeoutMillis: config.DB_TIMEOUT_MS,
  idleTimeoutMillis: 30000
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]', err);
});

export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (config.NODE_ENV === 'development' && duration > 100) {
    console.warn(`[Slow Query Warning] (${duration}ms): ${text.slice(0, 100)}`);
  }
  return res;
}

export async function withTransaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
