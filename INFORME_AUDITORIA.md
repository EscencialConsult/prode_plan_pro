# Informe de Auditoría — Prode One

> **Proyecto:** Plataforma de predicciones deportivas (Mundial 2026)
> **Stack real:** React 19 + Vite + React Router 7 + Supabase (PostgreSQL + RLS + GoTrue Auth)
> **Objetivo del informe:** Identificar y clasificar problemas funcionales y de soporte a gran volumen (meta: **4.500 usuarios habilitados**).
> **Fecha:** 2026-06-03

---

## Resumen ejecutivo

| Categoría | 🔴 Alto | 🟠 Medio | 🟡 Bajo |
|---|---|---|---|
| **1. Errores Funcionales** | 3 | 6 | 4 |
| **2. Soporte a Gran Volumen** | 5 | 7 | 5 |

**Los 3 hallazgos más críticos:**

1. **El ranking nunca se actualiza automáticamente.** La tabla `ranking_cache` (única fuente del ranking) solo la puebla la función `refrescar_ranking()`, que **no se invoca en ningún lugar** del código (ni frontend, ni trigger, ni cron en el repo). → El ranking aparecerá vacío o congelado.
2. **Contención de escritura severa bajo carga.** Cada predicción dispara 3 triggers por fila, uno de los cuales hace `COUNT(DISTINCT…)` sobre toda la apuesta y actualiza **la misma fila** de `apuestas` en cada insert → serialización de escrituras. Con 4.500 usuarios cargando cerca del cierre, esto colapsa.
3. **Credenciales y schema de producción versionados en git** (`tests/load/k6_stress_test.js`, `public_schema.sql`) + **agujeros de RLS latentes** en `partidos`/`selecciones`.

---

# 1. Errores Funcionales

Problemas de lógica de negocio, flujos, validaciones, cálculos, integraciones, estado y comportamiento de pantallas.

## 🔴 Alto riesgo

### F-A1 · El ranking nunca se refresca (ranking vacío / congelado)
- **Dónde:** `public_schema.sql` (`refrescar_ranking`, vistas `ranking_apuestas*`, tabla `ranking_cache`) · `src/services/sheetsApi.js:846` (`predicciones.tabla` lee de `ranking_cache`).
- **Problema:** `predicciones.tabla()` lee **exclusivamente** de `ranking_cache`. Esa tabla solo se llena con `refrescar_ranking(p_apuesta_id)`. Una búsqueda global confirma que esa función **no se llama desde ningún lado**: no hay `.rpc('refrescar_ranking')` en el frontend, no hay trigger que la dispare, no hay cron en el repositorio.
- **Impacto:** El ranking individual y grupal se mostrará **vacío o desactualizado** permanentemente. El trigger `recalcular_puntos_partido` sí recalcula `predicciones.puntos` al finalizar un partido, pero **no toca `ranking_cache`** → aunque los puntos se actualicen, el ranking no refleja nada.
- **Acción:** Llamar `refrescar_ranking` desde `finalizar_apuesta`/`recalcular_puntos_partido` (trigger) o programar `pg_cron`. Documentar la dependencia.

### F-A2 · Inconsistencia de zona horaria: cuenta regresiva vs. cierre real (desfase de 3 h)
- **Dónde:** `src/utils/index.js:83` (`fechaArgentinaATimestamp`), `timeLeft()` · vs. `isBetOpen()` (`utils:161`) y `BetsPage.jsx:21` (otro `timeLeft` inline).
- **Problema:** `fecha_cierre` se guarda como **UTC real** (`inputLocalAIsoUtc` → `toISOString()`, termina en `Z`). Pero `utils.timeLeft()` reinterpreta el sufijo `Z` como **hora Argentina (UTC-3)**, desfasando el cálculo. En cambio `isBetOpen()` y la DB (`fecha_cierre <= now()`) usan UTC correcto. Además existe un **segundo `timeLeft` distinto** embebido en `BetsPage.jsx` que sí usa UTC.
- **Impacto:** La cuenta regresiva del `PredictModal` puede mostrar **hasta 3 horas de diferencia** respecto al cierre real. El usuario puede creer que tiene tiempo cuando la apuesta ya cerró (o al revés). Distintas pantallas muestran distintos contadores.
- **Acción:** Unificar en una sola función UTC-consistente; eliminar la reinterpretación de `Z`.

### F-A3 · Código legacy roto y exportado (`authService`, `betsService`)
- **Dónde:** `src/services/authService.js`, `src/services/betsService.js`, exportados en `src/services/index.js:13-14`.
- **Problema:** Ambos llaman métodos **inexistentes** en el `sheetsApi` actual (`sheetsApi.getUsers()`, `addUser()`, `getBets()`, `addBet()`, `addPrediction()`) — vestigios de la era Google Sheets. Además `authService.login` compara **contraseñas en texto plano** (`user[6] !== 'true'`) y `register` guarda la password sin hashear.
- **Impacto:** Cualquier import que use `services/index.js` y toque estos servicios → **crash en runtime**. Si `authService` se vuelve a cablear por error, es un agujero de seguridad grave (passwords en claro).
- **Acción:** Eliminar `authService.js`, `betsService.js`, `sheetsApi.OLD.js` y limpiar `services/index.js`.

## 🟠 Medio riesgo

### F-M1 · `apuestas.crear` no es atómico (rollback manual frágil)
- **Dónde:** `src/services/sheetsApi.js:586-638`.
- **Problema:** Inserta en 3 pasos (`apuestas` → `apuesta_partidos` → `apuesta_areas`) con rollback manual en JS (`delete`). Si el trigger `validar_partidos_exclusivos` lanza error al insertar partidos, se borra la apuesta; pero si ese `delete` falla o se corta la red, queda una **apuesta huérfana sin partidos**.
- **Acción:** Mover la creación a una sola función RPC transaccional (`SECURITY DEFINER`).

### F-M2 · Conteo de aciertos ambiguo cuando los puntajes coinciden
- **Dónde:** Vistas `ranking_apuestas` / `ranking_apuestas_grupales` (`public_schema.sql:1134-1180`).
- **Problema:** Los `aciertos_exactos/diferencia/resultado/clasificado` se derivan comparando `puntos` con el valor de cada categoría (`p.puntos = a.puntos_diferencia`, etc.). Con los defaults `puntos_resultado=1` y `puntos_clasificado=1`, dos categorías valen lo mismo y se vuelven indistinguibles; la vista intenta desambiguar con `puntos <> puntos_resultado`, pero si un admin configura valores iguales, **los conteos por categoría quedan mal**.
- **Acción:** Persistir la categoría de acierto explícitamente al calcular puntos, no inferirla del valor.

### F-M3 · Ranking grupal cambia retroactivamente al (des)activar áreas
- **Dónde:** `ranking_apuestas_grupales` (CROSS JOIN con `areas WHERE activa = true`).
- **Problema:** El ranking grupal se arma cruzando con las áreas **actualmente activas**. Si se desactiva un área que participó, desaparece del ranking; si se agrega una nueva, aparece con 0. El histórico no es estable.
- **Acción:** Congelar las áreas participantes por apuesta (snapshot en `apuesta_areas`).

### F-M4 · Documentación contradictoria con la implementación real
- **Dónde:** `README.md`, `.env.example`.
- **Problema:** El README describe **Google Sheets como base de datos**, "Vite 8.0.4" y un esquema de hojas; el `.env.example` pide `VITE_GAS_URL` (Apps Script). La app real usa **Supabase** y necesita `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (`sheetsApi.js:22-23`).
- **Impacto:** Un dev nuevo **no puede configurar el proyecto** siguiendo la doc; el `.env.example` está completamente desalineado.
- **Acción:** Reescribir README y `.env.example` para Supabase.

### F-M5 · Sin Error Boundary global
- **Dónde:** `src/App.jsx`, `src/main.jsx`.
- **Problema:** No hay `<ErrorBoundary>`. Cualquier excepción de render (p. ej. una fila de datos malformada) desmonta toda la app a **pantalla en blanco**.
- **Impacto:** Con 4.500 usuarios, un solo registro corrupto puede tirar la pantalla a muchos. Sin telemetría de errores.
- **Acción:** Envolver las rutas en un Error Boundary con fallback y logging.

### F-M6 · Dos caminos de guardado de predicción con validaciones distintas
- **Dónde:** `predicciones.guardar` (upsert directo) vs. `predicciones.guardarBatch` (RPC). La app usa el batch (`BetsPage.jsx:183`).
- **Problema:** `guardar` (single) confía en los triggers y no replica las validaciones de apuesta abierta/área que sí hace el RPC en capa app. Código muerto/redundante que puede usarse por error con menos garantías.
- **Acción:** Eliminar el camino single o unificarlo con el RPC.

## 🟡 Bajo riesgo

### F-B1 · Logs de debug en producción
`console.log('🔴 CERRANDO MODAL')` (`PredictModal.jsx:259`), logs de fixture (`useFixtureSWR.js`) y de sesión. Ruido y fuga menor de información interna.

### F-B2 · Borradores de localStorage sin limpieza
`PredictModal.jsx:105` guarda `bet-${id}-draft` por apuesta; solo se borra al guardar con éxito. Crecimiento lento del storage del cliente.

### F-B3 · `isBetOpen` deja abierta para siempre si falta `fecha_cierre`
`utils/index.js:163` devuelve `true` cuando `fecha_cierre` es null. La DB la exige `NOT NULL`, pero el cliente no debería confiar en datos sin validar.

### F-B4 · Parsing frágil de minuto/estado
`extraerMinuto` (`sheetsApi.js:207`) depende de regex sobre `estado_raw` de la API externa; cambios de formato rompen el minuto en vivo (cosmético).

---

# 2. Errores de Soporte a Gran Volumen de Usuarios

Rendimiento, escalabilidad, concurrencia, seguridad, disponibilidad e integridad bajo carga para **4.500 usuarios habilitados**.

## 🔴 Alto riesgo

### V-A1 · Amplificación de escritura y contención de locks por triggers de predicción
- **Dónde:** Triggers sobre `predicciones`: `validar_prediccion_integridad`, `calc_puntos_al_predecir`, `actualizar_total_participantes` (`public_schema.sql`).
- **Problema:** Cada **fila** de predicción dispara:
  1. `validar_prediccion_integridad` → 4+ SELECT (`apuestas`, `usuarios`, `apuesta_partidos`, `partidos`).
  2. `calc_puntos_al_predecir` → 2 SELECT más.
  3. `actualizar_total_participantes` (AFTER INSERT/DELETE) → `COUNT(DISTINCT user_id/area_id)` sobre **todas** las predicciones de la apuesta + `UPDATE` de **la misma fila** de `apuestas`.
  Una carga batch de N partidos multiplica todo ×N. El `UPDATE total_participantes` golpea **la misma fila** desde cada usuario concurrente → **serialización por row-lock**.
- **Impacto:** Cerca de un cierre, 4.500 usuarios guardando a la vez serializan en una fila por apuesta y ejecutan un `COUNT` O(n) por cada insert → **timeouts y caída de throughput**. El propio k6 (`rate: 50/s`) ya estresa esto.
- **Acción:** Quitar el recálculo de `total_participantes` del trigger por fila (hacerlo una vez en el RPC batch, como ya hace `guardar_predicciones_apuesta`, y/o asíncrono). Reducir SELECTs combinando validaciones.

### V-A2 · Credenciales y URL de producción versionadas en git
- **Dónde:** `tests/load/k6_stress_test.js:37-38`.
- **Problema:** URL real del proyecto (`https://yexepwfqubeicrbqkekq.supabase.co`) y `SUPABASE_KEY` (`sb_publishable_…`) **hardcodeadas y commiteadas**. Aunque las *publishable/anon keys* son públicas por diseño, exponer el **project ref de producción** + tener el script de carga apuntando a prod facilita abuso (alta masiva, DoS, sondeo de RLS).
- **Acción:** Mover a variables de entorno; rotar el proyecto si fue expuesto públicamente; el k6 nunca debe apuntar a prod por default.

### V-A3 · Dump completo del schema versionado (`public_schema.sql`)
- **Dónde:** `public_schema.sql` (1961 líneas, untracked → a punto de commitearse).
- **Problema:** Expone **toda** la estructura: tablas, políticas RLS, funciones `SECURITY DEFINER`, triggers e incluso el token `\restrict` del dump. Es un mapa para buscar huecos de RLS.
- **Acción:** No versionar dumps de producción; mover migraciones a `supabase/migrations` sin datos sensibles.

### V-A4 · Agujeros latentes de RLS en `partidos` y `selecciones`
- **Dónde:** `public_schema.sql:1655,1662,1789,1796` — políticas `allow_insert_all` / `insert_all` con `WITH CHECK (true)` y `USING (true)`.
- **Problema:** Las políticas de INSERT están **completamente abiertas**. Hoy lo frena la capa de GRANT (a `authenticated` solo se le da `SELECT` sobre `partidos`/`selecciones`), pero **un solo `GRANT INSERT` futuro** (o acceso anon) habilita a cualquiera a **falsificar partidos y resultados**.
- **Impacto:** Si se explota, se corrompen los goles reales → **todos los puntos y rankings quedan adulterados**. Defensa en profundidad muy frágil.
- **Acción:** Restringir las políticas a `es_admin()` con `WITH CHECK` acorde; eliminar `allow_insert_all`/`insert_all`.

### V-A5 · Sin pipeline automático de puntuación/ranking → cuello de botella operativo
- **Dónde:** `finalizar_apuesta` / `finalizar_apuestas_listas` (manual, admin) + ausencia de refresh de ranking (ver F-A1).
- **Problema:** La finalización de apuestas y el refresco de ranking dependen de **acciones manuales del admin**. Con 4.500 usuarios y múltiples apuestas/partidos por jornada, la operación manual no escala y el ranking estará incorrecto justo en el pico de interés (post-partido).
- **Acción:** Automatizar finalización + refresh con `pg_cron`/Edge Functions disparadas por la sincronización de resultados.

## 🟠 Medio riesgo

### V-M1 · Inyección de filtro PostgREST en búsqueda de usuarios
- **Dónde:** `sheetsApi.js:472` → `.or(\`nombre.ilike.%${search}%,email.ilike.%${search}%\`)`.
- **Problema:** Interpola input crudo del admin en el string de filtro de PostgREST. Caracteres como `,`, `)` o `*` pueden **romper o alterar la lógica del filtro** (PostgREST filter injection). Aunque es panel admin, sigue siendo un vector.
- **Acción:** Usar el builder `.ilike()` parametrizado o escapar/validar `search`.

### V-M2 · Vistas de ranking costosas (agregaciones + CROSS JOIN)
- **Dónde:** `ranking_apuestas_grupales` (`apuestas_grupales CROSS JOIN areas LEFT JOIN predicciones` + window `rank()`).
- **Problema:** El refresh recalcula agregaciones pesadas. A escala (4.500 usuarios × muchas predicciones) cada `refrescar_ranking` es caro; sin throttling/scheduling adecuado, llamarlo en caliente sería costoso. El diseño con `ranking_cache` es correcto; falta la **planificación** del refresh.
- **Acción:** Refrescar por apuesta de forma incremental y agendada; índices ya existen (`idx_ranking_cache_apuesta`).

### V-M3 · Lecturas de tablas completas sin paginación en el arranque
- **Dónde:** `bootstrap.cargar` (`sheetsApi.js:1008`), `partidos.listar`, `apuestas.listar`.
- **Problema:** Cada dashboard trae **todos** los partidos y **todas** las apuestas con joins anidados. Hoy el fixture es chico (~104 partidos), pero apuestas/predicciones crecen. 4.500 usuarios refrescando → muchos `SELECT` con joins contra el pooler.
- **Acción:** Paginar/segmentar; cachear en edge (ver V-M4).

### V-M4 · Sin caché de borde/CDN para las lecturas calientes
- **Problema:** Las lecturas más frecuentes (ranking, fixture) van **directo a Supabase REST**. Solo hay caché en memoria + localStorage por cliente. 4.500 concurrentes presionan el connection pooler.
- **Acción:** Cachear ranking/fixture en CDN/edge (son datos compartidos y casi estáticos entre refrescos).

### V-M5 · Condición de carrera TOCTOU en `areas.toggle_activa`
- **Dónde:** `sheetsApi.js:993` (lee `activa`, luego escribe el opuesto).
- **Problema:** Read-then-write no atómico; dos admins concurrentes pueden dejar el estado inconsistente.
- **Acción:** `UPDATE areas SET activa = NOT activa WHERE id = …` en una sola sentencia.

### V-M6 · Registro sin rate limiting de aplicación
- **Dónde:** `auth.registro` (`sheetsApi.js:323`) + trigger `handle_new_user`.
- **Problema:** Solo se confía en los límites por defecto de Supabase. Alta masiva inflaría `usuarios`/`auth.users` (quedan en `pendiente`, blast radius limitado, pero crecimiento y ruido en `auditoria`).
- **Acción:** CAPTCHA / rate limit / verificación de email antes de crear perfil.

### V-M7 · JWT en `localStorage` (superficie XSS)
- **Dónde:** `sheetsApi.js:37` (`storage: window.localStorage`).
- **Problema:** Patrón estándar de Supabase, pero un XSS exfiltra el token de sesión. A escala, la superficie importa.
- **Acción:** Mantener CSP estricta y sanitización; evaluar cookies httpOnly vía SSR si aplica.

## 🟡 Bajo riesgo

### V-B1 · Crecimiento ilimitado de `auditoria` y `ranking_cache`
Sin política de retención. `auditoria` crece con cada aprobación/finalización. Definir retención/particionado.

### V-B2 · Recarga dura en expiración de sesión
`manejarSesionExpirada` hace `window.location.href = '/login'` (`sheetsApi.js:130`) → recarga completa de la SPA. UX pesada bajo errores transitorios de JWT.

### V-B3 · Comparaciones `JSON.stringify` masivas en hooks SWR
`useFixtureSWR`/`useSWR` comparan estado con `JSON.stringify` completo en cada revalidación (`useFixtureSWR.js:90,224`). Costo de CPU en cliente con fixtures grandes.

### V-B4 · Cachés múltiples que pueden desincronizarse
`CLIENT_CACHE` (memoria) + localStorage (SWR) + sessionStorage (`prode_user`) conviven; pese a `invalidateClientCache`, pueden mostrar datos viejos tras una escritura.

### V-B5 · Sin timeouts de statement a nivel app
Consultas largas de ranking podrían acumularse sin límite explícito desde el cliente. Configurar timeouts/`abortSignal` consistentes (ya se usa parcialmente).

---

## Anexo · Aspectos correctos detectados (no requieren acción)

Para balance, el proyecto **sí** acierta en varios puntos clave de robustez:

- **RLS bien aplicada** en `predicciones`, `usuarios`, `apuestas` (políticas por `auth.uid()`, `es_admin()`, `mi_area_id()`).
- **Validación de integridad server-side** vía triggers (`validar_prediccion_integridad`, exclusividad de partidos) — no se confía solo en el cliente.
- **Cálculo de puntos centralizado en la DB** (`calcular_puntos_prediccion`), difícil de manipular desde el frontend.
- **Cambio/reset de contraseña** usa GoTrue (bcrypt) correctamente; mensajes genéricos que no revelan existencia de email.
- **`ranking_cache` + índices parciales** es el patrón correcto para escalar lecturas (solo falta dispararlo).
- **Caché cliente con TTL** e `AbortController` para evitar requests duplicados.

> **Prioridad sugerida de remediación:** F-A1 y V-A1 (bloquean la experiencia central a escala) → V-A2/V-A3/V-A4 (seguridad) → F-A2/F-A3 → resto.
