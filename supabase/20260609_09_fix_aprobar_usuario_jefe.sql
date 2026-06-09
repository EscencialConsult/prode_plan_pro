-- ============================================================
-- FIX: aprobar_usuario() ignoraba p_tipo_usuario
-- Fecha: 2026-06-09
--
-- PROBLEMA:
--   La función hardcodeaba tipo_usuario = 'general' en ambas
--   ramas (plan_basic y plan_pro), ignorando completamente el
--   parámetro p_tipo_usuario que el admin seleccionaba en el
--   panel.
--
-- SOLUCIÓN:
--   - En plan_basic: se mantiene el forzado a 'general' (sin
--     cambios, el plan no soporta roles de área).
--   - En plan_pro:
--       · Acepta p_tipo_usuario = 'general' | 'jefe'
--       · Si es 'jefe', el área es OBLIGATORIA
--       · Si es 'general', el área es opcional
--       · El índice único idx_un_jefe_por_area ya garantiza
--         que no existan dos jefes en la misma área (error 23505)
-- ============================================================

CREATE OR REPLACE FUNCTION public.aprobar_usuario(
  p_user_id     uuid,
  p_tipo_usuario text DEFAULT 'general',
  p_area_id     uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user              usuarios;
  v_area              areas;
  v_admin_plan_basic  boolean;
  v_tipo              text;
BEGIN
  -- Solo el admin puede aprobar
  IF NOT es_admin() THEN
    RAISE EXCEPTION 'Solo el admin puede aprobar usuarios';
  END IF;

  -- Traer el usuario a aprobar
  SELECT * INTO v_user FROM usuarios WHERE id = p_user_id;
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;
  IF v_user.estado <> 'pendiente' THEN
    RAISE EXCEPTION 'El usuario no está en estado pendiente';
  END IF;

  -- Normalizar y validar tipo_usuario recibido
  v_tipo := COALESCE(LOWER(TRIM(p_tipo_usuario)), 'general');
  IF v_tipo NOT IN ('general', 'jefe') THEN
    RAISE EXCEPTION 'Tipo de usuario inválido: %. Debe ser "general" o "jefe"', v_tipo;
  END IF;

  v_admin_plan_basic := plan_basic();

  -- ── PLAN BASIC ─────────────────────────────────────────────
  -- Sin gestión de áreas ni roles: siempre general, sin área.
  IF v_admin_plan_basic THEN
    UPDATE usuarios SET
      estado       = 'activo',
      tipo_usuario = 'general',
      area_id      = NULL
    WHERE id = p_user_id;

  -- ── PLAN PRO ───────────────────────────────────────────────
  ELSE
    -- Si es jefe, el área es obligatoria
    IF v_tipo = 'jefe' AND p_area_id IS NULL THEN
      RAISE EXCEPTION 'Un jefe de área requiere área asignada (p_area_id no puede ser NULL)';
    END IF;

    -- Validar que el área exista y esté activa
    IF p_area_id IS NOT NULL THEN
      SELECT * INTO v_area FROM areas WHERE id = p_area_id;
      IF v_area IS NULL THEN
        RAISE EXCEPTION 'El área asignada no existe';
      END IF;
      IF NOT v_area.activa THEN
        RAISE EXCEPTION 'El área "%" está desactivada. Activala antes de asignar usuarios', v_area.nombre;
      END IF;
    END IF;

    -- Actualizar: ahora sí respeta p_tipo_usuario
    UPDATE usuarios SET
      estado       = 'activo',
      tipo_usuario = v_tipo,      -- 'general' o 'jefe'
      area_id      = p_area_id
    WHERE id = p_user_id;
    -- NOTA: el índice idx_un_jefe_por_area (UNIQUE parcial sobre
    -- area_id WHERE tipo_usuario='jefe') garantiza que no pueda
    -- haber dos jefes en la misma área → error 23505 capturado
    -- en el frontend como "Ya existe un jefe asignado a esa área."
  END IF;

  -- Registro de auditoría
  INSERT INTO auditoria (user_id, accion, detalle)
  VALUES (
    auth.uid(),
    'APROBACION',
    format(
      'Usuario %s aprobado como %s en área %s',
      p_user_id,
      v_tipo,
      COALESCE(p_area_id::text, 'sin área')
    )
  );

  RETURN json_build_object(
    'ok',      true,
    'message', 'Usuario aprobado',
    'tipo',    v_tipo
  );
END;
$$;
