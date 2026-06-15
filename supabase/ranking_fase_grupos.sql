-- ════════════════════════════════════════════════════════════════
-- RANKING FASE DE GRUPOS
-- Suma los puntos de cada persona a lo largo de las apuestas que son
-- PURAS de fase de grupos (las 3 fechas: 1ra, 2da y 3ra).
--
-- Una apuesta cuenta como "fase de grupos" si:
--   - tiene al menos un partido con fase = 'grupos', y
--   - NO tiene ningún partido de otra fase (eliminatorias).
--
-- Suma los puntos DIRECTO desde predicciones.puntos (que el trigger calcula
-- al cargar resultados). NO depende de ranking_cache, así que queda siempre
-- correcto aunque el cache esté vacío. Incluye a todos los que cargaron
-- predicciones (0 puntos hasta que finalicen partidos).
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
  base AS (
    SELECT
      pr.user_id,
      pr.puntos,
      pr.pred_local, pr.pred_visitante,
      p.goles_local, p.goles_visitante,
      (p.goles_local IS NOT NULL AND p.goles_visitante IS NOT NULL) AS fin
    FROM predicciones pr
    JOIN apuestas_grupos g ON g.id = pr.apuesta_id
    JOIN partidos p ON p.id = pr.partido_id
    WHERE pr.user_id IS NOT NULL
  ),
  agg AS (
    SELECT
      b.user_id,
      coalesce(sum(b.puntos), 0)::bigint AS puntos_totales,
      count(*) FILTER (WHERE b.fin AND b.pred_local = b.goles_local AND b.pred_visitante = b.goles_visitante)::bigint AS aciertos_exactos,
      count(*) FILTER (WHERE b.fin AND NOT (b.pred_local = b.goles_local AND b.pred_visitante = b.goles_visitante)
                              AND (b.pred_local - b.pred_visitante) = (b.goles_local - b.goles_visitante))::bigint AS aciertos_diferencia,
      count(*) FILTER (WHERE b.fin AND sign(b.pred_local - b.pred_visitante) = sign(b.goles_local - b.goles_visitante)
                              AND (b.pred_local - b.pred_visitante) <> (b.goles_local - b.goles_visitante))::bigint AS aciertos_resultado,
      0::bigint AS aciertos_clasificado,
      count(*)::bigint AS predicciones
    FROM base b
    GROUP BY b.user_id
  )
  SELECT
    a.user_id,
    coalesce(u.nombre, 'Participante') AS nombre,
    a.puntos_totales, a.aciertos_exactos, a.aciertos_diferencia,
    a.aciertos_resultado, a.aciertos_clasificado, a.predicciones,
    row_number() OVER (
      ORDER BY a.puntos_totales DESC, a.aciertos_exactos DESC, a.aciertos_diferencia DESC, coalesce(u.nombre,'') ASC
    ) AS posicion
  FROM agg a
  LEFT JOIN usuarios u ON u.id = a.user_id
  ORDER BY posicion;
$$;

GRANT EXECUTE ON FUNCTION public.ranking_fase_grupos() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ranking_fase_grupos() TO service_role;
