import pg from 'pg';

async function main() {
  const client = new pg.Client({
    user: 'postgres.bzujmohjrnqeadzjnpxd',
    host: 'aws-1-us-east-2.pooler.supabase.com',
    database: 'postgres',
    password: '@ProdeSindicato',
    port: 6543,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  await client.connect();
  console.log('✅ Connected!\n');

  // 1) How many @prodetalento.com users already exist in auth.users?
  const existing = await client.query(
    "SELECT count(*) AS total FROM auth.users WHERE email LIKE '%@prodetalento.com'"
  );
  console.log('Existing @prodetalento.com in auth.users:', existing.rows[0].total);

  // 2) Check auth.users column structure
  const cols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'users'
    ORDER BY ordinal_position
  `);
  console.log('\nauth.users columns:');
  for (const c of cols.rows) {
    console.log(`  ${c.column_name} (${c.data_type}) nullable=${c.is_nullable} default=${c.column_default || 'none'}`);
  }

  // 3) Check auth.identities columns
  const idCols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'identities'
    ORDER BY ordinal_position
  `);
  console.log('\nauth.identities columns:');
  for (const c of idCols.rows) {
    console.log(`  ${c.column_name} (${c.data_type}) nullable=${c.is_nullable} default=${c.column_default || 'none'}`);
  }

  // 4) Sample existing user to see the format
  const sampleUser = await client.query(`
    SELECT id, email, role, aud, instance_id, 
           raw_user_meta_data, created_at, email_confirmed_at,
           is_sso_user, confirmation_token
    FROM auth.users LIMIT 1
  `);
  console.log('\nSample existing user:', JSON.stringify(sampleUser.rows[0], null, 2));

  // 5) Sample identity
  const sampleId = await client.query(`
    SELECT * FROM auth.identities LIMIT 1
  `);
  console.log('\nSample identity:', JSON.stringify(sampleId.rows[0], null, 2));

  // 6) Check public.usuarios estado for prodetalento
  const estados = await client.query(`
    SELECT estado, count(*) AS cnt 
    FROM public.usuarios 
    WHERE email LIKE '%@prodetalento.com' 
    GROUP BY estado
  `);
  console.log('\npublic.usuarios @prodetalento.com by estado:', JSON.stringify(estados.rows));

  // 7) Check for DNI format issues in usuarios_temp
  const weirdDni = await client.query(`
    SELECT dni, nombre_completo FROM public.usuarios_temp 
    WHERE dni ~ '[^0-9]' OR length(dni) < 5
    LIMIT 10
  `);
  console.log('\nDNIs with non-numeric chars or short:', JSON.stringify(weirdDni.rows, null, 2));

  await client.end();
  console.log('\nDone.');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
