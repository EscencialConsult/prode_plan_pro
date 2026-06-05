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
    // Check email prefix lengths to understand format
    const res = await client.query(`
      SELECT 
        LENGTH(split_part(email, '@', 1)) as prefix_len,
        COUNT(*) as cnt,
        MIN(split_part(email, '@', 1)) as example_min,
        MAX(split_part(email, '@', 1)) as example_max
      FROM auth.users
      WHERE email LIKE '%@prodetalento.com'
        AND encrypted_password LIKE '$2a$%'
      GROUP BY LENGTH(split_part(email, '@', 1))
      ORDER BY prefix_len;
    `);
    
    console.log('\n=== Email prefix length distribution (migrated users only) ===');
    for (const row of res.rows) {
      console.log(`  Length ${row.prefix_len}: ${row.cnt} users (example: ${row.example_min} ... ${row.example_max})`);
    }

    // Show a few examples of each length
    const examples = await client.query(`
      SELECT split_part(email, '@', 1) as prefix, raw_user_meta_data->>'dni' as dni_meta
      FROM auth.users
      WHERE email LIKE '%@prodetalento.com'
        AND encrypted_password LIKE '$2a$%'
      ORDER BY LENGTH(split_part(email, '@', 1)), email
      LIMIT 15;
    `);
    
    console.log('\n=== Sample users ===');
    for (const row of examples.rows) {
      const prefix = row.prefix;
      let extractedDni;
      if (prefix.length >= 10) {
        // CUIT format: remove first 2 and last 1
        extractedDni = prefix.substring(2, prefix.length - 1);
      } else {
        extractedDni = prefix;
      }
      console.log(`  Email prefix: ${prefix} (len=${prefix.length}) | DNI meta: ${row.dni_meta} | Extracted DNI: ${extractedDni}`);
    }

    // Total count
    const totalRes = await client.query(`
      SELECT COUNT(*) as total
      FROM auth.users
      WHERE encrypted_password LIKE '$2a$%';
    `);
    console.log(`\nTotal users to fix: ${totalRes.rows[0].total}`);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

main();
