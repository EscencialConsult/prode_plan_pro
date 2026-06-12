-- ════════════════════════════════════════════════════════════════
-- 20260611_12_ranking_libre_por_area.sql
-- ----------------------------------------------------------------
-- Agrega rankings individuales por área para apuestas tipo 'libre'.
--
-- En apuestas 'libre', predicciones.area_id es siempre NULL.
-- El área se deriva en tiempo de consulta desde usuarios.area_id.
-- No se modifica el flujo de inserción de predicciones ni sus triggers.
--
-- Componentes:
--   1. VIEW ranking_apuestas_libre_por_area
--      → posición individual dentro del área (apuesta libre)
--   2. ALTER TABLE ranking_cache → columna posicion_en_area + area_nombre_cache
--   3. INDEX (apuesta_id, area_id, posicion_en_area) en ranking_cache
--   4. CREATE OR REPLACE refrescar_ranking(uuid)
--      → rellena posicion_en_area para apuestas 'libre'
--   5. VIEW ranking_global_libre_por_area
--      → acumulado individual por área en apuestas libres cerradas/finalizadas
--   6. TABLE ranking_global_libre_areas_cache
--   7. FUNCTION refrescar_ranking_global_libre_areas()
--   8. UPDATE refrescar_ranking_global()
--      → encadena el nuevo refresh (sin tocar AppScript)
--   9. RLS + GRANTs para la nueva tabla cache
--  10. Populate inicial + NOTIFY
-- ════════════════════════════════════════════════════════════════


-- ── 1. VIEW: ranking_apuestas_libre_por_area ──────────────────────
-- Calcula posición de cada usuario DENTRO de su área,
-- para apuestas de tipo 'libre'. El área se lee de usuarios.area_id.

CREATE OR REPLACE VIEW public.ranking_apuestas_libre_por_area AS
SELECT
  p.apuesta_id,
  p.user_id,
  u.area_id,
  ar.nombre                                             AS area_nombre,
  u.nombre                                              AS nombre,
  COALESCE(SUM(p.puntos), 0)::bigint                    AS puntos_totales,
  COUNT(*) FILTER (WHERE p.puntos = a.puntos_exacto)    AS aciertos_exactos,
  COUNT(*) FILTER (WHERE p.puntos = a.puntos_diferencia) AS aciertos_diferencia,
  COUNT(*) FILTER (WHERE p.puntos = a.puntos_clasificado
                     AND p.puntos <> a.puntos_resultado) AS aciertos_clasificado,
  COUNT(*) FILTER (WHERE p.puntos = a.puntos_resultado) AS aciertos_resultado,
  COUNT(*)                                              AS predicciones,
  RANK() OVER (
    PARTITION BY p.apuesta_id, u.area_id
    ORDER BY COALESCE(SUM(p.puntos), 0)::bigint DESC
  )                                                     AS posicion_en_area
FROM public.predicciones p
JOIN public.usuarios   u  ON u.id  = p.user_id
JOIN public.areas      ar ON ar.id = u.area_id
JOIN public.apuestas   a  ON a.id  = p.apuesta_id
WHERE a.tipo = 'libre'
  AND u.area_id IS NOT NULL   -- usuarios sin área se omiten
GROUP BY
  p.apuesta_id,
  p.user_id,
  u.area_id,
  ar.nombre,
  u.nombre,
  a.puntos_exacto,
  a.puntos_diferencia,
  a.puntos_clasificado,
  a.puntos_resultado;


-- ── 2. Columnas nuevas en ranking_cache ──────────────────────────
-- posicion_en_area : ranking del usuario dentro de su área
--                    (NULL en apuestas 'grupos' o usuarios sin área)
-- area_nombre_cache: nombre del área del usuario en el momento del
--                    cálculo (evita joins extra en el frontend)

ALTER TABLE public.ranking_cache
  ADD COLUMN IF NOT EXISTS posicion_en_area  bigint,
  ADD COLUMN IF NOT EXISTS area_nombre_cache text;


-- ── 3. Índice para consultas por área ────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ranking_cache_area_posicion
  ON public.ranking_cache (apuesta_id, area_id, posicion_en_area)
  WHERE es_grupal = false;


-- ── 4. refrescar_ranking(uuid) actualizado ────────────────────────
-- Después del INSERT individual habitual, si la apuesta es 'libre',
-- actualiza posicion_en_area y area_nombre_cache desde la VIEW.

DROP FUNCTION IF EXISTS public.refrescar_ranking(uuid);

CREATE OR REPLACE FUNCTION public.refrescar_ranking(p_apuesta_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tipo   text;
  v_estado text;
BEGIN
  SELECT tipo, estado
  INTO   v_tipo, v_estado
  FROM   public.apuestas
  WHERE  id = p_apuesta_id;

  IF v_tipo IS NULL THEN
    RAISE EXCEPTION 'Apuesta no encontrada: %', p_apuesta_id;
  END IF;

  IF v_estado NOT IN ('abierta', 'cerrada', 'finalizada') THEN
    RAISE EXCEPTION 'Estado de apuesta inválido (estado actual: %)', v_estado;
  END IF;

  -- Limpiar cache anterior para esta apuesta
  DELETE FROM public.ranking_cache
  WHERE apuesta_id = p_apuesta_id;

  -- ── Ranking individual (todos los tipos) ──────────────────────
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

  -- ── Posición por área (solo tipo='libre') ─────────────────────
  -- Actualiza posicion_en_area y area_nombre_cache en las filas
  -- ya insertadas para usuarios que tienen área asignada.
  IF v_tipo = 'libre' THEN
    UPDATE public.ranking_cache rc
    SET
      posicion_en_area  = v.posicion_en_area,
      area_id           = v.area_id,
      area_nombre_cache = v.area_nombre
    FROM public.ranking_apuestas_libre_por_area v
    WHERE rc.apuesta_id = p_apuesta_id
      AND rc.es_grupal  = false
      AND rc.user_id    = v.user_id
      AND v.apuesta_id  = p_apuesta_id;
  END IF;

  -- ── Ranking grupal (solo tipo='grupos') ──────────────────────
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


-- ── 5. VIEW: ranking_global_libre_por_area ───────────────────────
-- Acumulado de puntos por área a través de TODAS las apuestas
-- tipo 'libre' cerradas/finalizadas.

CREATE OR REPLACE VIEW public.ranking_global_libre_por_area AS
SELECT
  u.area_id,
  ar.nombre                                             AS area_nombre,
  COALESCE(SUM(p.puntos), 0)::bigint                    AS puntos_totales,
  COUNT(DISTINCT p.user_id)                             AS miembros_participantes,
  COUNT(*)                                              AS predicciones,
  RANK() OVER (
    ORDER BY COALESCE(SUM(p.puntos), 0)::bigint DESC,
             COUNT(DISTINCT p.user_id) DESC             -- desempate
  )                                                     AS posicion
FROM public.predicciones p
JOIN public.usuarios  u  ON u.id  = p.user_id
JOIN public.areas     ar ON ar.id = u.area_id
JOIN public.apuestas  a  ON a.id  = p.apuesta_id
WHERE a.tipo  = 'libre'
  AND a.estado IN ('cerrada', 'finalizada')
  AND p.puntos IS NOT NULL
  AND u.area_id IS NOT NULL
GROUP BY u.area_id, ar.nombre;


-- ── 6. TABLE: ranking_global_libre_areas_cache ───────────────────

CREATE TABLE IF NOT EXISTS public.ranking_global_libre_areas_cache (
  id                     uuid    DEFAULT gen_random_uuid() NOT NULL,
  area_id                uuid    NOT NULL,
  area_nombre            text,
  puntos_totales         bigint  DEFAULT 0,
  miembros_participantes bigint  DEFAULT 0,
  predicciones           bigint  DEFAULT 0,
  posicion               bigint,
  updated_at             timestamp with time zone DEFAULT now(),
  CONSTRAINT ranking_global_libre_areas_cache_pkey
    PRIMARY KEY (id),
  CONSTRAINT ranking_global_libre_areas_cache_area_id_fkey
    FOREIGN KEY (area_id) REFERENCES public.areas(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_rgl_areas_cache_area
  ON public.ranking_global_libre_areas_cache (area_id);

CREATE INDEX IF NOT EXISTS idx_rgl_areas_cache_posicion
  ON public.ranking_global_libre_areas_cache (posicion);


-- ── 7. FUNCTION: refrescar_ranking_global_libre_areas() ──────────

CREATE OR REPLACE FUNCTION public.refrescar_ranking_global_libre_areas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  TRUNCATE public.ranking_global_libre_areas_cache;
  INSERT INTO public.ranking_global_libre_areas_cache
    (area_id, area_nombre, puntos_totales, miembros_participantes,
     predicciones, posicion, updated_at)
  SELECT
    area_id, area_nombre, puntos_totales, miembros_participantes,
    predicciones, posicion, now()
  FROM public.ranking_global_libre_por_area;
END;
$$;


-- ── 8. Encadenar en refrescar_ranking_global() ───────────────────
-- Se reemplaza la función para añadir el nuevo paso.
-- El AppScript llama refrescar_ranking_global() al final de cada
-- ciclo y obtiene automáticamente el nuevo cálculo.

CREATE OR REPLACE FUNCTION public.refrescar_ranking_global()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ranking individual acumulado (existente, sin cambios)
  TRUNCATE public.ranking_global_cache;
  INSERT INTO public.ranking_global_cache
    (user_id, nombre, area_id, puntos_totales, predicciones, posicion, updated_at)
  SELECT
    user_id, nombre, area_id, puntos_totales, predicciones, posicion, now()
  FROM public.ranking_global;

  -- Ranking por área acumulado — apuestas tipo 'grupos' (existente)
  PERFORM public.refrescar_ranking_global_areas();

  -- Ranking por área acumulado — apuestas tipo 'libre' (NUEVO)
  PERFORM public.refrescar_ranking_global_libre_areas();
END;
$$;


-- ── 9. RLS + GRANTs ──────────────────────────────────────────────

ALTER TABLE public.ranking_global_libre_areas_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rglac_select ON public.ranking_global_libre_areas_cache;
CREATE POLICY rglac_select
  ON public.ranking_global_libre_areas_cache
  FOR SELECT
  TO authenticated
  USING (public.usuario_activo() OR public.es_admin());

GRANT SELECT ON public.ranking_global_libre_areas_cache TO authenticated;

-- service_role puede llamar refrescar_ranking_global_libre_areas
GRANT EXECUTE ON FUNCTION public.refrescar_ranking_global_libre_areas() TO service_role;


-- ── 10. Populate inicial ─────────────────────────────────────────
-- Si no hay apuestas libres cerradas/finalizadas aún, la tabla
-- quedará vacía; se poblará en el próximo ciclo del AppScript.

SELECT public.refrescar_ranking_global_libre_areas();

NOTIFY pgrst, 'reload schema';
