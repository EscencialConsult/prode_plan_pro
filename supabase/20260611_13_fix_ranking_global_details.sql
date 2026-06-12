-- ════════════════════════════════════════════════════════════════
-- 20260611_13_fix_ranking_global_details.sql
-- ----------------------------------------------------------------
-- Corrige y añade las columnas de detalle (apuestas_participadas,
-- aciertos_exactos, aciertos_diferencia, aciertos_resultado)
-- a la vista ranking_global y a la tabla de caché ranking_global_cache.
-- ════════════════════════════════════════════════════════════════

-- 1. Agregar columnas a la tabla de caché si no existen
ALTER TABLE public.ranking_global_cache
  ADD COLUMN IF NOT EXISTS apuestas_participadas bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS aciertos_exactos       bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS aciertos_diferencia    bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS aciertos_resultado     bigint DEFAULT 0;

-- 2. Redefinir la vista ranking_global para calcular los detalles correctamente
DROP VIEW IF EXISTS public.ranking_global CASCADE;
CREATE OR REPLACE VIEW public.ranking_global AS
SELECT
  p.user_id,
  u.nombre,
  u.area_id,
  COALESCE(SUM(p.puntos), 0)::bigint       AS puntos_totales,
  COUNT(*)                                 AS predicciones,
  COUNT(DISTINCT p.apuesta_id)             AS apuestas_participadas,
  COUNT(*) FILTER (WHERE p.puntos = a.puntos_exacto)    AS aciertos_exactos,
  COUNT(*) FILTER (WHERE p.puntos = a.puntos_diferencia) AS aciertos_diferencia,
  COUNT(*) FILTER (WHERE p.puntos = a.puntos_resultado) AS aciertos_resultado,
  RANK() OVER (
    ORDER BY COALESCE(SUM(p.puntos), 0)::bigint DESC
  )                                        AS posicion
FROM public.predicciones p
JOIN public.usuarios   u ON u.id = p.user_id
JOIN public.apuestas   a ON a.id = p.apuesta_id
WHERE a.estado IN ('cerrada', 'finalizada')
  AND p.puntos IS NOT NULL
GROUP BY p.user_id, u.nombre, u.area_id;

-- 3. Redefinir refrescar_ranking_global() para poblar todas las columnas
CREATE OR REPLACE FUNCTION public.refrescar_ranking_global()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ranking individual acumulado
  TRUNCATE public.ranking_global_cache;
  INSERT INTO public.ranking_global_cache
    (user_id, nombre, area_id, puntos_totales, predicciones,
     apuestas_participadas, aciertos_exactos, aciertos_diferencia, aciertos_resultado,
     posicion, updated_at)
  SELECT
    user_id, nombre, area_id, puntos_totales, predicciones,
    apuestas_participadas, aciertos_exactos, aciertos_diferencia, aciertos_resultado,
    posicion, now()
  FROM public.ranking_global;

  -- Ranking por área acumulado — apuestas tipo 'grupos' (existente)
  PERFORM public.refrescar_ranking_global_areas();

  -- Ranking por área acumulado — apuestas tipo 'libre' (nuevo)
  PERFORM public.refrescar_ranking_global_libre_areas();
END;
$$;

-- 4. Ejecutar refresco inicial
SELECT public.refrescar_ranking_global();

NOTIFY pgrst, 'reload schema';
