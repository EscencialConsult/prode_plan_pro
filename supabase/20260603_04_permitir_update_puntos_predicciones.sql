create or replace function public.validar_prediccion_integridad()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_apuesta apuestas;
  v_usuario usuarios;
  v_fase text;
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
$$;

notify pgrst, 'reload schema';
