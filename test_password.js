import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
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

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  
  await client.query(`
    UPDATE auth.users 
    SET encrypted_password = crypt('44444444', gen_salt('bf', 10)) 
    WHERE email = '44444444@prodetalento.com'
  `);
  console.log('Updated 44444444 with bf cost 10');
  
  await client.end();
  
  console.log('Testing login...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: '44444444@prodetalento.com',
    password: '44444444'
  });
  console.log('Login result:', error ? error.message : 'SUCCESS!');
}
main();
