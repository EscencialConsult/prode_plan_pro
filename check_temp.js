import pg from 'pg';

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
  console.log('✅ Connected to PG!\n');

  try {
    const res = await client.query(`
      UPDATE auth.users 
      SET encrypted_password = crypt('admin1234', gen_salt('bf')) 
      WHERE email = 'admin@escencial.com'
    `);
    console.log('Update result rowCount:', res.rowCount);
  } catch (err) {
    console.error('Error updating password:', err);
  }

  await client.end();
}

main();
