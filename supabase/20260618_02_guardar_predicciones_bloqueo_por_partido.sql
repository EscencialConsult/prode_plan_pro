-- =====================================================
-- MIGRACIÓN: bloqueo de predicciones por PARTIDO individual
-- Fecha: 2026-06-18
--
-- Cambio sobre guardar_predicciones_apuesta():
--   Dentro del loop, antes del UPSERT, se omite (CONTINUE) cualquier
--   partido ya cerrado:
--     - estado en_vivo / finalizado / cancelado, o
--     - fecha_hora <= now()  (ya inició) — comparación por instante UTC.
--
--   Los partidos cerrados NO se insertan ni se sobrescriben: la
--   predicción ya guardada del usuario queda intacta. Cero borrados.
--   Los partidos abiertos se guardan normalmente.
--
-- El chequeo global de apuesta (estado='abierta' + fecha_cierre>now)
-- se mantiene como backstop: con el modelo nuevo fecha_cierre = inicio
-- del último partido, así que solo dispara cuando ya arrancó el último.
--
-- SECURITY DEFINER (owner postgres) → bypassa RLS, por eso esta función
-- es la barrera real del guardado por lote (predicciones.guardarBatch).
-- =====================================================

CREATE OR REPLACE FUNCTION public.guardar_predicciones_apuesta(p_apuesta_id uuid, p_predicciones jsonb, p_area_id uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_apuesta apuestas;
  v_usuario usuarios;
  v_pred jsonb;
  v_count_enviados int;
  v_count_validos int;
  v_count_guardados int := 0;
  v_count_saltados int := 0;
  v_pl int;
  v_pv int;
  v_clasif text;
  v_partido_id text;
  v_partido_estado text;
  v_partido_fecha timestamptz;
BEGIN
  -- 1. VALIDAR PAYLOAD
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  IF p_predicciones IS NULL
     OR jsonb_typeof(p_predicciones) <> 'array'
     OR jsonb_array_length(p_predicciones) = 0 THEN
    RAISE EXCEPTION 'No se enviaron predicciones válidas';
  END IF;

  v_count_enviados := jsonb_array_length(p_predicciones);

  SELECT * INTO v_usuario FROM usuarios WHERE id = v_user_id;
  IF v_usuario IS NULL OR v_usuario.estado <> 'activo' THEN
    RAISE EXCEPTION 'Usuario no activo';
  END IF;

  -- 3. VALIDAR APUESTA (abierta hasta el inicio del último partido)
  SELECT * INTO v_apuesta FROM apuestas WHERE id = p_apuesta_id;
  IF v_apuesta IS NULL THEN
    RAISE EXCEPTION 'Apuesta no encontrada';
  END IF;
  IF v_apuesta.estado <> 'abierta' THEN
    RAISE EXCEPTION 'La apuesta no está abierta';
  END IF;
  IF v_apuesta.fecha_cierre <= now() THEN
    RAISE EXCEPTION 'La apuesta ya cerró';
  END IF;

  -- 5. VALIDAR PARTIDOS: todos pertenecen a la apuesta
  SELECT count(*) INTO v_count_validos
  FROM jsonb_array_elements(p_predicciones) AS elem
  JOIN apuesta_partidos ap
    ON ap.partido_id = elem->>'partido_id'
   AND ap.apuesta_id = p_apuesta_id;

  IF v_count_validos <> v_count_enviados THEN
    RAISE EXCEPTION 'Uno o más partidos no pertenecen a esta apuesta';
  END IF;

  FOR v_pred IN SELECT * FROM jsonb_array_elements(p_predicciones)
  LOOP
    v_partido_id := v_pred->>'partido_id';
    v_pl := (v_pred->>'pred_local')::int;
    v_pv := (v_pred->>'pred_visitante')::int;
    v_clasif := NULLIF(TRIM(v_pred->>'pred_clasificado'), '');

    -- Goles >= 0
    IF v_pl < 0 OR v_pv < 0 THEN
      RAISE EXCEPTION 'Goles negativos en partido %', v_partido_id;
    END IF;

    -- ═══ BLOQUEO POR PARTIDO ═══
    -- Cerrado si ya inició (fecha_hora <= now) o estado en_vivo/finalizado/cancelado.
    -- Se SALTA: no inserta ni sobrescribe la predicción ya guardada. NO borra nada.
    SELECT estado, fecha_hora INTO v_partido_estado, v_partido_fecha
    FROM partidos WHERE id = v_partido_id;

    IF v_partido_estado IN ('en_vivo','finalizado','cancelado')
       OR v_partido_fecha <= now() THEN
      v_count_saltados := v_count_saltados + 1;
      CONTINUE;
    END IF;

    -- 7. UPSERT (solo partidos abiertos)
    INSERT INTO predicciones (
      apuesta_id, user_id, partido_id,
      pred_local, pred_visitante, pred_clasificado, area_id
    ) VALUES (
      p_apuesta_id, v_user_id, v_partido_id,
      v_pl, v_pv, v_clasif,
      CASE WHEN v_apuesta.tipo = 'grupos' THEN p_area_id ELSE NULL END
    )
    ON CONFLICT (apuesta_id, user_id, partido_id)
    DO UPDATE SET
      pred_local = EXCLUDED.pred_local,
      pred_visitante = EXCLUDED.pred_visitante,
      pred_clasificado = EXCLUDED.pred_clasificado,
      area_id = EXCLUDED.area_id;

    v_count_guardados := v_count_guardados + 1;
  END LOOP;

  -- 8. RECALCULAR PARTICIPANTES (una sola vez)
  UPDATE apuestas SET total_participantes = (
    CASE WHEN v_apuesta.tipo = 'grupos'
      THEN (SELECT count(DISTINCT area_id)
            FROM predicciones
            WHERE apuesta_id = p_apuesta_id AND area_id IS NOT NULL)
      ELSE (SELECT count(DISTINCT user_id)
            FROM predicciones
            WHERE apuesta_id = p_apuesta_id)
    END
  ) WHERE id = p_apuesta_id;

  RETURN json_build_object(
    'ok', true,
    'message', 'Predicciones guardadas',
    'total', v_count_enviados,
    'guardados', v_count_guardados,
    'saltados', v_count_saltados
  );
END;
$function$;
