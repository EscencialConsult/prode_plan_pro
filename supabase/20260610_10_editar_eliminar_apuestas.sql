-- ════════════════════════════════════════════════════════════════
-- 20260610_10_editar_eliminar_apuestas.sql
-- ----------------------------------------------------------------
-- Agrega dos RPCs:
--   - editar_apuesta:    actualiza campos informativos (titulo,
--                        descripcion, premio, fecha_cierre).
--                        Permite editar partidos SOLO si la apuesta
--                        no tiene predicciones cargadas.
--   - eliminar_apuesta:  borra una apuesta y todas sus dependencias.
--                        Solo permitido en estado 'abierta'.
--
-- No afecta otras funcionalidades: las apuestas finalizadas o cerradas
-- no pueden eliminarse, y las que ya tienen predicciones conservan
-- intactos sus partidos asociados.
-- ════════════════════════════════════════════════════════════════

-- ── editar_apuesta ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.editar_apuesta(
  p_apuesta_id    uuid,
  p_titulo        text        DEFAULT NULL,
  p_descripcion   text        DEFAULT NULL,
  p_premio        text        DEFAULT NULL,
  p_fecha_cierre  timestamptz DEFAULT NULL,
  p_partidos_ids  text[]      DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_n_predicc int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM apuestas WHERE id = p_apuesta_id) THEN
    RAISE EXCEPTION 'Apuesta no encontrada';
  END IF;

  -- Campos informativos: siempre editables.
  UPDATE apuestas SET
    titulo       = COALESCE(p_titulo,       titulo),
    descripcion  = COALESCE(p_descripcion,  descripcion),
    premio       = COALESCE(p_premio,       premio),
    fecha_cierre = COALESCE(p_fecha_cierre, fecha_cierre)
  WHERE id = p_apuesta_id;

  -- Partidos: solo si vino la lista Y la apuesta no tiene predicciones.
  IF p_partidos_ids IS NOT NULL THEN
    SELECT count(*) INTO v_n_predicc
      FROM predicciones WHERE apuesta_id = p_apuesta_id;

    IF v_n_predicc > 0 THEN
      RAISE EXCEPTION 'No se pueden modificar los partidos: ya hay % predicciones cargadas', v_n_predicc;
    END IF;

    IF array_length(p_partidos_ids, 1) IS NULL THEN
      RAISE EXCEPTION 'La apuesta debe tener al menos un partido';
    END IF;

    DELETE FROM apuesta_partidos WHERE apuesta_id = p_apuesta_id;
    INSERT INTO apuesta_partidos (apuesta_id, partido_id)
    SELECT p_apuesta_id, unnest(p_partidos_ids);
  END IF;

  RETURN jsonb_build_object('ok', true, 'message', 'Apuesta editada correctamente');
END;
$$;

REVOKE ALL ON FUNCTION public.editar_apuesta(uuid, text, text, text, timestamptz, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.editar_apuesta(uuid, text, text, text, timestamptz, text[]) TO authenticated;


-- ── eliminar_apuesta ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.eliminar_apuesta(p_apuesta_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_estado text;
BEGIN
  SELECT estado INTO v_estado FROM apuestas WHERE id = p_apuesta_id;

  IF v_estado IS NULL THEN
    RAISE EXCEPTION 'Apuesta no encontrada';
  END IF;

  IF v_estado <> 'abierta' THEN
    RAISE EXCEPTION 'Solo se pueden eliminar apuestas en estado abierta';
  END IF;

  DELETE FROM predicciones     WHERE apuesta_id = p_apuesta_id;
  DELETE FROM ranking_cache    WHERE apuesta_id = p_apuesta_id;
  DELETE FROM apuesta_partidos WHERE apuesta_id = p_apuesta_id;
  DELETE FROM apuesta_areas    WHERE apuesta_id = p_apuesta_id;
  DELETE FROM apuestas         WHERE id = p_apuesta_id;

  RETURN jsonb_build_object('ok', true, 'message', 'Apuesta eliminada correctamente');
END;
$$;

REVOKE ALL ON FUNCTION public.eliminar_apuesta(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.eliminar_apuesta(uuid) TO authenticated;
