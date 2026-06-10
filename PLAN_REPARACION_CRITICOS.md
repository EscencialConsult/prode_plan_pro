# Plan de Reparación — Puntos Críticos
> Sistema: Prode One — `prode_plan_pro`
> Revisado: 2026-06-09 (incorpora el AppScript de sincronización multi-tenant)

---

## Contexto: arquitectura multi-tenant + AppScript (infraestructura confirmada)

El sistema es **multi-tenant por base de datos**: cada empresa que compra PRODE tiene **su propio proyecto Supabase** (URL + `service_role key` propias). Un único Google AppScript (`syncASupabase`) sincroniza el mismo Google Sheet (`Mundial2026`) hacia **N proyectos Supabase** a la vez, leyendo la lista de tenants desde la propiedad `PRODE_TENANTS`.

Consecuencias clave para este plan:

1. **El scheduler de ranking SÍ existe y es confiable.** El AppScript corre cada **5 minutos** (`TRIGGER_MIN: 5`, trigger time-based con `LockService`). Por cada tenant:
   - Hace upsert de `selecciones` y `partidos` (chunks de 100) vía PostgREST.
   - Llama a `refrescar_rankings_por_partidos({ p_partido_ids: [ids finalizados], p_solo_finalizados: true })`.
   - Tiene **fallback elegante**: si la RPC no existe (`PGRST202`), loguea y omite el ranking sin romper el sync.
   - Aísla errores por tenant: si una empresa falla, las demás siguen.
2. **Las llamadas a la RPC usan `service_role`**, que bypassa RLS y llega **sin `auth.uid()`** (es `NULL`).
3. **El Sheet es la fuente de verdad de `partidos` y de los resultados.** Los resultados se cargan exclusivamente desde el Sheet — el admin no carga resultados in-app. El AppScript propaga cada cambio en ≤ 5 min.
4. **No hay runner de migraciones.** Cada migración SQL debe aplicarse **manualmente en cada proyecto Supabase**. Ver la sección "Despliegue en todos los tenants" al final.

> **Impacto en el plan:** el ranking nunca queda desactualizado de forma indefinida — el AppScript lo cubre cada 5 min. Como el admin no carga resultados in-app, **no hay gap de latencia que reparar**. Los puntos pendientes son (C-1, C-2) y la nueva funcionalidad (N-1), todos con despliegue **por tenant**.

---

## Contexto: estado real de las migraciones

`public_schema.sql` es un **snapshot antiguo**. Las migraciones en `supabase/` representan el estado real
desplegado en producción. La migración más reciente (`20260604_05`) ya resolvió varios puntos de
infraestructura de ranking que el plan original marcaba como pendientes:

| Ya resuelto en migraciones | Migración |
|---------------------------|-----------|
| `refrescar_ranking()` acepta `abierta`, `cerrada` y `finalizada` | `20260604_05` §4 |
| `refrescar_ranking_global()` con `TRUNCATE` (evita bloqueo por RLS) | `20260604_05` §3 |
| `ranking_global_cache` + índices + RLS + grants | `20260604_05` §2 y §6 |
| `refrescar_rankings_por_partidos` procesa `abierta` + `cerrada` | `20260604_05` §5 |
| Auto-finalización de apuestas al terminar todos sus partidos | `20260604_05` §5 |
| `refrescar_rankings_por_partidos` llama a `refrescar_ranking_global()` | `20260604_05` §5 línea 273 |
| `trg_total_participantes` eliminado (evitaba contención por fila) | `20260603_01` |

Lo que **sigue faltando** son **2 puntos críticos** y **1 nueva funcionalidad**, todos confirmados ausentes en todas las migraciones:

---

## Resumen ejecutivo

| # | Punto | Capa | Esfuerzo | Riesgo si no se repara |
|---|-------|------|----------|------------------------|
| C-1 | Default de plan invertido frontend ↔ backend | Frontend | ⬛ Mínimo — 1 línea | UX rota: se ofrecen features Pro a usuarios Basic |
| C-2 | Cambio de plan no propaga a usuarios existentes | SQL + UI | ⬛⬛ Medio | Upgrade de plan no tiene efecto sobre usuarios ya registrados |
| N-1 | Ranking global acumulado por área *(no existe)* | SQL + Frontend | ⬛⬛ Medio | Sin visibilidad del desempeño acumulado de cada área en el torneo completo |

> **C-3 eliminado del plan:** el trigger `validar_prediccion_integridad` como segunda barrera de plan se descartó para evitar complejidad adicional. La barrera única es la RLS (`predicciones_insert`), que cubre el caso normal de uso.

> **C-4 eliminado del plan:** el admin no carga resultados in-app — todo pasa por el Sheet y el AppScript. El ranking se actualiza automáticamente en ≤ 5 min en cada ciclo. No hay gap de latencia que reparar.

**Orden de ejecución recomendado:** `C-2 → C-1 → N-1`
Primero la propagación de plan (asegura que todos los usuarios tengan el valor correcto), luego el fix de frontend y finalmente la nueva funcionalidad de área.

> **Todas las migraciones SQL y los builds de frontend deben aplicarse a cada tenant.** Ver "Despliegue en todos los tenants".

---

## C-1 — Default de plan invertido (frontend vs backend)

### Diagnóstico preciso

**Archivo:** `src/hooks/useAuth.jsx` líneas 151–156

El comentario en el código afirma "mismo criterio que el backend" pero la lógica es **la opuesta**:

```js
// CÓDIGO ACTUAL — incorrecto
const empresa = String(user?.empresa || '').trim().toLowerCase()
const isPlanBasic = empresa === 'plan_basic'  // empresa='' → false → isPro = TRUE ← MAL
const isPro = !isPlanBasic
```

La función `plan_basic()` en el backend (`public_schema.sql:731`) hace:
```sql
select coalesce(
  (select empresa = 'plan_basic' from usuarios where id = auth.uid() limit 1),
  true   -- empresa vacía / sin usuario → BASIC (restrictivo)
);
```

**Resultado con `empresa` vacía:**
- Backend → **Basic** (restrictivo, correcto).
- Frontend → **Pro** (permisivo, incorrecto).

El admin ve selectores de área y tipo de apuesta aunque sea Basic. Intenta usarlos y el backend los rechaza silenciosamente.

### Cambio exacto

**`src/hooks/useAuth.jsx`** — reemplazar líneas 151–156:

```js
// ANTES
  // Plan de la empresa del usuario logueado.
  // Si la columna empresa está vacía, se considera Plan_pro por defecto
  // (mismo criterio que el backend en esPlanBasic_).
  const empresa = String(user?.empresa || '').trim().toLowerCase()
  const isPlanBasic = empresa === 'plan_basic'
  const isPro = !isPlanBasic

// DESPUÉS
  // Plan de la empresa del usuario logueado.
  // Criterio idéntico al backend (función plan_basic()):
  //   empresa = 'plan_pro'        → Pro
  //   empresa = 'plan_basic', '' o null → Basic (por defecto restrictivo)
  const empresa = String(user?.empresa || '').trim().toLowerCase()
  const isPlanBasic = empresa !== 'plan_pro'
  const isPro = !isPlanBasic
```

### Verificación

| Valor de `empresa` | Antes | Después | Backend |
|--------------------|-------|---------|---------|
| `'plan_pro'` | Pro ✅ | Pro ✅ | Pro ✅ |
| `'plan_basic'` | Basic ✅ | Basic ✅ | Basic ✅ |
| `''` (vacío) | Pro ❌ | Basic ✅ | Basic ✅ |
| `null` | Pro ❌ | Basic ✅ | Basic ✅ |

> **Multi-tenant:** cada empresa tiene su propio build de frontend apuntando a su Supabase. Este fix de 1 línea debe incluirse en el código base y redeployarse para **todas** las empresas. Es idéntico para todas (no depende del tenant).

---

## C-2 — Cambio de plan no propaga a usuarios existentes

### Diagnóstico preciso

El trigger `handle_new_user()` sella `usuarios.empresa` **una sola vez**, al registrarse, copiando el valor de `config.plan_empresa`. Si después se edita `config` directamente en Supabase Studio, los 100 (o 1000) usuarios ya registrados mantienen el valor viejo en su columna personal. La función `plan_basic()` lee `usuarios.empresa`, no `config`, así que el backend los sigue tratando como estaban.

Además, no existe ninguna interfaz en la app para cambiar el plan: hay que hacerlo por SQL directo.

> **Multi-tenant:** como cada empresa es un proyecto Supabase independiente, **todos los usuarios de una misma base pertenecen a la misma empresa y comparten plan**. Por eso el `UPDATE usuarios SET empresa = p_plan` (sin `WHERE`) es correcto y seguro: actualiza solo a los usuarios de ESA empresa. La RPC se ejecuta una vez por proyecto, cuando esa empresa cambia de plan.

### Nueva migración: `supabase/20260609_06_set_plan_empresa.sql`

```sql
-- ============================================================
-- MIGRACIÓN: set_plan_empresa — cambia el plan global y
-- sincroniza TODOS los usuarios en una sola operación atómica.
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

  -- 2. Propagar a TODOS los usuarios existentes
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
```

> **Rollback:** ejecutar `SELECT public.set_plan_empresa('plan_basic')` desde un admin. La función es idempotente.

### Cambio en frontend — botón en el panel admin (`src/pages/AdminPage.jsx`)

```jsx
// ── Agregar estado y handler en el componente AdminPage ──────

const [cambiandoPlan, setCambiandoPlan] = useState(false)

async function handleCambiarPlan(nuevoPlan) {
  const ok = await confirm(
    `¿Cambiar a ${nuevoPlan === 'plan_pro' ? 'Plan Pro' : 'Plan Basic'}?\n` +
    `Esta acción actualiza el plan de TODOS los usuarios registrados.`
  )
  if (!ok) return

  setCambiandoPlan(true)
  try {
    const { data, error } = await sheetsApi._supabase
      .rpc('set_plan_empresa', { p_plan: nuevoPlan })
    if (error) throw error
    toast.success(
      `Plan cambiado a ${nuevoPlan}. ` +
      `${data.usuarios_actualizados} usuarios actualizados.`
    )
    toast.info(
      'Los usuarios con sesión activa deben cerrar sesión y volver a ingresar ' +
      'para que el nuevo plan se refleje en su navegador.'
    )
  } catch (e) {
    toast.error('Error al cambiar el plan: ' + e.message)
  } finally {
    setCambiandoPlan(false)
  }
}

// ── Sección en JSX (ej: dentro del tab de Configuración o Áreas) ──

{isAdmin && (
  <div className="p-4 rounded-xl border" style={{ borderColor: 'rgba(201,159,22,.3)' }}>
    <p className="text-xs font-bold uppercase tracking-widest mb-3"
       style={{ color: '#c99f16' }}>
      Plan de empresa
    </p>
    <p className="text-xs mb-4" style={{ color: '#64748b' }}>
      Plan actual: <strong>{isPro ? 'Plan Pro' : 'Plan Basic'}</strong>
    </p>
    <div className="flex gap-3">
      <button
        onClick={() => handleCambiarPlan('plan_basic')}
        disabled={cambiandoPlan || !isPro}
      >
        Cambiar a Basic
      </button>
      <button
        onClick={() => handleCambiarPlan('plan_pro')}
        disabled={cambiandoPlan || isPro}
      >
        Cambiar a Pro
      </button>
    </div>
  </div>
)}
```

### Verificación

1. `SELECT set_plan_empresa('plan_pro')` → `SELECT DISTINCT empresa FROM usuarios` devuelve solo `plan_pro`. ✅
2. `SELECT set_plan_empresa('plan_basic')` → todos vuelven a `plan_basic`. ✅
3. Nuevo registro tras el cambio → `handle_new_user()` lee `config` actualizada y sella el plan nuevo. ✅
4. `SELECT * FROM auditoria WHERE accion = 'CAMBIO_PLAN'` muestra el registro con timestamp y admin. ✅
5. Valor inválido: `SELECT set_plan_empresa('plan_gold')` → excepción con mensaje claro. ✅

---

## N-1 — Ranking global acumulado por área *(nueva funcionalidad)*

### Diagnóstico

Hoy existen dos rankings de área:
- `ranking_cache` con `es_grupal=true` → ranking de áreas **por apuesta** (quién ganó esa apuesta).
- `ranking_global_cache` → ranking individual acumulado (usuarios, no áreas).

**No existe** ningún ranking que acumule los puntos de todas las apuestas sumados por área. Para saber "qué área ganó el torneo", hoy no hay dónde mirarlo. Tampoco existe una función de refresh, una tabla de caché ni un endpoint para ello.

> Aplica **solo a `plan_pro`**: las áreas son una feature Pro. En empresas Basic la tabla de caché queda vacía y la UI no la muestra.

### Nueva migración: `supabase/20260609_07_ranking_global_areas.sql`

```sql
-- ============================================================
-- MIGRACIÓN: Ranking global acumulado por área.
-- Suma de puntos de TODAS las apuestas cerradas/finalizadas,
-- agrupados por área. Solo relevante en plan_pro.
-- ============================================================


-- ── 1. VISTA: ranking_global_areas ───────────────────────────

CREATE OR REPLACE VIEW public.ranking_global_areas AS
SELECT
  u.area_id,
  ar.nombre                                AS area_nombre,
  COALESCE(SUM(p.puntos), 0)::bigint       AS puntos_totales,
  COUNT(DISTINCT p.user_id)                AS miembros_participantes,
  COUNT(*)                                 AS predicciones,
  RANK() OVER (
    ORDER BY COALESCE(SUM(p.puntos), 0)::bigint DESC,
             COUNT(DISTINCT p.user_id) DESC   -- desempate: más miembros participaron
  )                                        AS posicion
FROM public.predicciones p
JOIN public.usuarios  u  ON u.id  = p.user_id
JOIN public.areas     ar ON ar.id = u.area_id
JOIN public.apuestas  a  ON a.id  = p.apuesta_id
WHERE a.estado IN ('cerrada', 'finalizada')
  AND p.puntos  IS NOT NULL
  AND u.area_id IS NOT NULL
GROUP BY u.area_id, ar.nombre;


-- ── 2. TABLA: ranking_global_areas_cache ─────────────────────

CREATE TABLE IF NOT EXISTS public.ranking_global_areas_cache (
  id                     uuid    DEFAULT gen_random_uuid() NOT NULL,
  area_id                uuid    NOT NULL,
  area_nombre            text,
  puntos_totales         bigint  DEFAULT 0,
  miembros_participantes bigint  DEFAULT 0,
  predicciones           bigint  DEFAULT 0,
  posicion               bigint,
  updated_at             timestamp with time zone DEFAULT now(),
  CONSTRAINT ranking_global_areas_cache_pkey PRIMARY KEY (id),
  CONSTRAINT ranking_global_areas_cache_area_id_fkey
    FOREIGN KEY (area_id) REFERENCES public.areas(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ranking_global_areas_cache_area
  ON public.ranking_global_areas_cache(area_id);

CREATE INDEX IF NOT EXISTS idx_ranking_global_areas_posicion
  ON public.ranking_global_areas_cache(posicion);


-- ── 3. FUNCIÓN: refrescar_ranking_global_areas() ─────────────
-- TRUNCATE (no DELETE sin WHERE) para evitar bloqueo por RLS.

CREATE OR REPLACE FUNCTION public.refrescar_ranking_global_areas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  TRUNCATE ranking_global_areas_cache;
  INSERT INTO ranking_global_areas_cache
    (area_id, area_nombre, puntos_totales, miembros_participantes,
     predicciones, posicion, updated_at)
  SELECT
    area_id, area_nombre, puntos_totales, miembros_participantes,
    predicciones, posicion, now()
  FROM ranking_global_areas;
END;
$$;


-- ── 4. ENCADENAR EN refrescar_ranking_global() ───────────────
-- Al agregarlo aquí, el AppScript lo actualiza automáticamente
-- en cada ciclo de 5 min sin ningún cambio en el AppScript.

CREATE OR REPLACE FUNCTION public.refrescar_ranking_global()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Ranking individual acumulado (existente)
  TRUNCATE ranking_global_cache;
  INSERT INTO ranking_global_cache
    (user_id, nombre, area_id, puntos_totales, predicciones, posicion, updated_at)
  SELECT
    user_id, nombre, area_id, puntos_totales, predicciones, posicion, now()
  FROM ranking_global;

  -- Ranking por área acumulado (nuevo)
  PERFORM public.refrescar_ranking_global_areas();
END;
$$;


-- ── 5. RLS + GRANTS ──────────────────────────────────────────

ALTER TABLE public.ranking_global_areas_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rgac_select ON public.ranking_global_areas_cache;
CREATE POLICY rgac_select
  ON public.ranking_global_areas_cache
  FOR SELECT
  TO authenticated
  USING (public.usuario_activo() OR public.es_admin());

GRANT SELECT ON public.ranking_global_areas_cache TO authenticated;


-- ── 6. POBLAR LA CACHÉ POR PRIMERA VEZ ───────────────────────

SELECT public.refrescar_ranking_global_areas();

NOTIFY pgrst, 'reload schema';
```

> **¿Por qué encadenar en `refrescar_ranking_global()`?** Esa función ya es llamada por `refrescar_rankings_por_partidos()` (que a su vez llama el AppScript y el admin in-app). Al agregar un `PERFORM` al final, el nuevo caché de áreas se actualiza en **cada ciclo automático** sin tocar el AppScript ni la RPC principal. Cero cambios de infraestructura adicionales.

> **¿Por qué TRUNCATE y no DELETE?** Mismo motivo que `refrescar_ranking_global()`: `DELETE` sin `WHERE` sobre una tabla con RLS activo es bloqueado por PostgreSQL (error 21000). `TRUNCATE` no es afectado por RLS y es más eficiente.

### Cambios en frontend

**1) Nueva función en `src/services/sheetsApi.js`:**

```js
/**
 * Ranking global acumulado por área.
 * Lee ranking_global_areas_cache ordenado por posición.
 * Solo tiene datos en plan_pro (sin áreas = tabla vacía).
 */
rankingGlobalAreas: async (opciones = {}) => {
  const limit = Math.min(parseInt(opciones.limit) || 50, 200)

  const [tablaResult, totalResult] = await Promise.all([
    supabase
      .from('ranking_global_areas_cache')
      .select('*')
      .order('posicion', { ascending: true })
      .limit(limit),
    supabase
      .from('ranking_global_areas_cache')
      .select('*', { count: 'exact', head: true }),
  ])

  checkError(tablaResult.error, 'predicciones.rankingGlobalAreas (tabla)')
  checkError(totalResult.error, 'predicciones.rankingGlobalAreas (total)')

  return {
    ok: true,
    total: totalResult.count || 0,
    tabla: (tablaResult.data || []).map(r => ({
      area_id:               r.area_id,
      nombre:                r.area_nombre,
      puntos_totales:        r.puntos_totales,
      miembros_participantes: r.miembros_participantes,
      predicciones:          r.predicciones,
      posicion:              r.posicion,
    })),
  }
},
```

**2) Mostrar en `src/pages/RankingPageUser.jsx`** — dentro del componente `RankingGlobal`, agregar una segunda tabla de áreas cuando `isPro && areasTabla.length > 0`:

```jsx
// En el componente RankingPageUser (o RankingGlobal):
const { isPro } = useAuth()
const [areasTabla, setAreasTabla] = useState([])

useEffect(() => {
  if (!isPro) return
  sheetsApi.predicciones.rankingGlobalAreas({ limit: 20 })
    .then(r => setAreasTabla(r.tabla || []))
    .catch(() => {})
}, [isPro])

// En el JSX (dentro del panel global, debajo del ranking individual):
{isPro && areasTabla.length > 0 && (
  <div style={{ marginTop: 24 }}>
    <p style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '.22em', color: 'rgba(235,195,43,.7)', marginBottom: 12 }}>
      RANKING POR ÁREA — ACUMULADO
    </p>
    <table>
      <thead>
        <tr>
          <th>#</th><th>Área</th><th>Puntos</th><th>Miembros</th>
        </tr>
      </thead>
      <tbody>
        {areasTabla.map(a => (
          <tr key={a.area_id}>
            <td>#{a.posicion}</td>
            <td>{a.nombre}</td>
            <td>{a.puntos_totales}</td>
            <td>{a.miembros_participantes}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
```

> El estilo exacto se adapta al sistema de diseño existente (navy + dorado). Esta es la estructura mínima funcional.

### Verificación

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| 1 | Aplicar migración y ejecutar `SELECT refrescar_ranking_global_areas()` | Devuelve void sin error ✅ |
| 2 | `SELECT * FROM ranking_global_areas_cache ORDER BY posicion` | Muestra áreas con puntos acumulados ✅ |
| 3 | AppScript corre → `refrescar_rankings_por_partidos` → `refrescar_ranking_global` → `refrescar_ranking_global_areas` | Cache de áreas actualizado automáticamente sin cambiar el AppScript ✅ |
| 4 | Empresa `plan_basic` (sin áreas) | `ranking_global_areas_cache` vacío; `WHERE u.area_id IS NOT NULL` filtra todo; UI no muestra la sección ✅ |
| 5 | Dos áreas con mismos puntos acumulados | Desempata por `miembros_participantes DESC` (consistente con ranking de áreas por apuesta) ✅ |
| 6 | Área eliminada → `ON DELETE CASCADE` | La fila desaparece del caché ✅ |

---

## Archivos a crear o modificar

| Archivo | Operación | Puntos que resuelve |
|---------|-----------|---------------------|
| `supabase/20260609_06_set_plan_empresa.sql` | **Crear** | C-2 |
| `supabase/20260609_07_ranking_global_areas.sql` | **Crear** | N-1 (vista + caché + función + encadenado) |
| `src/hooks/useAuth.jsx` líneas 151–156 | **Modificar** | C-1 |
| `src/pages/AdminPage.jsx` | **Modificar** | C-2 (botón cambiar plan) |
| `src/services/sheetsApi.js` (nueva función `rankingGlobalAreas`) | **Modificar** | N-1 |
| `src/pages/RankingPageUser.jsx` (`RankingGlobal`) | **Modificar** | N-1 (tabla de áreas en panel global) |

**Total: 2 migraciones SQL nuevas + 4 archivos frontend modificados.**

---

## Flujo del sistema tras las reparaciones

```
Carga de resultados — único camino (Sheet → AppScript):

Sheet Mundial2026 ──► AppScript syncASupabase() cada 5 min, POR CADA TENANT
        │                ├─ upsert partidos (chunks de 100, service_role)
        │                └─ RPC refrescar_rankings_por_partidos([finalizados])
        │                      → recalcula puntos en predicciones
        │                      → refresca ranking_cache (individual + grupal, por apuesta)
        │                      → refrescar_ranking_global()
        │                           ├─ ranking_global_cache   (usuarios acumulado)
        │                           └─ ranking_global_areas_cache (áreas acumulado) [NUEVO N-1]
        │                      → auto-finaliza apuestas completadas

Admin cambia plan Basic → Pro (en el Supabase de SU empresa)
        │
        └─ set_plan_empresa('plan_pro')           [NUEVO C-2]
              ├─ UPSERT config SET plan_empresa = 'plan_pro'
              ├─ UPDATE usuarios SET empresa = 'plan_pro'  (todos los de esa empresa)
              └─ INSERT auditoria

Frontend detecta empresa vacía / desconocida       [NUEVO C-1]
        │
        └─ isPlanBasic = empresa !== 'plan_pro'
              empresa='' → isPlanBasic=true (antes era false)
              Alineado con backend plan_basic()
```

---

## Despliegue en todos los tenants

No existe un runner de migraciones: cada cambio se aplica **manualmente por proyecto Supabase**. La lista de proyectos vivos es la propiedad `PRODE_TENANTS` del AppScript (`getTenants_()` / `listarTenants()`).

**Checklist por cada empresa (tenant):**

1. **SQL** — ejecutar en el SQL Editor de ese Supabase, en orden:
   `20260609_06_set_plan_empresa.sql` → `20260609_07_ranking_global_areas.sql`.
2. **Frontend** — el build de esa empresa debe incluir los cambios de `useAuth.jsx`, `sheetsApi.js`, `AdminPage.jsx` y `RankingPageUser.jsx`, y redeployarse apuntando a su Supabase.
3. **Verificar** con `pingTenants()` del AppScript que el proyecto responde, y que `refrescar_rankings_por_partidos` existe (si falta, el AppScript loguea `PGRST202` y omite el ranking de ese tenant).

**Orden de despliegue sin downtime:**
- Las migraciones SQL son retrocompatibles → aplicarlas **primero** en todos los tenants.
- La migración `_07` (N-1) es **aditiva pura**: crea tabla + vista + función nuevas y modifica `refrescar_ranking_global()` para encadenar el nuevo refresh. No rompe nada si se aplica antes o después del frontend.
- **Nota para tenants `plan_basic`:** la migración `_07` se puede aplicar igualmente — `ranking_global_areas_cache` quedará vacío y la UI no mostrará la sección (`isPro` es false). No hay impacto.
- Tener en cuenta el **caveat preexistente**: si el admin corrige un resultado in-app que diverge del Sheet, el próximo sync del AppScript lo sobrescribe. La fuente de verdad de `partidos` sigue siendo el Sheet.

> **Riesgo operativo (medio):** un tenant al que se le olvide aplicar una migración queda con el esquema viejo. Si falta `_06`, el cambio de plan solo funciona por SQL directo. Si falta `_07`, el ranking de áreas acumulado no existe. El AppScript sigue funcionando en ambos casos (fallback `PGRST202`). Conviene llevar un registro de qué migración está aplicada en cada tenant.
