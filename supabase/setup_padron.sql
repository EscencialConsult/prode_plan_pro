-- ════════════════════════════════════════════════════════════════
-- PADRÓN DE HABILITADOS  (STA)
-- Solo los DNIs cargados en public.padron pueden registrarse.
--
-- SEGURO DE CORRER AHORA:
--   · Si el padrón está VACÍO  → el registro funciona como hoy (queda 'pendiente').
--   · Si el padrón TIENE datos → se valida: DNI en lista = 'activo', si no = RECHAZADO.
--   Es decir, la validación se "auto-activa" recién cuando cargás la lista.
--
-- Ejecutar en: Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════════

-- ─── 1) Tabla del padrón ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.padron (
  dni        text PRIMARY KEY,
  nombre     text,
  creado_en  timestamptz NOT NULL DEFAULT now()
);

-- Formato de DNI: solo dígitos, 7 u 8 (idempotente)
DO $$ BEGIN
  ALTER TABLE public.padron ADD CONSTRAINT padron_dni_formato
    CHECK (dni ~ '^\d{7,8}$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS: nadie lee el padrón directo desde el front (los DNIs son privados).
-- El acceso se hace solo vía las funciones SECURITY DEFINER de abajo.
ALTER TABLE public.padron ENABLE ROW LEVEL SECURITY;

-- ─── 2) Función pública: ¿este DNI está habilitado? ────────────
--      (la usa la pantalla de registro para mostrar un mensaje claro)
CREATE OR REPLACE FUNCTION public.dni_habilitado(p_dni text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT EXISTS(SELECT 1 FROM public.padron WHERE dni = trim(p_dni)); $$;
GRANT EXECUTE ON FUNCTION public.dni_habilitado(text) TO anon;
GRANT EXECUTE ON FUNCTION public.dni_habilitado(text) TO authenticated;

-- ─── 3) Registro automático con validación de padrón ───────────
--      Reemplaza handle_new_user conservando todo lo de hoy
--      (plan desde config, dni/telefono/nombre desde metadata)
--      y agregando la regla del padrón.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_plan         text;
  v_dni          text;
  v_telefono     text;
  v_nombre       text;
  v_estado       text;
  v_padron_total int;
  v_habilitado   boolean;
BEGIN
  v_dni      := nullif(trim(new.raw_user_meta_data->>'dni'), '');
  v_telefono := nullif(trim(new.raw_user_meta_data->>'telefono'), '');
  v_nombre   := nullif(trim(new.raw_user_meta_data->>'nombre'), '');

  -- ¿Hay padrón cargado?
  SELECT count(*) INTO v_padron_total FROM public.padron;

  IF v_padron_total > 0 THEN
    -- Padrón ACTIVO → validar contra la lista
    SELECT EXISTS(SELECT 1 FROM public.padron WHERE dni = v_dni) INTO v_habilitado;
    IF v_dni IS NULL OR NOT v_habilitado THEN
      RAISE EXCEPTION 'DNI_NO_HABILITADO';   -- aborta el alta (no se crea la cuenta)
    END IF;
    v_estado := 'activo';                    -- habilitado → entra directo
  ELSE
    -- Padrón VACÍO → comportamiento de hoy (aprobación manual)
    v_estado := 'pendiente';
  END IF;

  -- Plan de la empresa (config). Por defecto plan_basic.
  SELECT coalesce(valor, 'plan_basic') INTO v_plan FROM public.config WHERE clave = 'plan_empresa';
  IF v_plan IS NULL THEN v_plan := 'plan_basic'; END IF;

  INSERT INTO public.usuarios
    (id, email, nombre, empresa, estado, rol, tipo_usuario, dni, telefono, perfil_completo)
  VALUES (new.id, new.email, coalesce(v_nombre, split_part(new.email,'@',1)),
    v_plan, v_estado, 'usuario', 'general', v_dni, v_telefono,
    CASE WHEN v_dni IS NOT NULL AND v_nombre IS NOT NULL AND v_telefono IS NOT NULL THEN true ELSE false END);

  RETURN new;
END; $$;

-- ─── Verificación ──────────────────────────────────────────────
SELECT count(*) AS dnis_en_padron FROM public.padron;
-- 0 = padrón aún vacío (registro funciona como hoy).
-- Cuando cargues la lista, este número sube y la validación se activa sola.
