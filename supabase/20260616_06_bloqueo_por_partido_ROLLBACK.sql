-- ============================================================
-- ROLLBACK de 20260616_06_bloqueo_por_partido.sql
-- ------------------------------------------------------------
-- Restaura las funciones y políticas EXACTAMENTE como estaban
-- antes del bloqueo por partido (validación solo por `fecha_cierre`
-- global de la apuesta).
--
-- Ejecutar este archivo completo en el SQL Editor de Supabase si
-- hace falta volver atrás.
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- 1) RPC: guardar_predicciones_apuesta (versión original)
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.guardar_predicciones_apuesta(p_apuesta_id uuid, p_predicciones jsonb, p_area_id uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$DECLARE
  v_user_id uuid := auth.uid();
  v_apuesta apuestas;
  v_usuario usuarios;
  v_pred jsonb;
  v_count_enviados int;
  v_count_validos int;
  v_count_duplicados int;
  v_pl int;
  v_pv int;
  v_clasif text;
  v_partido_id text;
  v_fase text;
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
    'total', v_count_enviados
  );
END;$function$;


-- ════════════════════════════════════════════════════════════
-- 2) TRIGGER: validar_prediccion_integridad (versión original)
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.validar_prediccion_integridad()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_apuesta apuestas;
  v_usuario usuarios;
  v_fase text;
begin
  -- Permitir actualizaciones internas de scoring/ranking.
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


-- ════════════════════════════════════════════════════════════
-- 3) RLS: predicciones_insert (versión original)
-- ════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS predicciones_insert ON public.predicciones;
CREATE POLICY predicciones_insert ON public.predicciones
  FOR INSERT
  WITH CHECK (
    ((user_id = auth.uid()) AND usuario_activo() AND (EXISTS ( SELECT 1
       FROM apuestas a
      WHERE ((a.id = predicciones.apuesta_id) AND (a.estado = 'abierta'::text) AND (a.fecha_cierre > now())))) AND ((EXISTS ( SELECT 1
       FROM apuestas a
      WHERE ((a.id = predicciones.apuesta_id) AND (a.tipo = 'libre'::text)))) OR ((mi_area_id() IS NOT NULL) AND (NOT plan_basic()) AND (area_id = mi_area_id()) AND (EXISTS ( SELECT 1
       FROM apuestas a
      WHERE ((a.id = predicciones.apuesta_id) AND (a.tipo = 'grupos'::text)))))))
  );


-- ════════════════════════════════════════════════════════════
-- 4) RLS: predicciones_update (versión original)
-- ════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS predicciones_update ON public.predicciones;
CREATE POLICY predicciones_update ON public.predicciones
  FOR UPDATE
  USING (
    ((user_id = auth.uid()) AND (EXISTS ( SELECT 1
       FROM apuestas a
      WHERE ((a.id = predicciones.apuesta_id) AND (a.estado = 'abierta'::text) AND (a.fecha_cierre > now())))))
  );
