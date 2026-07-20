-- =====================================================
-- MIGRACIÓN: reabrir apuestas con cierre por partido individual
-- Fecha: 2026-06-18
--
-- Modelo nuevo (sogefi):
--   La apuesta queda abierta hasta el INICIO del último partido
--   seleccionado. Cada partido se bloquea solo a su hora de inicio
--   (lo maneja guardar_predicciones_apuesta + el frontend).
--
-- Por eso fecha_cierre = MAX(fecha_hora) de los partidos de la apuesta.
--
-- NO destructivo: solo actualiza la columna fecha_cierre (y estado) de
-- la tabla `apuestas`. No toca `predicciones` — nada se borra.
-- =====================================================

update apuestas a
set fecha_cierre = sub.ultimo_kickoff,
    estado = 'abierta'
from (
  select ap.apuesta_id, max(p.fecha_hora) as ultimo_kickoff
  from apuesta_partidos ap
  join partidos p on p.id = ap.partido_id
  group by ap.apuesta_id
) sub
where a.id = sub.apuesta_id;

-- Verificación (esperado: cada apuesta con fecha_cierre = inicio de su último partido):
-- select titulo, estado, fecha_cierre from apuestas order by titulo;
