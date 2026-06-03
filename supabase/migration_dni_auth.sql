-- ════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Autenticación por DNI + Perfil completo
-- Primer email interno: dni@usuarios.local
-- Luego se reemplaza por email real del usuario
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS dni text,
  ADD COLUMN IF NOT EXISTS telefono text,
  ADD COLUMN IF NOT EXISTS perfil_completo boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'usuarios_dni_unique'
  ) THEN
    ALTER TABLE public.usuarios
      ADD CONSTRAINT usuarios_dni_unique UNIQUE (dni);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'usuarios_dni_formato'
  ) THEN
    ALTER TABLE public.usuarios
      ADD CONSTRAINT usuarios_dni_formato
      CHECK (dni IS NULL OR dni ~ '^\d{7,8}$');
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_dni
  ON public.usuarios (dni)
  WHERE dni IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_usuarios_perfil_completo
  ON public.usuarios (perfil_completo, estado);

CREATE OR REPLACE FUNCTION public.obtener_email_por_dni(p_dni text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT email
  FROM public.usuarios
  WHERE dni = trim(p_dni)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.obtener_email_por_dni(text) TO anon;
GRANT EXECUTE ON FUNCTION public.obtener_email_por_dni(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_plan text;
  v_dni text;
  v_telefono text;
  v_nombre text;
BEGIN
  SELECT coalesce(valor, 'plan_basic')
  INTO v_plan
  FROM public.config
  WHERE clave = 'plan_empresa';

  IF v_plan IS NULL THEN
    v_plan := 'plan_basic';
  END IF;

  v_dni      := nullif(trim(new.raw_user_meta_data->>'dni'), '');
  v_telefono := nullif(trim(new.raw_user_meta_data->>'telefono'), '');
  v_nombre   := nullif(trim(new.raw_user_meta_data->>'nombre'), '');

  INSERT INTO public.usuarios
    (id, email, nombre, empresa, estado, rol, tipo_usuario, dni, telefono, perfil_completo)
  VALUES (
    new.id,
    lower(new.email),
    coalesce(v_nombre, split_part(new.email, '@', 1)),
    v_plan,
    'pendiente',
    'usuario',
    'general',
    v_dni,
    v_telefono,
    CASE
      WHEN v_dni IS NOT NULL
        AND v_nombre IS NOT NULL
        AND v_telefono IS NOT NULL
        AND new.email NOT LIKE '%@usuarios.local'
      THEN true
      ELSE false
    END
  )
  ON CONFLICT (dni) DO UPDATE SET
    id = excluded.id,
    email = excluded.email,
    telefono = coalesce(excluded.telefono, public.usuarios.telefono),
    empresa = excluded.empresa,
    rol = excluded.rol,
    tipo_usuario = excluded.tipo_usuario;

  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.completar_perfil(
  p_nombre text,
  p_email text,
  p_telefono text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email_normalizado text := trim(lower(p_email));
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sesión inválida';
  END IF;

  IF p_nombre IS NULL OR trim(p_nombre) = '' THEN
    RAISE EXCEPTION 'El nombre es obligatorio';
  END IF;

  IF p_email IS NULL OR trim(p_email) = '' THEN
    RAISE EXCEPTION 'El email es obligatorio';
  END IF;

  IF v_email_normalizado !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'El email no tiene un formato válido';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM auth.users
    WHERE lower(email) = v_email_normalizado
      AND id <> v_user_id
  ) THEN
    RAISE EXCEPTION 'Ese email ya está registrado';
  END IF;

  UPDATE auth.users
  SET
    email = v_email_normalizado,
    email_confirmed_at = now(),
    updated_at = now(),
    raw_user_meta_data =
      coalesce(raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object(
        'nombre', trim(p_nombre),
        'telefono', nullif(trim(p_telefono), '')
      )
  WHERE id = v_user_id;

  UPDATE public.usuarios
  SET
    nombre = trim(p_nombre),
    email = v_email_normalizado,
    telefono = nullif(trim(p_telefono), ''),
    perfil_completo = true,
    estado = 'activo'
  WHERE id = v_user_id;

  RETURN json_build_object(
    'ok', true,
    'message', 'Perfil completado correctamente'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.completar_perfil(text, text, text) TO authenticated;

DROP POLICY IF EXISTS usuarios_update_self ON public.usuarios;

CREATE POLICY usuarios_update_self ON public.usuarios
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());