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
  connectionTimeoutMillis: 15000,
};

async function main() {
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  
  const res = await client.query(`
    UPDATE auth.users 
    SET instance_id = '00000000-0000-0000-0000-000000000000'
    WHERE instance_id IS NULL
  `);
  console.log('Fixed instance_id for rows:', res.rowCount);
  
  await client.end();
}
main();
