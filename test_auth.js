import pg from 'pg';

const DB_CONFIG = {
  user: 'postgres.bzujmohjrnqeadzjnpxd',
  host: 'aws-1-us-east-2.pooler.supabase.com',
  database: 'postgres',
  password: '@ProdeSindicato',
  port: 6543,
  ssl: { rejectUnauthorized: false },
};

async function main() {
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  console.log('Connected!');

  await client.query(`
    CREATE OR REPLACE FUNCTION public.cambiar_email_y_password(
      p_user_id uuid,
      p_new_email text,
      p_new_password text
    )
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      -- Verificar seguridad: solo el propio usuario puede actualizar sus datos
      if auth.uid() <> p_user_id then
        raise exception 'No autorizado';
      end if;

      -- 1. Actualizar public.usuarios
      UPDATE public.usuarios 
      SET email = p_new_email 
      WHERE id = p_user_id;

      -- 2. Actualizar auth.identities (identity_data JSON)
      UPDATE auth.identities
      SET identity_data = jsonb_set(identity_data, '{email}', to_jsonb(p_new_email))
      WHERE user_id = p_user_id;

      -- 3. Actualizar auth.users (email, raw_user_meta_data, encrypted_password)
      UPDATE auth.users
      SET 
        email = p_new_email,
        encrypted_password = crypt(p_new_password, gen_salt('bf', 10)),
        raw_user_meta_data = jsonb_set(
          jsonb_set(raw_user_meta_data, '{email}', to_jsonb(p_new_email)),
          '{email_contacto}',
          to_jsonb(p_new_email)
        )
      WHERE id = p_user_id;

      return json_build_object('ok', true, 'message', 'Datos actualizados correctamente');
    END;
    $$;
  `);
  console.log('Function public.cambiar_email_y_password created successfully!');

  await client.end();
}

main().catch(err => console.error(err));
