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
    SELECT id, email, is_sso_user, deleted_at, banned_until, raw_user_meta_data
    FROM auth.users 
    WHERE email IN ('admin@escencial.com', '44444444@prodetalento.com')
  `);
  console.log('Users:', res.rows);
  
  await client.end();
}
main();
