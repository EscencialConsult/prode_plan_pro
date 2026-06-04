import pg from 'pg';
import bcrypt from 'bcryptjs';
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
  const adminHash = bcrypt.hashSync('admin1234', 10);
  const userHash = bcrypt.hashSync('44444444', 10);
  
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  
  await client.query(`UPDATE auth.users SET encrypted_password = $1 WHERE email = 'admin@escencial.com'`, [adminHash]);
  await client.query(`UPDATE auth.users SET encrypted_password = $1 WHERE email = '44444444@prodetalento.com'`, [userHash]);
  
  console.log('Updated both passwords via bcryptjs');
  
  await client.end();
  
  const resAdmin = await supabase.auth.signInWithPassword({ email: 'admin@escencial.com', password: 'admin1234' });
  console.log('Admin Login:', resAdmin.error ? resAdmin.error.message : 'SUCCESS!');
  
  const resUser = await supabase.auth.signInWithPassword({ email: '44444444@prodetalento.com', password: '44444444' });
  console.log('User Login:', resUser.error ? resUser.error.message : 'SUCCESS!');
}

main();
