import pg from 'pg';
const { Pool } = pg;

const connectionString = process.env.POSTGRES_URL;

let pool: pg.Pool | null = null;

export const getPool = () => {
  if (!pool && connectionString) {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
  return pool;
};

export const query = async (text: string, params?: any[]) => {
  const p = getPool();
  if (!p) throw new Error('Database connection string (POSTGRES_URL) is not set.');
  return p.query(text, params);
};
