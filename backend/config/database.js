import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// CloudSQL connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'logitrack',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  // For CloudSQL, use Unix socket connection
  ...(process.env.DB_INSTANCE_CONNECTION_NAME && {
    host: `/cloudsql/${process.env.DB_INSTANCE_CONNECTION_NAME}`,
  }),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;

