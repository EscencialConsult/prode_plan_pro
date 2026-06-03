-- ════════════════════════════════════════════════════════════════
-- SETUP: Login por DNI + Admin inicial  (base STA-tabacal)
-- Ejecutar UNA vez en: Supabase Dashboard → SQL Editor → Run
-- ════════════════════════════════════════════════════════════════

-- ─── PARTE 1: Migración login por DNI ───────────────────────────

-- 1. Nuevas columnas en public.usuarios
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS dni             text,
  ADD COLUMN IF NOT EXISTS telefono        text,
  ADD COLUMN IF NOT EXISTS perfil_completo boolean NOT NULL DEFAULT false;

-- 2. DNI único (idempotente)
DO $$ BEGIN
  ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_dni_unique UNIQUE (dni);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL; END $$;

-- 3. Formato DNI: solo dígitos, 7 u 8 (idempotente)
DO $$ BEGIN
  ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_dni_formato
    CHECK (dni IS NULL OR dni ~ '^\d{7,8}$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Índices
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_dni
  ON public.usuarios (dni) WHERE dni IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_usuarios_perfil_completo
  ON public.usuarios (perfil_completo, estado);

-- 5. FUNCIÓN PÚBLICA: obtener_email_por_dni (login)
CREATE OR REPLACE FUNCTION public.obtener_email_por_dni(p_dni text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT email FROM public.usuarios WHERE dni = trim(p_dni) LIMIT 1; $$;
GRANT EXECUTE ON FUNCTION public.obtener_email_por_dni(text) TO anon;
GRANT EXECUTE ON FUNCTION public.obtener_email_por_dni(text) TO authenticated;

-- 6. handle_new_user (guarda dni/telefono/nombre al registrarse)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_plan text; v_dni text; v_telefono text; v_nombre text;
BEGIN
  SELECT coalesce(valor, 'plan_basic') INTO v_plan FROM public.config WHERE clave = 'plan_empresa';
  IF v_plan IS NULL THEN v_plan := 'plan_basic'; END IF;
  v_dni      := nullif(trim(new.raw_user_meta_data->>'dni'), '');
  v_telefono := nullif(trim(new.raw_user_meta_data->>'telefono'), '');
  v_nombre   := nullif(trim(new.raw_user_meta_data->>'nombre'), '');
  INSERT INTO public.usuarios
    (id, email, nombre, empresa, estado, rol, tipo_usuario, dni, telefono, perfil_completo)
  VALUES (new.id, new.email, coalesce(v_nombre, split_part(new.email,'@',1)),
    v_plan, 'pendiente', 'usuario', 'general', v_dni, v_telefono,
    CASE WHEN v_dni IS NOT NULL AND v_nombre IS NOT NULL AND v_telefono IS NOT NULL THEN true ELSE false END);
  RETURN new;
END; $$;

-- 7. RPC: completar_perfil
CREATE OR REPLACE FUNCTION public.completar_perfil(p_nombre text, p_email text, p_telefono text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Sesión inválida'; END IF;
  IF p_nombre IS NULL OR trim(p_nombre)='' THEN RAISE EXCEPTION 'El nombre es obligatorio'; END IF;
  IF p_email IS NULL OR trim(p_email)='' THEN RAISE EXCEPTION 'El email es obligatorio'; END IF;
  IF p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RAISE EXCEPTION 'El email no tiene un formato válido'; END IF;
  UPDATE public.usuarios SET nombre=trim(p_nombre), email=trim(lower(p_email)),
    telefono=nullif(trim(p_telefono),''), perfil_completo=true WHERE id = v_user_id;
  RETURN json_build_object('ok', true, 'message', 'Perfil completado');
END; $$;

-- 8. RLS: el usuario puede actualizar su propio perfil
DROP POLICY IF EXISTS usuarios_update_self ON public.usuarios;
CREATE POLICY usuarios_update_self ON public.usuarios
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ─── PARTE 2: Dejar el usuario ya creado como ADMIN ─────────────
-- ⚠️ Reemplazá el email y el DNI por los del admin real antes de ejecutar.
UPDATE public.usuarios
SET dni             = 'TU_DNI_ADMIN',
    rol             = 'admin',
    estado          = 'activo',
    perfil_completo = true
WHERE email = 'tu-admin@email.com';

-- Verificación (debe mostrar tu usuario admin/aprobado con dni)
SELECT id, dni, email, nombre, rol, estado, perfil_completo
FROM public.usuarios WHERE email = 'tu-admin@email.com';
