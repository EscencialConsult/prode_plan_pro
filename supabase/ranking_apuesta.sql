-- ════════════════════════════════════════════════════════════════
-- RANKING POR APUESTA (individual)
-- Tabla de posiciones de UNA apuesta. Incluye a TODOS los que cargaron
-- predicciones (con 0 puntos hasta que finalicen partidos).
--
-- Suma los puntos DIRECTO desde predicciones.puntos (que el trigger calcula
-- al cargar resultados). NO depende de ranking_cache, así que el ranking
-- queda siempre correcto aunque el cache esté vacío.
--
-- Los aciertos (exacto / diferencia / resultado) se recalculan comparando
-- la predicción con el resultado del partido (para el desempate).
--
-- Ejecutar en: Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.ranking_apuesta(p_apuesta_id uuid)
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
  WITH base AS (
    SELECT
      pr.user_id,
      pr.puntos,
      pr.pred_local, pr.pred_visitante,
      p.goles_local, p.goles_visitante,
      (p.goles_local IS NOT NULL AND p.goles_visitante IS NOT NULL) AS fin
    FROM predicciones pr
    JOIN partidos p ON p.id = pr.partido_id
    WHERE pr.apuesta_id = p_apuesta_id AND pr.user_id IS NOT NULL
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

GRANT EXECUTE ON FUNCTION public.ranking_apuesta(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ranking_apuesta(uuid) TO service_role;
