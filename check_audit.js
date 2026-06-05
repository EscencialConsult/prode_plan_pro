import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const DB_CONFIG = {
  user: 'postgres.bzujmohjrnqeadzjnpxd',
  host: 'aws-1-us-east-2.pooler.supabase.com',
  database: 'postgres',
  password: '@ProdeSindicato',
  port: 6543,
  ssl: { rejectUnauthorized: false },
};

async function check() {
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    const res = await client.query(`
      SELECT payload
      FROM auth.audit_log_entries
      ORDER BY created_at DESC
      LIMIT 5;
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
check();
