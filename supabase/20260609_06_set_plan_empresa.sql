-- ============================================================
-- MIGRACIÓN: set_plan_empresa
-- Cambia el plan global de la empresa y sincroniza TODOS los
-- usuarios existentes en una sola operación atómica.
--
-- Uso:
--   SELECT public.set_plan_empresa('plan_pro');
--   SELECT public.set_plan_empresa('plan_basic');
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_plan_empresa(p_plan text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_usuarios_actualizados int;
BEGIN
  -- Solo admin puede ejecutar esta función
  IF NOT public.es_admin() THEN
    RAISE EXCEPTION 'Solo el administrador puede cambiar el plan de empresa';
  END IF;

  -- Validar valor permitido
  IF p_plan NOT IN ('plan_basic', 'plan_pro') THEN
    RAISE EXCEPTION
      'Plan inválido: %. Los valores permitidos son plan_basic o plan_pro', p_plan;
  END IF;

  -- 1. Actualizar (o crear) el registro global en config
  INSERT INTO public.config (clave, valor)
  VALUES ('plan_empresa', p_plan)
  ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor;

  -- 2. Propagar a TODOS los usuarios existentes de esta base
  --    (cada base = una empresa; UPDATE sin WHERE es correcto y seguro aquí)
  UPDATE public.usuarios SET empresa = p_plan;
  GET DIAGNOSTICS v_usuarios_actualizados = ROW_COUNT;

  -- 3. Registrar en auditoría
  INSERT INTO public.auditoria (user_id, accion, detalle)
  VALUES (
    auth.uid(),
    'CAMBIO_PLAN',
    format(
      'Plan cambiado a "%s". Usuarios sincronizados: %s',
      p_plan, v_usuarios_actualizados
    )
  );

  RETURN jsonb_build_object(
    'ok',                    true,
    'plan',                  p_plan,
    'usuarios_actualizados', v_usuarios_actualizados
  );
END;
$$;

-- Cualquier admin autenticado puede llamarla (la función valida internamente)
GRANT EXECUTE ON FUNCTION public.set_plan_empresa(text) TO authenticated;

NOTIFY pgrst, 'reload schema';
