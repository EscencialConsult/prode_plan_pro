-- ============================================================
-- MIGRACIÓN: Desempate de ranking por orden de apuesta
-- ============================================================
-- Criterio de desempate: ante igualdad de puntos, gana quien
-- apostó PRIMERO, medido como MIN(fecha_registro) del usuario.
-- fecha_registro es estable: el upsert de guardado no la reescribe
-- al editar una predicción.
--
-- ALCANCE (según decisión del proyecto):
--   ✓ ranking_apuestas         (individual por apuesta)
--   ✓ ranking_global           (individual acumulado)
--   ✗ ranking_apuestas_grupales (por área) → NO se modifica
--
-- Solo cambia el ORDER BY de las ventanas rank()/RANK() y agrega
-- la columna fecha_apuesta al final (CREATE OR REPLACE VIEW permite
-- añadir columnas al final sin romper a refrescar_ranking, que
-- selecciona columnas por nombre).
--
-- Las tablas de caché copian la posición ya calculada, por lo que
-- refrescar_ranking() y refrescar_ranking_global() NO cambian; solo
-- se repueblan al final de esta migración.
-- ============================================================


-- ── 1. Individual por apuesta ─────────────────────────────
CREATE OR REPLACE VIEW public.ranking_apuestas AS
 SELECT
    p.apuesta_id,
    p.user_id,
    u.nombre,
    u.area_id,
    COALESCE(sum(p.puntos), (0)::bigint) AS puntos_totales,
    count(*) FILTER (WHERE (p.puntos = a.puntos_exacto))     AS aciertos_exactos,
    count(*) FILTER (WHERE (p.puntos = a.puntos_diferencia)) AS aciertos_diferencia,
    count(*) FILTER (WHERE ((p.puntos = a.puntos_clasificado)
                       AND (p.puntos <> a.puntos_resultado))) AS aciertos_clasificado,
    count(*) FILTER (WHERE (p.puntos = a.puntos_resultado))  AS aciertos_resultado,
    count(*)                                                 AS predicciones,
    rank() OVER (
      PARTITION BY p.apuesta_id
      ORDER BY COALESCE(sum(p.puntos), (0)::bigint) DESC,
               min(p.fecha_registro) ASC          -- ← DESEMPATE: apostó primero
    )                                                        AS posicion,
    min(p.fecha_registro)                                    AS fecha_apuesta
   FROM ((public.predicciones p
     JOIN public.usuarios u ON ((u.id = p.user_id)))
     JOIN public.apuestas a ON ((a.id = p.apuesta_id)))
  GROUP BY p.apuesta_id, p.user_id, u.nombre, u.area_id,
           a.puntos_exacto, a.puntos_diferencia, a.puntos_clasificado, a.puntos_resultado;


-- ── 2. Global acumulado ───────────────────────────────────
CREATE OR REPLACE VIEW public.ranking_global AS
 SELECT
    p.user_id,
    u.nombre,
    u.area_id,
    COALESCE(SUM(p.puntos), 0) AS puntos_totales,
    COUNT(*)                   AS predicciones,
    RANK() OVER (
      ORDER BY COALESCE(SUM(p.puntos), 0) DESC,
               MIN(p.fecha_registro) ASC          -- ← DESEMPATE: primera predicción histórica
    )                          AS posicion,
    MIN(p.fecha_registro)      AS fecha_apuesta
   FROM public.predicciones p
   JOIN public.usuarios u ON u.id = p.user_id
   JOIN public.apuestas a ON a.id = p.apuesta_id
  WHERE a.estado IN ('cerrada', 'finalizada')
    AND p.puntos IS NOT NULL
  GROUP BY p.user_id, u.nombre, u.area_id;


-- ── 3. Repoblar el caché con las nuevas posiciones ────────
-- refrescar_ranking() ya copia la posición desde ranking_apuestas
-- (y ranking_apuestas_grupales, que quedó intacta).
-- refrescar_ranking_global() copia desde ranking_global.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.apuestas
           WHERE estado IN ('abierta', 'cerrada', 'finalizada')
  LOOP
    PERFORM public.refrescar_ranking(r.id);
  END LOOP;

  PERFORM public.refrescar_ranking_global();
END $$;

NOTIFY pgrst, 'reload schema';
