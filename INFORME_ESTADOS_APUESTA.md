# Informe: Estados de una Apuesta (PRODE)

> Análisis del ciclo de vida de una **apuesta** en el proyecto PRODE: qué estados
> existen, qué significan, cómo se manejan y qué transiciones son válidas.
> Fecha: 2026-06-04.

---

## 1. Resumen ejecutivo

Una **apuesta** (entidad `apuestas`) tiene exactamente **3 estados posibles**, definidos
por un `CHECK` en la base de datos. No hay más valores legales:

| Estado | Significado | ¿Se puede predecir? | ¿Cuenta en ranking global? |
|--------|-------------|---------------------|----------------------------|
| `abierta` | Apuesta vigente, admite predicciones | ✅ Sí (hasta `fecha_cierre`) | ❌ No |
| `cerrada` | Ya no admite predicciones; partidos en juego/por finalizar | ❌ No | ✅ Sí |
| `finalizada` | Todos los partidos terminados y puntos calculados en definitiva | ❌ No | ✅ Sí |

> ⚠️ **No confundir** el *estado de la apuesta* con el *estado de un partido*
> (`programado` / `en_vivo` / `finalizado` / `cancelado`) ni con el *estado de un usuario*
> (`pendiente` / `activo` / `bloqueado`). Son tres máquinas de estado distintas. Ver §6.

---

## 2. Definición en base de datos

**Tabla `apuestas`** — [public_schema.sql:196](public_schema.sql#L196)

```sql
CREATE TABLE public.apuestas (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    titulo text NOT NULL,
    descripcion text DEFAULT ''::text,
    tipo text NOT NULL,                      -- 'libre' | 'grupos'
    premio text NOT NULL,
    fecha_cierre timestamp with time zone NOT NULL,
    estado text DEFAULT 'abierta'::text NOT NULL,   -- ← ESTADO
    puntos_exacto integer DEFAULT 5,
    puntos_diferencia integer DEFAULT 3,
    puntos_resultado integer DEFAULT 1,
    puntos_clasificado integer DEFAULT 1,
    creado_por uuid,
    fecha_creacion timestamp with time zone DEFAULT now(),
    total_participantes integer DEFAULT 0,
    CONSTRAINT apuestas_estado_check
        CHECK (estado = ANY (ARRAY['abierta'::text, 'cerrada'::text, 'finalizada'::text])),
    CONSTRAINT apuestas_tipo_check
        CHECK (tipo = ANY (ARRAY['libre'::text, 'grupos'::text]))
);
```

Puntos clave:
- **Valor por defecto**: `'abierta'` — toda apuesta nace abierta.
- **Restricción** `apuestas_estado_check` ([public_schema.sql:211](public_schema.sql#L211)):
  solo se aceptan `abierta`, `cerrada`, `finalizada`. Cualquier otro valor lanza error.
- **`fecha_cierre`** es independiente del estado: una apuesta puede seguir siendo
  `abierta` aunque haya pasado su `fecha_cierre` (ver §5, la distinción "abierta de jure"
  vs "abierta de facto").

---

## 3. Significado de cada estado

### 🟢 `abierta`
- Estado inicial al crear la apuesta.
- Los usuarios **pueden cargar y editar** sus predicciones, **siempre que** no haya pasado
  la `fecha_cierre` y que el usuario esté `activo`.
- Los puntos de predicciones permanecen en `NULL` hasta que cada partido finaliza.
- **No** suma al `ranking_global` todavía.

### ⚫ `cerrada`
- Ya **no se admiten** nuevas predicciones ni ediciones.
- La apuesta está "en curso": sus partidos pueden estar `programado`, `en_vivo` o ya
  `finalizado`. A medida que los partidos terminan, los puntos se **recalculan
  automáticamente** (cada ~5 min, ver §4.4).
- **Sí** participa en el `ranking_global` (suma de puntos ya calculados).
- Es un estado **intermedio**: espera a que todos los partidos terminen.

### 🟡 `finalizada`
- Estado **terminal**. Todos los partidos asociados están `finalizado`, con goles
  cargados (y penales si hubo empate en fase eliminatoria).
- Los puntos quedan **calculados en definitiva**; no deberían cambiar más.
- **Sí** participa en el `ranking_global`.
- Una apuesta finalizada **no puede volver** a abierta/cerrada (la RPC lo impide).

---

## 4. Cómo se manejan las transiciones

```
                 crear()                cerrar()              finalizar() / auto
   (no existe) ─────────► [abierta] ───────────► [cerrada] ─────────────────► [finalizada]
                              │                                                     ▲
                              └─────────────── auto-finalización ───────────────────┘
                                  (si todos los partidos ya están finalizados)
```

### 4.1 Creación → `abierta`
[src/services/sheetsApi.js:586](src/services/sheetsApi.js#L586) — `apuestas.crear()`
inserta la fila sin especificar `estado`, por lo que toma el default `'abierta'`.

### 4.2 `abierta` → `cerrada` (manual, admin)
[src/services/sheetsApi.js:640](src/services/sheetsApi.js#L640) — `apuestas.cerrar()`:
```js
await supabase.from('apuestas').update({ estado: 'cerrada' }).eq('id', apuesta_id)
```
Disparado desde el panel admin ([src/components/admin/BetsTab.jsx](src/components/admin/BetsTab.jsx)).
Cierra la apuesta para nuevas predicciones.

### 4.3 `cerrada`/`abierta` → `finalizada` (manual, admin)
[src/services/sheetsApi.js:648](src/services/sheetsApi.js#L648) — `apuestas.finalizar()`
invoca la RPC `finalizar_apuesta(p_apuesta_id)`
([public_schema.sql:384](public_schema.sql#L384)), que **valida antes de finalizar**:

- El llamante debe ser **admin** (`es_admin()`).
- La apuesta **no** debe estar ya `finalizada`.
- **Todos** los partidos deben estar `finalizado` con `goles_local` y `goles_visitante`
  no nulos.
- En **fase eliminatoria** con empate en los 90', deben estar cargados
  `penales_local` y `penales_visit`.

Si algún partido no cumple → `raise exception 'Hay N partidos sin finalizar correctamente'`
y la transición se aborta. Si todo OK → `UPDATE apuestas SET estado = 'finalizada'` + registro en `auditoria`.

### 4.4 Auto-finalización (automática)
[supabase/20260604_05_ranking_global_migration.sql:250](supabase/20260604_05_ranking_global_migration.sql#L250) —
dentro de la RPC `refrescar_rankings_por_partidos()` (que corre periódicamente, ~cada 5 min
vía AppScript) se ejecuta:

```sql
UPDATE public.apuestas a
SET estado = 'finalizada'
WHERE estado IN ('abierta', 'cerrada')
  AND NOT EXISTS ( -- no quedan partidos pendientes de finalizar
    SELECT 1 FROM public.apuesta_partidos ap
    JOIN public.partidos p ON p.id = ap.partido_id
    WHERE ap.apuesta_id = a.id
      AND ( p.estado <> 'finalizado'
            OR p.goles_local IS NULL OR p.goles_visitante IS NULL
            OR (public.es_fase_eliminatoria(p.fase)
                AND p.goles_local = p.goles_visitante
                AND (p.penales_local IS NULL OR p.penales_visit IS NULL)) )
  );
```

Es decir: una apuesta `abierta` o `cerrada` pasa **sola** a `finalizada` en cuanto todos
sus partidos quedan correctamente finalizados — sin intervención del admin.

---

## 5. El estado lógico "abierta de facto" en el frontend

El frontend distingue entre el **estado almacenado** (`bet.estado`) y si la apuesta está
**efectivamente abierta** según la fecha. El helper `isBetOpen()` combina ambos:

```js
// src/utils  (usado en Dashboard, BetsPage, BetsTab)
isBetOpen(bet) = bet.estado === 'abierta' && new Date(bet.fecha_cierre) > new Date()
```

Esto crea cuatro situaciones visibles al usuario:

| `bet.estado` | `fecha_cierre` | `isBetOpen()` | Cómo se muestra / comporta |
|--------------|----------------|---------------|----------------------------|
| `abierta` | en el futuro | `true` | **Activa** — admite predicciones |
| `abierta` | ya pasó | `false` | Aparece como "Cerrada" aunque el `estado` siga siendo `abierta` |
| `cerrada` | cualquiera | `false` | **Cerrada** |
| `finalizada` | cualquiera | `false` | **Finalizada** |

Además, en `DashboardPage` se marca con un punto rojo si algún partido está `en_vivo`
([src/dashboard/DashboardPage.jsx:40](src/dashboard/DashboardPage.jsx#L40)).

### Estilos visuales por estado
[src/dashboard/BetsPage.jsx:36](src/dashboard/BetsPage.jsx#L36) define la paleta de etiquetas:

```js
const STATE = {
  en_vivo:    { label:'EN VIVO',    color:'#e03252' },  // rojo  (derivado de partido en vivo)
  abierta:    { label:'ABIERTA',    color:'#1b8a5a' },  // verde
  cerrada:    { label:'CERRADA',    color:'#5f6e8a' },  // gris
  finalizada: { label:'FINALIZADA', color:'#0057B8' },  // dorado
}
```
> Nota: `en_vivo` **no** es un estado de la apuesta en la BD; es una etiqueta visual
> derivada de que uno de sus partidos esté `en_vivo`. Misma paleta en
> [src/components/user/BetCard.jsx:5](src/components/user/BetCard.jsx#L5) y
> [src/components/admin/BetsTab.jsx:5](src/components/admin/BetsTab.jsx#L5).

---

## 6. Estados relacionados (no son estados de la apuesta)

Para evitar confusiones, estos estados pertenecen a **otras** entidades pero influyen
en la apuesta:

**`partidos.estado`** — [public_schema.sql:236](public_schema.sql#L236)
`'programado' | 'en_vivo' | 'finalizado' | 'cancelado'`. Solo cuando un partido está
`finalizado` (con goles) se calculan los puntos de las predicciones asociadas, y solo
cuando **todos** los partidos están `finalizado` la apuesta puede pasar a `finalizada`.

**`usuarios.estado`** — [public_schema.sql:1118](public_schema.sql#L1118)
`'pendiente' | 'activo' | 'bloqueado'`. Un usuario debe estar `activo` para poder
predecir en una apuesta `abierta`.

---

## 7. Impacto del estado en puntos y ranking

- **Cálculo de puntos**: ocurre por partido finalizado, no por estado de apuesta. La
  función `calcular_puntos_prediccion()` ([public_schema.sql:244](public_schema.sql#L244))
  asigna `puntos_exacto` (5), `puntos_diferencia` (3), `puntos_resultado` (1) o
  `puntos_clasificado` (1) según el acierto. Los recálculos automáticos solo tocan
  apuestas en estado `('abierta','cerrada')`
  ([20260604_05_ranking_global_migration.sql:156](supabase/20260604_05_ranking_global_migration.sql#L156)).

- **Ranking global**: la vista `ranking_global`
  ([20260604_05_ranking_global_migration.sql:11](supabase/20260604_05_ranking_global_migration.sql#L11))
  **solo suma** puntos de apuestas en estado `('cerrada','finalizada')`. Las apuestas
  `abierta` quedan fuera del ranking global hasta cerrarse o finalizar.

---

## 8. Conclusión

- La apuesta tiene **3 estados** (`abierta` → `cerrada` → `finalizada`), con posibilidad
  de salto directo `abierta` → `finalizada` por auto-finalización.
- El cambio a `cerrada` lo hace el **admin** manualmente; el cambio a `finalizada` puede
  ser **manual** (con validación estricta de partidos) o **automático** (cuando todos los
  partidos terminan).
- El frontend agrega un matiz: una apuesta `abierta` con `fecha_cierre` vencida se ve y
  comporta como cerrada (`isBetOpen()`), y "EN VIVO" es una etiqueta derivada, no un
  estado real.
- El estado de la apuesta gobierna su inclusión en el **ranking global**
  (`cerrada`/`finalizada`), mientras que los **puntos** dependen del estado de cada
  **partido**.

---

### Archivos clave

| Archivo | Rol |
|---------|-----|
| [public_schema.sql:196](public_schema.sql#L196) | Definición de tabla `apuestas` + CHECK del estado |
| [public_schema.sql:384](public_schema.sql#L384) | RPC `finalizar_apuesta()` (validación + transición) |
| [supabase/20260604_05_ranking_global_migration.sql](supabase/20260604_05_ranking_global_migration.sql) | Auto-finalización, recálculo y `ranking_global` |
| [src/services/sheetsApi.js:519](src/services/sheetsApi.js#L519) | API cliente: listar / crear / cerrar / finalizar |
| [src/dashboard/BetsPage.jsx:36](src/dashboard/BetsPage.jsx#L36) | Etiquetas/estilos por estado y filtros |
| [src/components/admin/BetsTab.jsx](src/components/admin/BetsTab.jsx) | Panel admin: cerrar / finalizar |
| [src/components/user/BetCard.jsx:5](src/components/user/BetCard.jsx#L5) | Tarjeta de apuesta con estado visual |
