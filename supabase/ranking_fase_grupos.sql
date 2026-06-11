-- ════════════════════════════════════════════════════════════════
-- RANKING FASE DE GRUPOS
-- Suma los puntos de cada persona a lo largo de las apuestas que son
-- PURAS de fase de grupos (las 3 fechas: 1ra, 2da y 3ra).
--
-- Una apuesta cuenta como "fase de grupos" si:
--   - tiene al menos un partido con fase = 'grupos', y
--   - NO tiene ningún partido de otra fase (eliminatorias).
-- Así se identifican solas las 3 apuestas de grupos, sin configurar nada.
--
-- IMPORTANTE: muestra a TODOS los que ya cargaron predicciones en grupos,
-- aunque tengan 0 puntos (antes de que se jueguen los partidos). Los puntos
-- se suman desde ranking_cache a medida que finalizan los partidos.
--
-- Ejecutar en: Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.ranking_fase_grupos()
RETURNS TABLE (
  user_id              uuid,
  nombre               text,
  puntos_totales       bigint,
  aciertos_exactos     bigint,
  aciertos_diferencia  bigint,
  aciertos_resultado   bigint,
  aciertos_clasificado bigint,
  predicciones         bigint,
  posicion             bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH apuestas_grupos AS (
    SELECT a.id
    FROM apuestas a
    WHERE EXISTS (
            SELECT 1 FROM apuesta_partidos ap JOIN partidos p ON p.id = ap.partido_id
            WHERE ap.apuesta_id = a.id AND lower(trim(coalesce(p.fase, ''))) = 'grupos'
          )
      AND NOT EXISTS (
            SELECT 1 FROM apuesta_partidos ap JOIN partidos p ON p.id = ap.partido_id
            WHERE ap.apuesta_id = a.id AND lower(trim(coalesce(p.fase, ''))) <> 'grupos'
          )
  ),
  -- Todos los que cargaron al menos una predicción en grupos (aparecen aunque tengan 0 puntos)
  preds AS (
    SELECT pr.user_id, count(*)::bigint AS n_preds
    FROM predicciones pr
    JOIN apuestas_grupos g ON g.id = pr.apuesta_id
    WHERE pr.user_id IS NOT NULL
    GROUP BY pr.user_id
  ),
  -- Puntos acumulados (solo existen una vez que finalizan partidos)
  cache_agg AS (
    SELECT
      rc.user_id,
      max(rc.nombre)                       AS nombre,
      sum(rc.puntos_totales)::bigint       AS puntos_totales,
      sum(rc.aciertos_exactos)::bigint     AS aciertos_exactos,
      sum(rc.aciertos_diferencia)::bigint  AS aciertos_diferencia,
      sum(rc.aciertos_resultado)::bigint   AS aciertos_resultado,
      sum(rc.aciertos_clasificado)::bigint AS aciertos_clasificado
    FROM ranking_cache rc
    JOIN apuestas_grupos g ON g.id = rc.apuesta_id
    WHERE rc.es_grupal = false AND rc.user_id IS NOT NULL
    GROUP BY rc.user_id
  ),
  agg AS (
    SELECT
      p.user_id,
      coalesce(c.nombre, u.nombre, 'Participante') AS nombre,
      coalesce(c.puntos_totales, 0)       AS puntos_totales,
      coalesce(c.aciertos_exactos, 0)     AS aciertos_exactos,
      coalesce(c.aciertos_diferencia, 0)  AS aciertos_diferencia,
      coalesce(c.aciertos_resultado, 0)   AS aciertos_resultado,
      coalesce(c.aciertos_clasificado, 0) AS aciertos_clasificado,
      p.n_preds                           AS predicciones
    FROM preds p
    LEFT JOIN cache_agg c ON c.user_id = p.user_id
    LEFT JOIN usuarios  u ON u.id = p.user_id
  )
  SELECT
    user_id, nombre, puntos_totales, aciertos_exactos, aciertos_diferencia,
    aciertos_resultado, aciertos_clasificado, predicciones,
    row_number() OVER (
      -- Desempate: + puntos, luego + exactos, luego + diferencia, y por estabilidad nombre
      ORDER BY puntos_totales DESC, aciertos_exactos DESC, aciertos_diferencia DESC, nombre ASC
    ) AS posicion
  FROM agg
  ORDER BY posicion;
$$;

-- Lo ven usuarios logueados (y el admin). Service_role por si se llama desde backend.
GRANT EXECUTE ON FUNCTION public.ranking_fase_grupos() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ranking_fase_grupos() TO service_role;

-- Prueba rápida
SELECT * FROM public.ranking_fase_grupos();
