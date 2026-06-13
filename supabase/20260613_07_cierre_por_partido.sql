-- ============================================================================
-- 20260613_07_cierre_por_partido.sql
--
-- Objetivo: cerrar cada partido INDIVIDUALMENTE cuando arranca (su fecha_hora),
-- en lugar de cerrar toda la apuesta de golpe en una sola fecha global.
--
-- La fecha_cierre global de la apuesta pasa a ser la del ÚLTIMO partido
-- (se setea desde el frontend al crear la apuesta), por lo que la apuesta
-- sigue "abierta" hasta ese momento. El control fino, partido por partido,
-- se hace acá en el servidor con la columna partidos.fecha_hora.
--
-- Cambios (ADITIVOS, no se borra ni modifica ninguna tabla ni dato):
--   1) Trigger validar_prediccion_integridad: rechaza guardar/editar una
--      predicción si ESE partido ya comenzó. Cubre INSERT y UPDATE, tanto
--      vía la app como por acceso directo a la API (anti-trampa).
--   2) Función guardar_predicciones_apuesta: saltea los partidos ya iniciados
--      para no rechazar todo el lote (guarda los que todavía están abiertos).
--
-- Reversible: para volver atrás, ejecutar las definiciones originales de
-- public_schema.sql para estas dos funciones.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────
-- 1) TRIGGER: validar_prediccion_integridad
--    (idéntica a la versión EN PRODUCCIÓN + bloque "B2" marcado como NUEVO)
--    IMPORTANTE: se conserva el guard inicial que deja pasar las
--    actualizaciones internas de scoring/ranking (UPDATE de puntos), para
--    NO romper el recálculo de puntos de apuestas/partidos ya cerrados.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.validar_prediccion_integridad()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_apuesta apuestas;
  v_usuario usuarios;
  v_fase text;
  v_inicio timestamptz;   -- NUEVO
begin
  -- Permitir actualizaciones internas de scoring/ranking.
  -- Ej: UPDATE predicciones SET puntos = ...
  if tg_op = 'UPDATE'
     and old.apuesta_id is not distinct from new.apuesta_id
     and old.user_id is not distinct from new.user_id
     and old.partido_id is not distinct from new.partido_id
     and old.pred_local is not distinct from new.pred_local
     and old.pred_visitante is not distinct from new.pred_visitante
     and old.pred_clasificado is not distinct from new.pred_clasificado
     and old.area_id is not distinct from new.area_id
  then
    return new;
  end if;

  -- A + B: apuesta abierta y vigente
  select *
  into v_apuesta
  from public.apuestas
  where id = new.apuesta_id;

  if v_apuesta is null then
    raise exception 'Apuesta no encontrada';
  end if;

  if v_apuesta.estado <> 'abierta' then
    raise exception 'La apuesta no está abierta (estado actual: %)', v_apuesta.estado;
  end if;

  if v_apuesta.fecha_cierre <= now() then
    raise exception 'La apuesta ya cerró (fecha_cierre: %)', v_apuesta.fecha_cierre;
  end if;

  -- B2 (NUEVO): el partido específico todavía no empezó.
  -- Cada partido se cierra individualmente cuando arranca (su fecha_hora).
  -- Va DESPUÉS del guard de scoring, así el recálculo de puntos sigue pasando.
  select fecha_hora
  into v_inicio
  from public.partidos
  where id = new.partido_id;

  if v_inicio is not null and v_inicio <= now() then
    raise exception 'El partido % ya comenzó; no se puede pronosticar ni modificar', new.partido_id;
  end if;

  -- C: usuario activo
  select *
  into v_usuario
  from public.usuarios
  where id = new.user_id;

  if v_usuario is null or v_usuario.estado <> 'activo' then
    raise exception 'Usuario no activo';
  end if;

  -- D: partido pertenece a la apuesta
  if not exists (
    select 1
    from public.apuesta_partidos
    where apuesta_id = new.apuesta_id
      and partido_id = new.partido_id
  ) then
    raise exception 'El partido % no pertenece a la apuesta %',
      new.partido_id, new.apuesta_id;
  end if;

  -- E: área consistente según tipo de apuesta
  if v_apuesta.tipo = 'grupos' then
    if new.area_id is null or new.area_id <> v_usuario.area_id then
      raise exception 'Área inválida para apuesta grupal. Área del usuario: %, área en predicción: %',
        v_usuario.area_id, new.area_id;
    end if;
  else
    if new.area_id is not null then
      raise exception 'area_id debe ser NULL para apuestas de tipo libre';
    end if;
  end if;

  -- F: pred_clasificado válido en eliminatorias empatadas
  select fase
  into v_fase
  from public.partidos
  where id = new.partido_id;

  if public.es_fase_eliminatoria(v_fase)
     and new.pred_local = new.pred_visitante
  then
    if new.pred_clasificado is null then
      raise exception 'Falta el clasificado por penales en partido %', new.partido_id;
    end if;

    if not exists (
      select 1
      from public.partidos
      where id = new.partido_id
        and (
          local = new.pred_clasificado
          or visitante = new.pred_clasificado
        )
    ) then
      raise exception 'Clasificado inválido "%". Debe ser uno de los dos equipos del partido %',
        new.pred_clasificado, new.partido_id;
    end if;
  end if;

  return new;
end;
$function$;


-- ─────────────────────────────────────────────────────────────────────────
-- 2) RPC: guardar_predicciones_apuesta
--    (idéntica a la original + se saltean los partidos ya iniciados)
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.guardar_predicciones_apuesta(p_apuesta_id uuid, p_predicciones jsonb, p_area_id uuid DEFAULT NULL::uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_apuesta apuestas;
  v_usuario usuarios;
  v_pred jsonb;
  v_count_enviados int;
  v_count_validos int;
  v_count_duplicados int;
  v_count_guardados int := 0;   -- NUEVO
  v_pl int;
  v_pv int;
  v_clasif text;
  v_partido_id text;
  v_fase text;
  v_inicio timestamptz;         -- NUEVO
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
  IF v_apuesta.fecha_cierre <= now() THEN
    RAISE EXCEPTION 'La apuesta ya cerró';
  END IF;

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

    -- NUEVO: saltear los partidos que ya empezaron (se cierran individualmente).
    -- Así no se rechaza todo el lote: se guardan los partidos aún abiertos.
    SELECT fecha_hora INTO v_inicio FROM partidos WHERE id = v_partido_id;
    IF v_inicio IS NOT NULL AND v_inicio <= now() THEN
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

    v_count_guardados := v_count_guardados + 1;   -- NUEVO
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
    'total', v_count_guardados,                       -- NUEVO: guardados realmente
    'omitidos', v_count_enviados - v_count_guardados  -- NUEVO: partidos ya iniciados
  );
END;
$$;


-- Refrescar el cache de esquema de PostgREST
notify pgrst, 'reload schema';
