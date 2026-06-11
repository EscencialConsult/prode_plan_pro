-- ════════════════════════════════════════════════════════════════
-- RANKING POR APUESTA (individual)
-- Tabla de posiciones de UNA apuesta. Incluye a TODOS los que ya
-- cargaron predicciones (con 0 puntos hasta que finalicen partidos),
-- así se ven los participantes aunque todavía no haya resultados.
--
-- Los puntos se suman desde ranking_cache a medida que finalizan los
-- partidos. La usa sheetsApi.predicciones.tabla() para apuestas individuales.
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
  WITH preds AS (
    SELECT pr.user_id, count(*)::bigint AS n_preds
    FROM predicciones pr
    WHERE pr.apuesta_id = p_apuesta_id AND pr.user_id IS NOT NULL
    GROUP BY pr.user_id
  ),
  cache AS (
    SELECT rc.user_id, rc.nombre,
           rc.puntos_totales, rc.aciertos_exactos, rc.aciertos_diferencia,
           rc.aciertos_resultado, rc.aciertos_clasificado
    FROM ranking_cache rc
    WHERE rc.apuesta_id = p_apuesta_id AND rc.es_grupal = false AND rc.user_id IS NOT NULL
  ),
  agg AS (
    SELECT
      p.user_id,
      coalesce(c.nombre, u.nombre, 'Participante')   AS nombre,
      coalesce(c.puntos_totales, 0)::bigint          AS puntos_totales,
      coalesce(c.aciertos_exactos, 0)::bigint        AS aciertos_exactos,
      coalesce(c.aciertos_diferencia, 0)::bigint     AS aciertos_diferencia,
      coalesce(c.aciertos_resultado, 0)::bigint      AS aciertos_resultado,
      coalesce(c.aciertos_clasificado, 0)::bigint    AS aciertos_clasificado,
      p.n_preds                                      AS predicciones
    FROM preds p
    LEFT JOIN cache    c ON c.user_id = p.user_id
    LEFT JOIN usuarios u ON u.id = p.user_id
  )
  SELECT
    user_id, nombre, puntos_totales, aciertos_exactos, aciertos_diferencia,
    aciertos_resultado, aciertos_clasificado, predicciones,
    row_number() OVER (
      ORDER BY puntos_totales DESC, aciertos_exactos DESC, aciertos_diferencia DESC, nombre ASC
    ) AS posicion
  FROM agg
  ORDER BY posicion;
$$;

GRANT EXECUTE ON FUNCTION public.ranking_apuesta(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ranking_apuesta(uuid) TO service_role;
