create or replace function public.refrescar_ranking(
  p_apuesta_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tipo text;
  v_estado text;
begin
  select tipo, estado
  into v_tipo, v_estado
  from public.apuestas
  where id = p_apuesta_id;

  if v_tipo is null then
    raise exception 'Apuesta no encontrada: %', p_apuesta_id;
  end if;

  -- Para refrescar ranking NO se valida fecha_cierre.
  -- Una apuesta cerrada por fecha debe poder recalcular ranking.
  if v_estado <> 'abierta' then
    raise exception 'La apuesta no está abierta (estado actual: %)', v_estado;
  end if;

  delete from public.ranking_cache
  where apuesta_id = p_apuesta_id;

  -- Individual
  insert into public.ranking_cache (
    apuesta_id, user_id, nombre, puntos_totales,
    aciertos_exactos, aciertos_diferencia,
    aciertos_clasificado, aciertos_resultado,
    predicciones, posicion, es_grupal
  )
  select
    apuesta_id, user_id, nombre, puntos_totales,
    aciertos_exactos, aciertos_diferencia,
    aciertos_clasificado, aciertos_resultado,
    predicciones, posicion, false
  from public.ranking_apuestas
  where apuesta_id = p_apuesta_id;

  -- Grupal
  if v_tipo = 'grupos' then
    insert into public.ranking_cache (
      apuesta_id, area_id, nombre, puntos_totales,
      aciertos_exactos, aciertos_diferencia,
      aciertos_clasificado, aciertos_resultado,
      predicciones, miembros_participantes, posicion, es_grupal
    )
    select
      apuesta_id, area_id, area_nombre, puntos_totales,
      aciertos_exactos, aciertos_diferencia,
      aciertos_clasificado, aciertos_resultado,
      predicciones, miembros_participantes, posicion, true
    from public.ranking_apuestas_grupales
    where apuesta_id = p_apuesta_id;
  end if;
end;
$$;

grant execute on function public.refrescar_ranking(uuid) to service_role;

notify pgrst, 'reload schema';