-- ============================================================
-- FIX: Error 42501 al insertar áreas desde el panel admin
-- Fecha: 2026-06-09
--
-- PROBLEMA DOBLE:
--   1. es_admin() compara `rol = 'admin'` pero el campo en uso
--      real es `tipo_usuario`. Si el admin no tiene `rol = 'admin'`
--      en su fila de usuarios, la función devuelve false y la
--      política RLS bloquea el INSERT.
--   2. El GRANT sobre public.areas solo otorga SELECT al rol
--      'authenticated', faltando INSERT, UPDATE y DELETE.
--
-- SOLUCIÓN:
--   a) Actualizar es_admin() para verificar AMBOS campos.
--   b) Agregar GRANT INSERT, UPDATE, DELETE en public.areas.
-- ============================================================

-- ── 1. Corregir la función es_admin() ──────────────────────
--    Verifica rol='admin' O tipo_usuario='admin' para cubrir
--    ambas convenciones que existen en la base de datos.
CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (
      SELECT (rol = 'admin' OR tipo_usuario = 'admin')
      FROM usuarios
      WHERE id = auth.uid()
      LIMIT 1
    ),
    false
  );
$$;

-- ── 2. Otorgar privilegios de escritura en areas ────────────
--    El rol 'authenticated' necesita INSERT/UPDATE/DELETE para
--    que el admin pueda crear, editar y desactivar áreas.
--    La política RLS areas_admin_all ya restringe quién puede
--    hacer qué, así que otorgar el privilegio de tabla es seguro.
GRANT INSERT, UPDATE, DELETE ON public.areas TO authenticated;

-- ── Verificación ────────────────────────────────────────────
-- Podés confirmar ejecutando:
--   SELECT public.es_admin();          -- debe devolver true si sos admin
--   SELECT * FROM public.areas LIMIT 1; -- debe funcionar
