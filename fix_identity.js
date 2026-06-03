import pg from 'pg';

async function main() {
  const client = new pg.Client({
    user: 'postgres.bzujmohjrnqeadzjnpxd',
    host: 'aws-1-us-east-2.pooler.supabase.com',
    database: 'postgres',
    password: '@ProdeSindicato',
    port: 6543,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✅ Conectado');

  // Find the user missing their identity
  const { rows } = await client.query(`
    SELECT u.id, u.email 
    FROM auth.users u
    LEFT JOIN auth.identities i ON i.user_id = u.id
    WHERE u.email LIKE '%@prodetalento.com' AND i.id IS NULL
  `);

  console.log(`\nUsuarios sin identity: ${rows.length}`);

  for (const user of rows) {
    const identityData = JSON.stringify({
      sub: user.id,
      email: user.email,
      email_verified: true,
      phone_verified: false,
    });

    try {
      await client.query(`
        INSERT INTO auth.identities (
          provider_id, user_id, identity_data, provider,
          last_sign_in_at, created_at, updated_at
        ) VALUES (
          $1::text, $1::uuid, $2::jsonb, 'email',
          NOW(), NOW(), NOW()
        )
      `, [user.id, identityData]);
      console.log(`   ✅ Identity creada para ${user.email}`);
    } catch (err) {
      console.log(`   ❌ ${user.email}: ${err.message}`);
    }
  }

  // Final verification
  const { rows: [f] } = await client.query(`
    SELECT 
      (SELECT count(*) FROM auth.users WHERE email LIKE '%@prodetalento.com') AS auth_total,
      (SELECT count(*) FROM auth.identities i 
       JOIN auth.users u ON i.user_id = u.id 
       WHERE u.email LIKE '%@prodetalento.com') AS identities,
      (SELECT count(*) FROM public.usuarios WHERE email LIKE '%@prodetalento.com' AND estado='activo') AS activos
  `);
  console.log('\n═══════════════════════════════════════');
  console.log('  VERIFICACIÓN FINAL');
  console.log('═══════════════════════════════════════');
  console.log(`  auth.users @prodetalento:      ${f.auth_total}`);
  console.log(`  auth.identities:               ${f.identities}`);
  console.log(`  public.usuarios activos:       ${f.activos}`);
  console.log('═══════════════════════════════════════');

  await client.end();
  console.log('\n🏁 Fix completado.');
}

main().catch(err => { console.error('💥', err); process.exit(1); });
