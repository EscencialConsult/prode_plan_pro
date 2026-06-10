# Plan de Implementación — Desempate por orden de apuesta

> Sistema: Prode One — `prode_plan_pro`
> Fecha: 2026-06-08
> Objetivo: cuando dos participantes tienen el mismo puntaje, desempatar por **quién apostó primero**.

---

## 1. Diagnóstico — ¿cómo se resuelve hoy un empate?

El ranking se calcula en **3 vistas** de PostgreSQL que alimentan las tablas de caché. El estado actual del desempate en cada una:

| Vista | Alcance | `ORDER BY` del `rank()` | ¿Desempate? |
|-------|---------|-------------------------|-------------|
| `ranking_apuestas` | Individual, por apuesta | `puntos_totales DESC` | ❌ **Ninguno** |
| `ranking_apuestas_grupales` | Por área, por apuesta | `puntos_totales DESC, miembros_participantes DESC` | ⚠️ Solo por nº de miembros |
| `ranking_global` | Individual, acumulado | `puntos_totales DESC` | ❌ **Ninguno** |

**Conclusión:** en el ranking individual (por apuesta y global), **NO existe ningún criterio de desempate**. Dos usuarios con el mismo puntaje reciben la **misma posición** (efecto de `rank()`), y el orden en que se muestran entre ellos es **no determinista** — depende del plan de ejecución de PostgreSQL y puede variar entre refrescos.

Esto confirma lo que sospechabas: **hoy no se desempata por quién apostó primero** (ni por ningún otro criterio en el ranking individual).

### Evidencia en código

`ranking_apuestas` — `public_schema.sql:1139`:
```sql
rank() OVER (PARTITION BY p.apuesta_id ORDER BY COALESCE(sum(p.puntos), 0) DESC) AS posicion
```

`ranking_global` — `supabase/20260604_05_ranking_global_migration.sql:18`:
```sql
RANK() OVER (ORDER BY COALESCE(SUM(p.puntos), 0) DESC) AS posicion
```

`ranking_apuestas_grupales` — `public_schema.sql:1195`:
```sql
rank() OVER (PARTITION BY apuesta_id ORDER BY puntos_totales DESC, miembros_participantes DESC) AS posicion
```

---

## 2. Viabilidad — ¿tenemos el dato de "cuándo apostó"?

**Sí.** La tabla `predicciones` tiene la columna:

```sql
fecha_registro timestamp with time zone DEFAULT now()   -- public_schema.sql:1098
```

### Confirmación crítica: el timestamp es estable ante ediciones

El guardado de predicciones (en sus dos caminos) es un **upsert** que en conflicto **NO toca `fecha_registro`**:

- **RPC `guardar_predicciones_apuesta`** (`public_schema.sql:594`):
  ```sql
  ON CONFLICT (apuesta_id, user_id, partido_id)
  DO UPDATE SET
    pred_local = EXCLUDED.pred_local,
    pred_visitante = EXCLUDED.pred_visitante,
    pred_clasificado = EXCLUDED.pred_clasificado,
    area_id = EXCLUDED.area_id;        -- ← fecha_registro NO está en el SET
  ```
- **`predicciones.guardar`** (`src/services/sheetsApi.js:767`): el `payload` no incluye `fecha_registro`, por lo que el upsert de Supabase no la modifica en el UPDATE.

**Implicación:** `fecha_registro` refleja el **primer momento** en que el usuario creó esa predicción y **se mantiene fijo aunque después edite el marcador**. Es exactamente el dato necesario para "quién apostó primero" — no se puede manipular reapostando.

> ⚠️ Nota: `now()` en PostgreSQL devuelve el inicio de la transacción. Como cada usuario guarda en su propia transacción, dos usuarios distintos siempre tendrán timestamps distintos. Las múltiples predicciones de **un mismo** usuario guardadas en el mismo batch comparten timestamp (irrelevante, porque agregamos por usuario).

---

## 3. Decisión de diseño (requiere tu confirmación)

### 3.1 ¿Qué timestamp representa "cuándo apostó" en una apuesta?

Un usuario tiene **varias** filas en `predicciones` para una misma apuesta (una por partido). Hay que agregarlas a un solo instante:

| Opción | Significado | Recomendación |
|--------|-------------|---------------|
| **`MIN(fecha_registro)`** | El primer partido que predijo = "empezó a apostar primero" | ✅ **Recomendada** — interpretación literal de "apostó primero" |
| `MAX(fecha_registro)` | El último partido que predijo = "terminó de cargar primero" | Alternativa: premia a quien completó antes |

**Recomendación:** `MIN(fecha_registro)`. En la práctica casi no hay diferencia porque el flujo normal (`guardarBatch`) envía todas las predicciones en una sola transacción con el mismo `now()`. La distinción solo importa si el usuario carga partidos en momentos distintos.

### 3.2 Alcance

| Ranking | ¿Aplicar desempate por tiempo? | Detalle |
|---------|-------------------------------|---------|
| **Individual por apuesta** (`ranking_apuestas`) | ✅ Sí — objetivo principal | `MIN(fecha_registro)` del usuario en esa apuesta |
| **Global acumulado** (`ranking_global`) | ✅ Sí — por consistencia | `MIN(fecha_registro)` global del usuario (su primera predicción histórica). Ver caveat abajo |
| **Grupal por área** (`ranking_apuestas_grupales`) | ➕ Opcional — terciario | Mantiene `miembros_participantes` y agrega tiempo como 3er criterio |

> **Caveat global:** "quién apostó primero" es semánticamente difuso a nivel acumulado (suma de muchas apuestas). Se propone usar la primera predicción histórica del usuario como tiebreaker. Es determinista y razonable, pero si preferís otro criterio (ej. menos predicciones = más eficiente, o mantener empate visible), se ajusta.

---

## 4. Implementación

La posición se calcula **solo en las vistas**; las tablas de caché (`ranking_cache`, `ranking_global_cache`) copian la `posicion` ya calculada. Por lo tanto **el único cambio de lógica es en las vistas**, más un repoblado del caché. `refrescar_ranking()` y `refrescar_ranking_global()` **no necesitan cambios**.

### Migración: `supabase/20260608_10_desempate_por_fecha.sql`

```sql
-- ============================================================
-- MIGRACIÓN: Desempate de ranking por orden de apuesta.
-- Criterio: ante igualdad de puntos, gana quien apostó primero
-- (MIN(fecha_registro) más antiguo = mejor posición).
--
-- Solo cambia el ORDER BY de las ventanas rank()/RANK().
-- Se agrega la columna fecha_apuesta al final de cada vista
-- (CREATE OR REPLACE permite añadir columnas al final).
-- ============================================================

-- ── 1. Individual por apuesta ─────────────────────────────
CREATE OR REPLACE VIEW public.ranking_apuestas AS
 SELECT
    p.apuesta_id,
    p.user_id,
    u.nombre,
    u.area_id,
    COALESCE(sum(p.puntos), 0)::bigint AS puntos_totales,
    count(*) FILTER (WHERE p.puntos = a.puntos_exacto)        AS aciertos_exactos,
    count(*) FILTER (WHERE p.puntos = a.puntos_diferencia)    AS aciertos_diferencia,
    count(*) FILTER (WHERE p.puntos = a.puntos_clasificado
                       AND p.puntos <> a.puntos_resultado)    AS aciertos_clasificado,
    count(*) FILTER (WHERE p.puntos = a.puntos_resultado)     AS aciertos_resultado,
    count(*)                                                  AS predicciones,
    rank() OVER (
      PARTITION BY p.apuesta_id
      ORDER BY COALESCE(sum(p.puntos), 0)::bigint DESC,
               min(p.fecha_registro) ASC          -- ← DESEMPATE: apostó primero
    )                                                         AS posicion,
    min(p.fecha_registro)                                     AS fecha_apuesta
   FROM public.predicciones p
   JOIN public.usuarios u ON u.id = p.user_id
   JOIN public.apuestas a ON a.id = p.apuesta_id
  GROUP BY p.apuesta_id, p.user_id, u.nombre, u.area_id,
           a.puntos_exacto, a.puntos_diferencia, a.puntos_clasificado, a.puntos_resultado;


-- ── 2. Global acumulado ───────────────────────────────────
CREATE OR REPLACE VIEW public.ranking_global AS
 SELECT
    p.user_id,
    u.nombre,
    u.area_id,
    COALESCE(SUM(p.puntos), 0)::bigint AS puntos_totales,
    COUNT(*)                           AS predicciones,
    RANK() OVER (
      ORDER BY COALESCE(SUM(p.puntos), 0)::bigint DESC,
               MIN(p.fecha_registro) ASC          -- ← DESEMPATE: primera predicción histórica
    )                                  AS posicion,
    MIN(p.fecha_registro)              AS fecha_apuesta
   FROM public.predicciones p
   JOIN public.usuarios u ON u.id = p.user_id
   JOIN public.apuestas a ON a.id = p.apuesta_id
  WHERE a.estado IN ('cerrada', 'finalizada')
    AND p.puntos IS NOT NULL
  GROUP BY p.user_id, u.nombre, u.area_id;


-- ── 3. Grupal por área (opcional, tiempo como 3er criterio) ──
CREATE OR REPLACE VIEW public.ranking_apuestas_grupales AS
 WITH apuestas_grupales AS (
   SELECT id, puntos_exacto, puntos_diferencia, puntos_clasificado, puntos_resultado
   FROM public.apuestas
   WHERE tipo = 'grupos'
 ), combinaciones AS (
   SELECT a.id AS apuesta_id, a.puntos_exacto, a.puntos_diferencia,
          a.puntos_clasificado, a.puntos_resultado,
          ar.id AS area_id, ar.nombre AS area_nombre
   FROM apuestas_grupales a
   CROSS JOIN public.areas ar
   WHERE ar.activa = true
 ), predicciones_agregadas AS (
   SELECT c.apuesta_id, c.area_id, c.area_nombre,
     COALESCE(count(DISTINCT p.user_id), 0)                                  AS miembros_participantes,
     COALESCE(sum(p.puntos), 0)                                             AS puntos_totales,
     COALESCE(count(p.id) FILTER (WHERE p.puntos = c.puntos_exacto), 0)     AS aciertos_exactos,
     COALESCE(count(p.id) FILTER (WHERE p.puntos = c.puntos_diferencia), 0) AS aciertos_diferencia,
     COALESCE(count(p.id) FILTER (WHERE p.puntos = c.puntos_clasificado
                                    AND p.puntos <> c.puntos_resultado), 0) AS aciertos_clasificado,
     COALESCE(count(p.id) FILTER (WHERE p.puntos = c.puntos_resultado), 0)  AS aciertos_resultado,
     COALESCE(count(p.id), 0)                                               AS predicciones,
     min(p.fecha_registro)                                                  AS fecha_apuesta
   FROM combinaciones c
   LEFT JOIN public.predicciones p
     ON p.apuesta_id = c.apuesta_id AND p.area_id = c.area_id
   GROUP BY c.apuesta_id, c.area_id, c.area_nombre,
            c.puntos_exacto, c.puntos_diferencia, c.puntos_clasificado, c.puntos_resultado
 )
 SELECT apuesta_id, area_id, area_nombre, miembros_participantes, puntos_totales,
   aciertos_exactos, aciertos_diferencia, aciertos_clasificado, aciertos_resultado, predicciones,
   rank() OVER (
     PARTITION BY apuesta_id
     ORDER BY puntos_totales DESC,
              miembros_participantes DESC,
              fecha_apuesta ASC NULLS LAST    -- ← 3er criterio: el área que apostó primero
   ) AS posicion
 FROM predicciones_agregadas;


-- ── 4. Repoblar el caché con las nuevas posiciones ────────
-- refrescar_ranking() y refrescar_ranking_global() ya copian
-- la posición desde las vistas; solo hay que re-ejecutarlos.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.apuestas
           WHERE estado IN ('abierta', 'cerrada', 'finalizada')
  LOOP
    PERFORM public.refrescar_ranking(r.id);
  END LOOP;

  PERFORM public.refrescar_ranking_global();
END $$;

NOTIFY pgrst, 'reload schema';
```

> **Sobre `rank()` vs `row_number()`:** con el tiebreaker añadido, `rank()` ya produce posiciones únicas (dos filas comparten posición solo si tienen **idénticos** puntos **y** `fecha_apuesta` al microsegundo — prácticamente imposible entre usuarios distintos). Si querés garantía absoluta de unicidad incluso en ese caso límite, se puede cambiar `rank()` por `row_number()`. Recomiendo mantener `rank()` (cambio mínimo, comportamiento determinista).

> **Sobre `fecha_apuesta` en `ranking_cache`:** es opcional persistirla en la tabla de caché. Si querés mostrar/depurar el desempate en la UI, agregar la columna a `ranking_cache` y `ranking_global_cache` y mapearla en `refrescar_ranking()`/`refrescar_ranking_global()`. **No es necesaria** para que el desempate funcione, porque la `posicion` ya viene calculada.

---

## 5. Frontend

**No requiere cambios funcionales.** El frontend ya renderiza `posicion` directamente desde el caché:

- `src/dashboard/RankingPage.jsx:780` → `#${pos.posicion}`
- `src/dashboard/RankingPage.jsx:328` → `#${meta.mi_posicion.posicion}`
- `src/services/sheetsApi.js:879` → mapea `posicion` desde `ranking_cache`

No hay lógica de detección de empates en la UI, así que el cambio es transparente: las posiciones simplemente pasan a ser únicas y deterministas (mejora la experiencia, ya no hay posiciones ambiguas que cambian entre refrescos).

**Opcional (mejora de UX):** mostrar un tooltip "Desempatado por orden de apuesta" cuando dos usuarios consecutivos tienen el mismo `puntos_totales` pero distinta posición. Requiere persistir `fecha_apuesta` en el caché (ver nota arriba).

---

## 6. Casos de prueba / verificación

| # | Escenario | Resultado esperado |
|---|-----------|--------------------|
| 1 | Dos usuarios, mismos puntos, A apostó 10:00 y B 11:00 | A queda en mejor posición que B |
| 2 | B edita su predicción a las 12:00 (sin cambiar el resultado de aciertos) | A sigue por delante de B (la edición no reescribe `fecha_registro`) |
| 3 | Tres usuarios con puntajes 10, 10, 8 | Posiciones 1, 2, 3 (sin huecos), no "1, 1, 3" |
| 4 | Ranking global: dos usuarios mismos puntos acumulados | Desempata el de primera predicción histórica más antigua |
| 5 | Apuesta grupal: dos áreas mismos puntos y mismos miembros | Desempata el área que apostó primero |
| 6 | Refrescar el ranking dos veces seguidas | Las posiciones son idénticas y estables (determinismo) |

### Consulta de validación rápida (SQL)

```sql
-- Verificar que no quedan posiciones duplicadas en una apuesta
SELECT apuesta_id, posicion, count(*)
FROM ranking_cache
WHERE es_grupal = false
GROUP BY apuesta_id, posicion
HAVING count(*) > 1;   -- debe devolver 0 filas
```

---

## 7. Riesgos y consideraciones

| Nivel | Riesgo | Mitigación |
|-------|--------|------------|
| 🟢 Leve | Predicciones históricas sin `fecha_registro` confiable (datos migrados) | La columna tiene `DEFAULT now()`; filas viejas ya tienen valor. Verificar que no haya `NULL` antes de desplegar |
| 🟢 Leve | `CREATE OR REPLACE VIEW` falla si se intenta reordenar/quitar columnas existentes | El plan **solo agrega** `fecha_apuesta` al final → compatible. `refrescar_ranking` selecciona columnas por nombre, no por posición |
| 🟡 Medio | Repoblado del caché en producción con muchas apuestas | El bloque `DO $$` recorre todas las apuestas una vez. Ejecutar en ventana de bajo tráfico; es la misma operación que hace el scheduler |
| 🟡 Medio | Empate exacto al microsegundo (dos usuarios) | Extremadamente improbable entre transacciones distintas; `rank()` los dejaría empatados como fallback aceptable. Usar `row_number()` si se requiere unicidad absoluta |

---

## 8. Resumen

- **Hoy:** el ranking individual (por apuesta y global) **no desempata**; usa solo puntos y deja posiciones compartidas no deterministas.
- **Dato disponible:** `predicciones.fecha_registro`, estable ante ediciones (el upsert no lo reescribe).
- **Cambio:** agregar `MIN(fecha_registro) ASC` como criterio de desempate en el `ORDER BY` de las ventanas de las 3 vistas + repoblar caché. **Una sola migración SQL, sin cambios de frontend.**
- **Decisión pendiente de tu confirmación:** `MIN` vs `MAX` (recomiendo `MIN`) y si aplicar también al ranking global y grupal (recomendado por consistencia).
```
