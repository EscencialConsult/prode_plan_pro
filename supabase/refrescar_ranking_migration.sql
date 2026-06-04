-- =====================================================
-- MIGRACIÓN: RPC para refrescar rankings desde AppScript
-- =====================================================

create or replace function public.refrescar_rankings_por_partidos(
  p_partido_ids text[] default null,
  p_solo_finalizados boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_apuesta_id uuid;
  v_refrescadas int := 0;
  v_apuestas jsonb := '[]'::jsonb;
begin
  /*
    Esta RPC está pensada para ser llamada desde AppScript
    después de sincronizar partidos a Supabase.

    - Si p_partido_ids viene con IDs, refresca solo apuestas afectadas.
    - Si p_partido_ids es null o vacío, refresca apuestas con partidos finalizados.
  */

  -- Recalcular puntos por seguridad para los partidos afectados.
  -- El trigger ya lo hace al actualizar partidos, pero esto deja la RPC idempotente.
  update predicciones pr
  set puntos = public.calcular_puntos_prediccion(
    p,
    a,
    pr.pred_local,
    pr.pred_visitante,
    pr.pred_clasificado
  )
  from partidos p
  join apuestas a on a.id = pr.apuesta_id
  where pr.partido_id = p.id
    and (
      p_partido_ids is null
      or cardinality(p_partido_ids) = 0
      or p.id = any(p_partido_ids)
    )
    and p.estado = 'finalizado'
    and p.goles_local is not null
    and p.goles_visitante is not null
    and not (
      public.es_fase_eliminatoria(p.fase)
      and p.goles_local = p.goles_visitante
      and (p.penales_local is null or p.penales_visit is null)
    );

  -- Limpiar puntos si un partido volvió a no-finalizado.
  update predicciones pr
  set puntos = null
  from partidos p
  where pr.partido_id = p.id
    and (
      p_partido_ids is null
      or cardinality(p_partido_ids) = 0
      or p.id = any(p_partido_ids)
    )
    and (
      p.estado <> 'finalizado'
      or p.goles_local is null
      or p.goles_visitante is null
      or (
        public.es_fase_eliminatoria(p.fase)
        and p.goles_local = p.goles_visitante
        and (p.penales_local is null or p.penales_visit is null)
      )
    );

  -- Refrescar solo apuestas relacionadas con esos partidos.
  for v_apuesta_id in
    select distinct ap.apuesta_id
    from apuesta_partidos ap
    join partidos p on p.id = ap.partido_id
    where (
      p_partido_ids is null
      or cardinality(p_partido_ids) = 0
      or ap.partido_id = any(p_partido_ids)
    )
    and (
      not p_solo_finalizados
      or (
        p.estado = 'finalizado'
        and p.goles_local is not null
        and p.goles_visitante is not null
        and not (
          public.es_fase_eliminatoria(p.fase)
          and p.goles_local = p.goles_visitante
          and (p.penales_local is null or p.penales_visit is null)
        )
      )
    )
  loop
    perform public.refrescar_ranking(v_apuesta_id);

    v_refrescadas := v_refrescadas + 1;
    v_apuestas := v_apuestas || to_jsonb(v_apuesta_id::text);
  end loop;

  return jsonb_build_object(
    'ok', true,
    'rankings_refrescados', v_refrescadas,
    'apuestas', v_apuestas
  );
end;
$$;

-- AppScript usa service_role, así que alcanza con esto.
grant execute on function public.refrescar_rankings_por_partidos(text[], boolean) to service_role;

-- Opcional: si querés probarla desde un usuario admin autenticado vía frontend.
-- grant execute on function public.refrescar_rankings_por_partidos(text[], boolean) to authenticated;