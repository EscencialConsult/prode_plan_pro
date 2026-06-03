-- ════════════════════════════════════════════════════════════════
-- RANKING GENERAL ACUMULADO
-- Suma los puntos de cada persona a lo largo de TODAS las apuestas
-- FINALIZADAS (del comienzo al final del torneo).
--
-- Se apoya en ranking_cache (que ya se refresca solo cuando entran
-- resultados), así que el general queda siempre actualizado.
--
-- Ejecutar en: Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.ranking_general()
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
  WITH agg AS (
    SELECT
      rc.user_id,
      max(rc.nombre)                      AS nombre,
      sum(rc.puntos_totales)::bigint      AS puntos_totales,
      sum(rc.aciertos_exactos)::bigint    AS aciertos_exactos,
      sum(rc.aciertos_diferencia)::bigint AS aciertos_diferencia,
      sum(rc.aciertos_resultado)::bigint  AS aciertos_resultado,
      sum(rc.aciertos_clasificado)::bigint AS aciertos_clasificado,
      sum(rc.predicciones)::bigint        AS predicciones
    FROM ranking_cache rc
    JOIN apuestas a ON a.id = rc.apuesta_id
    WHERE rc.es_grupal = false          -- solo ranking individual (personas)
      AND rc.user_id IS NOT NULL
      AND a.estado = 'finalizada'       -- solo apuestas finalizadas
    GROUP BY rc.user_id
  )
  SELECT
    user_id, nombre, puntos_totales, aciertos_exactos, aciertos_diferencia,
    aciertos_resultado, aciertos_clasificado, predicciones,
    row_number() OVER (
      ORDER BY puntos_totales DESC, aciertos_exactos DESC, aciertos_diferencia DESC
    ) AS posicion
  FROM agg
  ORDER BY posicion;
$$;

-- Lo ven usuarios logueados (y el admin). Service_role por si se llama desde backend.
GRANT EXECUTE ON FUNCTION public.ranking_general() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ranking_general() TO service_role;

-- Prueba rápida (debería devolver el acumulado, o vacío si aún no hay apuestas finalizadas)
SELECT * FROM public.ranking_general();
