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

function limpiarDni(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  if (/e\+/i.test(s)) {
    s = s.replace(',', '.');
    const num = parseFloat(s);
    if (!isNaN(num)) s = Math.round(num).toString();
  }
  s = s.replace(/O/g, '0');
  s = s.replace(/[^0-9]/g, '');
  if (s.length < 7 || s.length > 13) return null;
  return s;
}

async function main() {
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  console.log('✅ Conectado\n');

  const { rows: allUsers } = await client.query(
    `SELECT dni, nombre_completo FROM public.usuarios_temp ORDER BY nombre_completo`
  );
  console.log(`📥 ${allUsers.length} filas leídas`);

  const seenDni = new Set();
  const cleaned = [];
  for (const row of allUsers) {
    const cleanDni = limpiarDni(row.dni);
    if (!cleanDni || seenDni.has(cleanDni)) continue;
    seenDni.add(cleanDni);
    cleaned.push({ cleanDni, nombre: row.nombre_completo });
  }
  console.log(`🧹 ${cleaned.length} DNIs únicos`);

  const { rows: existingEmails } = await client.query(
    "SELECT email FROM auth.users WHERE email LIKE '%@prodetalento.com'"
  );
  const existingSet = new Set(existingEmails.map(r => r.email));
  const missing = cleaned.filter(u => !existingSet.has(`${u.cleanDni}@prodetalento.com`));
  console.log(`🔍 Faltantes: ${missing.length}\n`);

  let created = 0, errors = 0;
  for (let i = 0; i < missing.length; i++) {
    const u = missing[i];
    const email = `${u.cleanDni}@prodetalento.com`;
    try {
      // Step 1: Insert into auth.users
      const userMeta = JSON.stringify({
        email: email,
        nombre: u.nombre,
        dni: u.cleanDni,
        email_verified: true,
        phone_verified: false,
      });
      const appMeta = JSON.stringify({ provider: 'email', providers: ['email'] });

      const insertUser = await client.query(`
        INSERT INTO auth.users (
          id, instance_id, email, encrypted_password,
          email_confirmed_at, created_at, updated_at,
          raw_app_meta_data, raw_user_meta_data,
          role, aud, confirmation_token, recovery_token,
          email_change_token_new, email_change_token_current,
          reauthentication_token, is_sso_user, is_anonymous
        ) VALUES (
          gen_random_uuid(),
          '00000000-0000-0000-0000-000000000000'::uuid,
          $1::text,
          crypt($2::text, gen_salt('bf')),
          NOW(), NOW(), NOW(),
          $3::jsonb,
          $4::jsonb,
          'authenticated', 'authenticated',
          '', '', '', '', '',
          false, false
        )
        RETURNING id::text AS user_id
      `, [email, u.cleanDni, appMeta, userMeta]);


      if (insertUser.rows.length === 0) {
        console.log(`   ⚠️  [${i+1}/${missing.length}] ${email} — ya existía`);
        continue;
      }

      const userId = insertUser.rows[0].user_id;

      // Step 2: Insert into auth.identities
      const identityData = JSON.stringify({
        sub: userId,
        email: email,
        nombre: u.nombre,
        email_verified: true,
        phone_verified: false,
      });

      await client.query(`
        INSERT INTO auth.identities (
          provider_id, user_id, identity_data, provider,
          last_sign_in_at, created_at, updated_at, email
        ) VALUES (
          $1::text,
          $1::uuid,
          $2::jsonb,
          'email',
          NOW(), NOW(), NOW(),
          $3::text
        )
      `, [userId, identityData, email]);

      created++;
      console.log(`   ✅ [${i+1}/${missing.length}] ${email} — ${u.nombre}`);
    } catch (err) {
      errors++;
      console.log(`   ❌ [${i+1}/${missing.length}] ${email} — ${err.message}`);
    }
  }

  console.log(`\n   Creados: ${created} | Errores: ${errors}\n`);

  const upd = await client.query(`
    UPDATE public.usuarios SET estado='activo'
    WHERE email LIKE '%@prodetalento.com' AND estado='pendiente'
  `);
  console.log(`🟢 Activados: ${upd.rowCount} pendientes\n`);

  const { rows: [f] } = await client.query(`
    SELECT 
      (SELECT count(*) FROM auth.users WHERE email LIKE '%@prodetalento.com') AS auth_total,
      (SELECT count(*) FROM public.usuarios WHERE email LIKE '%@prodetalento.com' AND estado='activo') AS activos,
      (SELECT count(*) FROM public.usuarios WHERE email LIKE '%@prodetalento.com' AND estado='pendiente') AS pendientes
  `);
  console.log('═══════════════════════════════════════');
  console.log('  RESUMEN FINAL');
  console.log('═══════════════════════════════════════');
  console.log(`  usuarios_temp:             ${allUsers.length}`);
  console.log(`  auth.users @prodetalento:  ${f.auth_total}`);
  console.log(`  public.usuarios activos:   ${f.activos}`);
  console.log(`  public.usuarios pendiente: ${f.pendientes}`);
  console.log('═══════════════════════════════════════');

  await client.end();
  console.log('\n🏁 Migración completada.');
}

main().catch(err => { console.error('💥 FATAL:', err); process.exit(1); });
