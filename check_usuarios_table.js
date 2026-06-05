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
  statement_timeout: 15000,
};

async function main() {
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'usuarios'
      ORDER BY ordinal_position;
    `);
    console.log('=== Columnas de public.usuarios ===');
    for (const row of res.rows) {
      console.log(`  ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
    }

    // Check a sample user
    const sample = await client.query(`
      SELECT * FROM public.usuarios LIMIT 3;
    `);
    console.log('\n=== Sample rows ===');
    console.log(JSON.stringify(sample.rows, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}
main();
