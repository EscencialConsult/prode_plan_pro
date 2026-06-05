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
      SELECT crypt('44866758', '$2a$10$YN.lR11eJVOKZNluNG715.T/DCKuiJL9548ZYa5W//2cgrgwdskGa');
    `);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
check();
