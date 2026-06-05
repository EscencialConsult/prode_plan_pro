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
      SELECT id, email, raw_user_meta_data, raw_app_meta_data, is_sso_user
      FROM auth.users
      WHERE email IN ('44866758@prodetalento.com', 'admin@escencial.com');
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
check();
