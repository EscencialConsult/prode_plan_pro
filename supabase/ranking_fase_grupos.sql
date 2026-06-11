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
-- Se apoya en ranking_cache (que ya se refresca cuando entran resultados),
-- así que el ranking de grupos queda siempre actualizado en vivo.
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
    -- Apuestas puras de fase de grupos
    SELECT a.id
    FROM apuestas a
    WHERE EXISTS (
            SELECT 1
            FROM apuesta_partidos ap
            JOIN partidos p ON p.id = ap.partido_id
            WHERE ap.apuesta_id = a.id
              AND lower(trim(coalesce(p.fase, ''))) = 'grupos'
          )
      AND NOT EXISTS (
            SELECT 1
            FROM apuesta_partidos ap
            JOIN partidos p ON p.id = ap.partido_id
            WHERE ap.apuesta_id = a.id
              AND lower(trim(coalesce(p.fase, ''))) <> 'grupos'
          )
  ),
  agg AS (
    SELECT
      rc.user_id,
      max(rc.nombre)                       AS nombre,
      sum(rc.puntos_totales)::bigint       AS puntos_totales,
      sum(rc.aciertos_exactos)::bigint     AS aciertos_exactos,
      sum(rc.aciertos_diferencia)::bigint  AS aciertos_diferencia,
      sum(rc.aciertos_resultado)::bigint   AS aciertos_resultado,
      sum(rc.aciertos_clasificado)::bigint AS aciertos_clasificado,
      sum(rc.predicciones)::bigint         AS predicciones
    FROM ranking_cache rc
    JOIN apuestas_grupos g ON g.id = rc.apuesta_id
    WHERE rc.es_grupal = false          -- solo ranking individual (personas)
      AND rc.user_id IS NOT NULL
    GROUP BY rc.user_id
  )
  SELECT
    user_id, nombre, puntos_totales, aciertos_exactos, aciertos_diferencia,
    aciertos_resultado, aciertos_clasificado, predicciones,
    row_number() OVER (
      -- Mismo desempate que el resto: + puntos, luego + exactos, luego + diferencia
      ORDER BY puntos_totales DESC, aciertos_exactos DESC, aciertos_diferencia DESC
    ) AS posicion
  FROM agg
  ORDER BY posicion;
$$;

-- Lo ven usuarios logueados (y el admin). Service_role por si se llama desde backend.
GRANT EXECUTE ON FUNCTION public.ranking_fase_grupos() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ranking_fase_grupos() TO service_role;

-- Prueba rápida (debería devolver el acumulado de grupos, o vacío si aún no hay puntos)
SELECT * FROM public.ranking_fase_grupos();
