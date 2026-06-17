-- ============================================================
-- BLOQUEO DE PREDICCIONES POR PARTIDO INDIVIDUAL
-- Ejecutar UNA SOLA VEZ en el SQL Editor de Supabase.
-- ============================================================
--
-- Objetivo
-- --------
-- Hasta ahora una apuesta se cerraba solo con su fecha_cierre global.
-- Este cambio agrega, ADEMÁS, un cierre por partido: cada partido deja de
-- aceptar predicciones cuando
--   1. su estado es en_vivo / finalizado / cancelado, o
--   2. su hora de inicio (partidos.fecha_hora) ya pasó.
--
-- La comparación se hace contra now() (timestamptz, instante UTC absoluto),
-- por lo que es correcta sin importar la zona horaria del cliente.
--
-- Modelo de fecha_cierre
-- ----------------------
-- fecha_cierre = hora del ÚLTIMO partido seleccionado en esa apuesta.
-- Así la apuesta queda "abierta" mientras sus partidos se cierran de a uno;
-- cuando arranca el último, la apuesta entera ya quedó cerrada.
--
-- Por qué la guarda `v_cambio_prediccion`
-- ---------------------------------------
-- El trigger trg_validar_prediccion corre BEFORE INSERT OR UPDATE sobre
-- `predicciones`. El cálculo de puntos (recalcular_puntos_partido) hace
-- `UPDATE predicciones SET puntos = ...` DESPUÉS de que el partido terminó
-- (es decir, cuando fecha_cierre y la hora del partido YA pasaron).
--
-- Esa operación es del SISTEMA (scoring), no del usuario, y debe pasar
-- SIEMPRE. Por eso, si la operación no cambia los valores predichos
-- (pred_local / pred_visitante / pred_clasificado), el trigger retorna de
-- inmediato sin validar nada. Todas las validaciones —cierre global, cierre
-- por partido, usuario activo, área, clasificado— se aplican únicamente
-- cuando un usuario realmente carga o edita su predicción.
-- ============================================================

CREATE OR REPLACE FUNCTION public.validar_prediccion_integridad() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_apuesta apuestas;
  v_usuario usuarios;
  v_partido partidos;
  v_cambio_prediccion boolean;
BEGIN
  -- ¿El usuario está cambiando los VALORES de la predicción?
  -- En INSERT siempre; en UPDATE solo si cambian los campos predichos.
  v_cambio_prediccion := (TG_OP = 'INSERT')
    OR (NEW.pred_local       IS DISTINCT FROM OLD.pred_local)
    OR (NEW.pred_visitante   IS DISTINCT FROM OLD.pred_visitante)
    OR (NEW.pred_clasificado IS DISTINCT FROM OLD.pred_clasificado);

  -- Operación del sistema (p. ej. recálculo de `puntos`): no se valida nada.
  -- Debe pasar siempre, incluso con el partido finalizado y fecha_cierre vencida.
  IF NOT v_cambio_prediccion THEN
    RETURN NEW;
  END IF;

  -- ── A partir de acá: el usuario carga/edita una predicción ──

  -- A + B: apuesta abierta y vigente (cierre global = último partido)
  SELECT * INTO v_apuesta FROM apuestas WHERE id = NEW.apuesta_id;
  IF v_apuesta IS NULL THEN
    RAISE EXCEPTION 'Apuesta no encontrada';
  END IF;
  IF v_apuesta.estado <> 'abierta' THEN
    RAISE EXCEPTION 'La apuesta no está abierta (estado actual: %)', v_apuesta.estado;
  END IF;
  IF v_apuesta.fecha_cierre <= now() THEN
    RAISE EXCEPTION 'La apuesta ya cerró (fecha_cierre: %)', v_apuesta.fecha_cierre;
  END IF;

  -- C: usuario activo
  SELECT * INTO v_usuario FROM usuarios WHERE id = NEW.user_id;
  IF v_usuario IS NULL OR v_usuario.estado <> 'activo' THEN
    RAISE EXCEPTION 'Usuario no activo';
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

  -- Cargar el partido (se reutiliza para el bloqueo por inicio y para la fase)
  SELECT * INTO v_partido FROM partidos WHERE id = NEW.partido_id;

  -- B2 (NUEVO): bloqueo por partido individual.
  IF v_partido.estado IN ('en_vivo', 'finalizado', 'cancelado') THEN
    RAISE EXCEPTION 'El partido % ya no admite predicciones (estado: %)',
      NEW.partido_id, v_partido.estado;
  END IF;
  IF v_partido.fecha_hora <= now() THEN
    RAISE EXCEPTION 'El partido % ya comenzó (inicio: %)',
      NEW.partido_id, v_partido.fecha_hora;
  END IF;

  -- E: área consistente según tipo de apuesta
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

  -- F: pred_clasificado válido en eliminatorias empatadas
  IF es_fase_eliminatoria(v_partido.fase) AND NEW.pred_local = NEW.pred_visitante THEN
    IF NEW.pred_clasificado IS NULL THEN
      RAISE EXCEPTION 'Falta el clasificado por penales en partido %', NEW.partido_id;
    END IF;
    IF v_partido.local <> NEW.pred_clasificado
       AND v_partido.visitante <> NEW.pred_clasificado THEN
      RAISE EXCEPTION 'Clasificado inválido "%". Debe ser uno de los dos equipos del partido %',
        NEW.pred_clasificado, NEW.partido_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
