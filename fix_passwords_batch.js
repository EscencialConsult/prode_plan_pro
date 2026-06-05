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
  statement_timeout: 60000, // 60s timeout per batch
};

const BATCH_SIZE = 20;
const DELAY_MS = 2000; // 2 seconds between batches

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  console.log('Connected!');

  try {
    // Get total count
    const countRes = await client.query(`
      SELECT COUNT(*) as total
      FROM auth.users
      WHERE encrypted_password LIKE '$2a$%'
        AND email LIKE '%@prodetalento.com';
    `);
    const total = parseInt(countRes.rows[0].total);
    console.log(`Total users to fix: ${total}`);

    let offset = 0;
    let fixed = 0;
    let errors = 0;

    while (true) {
      // Get a batch of user IDs and their DNIs (email prefix)
      const batchRes = await client.query(`
        SELECT id, split_part(email, '@', 1) as dni
        FROM auth.users
        WHERE encrypted_password LIKE '$2a$%'
          AND email LIKE '%@prodetalento.com'
        ORDER BY id
        LIMIT $1;
      `, [BATCH_SIZE]);

      if (batchRes.rows.length === 0) break;

      // Update each user in this batch
      for (const user of batchRes.rows) {
        try {
          // Hash password with bcrypt and replace $2a$ with $2b$ for Supabase compatibility
          await client.query(`
            UPDATE auth.users
            SET encrypted_password = REPLACE(
              crypt($1, gen_salt('bf', 10)),
              '$2a$',
              '$2b$'
            ),
            updated_at = NOW()
            WHERE id = $2;
          `, [user.dni, user.id]);
          fixed++;
        } catch (err) {
          console.error(`  Error updating user ${user.id} (${user.dni}): ${err.message}`);
          errors++;
        }
      }

      console.log(`  Progress: ${fixed}/${total} processed (${errors} errors)`);

      // Wait between batches to avoid overloading
      await sleep(DELAY_MS);
    }

    console.log(`\n=== DONE ===`);
    console.log(`Fixed: ${fixed}`);
    console.log(`Errors: ${errors}`);

    // Verify: check that no $2a$ passwords remain
    const verifyRes = await client.query(`
      SELECT COUNT(*) as remaining
      FROM auth.users
      WHERE encrypted_password LIKE '$2a$%';
    `);
    console.log(`Remaining $2a$ passwords: ${verifyRes.rows[0].remaining}`);

  } catch (err) {
    console.error('Fatal error:', err.message);
  } finally {
    await client.end();
  }
}

main();
