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
  statement_timeout: 30000,
};

async function main() {
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  console.log('Connected!');

  try {
    // Compare a working user vs a non-working user
    const res = await client.query(`
      SELECT 
        u.id,
        u.email, 
        LEFT(u.encrypted_password, 30) as pwd_prefix,
        LENGTH(u.encrypted_password) as pwd_length,
        u.raw_user_meta_data->>'dni' as dni,
        u.raw_user_meta_data->>'nombre' as nombre,
        u.email_confirmed_at,
        u.created_at
      FROM auth.users u
      WHERE u.email IN (
        'admin@escencial.com',
        '44444444@prodetalento.com', 
        '44376560@prodetalento.com',
        '30498631@prodetalento.com',
        '44866758@prodetalento.com'
      )
      ORDER BY u.created_at;
    `);
    
    for (const row of res.rows) {
      console.log(`\n--- ${row.email} ---`);
      console.log(`  DNI: ${row.dni}`);
      console.log(`  Nombre: ${row.nombre}`);
      console.log(`  Pwd prefix: ${row.pwd_prefix}`);
      console.log(`  Pwd length: ${row.pwd_length}`);
      console.log(`  Email confirmed: ${row.email_confirmed_at}`);
      console.log(`  Created: ${row.created_at}`);
    }

    // Count total users and check how many have different password formats
    const countRes = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE encrypted_password LIKE '$2a$10$%') as bcrypt_10,
        COUNT(*) FILTER (WHERE encrypted_password LIKE '$2a$06$%') as bcrypt_06,
        COUNT(*) FILTER (WHERE encrypted_password LIKE '$2b$%') as bcrypt_2b,
        COUNT(*) FILTER (WHERE encrypted_password IS NULL OR encrypted_password = '') as no_pwd
      FROM auth.users;
    `);
    console.log('\n\n=== Password format summary ===');
    console.log(countRes.rows[0]);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

main();
