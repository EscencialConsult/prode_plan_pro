--
-- PostgreSQL database dump
--

\restrict 3b9SJp2fDxogb3nyMfFEkSdFXt0h8MR01I6slcVVK56qddPYI7RFnRNiDjnh8Mg

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: _check_update_usuario_self(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._check_update_usuario_self() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  select true;
$$;


--
-- Name: actualizar_mi_perfil(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.actualizar_mi_perfil(p_nombre text DEFAULT NULL::text, p_empresa text DEFAULT NULL::text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Sesión inválida';
  end if;
  if not usuario_activo() then
    raise exception 'Tu cuenta no está activa';
  end if;

  update usuarios set
    nombre  = coalesce(nullif(trim(p_nombre), ''), nombre),
    empresa = coalesce(p_empresa, empresa)
  where id = v_user_id;

  return json_build_object('ok', true, 'message', 'Perfil actualizado');
end;
$$;


--
-- Name: actualizar_total_participantes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.actualizar_total_participantes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  v_apuesta_id uuid;
  v_tipo text;
  v_count int;
begin
  v_apuesta_id := coalesce(new.apuesta_id, old.apuesta_id);
  select tipo into v_tipo from apuestas where id = v_apuesta_id;

  if v_tipo = 'grupos' then
    select count(distinct area_id) into v_count
    from predicciones where apuesta_id = v_apuesta_id and area_id is not null;
  else
    select count(distinct user_id) into v_count
    from predicciones where apuesta_id = v_apuesta_id;
  end if;

  update apuestas set total_participantes = v_count where id = v_apuesta_id;
  return null;
end;
$$;


--
-- Name: aprobar_usuario(uuid, text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.aprobar_usuario(p_user_id uuid, p_tipo_usuario text DEFAULT 'general'::text, p_area_id uuid DEFAULT NULL::uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_user usuarios;
  v_area areas;
  v_admin_plan_basic boolean;
begin
  if not es_admin() then
    raise exception 'Solo el admin puede aprobar usuarios';
  end if;

  select * into v_user from usuarios where id = p_user_id;
  if v_user is null then raise exception 'Usuario no encontrado'; end if;
  if v_user.estado <> 'pendiente' then
    raise exception 'El usuario no está en estado pendiente';
  end if;

  v_admin_plan_basic := plan_basic();

  -- En plan_basic forzamos rol general sin área
  if v_admin_plan_basic then
    update usuarios set
      estado = 'activo',
      tipo_usuario = 'general',
      area_id = null
    where id = p_user_id;
  else
    -- plan_pro: aceptamos área (opcional), tipo_usuario SIEMPRE 'general'
    if p_area_id is not null then
      select * into v_area from areas where id = p_area_id;
      if v_area is null then raise exception 'El área asignada no existe'; end if;
    end if;

    update usuarios set
      estado = 'activo',
      tipo_usuario = 'general',  -- forzado, ignora p_tipo_usuario
      area_id = p_area_id
    where id = p_user_id;
  end if;

  insert into auditoria (user_id, accion, detalle)
  values (auth.uid(), 'APROBACION',
    format('Usuario %s aprobado en área %s', p_user_id, coalesce(p_area_id::text, 'sin área')));

  return json_build_object('ok', true, 'message', 'Usuario aprobado');
end;
$$;


--
-- Name: calc_puntos_al_predecir(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calc_puntos_al_predecir() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  v_partido partidos;
  v_apuesta apuestas;
begin
  select * into v_partido from partidos where id = new.partido_id;
  select * into v_apuesta from apuestas where id = new.apuesta_id;

  if v_partido.estado = 'finalizado'
     and v_partido.goles_local is not null
     and v_partido.goles_visitante is not null then
    new.puntos := calcular_puntos_prediccion(
      v_partido, v_apuesta,
      new.pred_local, new.pred_visitante, new.pred_clasificado
    );
  else
    new.puntos := null;
  end if;
  return new;
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: apuestas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.apuestas (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    titulo text NOT NULL,
    descripcion text DEFAULT ''::text,
    tipo text NOT NULL,
    premio text NOT NULL,
    fecha_cierre timestamp with time zone NOT NULL,
    estado text DEFAULT 'abierta'::text NOT NULL,
    puntos_exacto integer DEFAULT 5,
    puntos_diferencia integer DEFAULT 3,
    puntos_resultado integer DEFAULT 1,
    puntos_clasificado integer DEFAULT 1,
    creado_por uuid,
    fecha_creacion timestamp with time zone DEFAULT now(),
    total_participantes integer DEFAULT 0,
    CONSTRAINT apuestas_estado_check CHECK ((estado = ANY (ARRAY['abierta'::text, 'cerrada'::text, 'finalizada'::text]))),
    CONSTRAINT apuestas_tipo_check CHECK ((tipo = ANY (ARRAY['libre'::text, 'grupos'::text])))
);


--
-- Name: partidos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partidos (
    id text NOT NULL,
    fase text NOT NULL,
    grupo text,
    jornada integer,
    fecha_hora timestamp with time zone NOT NULL,
    sede text,
    local text,
    visitante text,
    goles_local integer,
    goles_visitante integer,
    penales_local integer,
    penales_visit integer,
    estado text DEFAULT 'programado'::text NOT NULL,
    estado_raw text,
    event_id text,
    CONSTRAINT partidos_estado_check CHECK ((estado = ANY (ARRAY['programado'::text, 'en_vivo'::text, 'finalizado'::text, 'cancelado'::text])))
);


--
-- Name: calcular_puntos_prediccion(public.partidos, public.apuestas, integer, integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calcular_puntos_prediccion(p_partido public.partidos, p_apuesta public.apuestas, p_pred_local integer, p_pred_visit integer, p_pred_clasif text) RETURNS integer
    LANGUAGE plpgsql STABLE
    AS $$
declare
  v_es_elim        boolean := es_fase_eliminatoria(p_partido.fase);
  v_dif_real       int;
  v_dif_pred       int;
  v_empate_pred    boolean;
  v_acierto_exacto boolean;
  v_acierto_clasif boolean;
  v_dif_correcta   boolean;
  v_clasif_real    text;
begin
  if p_pred_local is null or p_pred_visit is null then return 0; end if;
  if p_partido.goles_local is null or p_partido.goles_visitante is null then return 0; end if;

  v_dif_real       := p_partido.goles_local - p_partido.goles_visitante;
  v_dif_pred       := p_pred_local - p_pred_visit;
  v_empate_pred    := (p_pred_local = p_pred_visit);
  v_acierto_exacto := (p_pred_local = p_partido.goles_local
                       and p_pred_visit = p_partido.goles_visitante);

  if v_es_elim then
    -- ─── ELIMINATORIA ───────────────────────────────────────────
    v_clasif_real := obtener_clasificado_real(p_partido);
    if v_clasif_real is null then
      return null;  -- empate sin penales → postergar
    end if;

    v_acierto_clasif := (trim(coalesce(p_pred_clasif, '')) = trim(v_clasif_real));
    -- "diferencia correcta" SOLO si NO se predijo empate y la diferencia es no-cero
    v_dif_correcta := (not v_empate_pred)
                       and (v_dif_pred = v_dif_real)
                       and (v_dif_real <> 0);

    if v_acierto_exacto and v_acierto_clasif     then return p_apuesta.puntos_exacto;      end if;
    if v_acierto_exacto and not v_acierto_clasif then return p_apuesta.puntos_diferencia;  end if;
    if v_dif_correcta  and v_acierto_clasif      then return p_apuesta.puntos_diferencia;  end if;
    if v_acierto_clasif                          then return p_apuesta.puntos_clasificado; end if;
    return 0;
  end if;

  -- ─── FASE DE GRUPOS ─────────────────────────────────────────────
  if v_acierto_exacto then return p_apuesta.puntos_exacto; end if;
  if v_dif_pred = v_dif_real then return p_apuesta.puntos_diferencia; end if;
  if (v_dif_pred > 0 and v_dif_real > 0)
     or (v_dif_pred < 0 and v_dif_real < 0) then
    return p_apuesta.puntos_resultado;
  end if;
  return 0;
end;
$$;


--
-- Name: crear_primer_admin(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.crear_primer_admin(p_email text) RETURNS json
    LANGUAGE plpgsql
    AS $$
declare
  v_user_id uuid;
  v_existe_admin boolean;
begin
  select exists(select 1 from usuarios where rol = 'admin' and estado = 'activo')
    into v_existe_admin;

  if v_existe_admin then
    raise exception 'Ya existe un admin activo. Usá la función promover_a_admin desde un admin existente.';
  end if;

  select id into v_user_id from usuarios where lower(email) = lower(p_email);

  if v_user_id is null then
    raise exception 'No existe un usuario registrado con el email %. Registrá la cuenta primero desde Authentication > Users.', p_email;
  end if;

  update usuarios
    set rol = 'admin',
        estado = 'activo'
    where id = v_user_id;

  return json_build_object(
    'ok', true,
    'message', 'Usuario ' || p_email || ' promovido a admin',
    'user_id', v_user_id
  );
end;
$$;


--
-- Name: es_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.es_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select coalesce(
    (select rol = 'admin'
     from usuarios
     where id = auth.uid()
     limit 1),
    false
  );
$$;


--
-- Name: es_fase_eliminatoria(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.es_fase_eliminatoria(p_fase text) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $$
  select coalesce(lower(trim(p_fase)) <> 'grupos', false);
$$;


--
-- Name: es_jefe(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.es_jefe() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select coalesce(
    (select tipo_usuario = 'jefe'
     from usuarios
     where id = auth.uid()
     limit 1),
    false
  );
$$;


--
-- Name: finalizar_apuesta(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.finalizar_apuesta(p_apuesta_id uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_apuesta apuestas;
  v_pendientes int;
begin
  if not es_admin() then
    raise exception 'Solo el admin puede finalizar apuestas';
  end if;

  select * into v_apuesta from apuestas where id = p_apuesta_id;
  if v_apuesta is null then
    raise exception 'Apuesta no encontrada';
  end if;
  if v_apuesta.estado = 'finalizada' then
    raise exception 'La apuesta ya está finalizada';
  end if;

  -- Verificar que todos los partidos de la apuesta estén finalizados
  -- y, si son eliminatorios empatados, tengan penales cargados
  select count(*) into v_pendientes
  from apuesta_partidos ap
  join partidos p on p.id = ap.partido_id
  where ap.apuesta_id = p_apuesta_id
    and (
      p.estado <> 'finalizado'
      or p.goles_local is null
      or p.goles_visitante is null
      or (es_fase_eliminatoria(p.fase)
          and p.goles_local = p.goles_visitante
          and (p.penales_local is null or p.penales_visit is null))
    );

  if v_pendientes > 0 then
    raise exception 'Hay % partidos sin finalizar correctamente', v_pendientes;
  end if;

  update apuestas set estado = 'finalizada' where id = p_apuesta_id;

  insert into auditoria (user_id, accion, detalle)
  values (auth.uid(), 'FINALIZAR_APUESTA', 'Apuesta finalizada: ' || p_apuesta_id::text);

  return json_build_object('ok', true, 'message', 'Apuesta finalizada');
end;
$$;


--
-- Name: finalizar_apuestas_listas(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.finalizar_apuestas_listas() RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_apuesta apuestas;
  v_pendientes int;
  v_finalizadas int := 0;
  v_no_listas int := 0;
  v_resumen jsonb := '[]'::jsonb;
begin
  if not es_admin() then
    raise exception 'Solo el admin puede finalizar apuestas en lote';
  end if;

  for v_apuesta in
    select * from apuestas where estado = 'cerrada'
  loop
    select count(*) into v_pendientes
    from apuesta_partidos ap
    join partidos p on p.id = ap.partido_id
    where ap.apuesta_id = v_apuesta.id
      and (
        p.estado <> 'finalizado'
        or p.goles_local is null
        or p.goles_visitante is null
        or (es_fase_eliminatoria(p.fase)
            and p.goles_local = p.goles_visitante
            and (p.penales_local is null or p.penales_visit is null))
      );

    if v_pendientes = 0 then
      update apuestas set estado = 'finalizada' where id = v_apuesta.id;
      v_finalizadas := v_finalizadas + 1;
      v_resumen := v_resumen || jsonb_build_object(
        'id', v_apuesta.id,
        'titulo', v_apuesta.titulo,
        'estado', 'finalizada'
      );
    else
      v_no_listas := v_no_listas + 1;
      v_resumen := v_resumen || jsonb_build_object(
        'id', v_apuesta.id,
        'titulo', v_apuesta.titulo,
        'estado', 'pendiente',
        'partidos_pendientes', v_pendientes
      );
    end if;
  end loop;

  if v_finalizadas > 0 then
    insert into auditoria (user_id, accion, detalle)
    values (auth.uid(), 'FINALIZAR_LISTAS',
      format('%s apuestas finalizadas en lote', v_finalizadas));
  end if;

  return json_build_object(
    'ok', true,
    'finalizadas', v_finalizadas,
    'no_listas', v_no_listas,
    'resumen', v_resumen
  );
end;
$$;


--
-- Name: guardar_predicciones_apuesta(uuid, jsonb, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.guardar_predicciones_apuesta(p_apuesta_id uuid, p_predicciones jsonb, p_area_id uuid DEFAULT NULL::uuid) RETURNS json
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


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_plan text;
begin
  -- Leer el plan global de la empresa (default = plan_basic si no está configurado)
  select coalesce(valor, 'plan_basic') into v_plan
  from public.config
  where clave = 'plan_empresa';

  if v_plan is null then v_plan := 'plan_basic'; end if;

  insert into public.usuarios (id, email, nombre, empresa, estado, rol, tipo_usuario)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    v_plan,           -- ahora se asigna según el config de la empresa
    'pendiente',
    'usuario',
    'general'
  );
  return new;
end;
$$;


--
-- Name: mi_area_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mi_area_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select area_id
  from usuarios
  where id = auth.uid()
  limit 1;
$$;


--
-- Name: obtener_clasificado_real(public.partidos); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.obtener_clasificado_real(p_partido public.partidos) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
begin
  if p_partido.goles_local is null or p_partido.goles_visitante is null then
    return null;
  end if;
  if p_partido.goles_local > p_partido.goles_visitante then
    return p_partido.local;
  elsif p_partido.goles_visitante > p_partido.goles_local then
    return p_partido.visitante;
  end if;
  -- Empate en 90' → desempate por penales
  if p_partido.penales_local is null or p_partido.penales_visit is null then
    return null;
  end if;
  if p_partido.penales_local > p_partido.penales_visit then
    return p_partido.local;
  else
    return p_partido.visitante;
  end if;
end;
$$;


--
-- Name: partidos_bloqueados(text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.partidos_bloqueados(p_partido_ids text[] DEFAULT NULL::text[]) RETURNS TABLE(partido_id text, apuesta_id uuid, apuesta_titulo text, apuesta_tipo text, apuesta_estado text, apuesta_fecha_cierre timestamp with time zone)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select
    ap.partido_id,
    a.id        as apuesta_id,
    a.titulo    as apuesta_titulo,
    a.tipo      as apuesta_tipo,
    a.estado    as apuesta_estado,
    a.fecha_cierre as apuesta_fecha_cierre
  from public.apuesta_partidos ap
  join public.apuestas a on a.id = ap.apuesta_id
  where a.estado in ('abierta', 'cerrada')   -- "activa" = no finalizada
    and (p_partido_ids is null
         or ap.partido_id = any(p_partido_ids));
$$;


--
-- Name: plan_basic(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.plan_basic() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select coalesce(
    (select empresa = 'plan_basic'
     from usuarios
     where id = auth.uid()
     limit 1),
    true
  );
$$;


--
-- Name: recalcular_puntos_partido(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.recalcular_puntos_partido() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  -- Si dejó de estar finalizado, limpiar puntos de todas las predicciones
  if new.estado <> 'finalizado'
     and old.estado = 'finalizado' then
    update predicciones
    set puntos = null
    where partido_id = new.id;
    return new;
  end if;

  -- Si está finalizado pero sin marcador, no calcular
  if new.estado <> 'finalizado'
     or new.goles_local is null
     or new.goles_visitante is null then
    return new;
  end if;

  -- Eliminatoria empatada sin penales: no se puede puntuar todavía
  if es_fase_eliminatoria(new.fase)
     and new.goles_local = new.goles_visitante
     and (new.penales_local is null or new.penales_visit is null) then
    return new;
  end if;

  -- Recalcular puntos para todas las predicciones de este partido
  update predicciones p
  set puntos = calcular_puntos_prediccion(
    new, a, p.pred_local, p.pred_visitante, p.pred_clasificado
  )
  from apuestas a
  where p.partido_id = new.id
    and p.apuesta_id = a.id;

  return new;
end;
$$;


--
-- Name: refrescar_ranking(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refrescar_ranking(p_apuesta_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_tipo text;
BEGIN
  SELECT tipo INTO v_tipo FROM apuestas WHERE id = p_apuesta_id;

  DELETE FROM ranking_cache WHERE apuesta_id = p_apuesta_id;

  -- Individual (siempre)
  INSERT INTO ranking_cache (
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
  FROM ranking_apuestas
  WHERE apuesta_id = p_apuesta_id;

  -- Grupal (solo si aplica)
  IF v_tipo = 'grupos' THEN
    INSERT INTO ranking_cache (
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
    FROM ranking_apuestas_grupales
    WHERE apuesta_id = p_apuesta_id;
  END IF;
END;
$$;


--
-- Name: usuario_activo(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.usuario_activo() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select coalesce(
    (select estado = 'activo'
     from usuarios
     where id = auth.uid()
     limit 1),
    false
  );
$$;


--
-- Name: validar_partidos_exclusivos(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validar_partidos_exclusivos() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_conflict record;
begin
  -- Buscar si el partido ya está en otra apuesta activa
  select a.id, a.titulo, a.tipo, a.estado
    into v_conflict
  from public.apuesta_partidos ap
  join public.apuestas a on a.id = ap.apuesta_id
  where ap.partido_id = new.partido_id
    and ap.apuesta_id <> new.apuesta_id       -- distinta apuesta
    and a.estado in ('abierta', 'cerrada')    -- y está activa
  limit 1;

  if found then
    raise exception 'El partido % ya está en uso en la apuesta "%" (tipo: %, estado: %). No se puede usar el mismo partido en dos apuestas activas al mismo tiempo. Esperá a que la apuesta anterior se finalice o elegí otro partido.',
      new.partido_id,
      v_conflict.titulo,
      v_conflict.tipo,
      v_conflict.estado
    using errcode = 'P0001';
  end if;

  return new;
end;
$$;


--
-- Name: validar_prediccion_integridad(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validar_prediccion_integridad() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_apuesta apuestas;
  v_usuario usuarios;
  v_fase    text;
BEGIN
  -- A + B: apuesta abierta y vigente
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

  RETURN NEW;
END;
$$;


--
-- Name: apuesta_areas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.apuesta_areas (
    apuesta_id uuid NOT NULL,
    area_id uuid NOT NULL
);


--
-- Name: apuesta_partidos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.apuesta_partidos (
    apuesta_id uuid NOT NULL,
    partido_id text NOT NULL
);


--
-- Name: areas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.areas (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    nombre text NOT NULL,
    descripcion text DEFAULT ''::text,
    activa boolean DEFAULT true,
    fecha_creacion timestamp with time zone DEFAULT now()
);


--
-- Name: auditoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auditoria (
    id bigint NOT NULL,
    fecha timestamp with time zone DEFAULT now(),
    user_id uuid,
    accion text NOT NULL,
    detalle text,
    ip text
);


--
-- Name: auditoria_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.auditoria_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: auditoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.auditoria_id_seq OWNED BY public.auditoria.id;


--
-- Name: config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config (
    clave text NOT NULL,
    valor text
);


--
-- Name: selecciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.selecciones (
    codigo text NOT NULL,
    nombre text NOT NULL,
    bandera_url text,
    grupo text,
    j integer DEFAULT 0,
    g integer DEFAULT 0,
    e integer DEFAULT 0,
    p integer DEFAULT 0,
    gf integer DEFAULT 0,
    gc integer DEFAULT 0,
    dif integer DEFAULT 0,
    pts integer DEFAULT 0,
    pos integer DEFAULT 0
);


--
-- Name: grupos; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.grupos AS
 SELECT grupo AS letra,
    codigo,
    nombre,
    bandera_url,
    j,
    g,
    e,
    p,
    gf,
    gc,
    dif,
    pts,
    pos
   FROM public.selecciones
  WHERE ((grupo IS NOT NULL) AND (grupo <> ''::text) AND (codigo <> 'TBD'::text))
  ORDER BY grupo, pos;


--
-- Name: predicciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.predicciones (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    apuesta_id uuid NOT NULL,
    user_id uuid NOT NULL,
    partido_id text NOT NULL,
    pred_local integer NOT NULL,
    pred_visitante integer NOT NULL,
    pred_clasificado text,
    puntos integer,
    area_id uuid,
    fecha_registro timestamp with time zone DEFAULT now(),
    CONSTRAINT predicciones_pred_local_check CHECK ((pred_local >= 0)),
    CONSTRAINT predicciones_pred_visitante_check CHECK ((pred_visitante >= 0))
);


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id uuid NOT NULL,
    nombre text NOT NULL,
    email text NOT NULL,
    rol text DEFAULT 'usuario'::text NOT NULL,
    estado text DEFAULT 'pendiente'::text NOT NULL,
    tipo_usuario text DEFAULT 'general'::text,
    area_id uuid,
    empresa text DEFAULT 'plan_basic'::text,
    fecha_registro timestamp with time zone DEFAULT now(),
    CONSTRAINT usuarios_estado_check CHECK ((estado = ANY (ARRAY['pendiente'::text, 'activo'::text, 'bloqueado'::text]))),
    CONSTRAINT usuarios_rol_check CHECK ((rol = ANY (ARRAY['admin'::text, 'usuario'::text]))),
    CONSTRAINT usuarios_tipo_usuario_check CHECK ((tipo_usuario = ANY (ARRAY['general'::text, 'jefe'::text])))
);


--
-- Name: ranking_apuestas; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.ranking_apuestas AS
 SELECT p.apuesta_id,
    p.user_id,
    u.nombre,
    u.area_id,
    COALESCE(sum(p.puntos), (0)::bigint) AS puntos_totales,
    count(*) FILTER (WHERE (p.puntos = a.puntos_exacto)) AS aciertos_exactos,
    count(*) FILTER (WHERE (p.puntos = a.puntos_diferencia)) AS aciertos_diferencia,
    count(*) FILTER (WHERE ((p.puntos = a.puntos_clasificado) AND (p.puntos <> a.puntos_resultado))) AS aciertos_clasificado,
    count(*) FILTER (WHERE (p.puntos = a.puntos_resultado)) AS aciertos_resultado,
    count(*) AS predicciones,
    rank() OVER (PARTITION BY p.apuesta_id ORDER BY COALESCE(sum(p.puntos), (0)::bigint) DESC) AS posicion
   FROM ((public.predicciones p
     JOIN public.usuarios u ON ((u.id = p.user_id)))
     JOIN public.apuestas a ON ((a.id = p.apuesta_id)))
  GROUP BY p.apuesta_id, p.user_id, u.nombre, u.area_id, a.puntos_exacto, a.puntos_diferencia, a.puntos_clasificado, a.puntos_resultado;


--
-- Name: ranking_apuestas_grupales; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.ranking_apuestas_grupales AS
 WITH apuestas_grupales AS (
         SELECT apuestas.id,
            apuestas.puntos_exacto,
            apuestas.puntos_diferencia,
            apuestas.puntos_clasificado,
            apuestas.puntos_resultado
           FROM public.apuestas
          WHERE (apuestas.tipo = 'grupos'::text)
        ), combinaciones AS (
         SELECT a.id AS apuesta_id,
            a.puntos_exacto,
            a.puntos_diferencia,
            a.puntos_clasificado,
            a.puntos_resultado,
            ar.id AS area_id,
            ar.nombre AS area_nombre
           FROM (apuestas_grupales a
             CROSS JOIN public.areas ar)
          WHERE (ar.activa = true)
        ), predicciones_agregadas AS (
         SELECT c.apuesta_id,
            c.area_id,
            c.area_nombre,
            COALESCE(count(DISTINCT p.user_id), (0)::bigint) AS miembros_participantes,
            COALESCE(sum(p.puntos), (0)::bigint) AS puntos_totales,
            COALESCE(count(p.id) FILTER (WHERE (p.puntos = c.puntos_exacto)), (0)::bigint) AS aciertos_exactos,
            COALESCE(count(p.id) FILTER (WHERE (p.puntos = c.puntos_diferencia)), (0)::bigint) AS aciertos_diferencia,
            COALESCE(count(p.id) FILTER (WHERE ((p.puntos = c.puntos_clasificado) AND (p.puntos <> c.puntos_resultado))), (0)::bigint) AS aciertos_clasificado,
            COALESCE(count(p.id) FILTER (WHERE (p.puntos = c.puntos_resultado)), (0)::bigint) AS aciertos_resultado,
            COALESCE(count(p.id), (0)::bigint) AS predicciones
           FROM (combinaciones c
             LEFT JOIN public.predicciones p ON (((p.apuesta_id = c.apuesta_id) AND (p.area_id = c.area_id))))
          GROUP BY c.apuesta_id, c.area_id, c.area_nombre, c.puntos_exacto, c.puntos_diferencia, c.puntos_clasificado, c.puntos_resultado
        )
 SELECT apuesta_id,
    area_id,
    area_nombre,
    miembros_participantes,
    puntos_totales,
    aciertos_exactos,
    aciertos_diferencia,
    aciertos_clasificado,
    aciertos_resultado,
    predicciones,
    rank() OVER (PARTITION BY apuesta_id ORDER BY puntos_totales DESC, miembros_participantes DESC) AS posicion
   FROM predicciones_agregadas;


--
-- Name: ranking_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ranking_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    apuesta_id uuid NOT NULL,
    user_id uuid,
    area_id uuid,
    nombre text,
    puntos_totales bigint DEFAULT 0,
    aciertos_exactos bigint DEFAULT 0,
    aciertos_diferencia bigint DEFAULT 0,
    aciertos_clasificado bigint DEFAULT 0,
    aciertos_resultado bigint DEFAULT 0,
    predicciones bigint DEFAULT 0,
    miembros_participantes bigint,
    posicion bigint,
    es_grupal boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: auditoria id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria ALTER COLUMN id SET DEFAULT nextval('public.auditoria_id_seq'::regclass);


--
-- Name: apuesta_areas apuesta_areas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apuesta_areas
    ADD CONSTRAINT apuesta_areas_pkey PRIMARY KEY (apuesta_id, area_id);


--
-- Name: apuesta_partidos apuesta_partidos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apuesta_partidos
    ADD CONSTRAINT apuesta_partidos_pkey PRIMARY KEY (apuesta_id, partido_id);


--
-- Name: apuestas apuestas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apuestas
    ADD CONSTRAINT apuestas_pkey PRIMARY KEY (id);


--
-- Name: areas areas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_pkey PRIMARY KEY (id);


--
-- Name: auditoria auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_pkey PRIMARY KEY (id);


--
-- Name: config config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config
    ADD CONSTRAINT config_pkey PRIMARY KEY (clave);


--
-- Name: partidos partidos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partidos
    ADD CONSTRAINT partidos_pkey PRIMARY KEY (id);


--
-- Name: predicciones predicciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.predicciones
    ADD CONSTRAINT predicciones_pkey PRIMARY KEY (id);


--
-- Name: ranking_cache ranking_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ranking_cache
    ADD CONSTRAINT ranking_cache_pkey PRIMARY KEY (id);


--
-- Name: selecciones selecciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selecciones
    ADD CONSTRAINT selecciones_pkey PRIMARY KEY (codigo);


--
-- Name: predicciones uq_prediccion_usuario; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.predicciones
    ADD CONSTRAINT uq_prediccion_usuario UNIQUE (apuesta_id, user_id, partido_id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: idx_apuesta_partidos_partido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_apuesta_partidos_partido ON public.apuesta_partidos USING btree (partido_id);


--
-- Name: idx_apuestas_estado_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_apuestas_estado_fecha ON public.apuestas USING btree (estado, fecha_cierre);


--
-- Name: idx_audit_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_fecha ON public.auditoria USING btree (fecha DESC);


--
-- Name: idx_audit_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_user ON public.auditoria USING btree (user_id);


--
-- Name: idx_partidos_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partidos_estado ON public.partidos USING btree (estado);


--
-- Name: idx_partidos_fase; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partidos_fase ON public.partidos USING btree (fase);


--
-- Name: idx_partidos_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partidos_fecha ON public.partidos USING btree (fecha_hora);


--
-- Name: idx_pred_apuesta; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pred_apuesta ON public.predicciones USING btree (apuesta_id);


--
-- Name: idx_pred_apuesta_area; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pred_apuesta_area ON public.predicciones USING btree (apuesta_id, area_id);


--
-- Name: idx_pred_apuesta_partido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pred_apuesta_partido ON public.predicciones USING btree (apuesta_id, partido_id);


--
-- Name: idx_pred_apuesta_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pred_apuesta_user ON public.predicciones USING btree (apuesta_id, user_id);


--
-- Name: idx_pred_area; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pred_area ON public.predicciones USING btree (area_id);


--
-- Name: idx_pred_partido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pred_partido ON public.predicciones USING btree (partido_id);


--
-- Name: idx_pred_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pred_user ON public.predicciones USING btree (user_id);


--
-- Name: idx_ranking_cache_apuesta; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ranking_cache_apuesta ON public.ranking_cache USING btree (apuesta_id, es_grupal, posicion);


--
-- Name: idx_un_jefe_por_area; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_un_jefe_por_area ON public.usuarios USING btree (area_id) WHERE (tipo_usuario = 'jefe'::text);


--
-- Name: idx_usuarios_area; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_area ON public.usuarios USING btree (area_id);


--
-- Name: idx_usuarios_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_email ON public.usuarios USING btree (email);


--
-- Name: idx_usuarios_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_estado ON public.usuarios USING btree (estado);


--
-- Name: uq_ranking_cache_grupal; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_ranking_cache_grupal ON public.ranking_cache USING btree (apuesta_id, area_id) WHERE (es_grupal = true);


--
-- Name: uq_ranking_cache_individual; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_ranking_cache_individual ON public.ranking_cache USING btree (apuesta_id, user_id) WHERE (es_grupal = false);


--
-- Name: predicciones trg_calc_puntos_al_predecir; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_calc_puntos_al_predecir BEFORE INSERT OR UPDATE OF pred_local, pred_visitante, pred_clasificado ON public.predicciones FOR EACH ROW EXECUTE FUNCTION public.calc_puntos_al_predecir();


--
-- Name: apuesta_partidos trg_partido_exclusivo; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_partido_exclusivo BEFORE INSERT ON public.apuesta_partidos FOR EACH ROW EXECUTE FUNCTION public.validar_partidos_exclusivos();


--
-- Name: partidos trg_recalcular_puntos_partido; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_recalcular_puntos_partido AFTER UPDATE OF estado, goles_local, goles_visitante, penales_local, penales_visit ON public.partidos FOR EACH ROW EXECUTE FUNCTION public.recalcular_puntos_partido();


--
-- Name: predicciones trg_total_participantes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_total_participantes AFTER INSERT OR DELETE ON public.predicciones FOR EACH ROW EXECUTE FUNCTION public.actualizar_total_participantes();


--
-- Name: predicciones trg_validar_prediccion; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validar_prediccion BEFORE INSERT OR UPDATE ON public.predicciones FOR EACH ROW EXECUTE FUNCTION public.validar_prediccion_integridad();


--
-- Name: apuesta_areas apuesta_areas_apuesta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apuesta_areas
    ADD CONSTRAINT apuesta_areas_apuesta_id_fkey FOREIGN KEY (apuesta_id) REFERENCES public.apuestas(id) ON DELETE CASCADE;


--
-- Name: apuesta_areas apuesta_areas_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apuesta_areas
    ADD CONSTRAINT apuesta_areas_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id) ON DELETE CASCADE;


--
-- Name: apuesta_partidos apuesta_partidos_apuesta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apuesta_partidos
    ADD CONSTRAINT apuesta_partidos_apuesta_id_fkey FOREIGN KEY (apuesta_id) REFERENCES public.apuestas(id) ON DELETE CASCADE;


--
-- Name: apuesta_partidos apuesta_partidos_partido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apuesta_partidos
    ADD CONSTRAINT apuesta_partidos_partido_id_fkey FOREIGN KEY (partido_id) REFERENCES public.partidos(id) ON DELETE CASCADE;


--
-- Name: apuestas apuestas_creado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apuestas
    ADD CONSTRAINT apuestas_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuarios(id);


--
-- Name: partidos partidos_local_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partidos
    ADD CONSTRAINT partidos_local_fkey FOREIGN KEY (local) REFERENCES public.selecciones(codigo);


--
-- Name: partidos partidos_visitante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partidos
    ADD CONSTRAINT partidos_visitante_fkey FOREIGN KEY (visitante) REFERENCES public.selecciones(codigo);


--
-- Name: predicciones predicciones_apuesta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.predicciones
    ADD CONSTRAINT predicciones_apuesta_id_fkey FOREIGN KEY (apuesta_id) REFERENCES public.apuestas(id) ON DELETE CASCADE;


--
-- Name: predicciones predicciones_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.predicciones
    ADD CONSTRAINT predicciones_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);


--
-- Name: predicciones predicciones_partido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.predicciones
    ADD CONSTRAINT predicciones_partido_id_fkey FOREIGN KEY (partido_id) REFERENCES public.partidos(id) ON DELETE CASCADE;


--
-- Name: predicciones predicciones_pred_clasificado_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.predicciones
    ADD CONSTRAINT predicciones_pred_clasificado_fkey FOREIGN KEY (pred_clasificado) REFERENCES public.selecciones(codigo);


--
-- Name: predicciones predicciones_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.predicciones
    ADD CONSTRAINT predicciones_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: ranking_cache ranking_cache_apuesta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ranking_cache
    ADD CONSTRAINT ranking_cache_apuesta_id_fkey FOREIGN KEY (apuesta_id) REFERENCES public.apuestas(id) ON DELETE CASCADE;


--
-- Name: ranking_cache ranking_cache_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ranking_cache
    ADD CONSTRAINT ranking_cache_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id) ON DELETE CASCADE;


--
-- Name: ranking_cache ranking_cache_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ranking_cache
    ADD CONSTRAINT ranking_cache_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: usuarios usuarios_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id) ON DELETE SET NULL;


--
-- Name: usuarios usuarios_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: partidos allow_insert_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_insert_all ON public.partidos FOR INSERT WITH CHECK (true);


--
-- Name: selecciones allow_insert_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_insert_all ON public.selecciones FOR INSERT WITH CHECK (true);


--
-- Name: apuesta_areas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.apuesta_areas ENABLE ROW LEVEL SECURITY;

--
-- Name: apuesta_areas apuesta_areas_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY apuesta_areas_admin_all ON public.apuesta_areas TO authenticated USING (public.es_admin()) WITH CHECK (public.es_admin());


--
-- Name: apuesta_areas apuesta_areas_select_authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY apuesta_areas_select_authenticated ON public.apuesta_areas FOR SELECT TO authenticated USING (true);


--
-- Name: apuesta_partidos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.apuesta_partidos ENABLE ROW LEVEL SECURITY;

--
-- Name: apuesta_partidos apuesta_partidos_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY apuesta_partidos_admin_all ON public.apuesta_partidos TO authenticated USING (public.es_admin()) WITH CHECK (public.es_admin());


--
-- Name: apuesta_partidos apuesta_partidos_select_authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY apuesta_partidos_select_authenticated ON public.apuesta_partidos FOR SELECT TO authenticated USING (true);


--
-- Name: apuestas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.apuestas ENABLE ROW LEVEL SECURITY;

--
-- Name: apuestas apuestas_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY apuestas_admin_all ON public.apuestas USING (public.es_admin()) WITH CHECK (public.es_admin());


--
-- Name: apuestas apuestas_select_simple; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY apuestas_select_simple ON public.apuestas FOR SELECT TO authenticated USING ((public.usuario_activo() OR public.es_admin()));


--
-- Name: areas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

--
-- Name: areas areas_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY areas_admin_all ON public.areas USING (public.es_admin()) WITH CHECK (public.es_admin());


--
-- Name: areas areas_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY areas_select_all ON public.areas FOR SELECT USING (public.usuario_activo());


--
-- Name: auditoria; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

--
-- Name: auditoria auditoria_admin_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY auditoria_admin_select ON public.auditoria FOR SELECT USING (public.es_admin());


--
-- Name: auditoria auditoria_insert_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY auditoria_insert_self ON public.auditoria FOR INSERT WITH CHECK (((user_id = auth.uid()) OR public.es_admin()));


--
-- Name: config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;

--
-- Name: config config_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY config_admin_all ON public.config USING (public.es_admin()) WITH CHECK (public.es_admin());


--
-- Name: config config_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY config_select_all ON public.config FOR SELECT USING (public.usuario_activo());


--
-- Name: partidos insert_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY insert_all ON public.partidos USING (true) WITH CHECK (true);


--
-- Name: selecciones insert_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY insert_all ON public.selecciones USING (true) WITH CHECK (true);


--
-- Name: partidos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.partidos ENABLE ROW LEVEL SECURITY;

--
-- Name: partidos partidos_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY partidos_admin_all ON public.partidos USING (public.es_admin()) WITH CHECK (public.es_admin());


--
-- Name: partidos partidos_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY partidos_select_all ON public.partidos FOR SELECT USING (public.usuario_activo());


--
-- Name: predicciones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.predicciones ENABLE ROW LEVEL SECURITY;

--
-- Name: predicciones predicciones_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY predicciones_admin_all ON public.predicciones USING (public.es_admin()) WITH CHECK (public.es_admin());


--
-- Name: predicciones predicciones_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY predicciones_insert ON public.predicciones FOR INSERT WITH CHECK (((user_id = auth.uid()) AND public.usuario_activo() AND (EXISTS ( SELECT 1
   FROM public.apuestas a
  WHERE ((a.id = predicciones.apuesta_id) AND (a.estado = 'abierta'::text) AND (a.fecha_cierre > now())))) AND ((EXISTS ( SELECT 1
   FROM public.apuestas a
  WHERE ((a.id = predicciones.apuesta_id) AND (a.tipo = 'libre'::text)))) OR ((public.mi_area_id() IS NOT NULL) AND (NOT public.plan_basic()) AND (area_id = public.mi_area_id()) AND (EXISTS ( SELECT 1
   FROM public.apuestas a
  WHERE ((a.id = predicciones.apuesta_id) AND (a.tipo = 'grupos'::text))))))));


--
-- Name: predicciones predicciones_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY predicciones_select ON public.predicciones FOR SELECT USING (((user_id = auth.uid()) OR ((area_id IS NOT NULL) AND (area_id = public.mi_area_id())) OR public.es_admin()));


--
-- Name: predicciones predicciones_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY predicciones_update ON public.predicciones FOR UPDATE USING (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.apuestas a
  WHERE ((a.id = predicciones.apuesta_id) AND (a.estado = 'abierta'::text) AND (a.fecha_cierre > now()))))));


--
-- Name: ranking_cache; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ranking_cache ENABLE ROW LEVEL SECURITY;

--
-- Name: ranking_cache ranking_cache_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ranking_cache_admin_all ON public.ranking_cache TO authenticated USING (public.es_admin()) WITH CHECK (public.es_admin());


--
-- Name: ranking_cache ranking_cache_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ranking_cache_select ON public.ranking_cache FOR SELECT TO authenticated USING ((public.usuario_activo() OR public.es_admin()));


--
-- Name: selecciones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.selecciones ENABLE ROW LEVEL SECURITY;

--
-- Name: selecciones selecciones_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY selecciones_admin_all ON public.selecciones USING (public.es_admin()) WITH CHECK (public.es_admin());


--
-- Name: selecciones selecciones_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY selecciones_select_all ON public.selecciones FOR SELECT USING (public.usuario_activo());


--
-- Name: usuarios; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

--
-- Name: usuarios usuarios_select_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY usuarios_select_self ON public.usuarios FOR SELECT USING (((id = auth.uid()) OR public.es_admin() OR ((area_id IS NOT NULL) AND (area_id = public.mi_area_id()) AND public.usuario_activo())));


--
-- Name: usuarios usuarios_update_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY usuarios_update_admin ON public.usuarios FOR UPDATE USING (public.es_admin()) WITH CHECK (public.es_admin());

-- =====================================================
-- GRANTS PARA SUPABASE AUTHENTICATED
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;

-- usuarios
GRANT SELECT, INSERT, UPDATE ON public.usuarios TO authenticated;

-- tablas que leen usuarios autenticados
GRANT SELECT ON public.apuestas TO authenticated;
GRANT SELECT ON public.partidos TO authenticated;
GRANT SELECT ON public.selecciones TO authenticated;
GRANT SELECT ON public.areas TO authenticated;
GRANT SELECT ON public.apuesta_partidos TO authenticated;
GRANT SELECT ON public.apuesta_areas TO authenticated;
GRANT SELECT ON public.ranking_cache TO authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE public.selecciones TO service_role;

GRANT SELECT, INSERT, UPDATE ON TABLE public.partidos TO service_role;

-- predicciones
GRANT SELECT, INSERT, UPDATE ON public.predicciones TO authenticated;

-- auditoría (si la usas desde frontend)
GRANT INSERT ON public.auditoria TO authenticated;

-- config (si la consulta el frontend)
GRANT SELECT ON public.config TO authenticated;

GRANT INSERT ON public.apuestas TO authenticated;

GRANT INSERT ON public.apuesta_partidos TO authenticated;

GRANT SELECT, UPDATE ON public.predicciones TO service_role;

GRANT ALL PRIVILEGES ON public.apuestas TO service_role;


DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

--
-- PostgreSQL database dump complete
--

\unrestrict 3b9SJp2fDxogb3nyMfFEkSdFXt0h8MR01I6slcVVK56qddPYI7RFnRNiDjnh8Mg

