-- ============================================================
-- MIGRACIÓN: Ranking global acumulado por área
-- Suma de puntos de TODAS las apuestas cerradas/finalizadas,
-- agrupados por área. Solo tiene datos en plan_pro (empresas
-- con áreas). En plan_basic la tabla queda vacía.
-- ============================================================


-- ── 1. VISTA: ranking_global_areas ───────────────────────────

CREATE OR REPLACE VIEW public.ranking_global_areas AS
SELECT
  u.area_id,
  ar.nombre                                AS area_nombre,
  COALESCE(SUM(p.puntos), 0)::bigint       AS puntos_totales,
  COUNT(DISTINCT p.user_id)                AS miembros_participantes,
  COUNT(*)                                 AS predicciones,
  RANK() OVER (
    ORDER BY COALESCE(SUM(p.puntos), 0)::bigint DESC,
             COUNT(DISTINCT p.user_id) DESC   -- desempate: más miembros participaron
  )                                        AS posicion
FROM public.predicciones p
JOIN public.usuarios  u  ON u.id  = p.user_id
JOIN public.areas     ar ON ar.id = u.area_id
JOIN public.apuestas  a  ON a.id  = p.apuesta_id
WHERE a.estado IN ('cerrada', 'finalizada')
  AND p.puntos  IS NOT NULL
  AND u.area_id IS NOT NULL
GROUP BY u.area_id, ar.nombre;


-- ── 2. TABLA: ranking_global_areas_cache ─────────────────────

CREATE TABLE IF NOT EXISTS public.ranking_global_areas_cache (
  id                     uuid    DEFAULT gen_random_uuid() NOT NULL,
  area_id                uuid    NOT NULL,
  area_nombre            text,
  puntos_totales         bigint  DEFAULT 0,
  miembros_participantes bigint  DEFAULT 0,
  predicciones           bigint  DEFAULT 0,
  posicion               bigint,
  updated_at             timestamp with time zone DEFAULT now(),
  CONSTRAINT ranking_global_areas_cache_pkey PRIMARY KEY (id),
  CONSTRAINT ranking_global_areas_cache_area_id_fkey
    FOREIGN KEY (area_id) REFERENCES public.areas(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ranking_global_areas_cache_area
  ON public.ranking_global_areas_cache(area_id);

CREATE INDEX IF NOT EXISTS idx_ranking_global_areas_posicion
  ON public.ranking_global_areas_cache(posicion);


-- ── 3. FUNCIÓN: refrescar_ranking_global_areas() ─────────────
-- TRUNCATE en lugar de DELETE sin WHERE para evitar el bloqueo
-- que PostgreSQL aplica sobre DELETE sin cláusula WHERE en
-- tablas con RLS activo (error 21000).

CREATE OR REPLACE FUNCTION public.refrescar_ranking_global_areas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  TRUNCATE ranking_global_areas_cache;
  INSERT INTO ranking_global_areas_cache
    (area_id, area_nombre, puntos_totales, miembros_participantes,
     predicciones, posicion, updated_at)
  SELECT
    area_id, area_nombre, puntos_totales, miembros_participantes,
    predicciones, posicion, now()
  FROM ranking_global_areas;
END;
$$;


-- ── 4. ENCADENAR EN refrescar_ranking_global() ───────────────
-- Al agregarlo aquí, el AppScript actualiza ranking_global_areas_cache
-- automáticamente en cada ciclo de 5 min sin ningún cambio al AppScript
-- ni a refrescar_rankings_por_partidos().

CREATE OR REPLACE FUNCTION public.refrescar_ranking_global()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Ranking individual acumulado (existente, sin cambios)
  TRUNCATE ranking_global_cache;
  INSERT INTO ranking_global_cache
    (user_id, nombre, area_id, puntos_totales, predicciones, posicion, updated_at)
  SELECT
    user_id, nombre, area_id, puntos_totales, predicciones, posicion, now()
  FROM ranking_global;

  -- Ranking por área acumulado (nuevo)
  PERFORM public.refrescar_ranking_global_areas();
END;
$$;


-- ── 5. RLS + GRANTS ──────────────────────────────────────────

ALTER TABLE public.ranking_global_areas_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rgac_select ON public.ranking_global_areas_cache;
CREATE POLICY rgac_select
  ON public.ranking_global_areas_cache
  FOR SELECT
  TO authenticated
  USING (public.usuario_activo() OR public.es_admin());

GRANT SELECT ON public.ranking_global_areas_cache TO authenticated;


-- ── 6. POBLAR LA CACHÉ POR PRIMERA VEZ ───────────────────────
-- Si falla (no hay apuestas cerradas/finalizadas aún), es normal;
-- se populará automáticamente en el próximo ciclo del AppScript.

SELECT public.refrescar_ranking_global_areas();

NOTIFY pgrst, 'reload schema';
