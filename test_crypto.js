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
  
  const res = await client.query(`SELECT crypt('44444444', gen_salt('bf')) as hash`);
  const hash = res.rows[0].hash;
  console.log('Hash:', hash);
  
  const match = await client.query(`SELECT (crypt('44444444', $1) = $1) as matches`, [hash]);
  console.log('Matches:', match.rows[0].matches);
  
  await client.end();
}
main();
