-- =====================================================
-- MIGRACIÓN: eliminar trigger de total_participantes por fila
-- Motivo:
--   guardar_predicciones_apuesta() ya recalcula total_participantes
--   una sola vez al final del batch.
-- =====================================================

DROP TRIGGER IF EXISTS trg_total_participantes
ON public.predicciones;

COMMENT ON FUNCTION public.actualizar_total_participantes()
IS 'Función legacy conservada como respaldo. Ya no se ejecuta por trigger para evitar contención por fila en predicciones.';