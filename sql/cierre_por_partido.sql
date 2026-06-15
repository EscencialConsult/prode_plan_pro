-- ============================================================================
-- PRODE — Cierre POR PARTIDO (en vez de cierre único por apuesta)
-- ============================================================================
-- Objetivo:
--   El usuario puede cargar/editar su pronóstico de cada partido HASTA que ese
--   partido inicia. Apenas un partido arranca, queda bloqueado individualmente,
--   pero los demás partidos del mismo grupo siguen abiertos.
--
--   Antes el cierre era único por apuesta (apuestas.fecha_cierre). Este script
--   reemplaza ese candado por uno a nivel de partido en las TRES capas que lo
--   validaban: el RPC de guardado, el trigger de integridad y las políticas RLS.
--
-- No modifica datos existentes (las apuestas creadas quedan igual). El campo
-- apuestas.fecha_cierre deja de usarse para bloquear; el bloqueo pasa a depender
-- de la hora de inicio de cada partido (partidos.fecha_hora) y su estado.
--
-- Idempotente: se puede correr más de una vez sin problema.
-- ============================================================================

-- ── 0. Función auxiliar: ¿el partido sigue abierto para pronosticar? ────────
--    Abierto = su hora de inicio aún no llegó y no está en vivo/finalizado/
--    cancelado. SECURITY DEFINER para poder leerse desde las políticas RLS.
CREATE OR REPLACE FUNCTION public.partido_abierto(p_partido_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM partidos
    WHERE id = p_partido_id
      AND fecha_hora > now()
      AND coalesce(estado, 'programado') NOT IN ('en_vivo', 'finalizado', 'cancelado')
  );
$$;


-- ── 1. RPC de guardado: quitar el cierre por apuesta y saltear partidos
--       que ya iniciaron (guarda los abiertos, omite los cerrados). ──────────
CREATE OR REPLACE FUNCTION public.guardar_predicciones_apuesta(
  p_apuesta_id uuid,
  p_predicciones jsonb,
  p_area_id uuid DEFAULT NULL::uuid
)
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
  v_pl int;
  v_pv int;
  v_clasif text;
  v_partido_id text;
BEGIN
  -- ═══ 1. VALIDAR PAYLOAD ═══
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

  -- ═══ 3. VALIDAR APUESTA ═══
  SELECT * INTO v_apuesta FROM apuestas WHERE id = p_apuesta_id;
  IF v_apuesta IS NULL THEN
    RAISE EXCEPTION 'Apuesta no encontrada';
  END IF;
  IF v_apuesta.estado <> 'abierta' THEN
    RAISE EXCEPTION 'La apuesta no está abierta';
  END IF;
  -- (Se eliminó el chequeo de fecha_cierre: el cierre ahora es por partido.)

  -- ═══ 5. VALIDAR PARTIDOS ═══
  -- Todos pertenecen a la apuesta
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

    -- ═══ CIERRE POR PARTIDO ═══
    -- Si el partido ya inició, se omite (no se falla todo el lote): así se
    -- guardan los partidos todavía abiertos del mismo grupo.
    IF NOT partido_abierto(v_partido_id) THEN
      CONTINUE;
    END IF;

    v_pl := (v_pred->>'pred_local')::int;
    v_pv := (v_pred->>'pred_visitante')::int;
    v_clasif := NULLIF(TRIM(v_pred->>'pred_clasificado'), '');

    -- Goles >= 0
    IF v_pl < 0 OR v_pv < 0 THEN
      RAISE EXCEPTION 'Goles negativos en partido %', v_partido_id;
    END IF;

    -- ═══ 7. UPSERT ═══
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

  -- ═══ 8. RECALCULAR PARTICIPANTES (una sola vez) ═══
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
    'total', v_count_guardados,
    'enviados', v_count_enviados,
    'omitidos', v_count_enviados - v_count_guardados
  );
END;
$function$;


-- ── 2. Trigger de integridad: cambiar el cierre por apuesta por cierre
--       por partido. (Es la validación más fuerte: corre en cada
--       insert/update, incluso desde el RPC SECURITY DEFINER.) ──────────────
CREATE OR REPLACE FUNCTION public.validar_prediccion_integridad()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_apuesta apuestas;
  v_usuario usuarios;
  v_fase    text;
BEGIN
  -- Obtener apuesta
  SELECT * INTO v_apuesta FROM apuestas WHERE id = NEW.apuesta_id;
  IF v_apuesta IS NULL THEN
    RAISE EXCEPTION 'Apuesta no encontrada';
  END IF;

  -- A + B: apuesta abierta y partido todavía no iniciado
  -- (solo en INSERT o si cambian los campos pred_*)
  IF TG_OP = 'INSERT' OR
     OLD.pred_local IS DISTINCT FROM NEW.pred_local OR
     OLD.pred_visitante IS DISTINCT FROM NEW.pred_visitante OR
     OLD.pred_clasificado IS DISTINCT FROM NEW.pred_clasificado THEN

    IF v_apuesta.estado <> 'abierta' THEN
      RAISE EXCEPTION 'La apuesta no está abierta (estado actual: %)', v_apuesta.estado;
    END IF;
    -- Cierre POR PARTIDO: el pronóstico solo se acepta si ESE partido no empezó.
    IF NOT partido_abierto(NEW.partido_id) THEN
      RAISE EXCEPTION 'El partido % ya comenzó: el pronóstico está cerrado', NEW.partido_id;
    END IF;

    -- C: usuario activo (solo validar al insertar o cambiar predicción)
    SELECT * INTO v_usuario FROM usuarios WHERE id = NEW.user_id;
    IF v_usuario IS NULL OR v_usuario.estado <> 'activo' THEN
      RAISE EXCEPTION 'Usuario no activo';
    END IF;
  END IF;

  -- D: partido pertenece a la apuesta
  IF NOT EXISTS (
    SELECT 1 FROM apuesta_partidos
    WHERE apuesta_id = NEW.apuesta_id
      AND partido_id = NEW.partido_id
  ) THEN
    RAISE EXCEPTION 'El partido % no pertenece a la apuesta %',
      NEW.partido_id, NEW.apuesta_id;
  END IF;

  -- E: área consistente según tipo de apuesta (solo si es INSERT o cambia area_id/user_id)
  IF TG_OP = 'INSERT' OR OLD.area_id IS DISTINCT FROM NEW.area_id OR OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    IF v_usuario IS NULL THEN
      SELECT * INTO v_usuario FROM usuarios WHERE id = NEW.user_id;
    END IF;
    IF v_apuesta.tipo = 'grupos' THEN
      IF NEW.area_id IS NULL OR NEW.area_id <> v_usuario.area_id THEN
        RAISE EXCEPTION 'Área inválida para apuesta grupal. Área del usuario: %, área en predicción: %',
          v_usuario.area_id, NEW.area_id;
      END IF;
    ELSE
      -- Apuesta libre: area_id debe ser NULL
      IF NEW.area_id IS NOT NULL THEN
        RAISE EXCEPTION 'area_id debe ser NULL para apuestas de tipo libre';
      END IF;
    END IF;
  END IF;

  -- F: pred_clasificado válido en eliminatorias empatadas (solo si cambia la predicción o partido)
  IF TG_OP = 'INSERT' OR
     OLD.pred_local IS DISTINCT FROM NEW.pred_local OR
     OLD.pred_visitante IS DISTINCT FROM NEW.pred_visitante OR
     OLD.pred_clasificado IS DISTINCT FROM NEW.pred_clasificado OR
     OLD.partido_id IS DISTINCT FROM NEW.partido_id THEN

    SELECT fase INTO v_fase FROM partidos WHERE id = NEW.partido_id;
    IF es_fase_eliminatoria(v_fase) AND NEW.pred_local = NEW.pred_visitante THEN
      IF NEW.pred_clasificado IS NULL THEN
        RAISE EXCEPTION 'Falta el clasificado por penales en partido %', NEW.partido_id;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM partidos
        WHERE id = NEW.partido_id
          AND (local = NEW.pred_clasificado OR visitante = NEW.pred_clasificado)
      ) THEN
        RAISE EXCEPTION 'Clasificado inválido "%". Debe ser uno de los dos equipos del partido %',
          NEW.pred_clasificado, NEW.partido_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;


-- ── 3. Políticas RLS: reemplazar el cierre por apuesta por cierre por
--       partido (mantienen el resto de la lógica de seguridad intacta). ──────

-- INSERT: el partido de la predicción debe estar abierto.
ALTER POLICY predicciones_insert ON public.predicciones
WITH CHECK (
  (user_id = auth.uid())
  AND usuario_activo()
  AND (EXISTS (
        SELECT 1 FROM apuestas a
        WHERE a.id = predicciones.apuesta_id
          AND a.estado = 'abierta'::text))
  AND partido_abierto(predicciones.partido_id)
  AND (
        (EXISTS (
          SELECT 1 FROM apuestas a
          WHERE a.id = predicciones.apuesta_id
            AND a.tipo = 'libre'::text))
        OR (
          (mi_area_id() IS NOT NULL)
          AND (NOT plan_basic())
          AND (area_id = mi_area_id())
          AND (EXISTS (
            SELECT 1 FROM apuestas a
            WHERE a.id = predicciones.apuesta_id
              AND a.tipo = 'grupos'::text)))
      )
);

-- UPDATE: idem, el partido debe seguir abierto para editar.
ALTER POLICY predicciones_update ON public.predicciones
USING (
  (user_id = auth.uid())
  AND (EXISTS (
        SELECT 1 FROM apuestas a
        WHERE a.id = predicciones.apuesta_id
          AND a.estado = 'abierta'::text))
  AND partido_abierto(predicciones.partido_id)
);

-- ============================================================================
-- FIN
-- ============================================================================
