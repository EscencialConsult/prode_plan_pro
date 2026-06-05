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
  
  // Grant basic permissions to anon role
  await client.query(`GRANT SELECT, INSERT ON public.propuestas TO anon;`);
  console.log('Granted permissions to anon');
  
  // Grant basic permissions to authenticated role just in case
  await client.query(`GRANT SELECT, INSERT ON public.propuestas TO authenticated;`);
  console.log('Granted permissions to authenticated');
  
  await client.end();
}
main();
