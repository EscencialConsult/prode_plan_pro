-- ════════════════════════════════════════════════════════════════
-- 20260610_11_regionales_y_ci_usuarios.sql
-- ----------------------------------------------------------------
-- 1) Crea la tabla `regionales`.
-- 2) Agrega columnas `ci` y `regional_id` a `usuarios`.
-- 3) Reemplaza `handle_new_user()` para leer ci/area_id/regional_id
--    desde raw_user_meta_data. Cuando vienen completos (importación
--    masiva), el usuario queda `activo`; cuando no, queda `pendiente`
--    (comportamiento anterior).
--
-- No afecta otras funcionalidades: las columnas nuevas son nullable
-- y el flujo de alta manual mantiene el estado `pendiente`.
-- ════════════════════════════════════════════════════════════════

-- ── 1) Tabla regionales ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.regionales (
  id     bigserial PRIMARY KEY,
  nombre text NOT NULL UNIQUE
);

ALTER TABLE public.regionales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "regionales_select_authenticated" ON public.regionales;
CREATE POLICY "regionales_select_authenticated"
  ON public.regionales FOR SELECT
  TO authenticated USING (true);

GRANT SELECT ON public.regionales TO authenticated;


-- ── 2) usuarios: ci + regional_id ─────────────────────────
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS ci          text,
  ADD COLUMN IF NOT EXISTS regional_id bigint REFERENCES public.regionales(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_usuarios_regional_id ON public.usuarios(regional_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_ci          ON public.usuarios(ci);


-- ── 3) handle_new_user: leer ci/area_id/regional_id ───────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan         text;
  v_ci           text;
  v_area_id      uuid;
  v_regional_id  bigint;
  v_nombre       text;
  v_estado       text;
BEGIN
  -- Plan de empresa (default plan_basic)
  SELECT COALESCE(valor, 'plan_basic') INTO v_plan
    FROM public.config WHERE clave = 'plan_empresa';
  IF v_plan IS NULL THEN v_plan := 'plan_basic'; END IF;

  -- Leer metadata (importación masiva la envía completa)
  v_ci          := NULLIF(NEW.raw_user_meta_data->>'ci', '');
  v_area_id     := NULLIF(NEW.raw_user_meta_data->>'area_id', '')::uuid;
  v_regional_id := NULLIF(NEW.raw_user_meta_data->>'regional_id', '')::bigint;
  v_nombre      := COALESCE(
                     NULLIF(NEW.raw_user_meta_data->>'nombre_completo', ''),
                     NULLIF(NEW.raw_user_meta_data->>'nombre', ''),
                     split_part(NEW.email, '@', 1)
                   );

  -- Estado: activo si vino el set completo (import); pendiente si no.
  v_estado := CASE
                WHEN v_area_id IS NOT NULL AND v_regional_id IS NOT NULL
                  THEN 'activo'
                ELSE 'pendiente'
              END;

  INSERT INTO public.usuarios (
    id, email, nombre, empresa, estado, rol, tipo_usuario,
    ci, area_id, regional_id
  )
  VALUES (
    NEW.id, NEW.email, v_nombre, v_plan, v_estado, 'usuario', 'general',
    v_ci, v_area_id, v_regional_id
  );

  RETURN NEW;
END;
$$;


-- ── 4) Datos maestros: áreas (GRUPO PARA PREMIOS) ─────────
-- Insertamos solo las que aún no existan (sin requerir UNIQUE en areas.nombre).
INSERT INTO public.areas (nombre, descripcion, activa)
SELECT v.nombre, '', true
FROM (VALUES
  ('Oficina Nacional'),
  ('Regional Cochabamba'),
  ('Regional El Alto'),
  ('Regional La Paz'),
  ('Regional Santa Cruz'),
  ('Regionales Oruro, Sucre, Tarija Potosí, Beni y Pando')
) AS v(nombre)
WHERE NOT EXISTS (
  SELECT 1 FROM public.areas a WHERE a.nombre = v.nombre
);


-- ── 5) Datos maestros: regionales ─────────────────────────
INSERT INTO public.regionales (nombre) VALUES
  ('Oficina Beni'),
  ('Oficina Nacional'),
  ('Oficina Oruro'),
  ('Oficina Pando'),
  ('Oficina Potosí'),
  ('Oficina Tarija'),
  ('Regional Cochabamba'),
  ('Regional El Alto'),
  ('Regional La Paz'),
  ('Regional Santa Cruz'),
  ('Regional Sucre')
ON CONFLICT (nombre) DO NOTHING;
