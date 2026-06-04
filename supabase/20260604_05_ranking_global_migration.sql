-- ============================================================
-- MIGRACIÓN: Ranking Global Acumulado y Finalización Automática
-- Ejecutar UNA SOLA VEZ en el SQL Editor de Supabase
-- ============================================================

-- ── 1. VISTA: ranking_global ──────────────────────────────
-- Suma de puntos por usuario en apuestas cerradas/finalizadas.

DROP VIEW IF EXISTS public.ranking_global CASCADE;

CREATE VIEW public.ranking_global AS
SELECT
  p.user_id,
  u.nombre,
  u.area_id,
  COALESCE(SUM(p.puntos), 0)              AS puntos_totales,
  COUNT(*)                                 AS predicciones,
  RANK() OVER (
    ORDER BY COALESCE(SUM(p.puntos), 0) DESC
  )                                        AS posicion
FROM public.predicciones p
JOIN public.usuarios   u ON u.id = p.user_id
JOIN public.apuestas   a ON a.id = p.apuesta_id
WHERE a.estado IN ('cerrada', 'finalizada')
  AND p.puntos IS NOT NULL
GROUP BY p.user_id, u.nombre, u.area_id;


-- ── 2. TABLA: ranking_global_cache ───────────────────────
-- Snapshot materializado de ranking_global.

CREATE TABLE IF NOT EXISTS public.ranking_global_cache (
  id             uuid    DEFAULT gen_random_uuid() NOT NULL,
  user_id        uuid    NOT NULL,
  nombre         text,
  area_id        uuid,
  puntos_totales bigint  DEFAULT 0,
  predicciones   bigint  DEFAULT 0,
  posicion       bigint,
  updated_at     timestamp with time zone DEFAULT now(),
  CONSTRAINT ranking_global_cache_pkey PRIMARY KEY (id),
  CONSTRAINT ranking_global_cache_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.usuarios(id) ON DELETE CASCADE,
  CONSTRAINT ranking_global_cache_area_id_fkey
    FOREIGN KEY (area_id) REFERENCES public.areas(id)    ON DELETE SET NULL
);

-- Índice único por user_id
CREATE UNIQUE INDEX IF NOT EXISTS uq_ranking_global_cache_user
  ON public.ranking_global_cache(user_id);

-- Índice por posicion
CREATE INDEX IF NOT EXISTS idx_ranking_global_posicion
  ON public.ranking_global_cache(posicion);


-- ── 3. FUNCIÓN: refrescar_ranking_global() ────────────────
-- CORRECCIÓN: Cambiado DELETE sin WHERE por TRUNCATE.
-- DELETE sin WHERE clause es bloqueado por PostgreSQL cuando
-- RLS está activo en la tabla, lanzando error code 21000.
-- TRUNCATE no es afectado por RLS y es más eficiente.

CREATE OR REPLACE FUNCTION public.refrescar_ranking_global()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  TRUNCATE ranking_global_cache;
  INSERT INTO ranking_global_cache
    (user_id, nombre, area_id, puntos_totales, predicciones, posicion, updated_at)
  SELECT
    user_id, nombre, area_id, puntos_totales, predicciones, posicion, now()
  FROM ranking_global;
END;
$$;


-- ── 4. FUNCIÓN: refrescar_ranking(uuid) ──────────────────
-- Permite recalcular rankings de apuestas en estado
-- 'abierta', 'cerrada' y 'finalizada'.

DROP FUNCTION IF EXISTS public.refrescar_ranking(uuid);

CREATE OR REPLACE FUNCTION public.refrescar_ranking(
  p_apuesta_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tipo   text;
  v_estado text;
BEGIN
  SELECT tipo, estado
  INTO v_tipo, v_estado
  FROM public.apuestas
  WHERE id = p_apuesta_id;

  IF v_tipo IS NULL THEN
    RAISE EXCEPTION 'Apuesta no encontrada: %', p_apuesta_id;
  END IF;

  IF v_estado NOT IN ('abierta', 'cerrada', 'finalizada') THEN
    RAISE EXCEPTION 'Estado de apuesta inválido (estado actual: %)', v_estado;
  END IF;

  DELETE FROM public.ranking_cache
  WHERE apuesta_id = p_apuesta_id;

  -- Individual
  INSERT INTO public.ranking_cache (
    apuesta_id, user_id, nombre, puntos_totales,
    aciertos_exactos, aciertos_diferencia,
    aciertos_clasificado, aciertos_resultado,
    predicciones, posicion, es_grupal
  )
  SELECT
    apuesta_id, user_id, nombre, puntos_totales,
    aciertos_exactos, aciertos_diferencia,
    aciertos_clasificado, aciertos_resultado,
    predicciones, posicion, false
  FROM public.ranking_apuestas
  WHERE apuesta_id = p_apuesta_id;

  -- Grupal
  IF v_tipo = 'grupos' THEN
    INSERT INTO public.ranking_cache (
      apuesta_id, area_id, nombre, puntos_totales,
      aciertos_exactos, aciertos_diferencia,
      aciertos_clasificado, aciertos_resultado,
      predicciones, miembros_participantes, posicion, es_grupal
    )
    SELECT
      apuesta_id, area_id, area_nombre, puntos_totales,
      aciertos_exactos, aciertos_diferencia,
      aciertos_clasificado, aciertos_resultado,
      predicciones, miembros_participantes, posicion, true
    FROM public.ranking_apuestas_grupales
    WHERE apuesta_id = p_apuesta_id;
  END IF;
END;
$$;


-- ── 5. RPC: refrescar_rankings_por_partidos ───────────────
-- 1. Recalcula y refresca apuestas en estado 'abierta' y 'cerrada'.
-- 2. Auto-finalización: Pasa apuestas a 'finalizada' si todos
--    sus partidos han finalizado correctamente.

DROP FUNCTION IF EXISTS public.refrescar_rankings_por_partidos(text[], boolean);

CREATE OR REPLACE FUNCTION public.refrescar_rankings_por_partidos(
  p_partido_ids      text[] DEFAULT NULL::text[],
  p_solo_finalizados boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_apuesta_id  uuid;
  v_refrescadas int  := 0;
  v_apuestas    jsonb := '[]'::jsonb;
BEGIN
  -- Recalcular puntos para apuestas abiertas o cerradas
  UPDATE public.predicciones pr
  SET puntos = public.calcular_puntos_prediccion(
    p,
    a,
    pr.pred_local,
    pr.pred_visitante,
    pr.pred_clasificado
  )
  FROM public.partidos p, public.apuestas a
  WHERE pr.partido_id = p.id
    AND pr.apuesta_id = a.id
    AND a.estado IN ('abierta', 'cerrada')
    AND (
      p_partido_ids IS NULL
      OR cardinality(p_partido_ids) = 0
      OR p.id = ANY(p_partido_ids)
    )
    AND p.estado = 'finalizado'
    AND p.goles_local IS NOT NULL
    AND p.goles_visitante IS NOT NULL
    AND NOT (
      public.es_fase_eliminatoria(p.fase)
      AND p.goles_local = p.goles_visitante
      AND (p.penales_local IS NULL OR p.penales_visit IS NULL)
    );

  -- Limpiar puntos si los partidos afectados no son puntuables
  UPDATE public.predicciones pr
  SET puntos = NULL
  FROM public.partidos p, public.apuestas a
  WHERE pr.partido_id = p.id
    AND pr.apuesta_id = a.id
    AND a.estado IN ('abierta', 'cerrada')
    AND (
      p_partido_ids IS NULL
      OR cardinality(p_partido_ids) = 0
      OR p.id = ANY(p_partido_ids)
    )
    AND (
      p.estado <> 'finalizado'
      OR p.goles_local IS NULL
      OR p.goles_visitante IS NULL
      OR (
        public.es_fase_eliminatoria(p.fase)
        AND p.goles_local = p.goles_visitante
        AND (p.penales_local IS NULL OR p.penales_visit IS NULL)
      )
    );

  -- Refrescar rankings de apuestas abiertas o cerradas
  FOR v_apuesta_id IN
    SELECT DISTINCT ap.apuesta_id
    FROM public.apuesta_partidos ap
    JOIN public.partidos p ON p.id = ap.partido_id
    JOIN public.apuestas a ON a.id = ap.apuesta_id
    WHERE a.estado IN ('abierta', 'cerrada')
      AND (
        p_partido_ids IS NULL
        OR cardinality(p_partido_ids) = 0
        OR ap.partido_id = ANY(p_partido_ids)
      )
      AND (
        NOT p_solo_finalizados
        OR (
          p.estado = 'finalizado'
          AND p.goles_local IS NOT NULL
          AND p.goles_visitante IS NOT NULL
          AND NOT (
            public.es_fase_eliminatoria(p.fase)
            AND p.goles_local = p.goles_visitante
            AND (p.penales_local IS NULL OR p.penales_visit IS NULL)
          )
        )
      )
  LOOP
    PERFORM public.refrescar_ranking(v_apuesta_id);
    v_refrescadas := v_refrescadas + 1;
    v_apuestas    := v_apuestas || to_jsonb(v_apuesta_id::text);
  END LOOP;

  -- Auto-finalización: apuestas cuyos partidos hayan finalizado todos
  UPDATE public.apuestas a
  SET estado = 'finalizada'
  WHERE estado IN ('abierta', 'cerrada')
    AND NOT EXISTS (
      SELECT 1
      FROM public.apuesta_partidos ap
      JOIN public.partidos p ON p.id = ap.partido_id
      WHERE ap.apuesta_id = a.id
        AND (
          p.estado <> 'finalizado'
          OR p.goles_local IS NULL
          OR p.goles_visitante IS NULL
          OR (
            public.es_fase_eliminatoria(p.fase)
            AND p.goles_local = p.goles_visitante
            AND (p.penales_local IS NULL OR p.penales_visit IS NULL)
          )
        )
    );

  -- Refrescar ranking global acumulado
  PERFORM public.refrescar_ranking_global();

  RETURN jsonb_build_object(
    'ok',                 true,
    'rankings_refrescados', v_refrescadas,
    'apuestas',           v_apuestas
  );
END;
$$;


-- ── 6. RLS + GRANTS para ranking_global_cache ────────────

ALTER TABLE public.ranking_global_cache ENABLE ROW LEVEL SECURITY;

-- Solo usuarios activos o admins pueden leer
DROP POLICY IF EXISTS rgc_select ON public.ranking_global_cache;
CREATE POLICY rgc_select
  ON public.ranking_global_cache
  FOR SELECT
  TO authenticated
  USING (public.usuario_activo() OR public.es_admin());

-- CORRECCIÓN: Agregado FOR ALL explícito para mayor claridad
DROP POLICY IF EXISTS rgc_admin_all ON public.ranking_global_cache;
CREATE POLICY rgc_admin_all
  ON public.ranking_global_cache
  FOR ALL
  TO authenticated
  USING (public.es_admin())
  WITH CHECK (public.es_admin());

GRANT SELECT ON public.ranking_global_cache TO authenticated;


-- ── 7. POBLAR LA CACHÉ POR PRIMERA VEZ ───────────────────
-- Se ejecuta al final; si falla, corregir y llamar manualmente:
-- SELECT public.refrescar_ranking_global();

SELECT public.refrescar_ranking_global();