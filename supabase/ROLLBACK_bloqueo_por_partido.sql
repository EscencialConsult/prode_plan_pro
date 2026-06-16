-- ============================================================================
-- ROLLBACK: bloqueo de predicciones por partido individual
-- ============================================================================
-- Restaura las 3 capas de validacion del backend EXACTAMENTE como estaban
-- ANTES de implementar el bloqueo por partido (modelo: cierre global por
-- apuestas.fecha_cierre).
--
-- Estas definiciones son copia 1:1 de public_schema.sql (rama Branch-Ospa,
-- commit c0475d2). Ejecutar TODO el script en el SQL Editor de Supabase para
-- volver al comportamiento original.
--
-- Capas restauradas:
--   1. FUNCTION guardar_predicciones_apuesta(uuid, jsonb, uuid)
--   2. FUNCTION validar_prediccion_integridad() (trigger BEFORE INSERT/UPDATE)
--   3. POLICY  predicciones_insert
--   4. POLICY  predicciones_update
-- ============================================================================

BEGIN;

-- ─── 1. RPC principal de guardado ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.guardar_predicciones_apuesta(p_apuesta_id uuid, p_predicciones jsonb, p_area_id uuid DEFAULT NULL::uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$DECLARE
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
END;$$;


-- ─── 2. Trigger de integridad ──────────────────────────────────────────────
-- NOTA: copia 1:1 de la version VIVA en produccion (capturada con
-- pg_get_functiondef el 2026-06-16). Difiere del dump public_schema.sql:
-- incluye el guard inicial que permite los UPDATE internos de scoring.
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
  -- Ej: UPDATE predicciones SET puntos = ... (cuando entra un resultado,
  -- aunque la apuesta ya esté cerrada). No cambia nada que cargó el usuario.
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
  select * into v_apuesta from public.apuestas where id = new.apuesta_id;
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
  select * into v_usuario from public.usuarios where id = new.user_id;
  if v_usuario is null or v_usuario.estado <> 'activo' then
    raise exception 'Usuario no activo';
  end if;

  -- D: partido pertenece a la apuesta
  if not exists (
    select 1 from public.apuesta_partidos
    where apuesta_id = new.apuesta_id and partido_id = new.partido_id
  ) then
    raise exception 'El partido % no pertenece a la apuesta %', new.partido_id, new.apuesta_id;
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
  select fase into v_fase from public.partidos where id = new.partido_id;
  if public.es_fase_eliminatoria(v_fase) and new.pred_local = new.pred_visitante then
    if new.pred_clasificado is null then
      raise exception 'Falta el clasificado por penales en partido %', new.partido_id;
    end if;
    if not exists (
      select 1 from public.partidos
      where id = new.partido_id
        and (local = new.pred_clasificado or visitante = new.pred_clasificado)
    ) then
      raise exception 'Clasificado inválido "%". Debe ser uno de los dos equipos del partido %',
        new.pred_clasificado, new.partido_id;
    end if;
  end if;

  return new;
end;
$function$;


-- ─── 3. RLS: politica de INSERT ────────────────────────────────────────────
DROP POLICY IF EXISTS predicciones_insert ON public.predicciones;
CREATE POLICY predicciones_insert ON public.predicciones FOR INSERT WITH CHECK (((user_id = auth.uid()) AND public.usuario_activo() AND (EXISTS ( SELECT 1
   FROM public.apuestas a
  WHERE ((a.id = predicciones.apuesta_id) AND (a.estado = 'abierta'::text) AND (a.fecha_cierre > now())))) AND ((EXISTS ( SELECT 1
   FROM public.apuestas a
  WHERE ((a.id = predicciones.apuesta_id) AND (a.tipo = 'libre'::text)))) OR ((public.mi_area_id() IS NOT NULL) AND (NOT public.plan_basic()) AND (area_id = public.mi_area_id()) AND (EXISTS ( SELECT 1
   FROM public.apuestas a
  WHERE ((a.id = predicciones.apuesta_id) AND (a.tipo = 'grupos'::text))))))));


-- ─── 4. RLS: politica de UPDATE ────────────────────────────────────────────
DROP POLICY IF EXISTS predicciones_update ON public.predicciones;
CREATE POLICY predicciones_update ON public.predicciones FOR UPDATE USING (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.apuestas a
  WHERE ((a.id = predicciones.apuesta_id) AND (a.estado = 'abierta'::text) AND (a.fecha_cierre > now()))))));


-- ─── 5. Restaurar fecha_cierre original de las apuestas abiertas ────────────
-- Valores capturados de produccion el 2026-06-16 (query F) ANTES de la migracion.
UPDATE public.apuestas SET fecha_cierre = '2026-06-13 18:00:00+00'
  WHERE id = 'a6058c9e-7bde-473c-b3b2-b3f43ee3640e';  -- 1ª Fecha · Grupos
UPDATE public.apuestas SET fecha_cierre = '2026-06-18 15:00:00+00'
  WHERE id = '9ff5cfc5-ea0f-4db7-8810-bfb369537f27';  -- 2ª Fecha · Grupos
UPDATE public.apuestas SET fecha_cierre = '2026-06-24 18:00:00+00'
  WHERE id = '9157254f-947f-4bb3-9c40-ccea3a246d68';  -- 3ª Fecha · Grupos


-- ─── 6. Eliminar el helper de bloqueo por partido ──────────────────────────
DROP FUNCTION IF EXISTS public.partido_bloqueado(text);

COMMIT;
