# Análisis de Planes — Prode One (`plan_pro` vs `plan_basic`)

> Documento técnico generado a partir de la revisión del código fuente (`src/`) y del esquema de base de datos (`public_schema.sql`).
> El sistema es **single‑tenant**: toda la instalación opera bajo **un** plan global a la vez, definido a nivel de empresa. No existe una tabla de "planes"; el plan es un *string* (`plan_basic` / `plan_pro`) que actúa como *feature flag* transversal.

---

## 1. Plan Pro

### 1.1 Funcionalidades principales y ventajas

`plan_pro` es el plan superior. Habilita **todo lo de Plan Basic** y, además:

| Funcionalidad | Descripción | Dónde se evidencia |
|---------------|-------------|--------------------|
| **Áreas / sectores** | Gestión de departamentos de la empresa (tabla `areas`). El admin crea, edita y activa/desactiva áreas. | `sheetsApi.js` (`areas.*`, líneas 1064‑1111); `AreasTab.jsx` |
| **Asignación de usuarios a áreas** | Al aprobar un usuario, el admin le asigna un área. | `AdminPage.jsx:815` (selector de área); `aprobar_usuario()` RPC |
| **Apuestas grupales** (`tipo = 'grupos'`) | Además del puntaje individual, el puntaje suma al **ranking del área**; las áreas compiten entre sí. | `CreateBetForm.jsx:568,594`; `Eliminatorias.jsx:281,308` |
| **Selección de áreas competidoras** | En una apuesta grupal se eligen ≥2 áreas (o "todas las activas compiten automáticamente"). | `Eliminatorias.jsx:245`; `CreateBetForm.jsx:608` |
| **Ranking por área** | Vista agregada que rankea áreas. | Vista `ranking_apuestas_grupales` (`public_schema.sql:1150`) |
| **Selector de tipo de apuesta** | El admin elige entre apuesta `libre` (individual) o `grupos`. | `CreateBetForm.jsx:568` |
| **Badges visuales GRUPAL / INDIVIDUAL** | Identificación visual del tipo de apuesta en la UI del usuario. | `BetCard.jsx:154‑155` |

**Ventaja central:** introduce la dimensión **colaborativa/competitiva por sector**, lo que aumenta el *engagement* (cada usuario juega por sí mismo y por su área), frente al modelo plano de Basic.

### 1.2 Limitaciones y requisitos específicos

- **Requiere área asignada para apuestas grupales.** La política RLS de inserción de predicciones exige `mi_area_id() IS NOT NULL` **y** `NOT plan_basic()` para predecir en apuestas `grupos` (`public_schema.sql:1840`). Un usuario Pro sin área **no puede** predecir en grupales.
- **Aprobación bloqueada sin área.** En el panel admin, el botón de aprobar queda deshabilitado si el usuario no tiene área: `disabled={... || (isPro && !approvingUser.area_id)}` (`AdminPage.jsx:912`).
- **`tipo_usuario` siempre `'general'`.** Aunque el plan contempla áreas, `aprobar_usuario()` **fuerza** `tipo_usuario = 'general'` e ignora el parámetro recibido (`public_schema.sql:145`). El concepto de "jefe de área" aparece en la UI pero no se persiste como rol diferenciado.
- **Sin self‑service.** No hay interfaz para activar Pro: depende de `config.plan_empresa = 'plan_pro'` editado manualmente en la base de datos.
- **Costo de cómputo.** El ranking grupal (`CROSS JOIN areas` + `window rank()`) es caro a escala; depende de `ranking_cache` con refresh aún sin agendar (ver `INFORME_AUDITORIA.md`).

---

## 2. Comparación con Plan Basic

| Dimensión | **Plan Basic** | **Plan Pro** |
|-----------|----------------|--------------|
| Apuestas individuales (`libre`) | ✅ | ✅ |
| Apuestas grupales (`grupos`) | ❌ (bloqueado por RLS) | ✅ |
| Áreas / sectores | ❌ | ✅ |
| Asignación de área al aprobar | ❌ — forzado `area_id = null` | ✅ — área obligatoria |
| Ranking | Único ranking global | Global **+** ranking por área |
| Selector de tipo de apuesta (admin) | Oculto (siempre `libre`) | Visible |
| Selector de área / tipo de usuario (admin) | Oculto; se muestra cartel informativo | Visible |
| Badges GRUPAL/INDIVIDUAL | Ocultos | Visibles |
| Complejidad operativa | Baja (cero configuración) | Media (gestión de áreas) |
| Público objetivo | Empresas chicas / torneo simple | Empresas con sectores que compiten |

**Diferencia clave de alcance:** Basic es un torneo plano donde todos compiten en una sola tabla; Pro añade una jerarquía organizativa (áreas) y un segundo eje de competencia (área vs área). La restricción **real** que separa ambos planes vive en la base de datos (RLS), no en el frontend — el frontend solo decide qué mostrar.

---

## 3. Scripts y configuraciones donde se definen y validan los planes

### 3.1 Frontend (React + Vite)

| Archivo | Rol respecto a los planes |
|---------|---------------------------|
| `src/hooks/useAuth.jsx` (líneas 151‑169) | **Punto único de decisión del plan en frontend.** Calcula `isPlanBasic` / `isPro` desde `user.empresa` y los expone por contexto. |
| `src/pages/AdminPage.jsx` (39, 100, 106, 199, 214, 769, 815, 877, 912) | Render condicional del panel admin: carga de áreas, selector de área/tipo, validación de aprobación, cartel para Basic. |
| `src/components/admin/CreateBetForm.jsx` (111, 568, 594, 608) | Muestra/oculta el selector de tipo de apuesta y la info de áreas según `isPro`. |
| `src/components/admin/Eliminatorias.jsx` (103, 245, 281, 308) | Igual que el anterior para apuestas de fase eliminatoria; valida ≥2 áreas en grupales. |
| `src/components/user/BetCard.jsx` (86, 154‑155) | Muestra badges GRUPAL/INDIVIDUAL solo en Pro. |
| `src/services/sheetsApi.js` | Capa de acceso a Supabase: RPC `aprobar_usuario` (508), creación de apuestas con áreas (641‑645), CRUD de `areas` (1064‑1111). |

> No existe ningún script de frontend que **escriba** `config.plan_empresa`. La búsqueda de `plan_empresa`/`config` en `src/` no arroja resultados: el plan global se administra fuera de la app.

### 3.2 Supabase / PostgreSQL (`public_schema.sql`)

| Objeto | Tipo | Rol respecto a los planes |
|--------|------|---------------------------|
| `config (clave='plan_empresa', valor)` | Tabla | **Fuente de verdad global** del plan de la empresa. |
| `usuarios.empresa` (default `'plan_basic'`) | Columna | Copia del plan sellada por usuario al registrarse. |
| `plan_basic()` | Función SQL `SECURITY DEFINER` (727) | **Validador canónico del plan.** Devuelve `true` si el usuario actual es Basic; default restrictivo `true`. |
| `handle_new_user()` | Trigger (627) | Lee `plan_empresa` y sella `usuarios.empresa` en cada alta. |
| `aprobar_usuario()` | RPC `SECURITY DEFINER` (108) | Aplica reglas de plan al aprobar: Basic → sin área; Pro → área opcional, `tipo_usuario` forzado a `general`. |
| `mi_area_id()` | Función SQL (660) | Devuelve el área del usuario; usada junto a `plan_basic()` en RLS. |
| Política `predicciones_insert` | RLS (1836‑1842) | **Barrera real:** solo permite predicciones en apuestas `grupos` si `NOT plan_basic()` y el usuario tiene área. |
| Tablas `areas`, `apuesta_areas` | Tablas (988, 968) | Soporte de la funcionalidad exclusiva de Pro. |
| Vista `ranking_apuestas_grupales` | Vista (1150) | Ranking por área (solo relevante en Pro). |

---

## 4. Funciones que manejan los planes

### 4.1 Frontend
- **Hook / contexto `useAuth` (`AuthProvider`)** — deriva el plan:
  ```js
  const empresa = String(user?.empresa || '').trim().toLowerCase()
  const isPlanBasic = empresa === 'plan_basic'
  const isPro = !isPlanBasic
  ```
  Lo expone vía `AuthContext`; cualquier componente lo consume con `const { isPro, isPlanBasic } = useAuth()`.
- **Componentes consumidores:** `AdminPage`, `CreateBetForm`, `Eliminatorias`, `BetCard` (render condicional).
- **Capa de servicios `sheetsApi`:** no decide el plan, pero ejecuta las operaciones que el plan habilita (RPC `aprobar_usuario`, alta de apuestas con áreas, CRUD de áreas).

> No hay middleware de rutas que bloquee por plan: el control de plan es de **UI** (frontend) + **RLS** (backend), no de routing.

### 4.2 Supabase
- **`plan_basic() → boolean`** — validación central reutilizada por RLS y por `aprobar_usuario()`.
- **`aprobar_usuario(p_user_id, p_tipo_usuario, p_area_id) → json`** — lógica de aprobación dependiente del plan (fuerza rol/área).
- **`handle_new_user() → trigger`** — sella el plan en el alta del usuario.
- **`mi_area_id() → uuid`** — usada en las políticas RLS de `predicciones` y `usuarios`.
- **Políticas RLS** (`predicciones_insert`, `predicciones_select`, `usuarios_select_self`, `areas_*`) — aplican el alcance del plan a nivel de fila.

---

## 5. Riesgos de fallo por nivel

### 🔴 Crítico (bloqueo, seguridad o integridad de datos)
1. **Default de plan divergente entre capas.** Para `empresa` vacío:
   - Backend `plan_basic()` → `coalesce(..., true)` = **Basic** (restrictivo).
   - Frontend `isPro = !isPlanBasic` → **Pro** (permisivo).
   El comentario en `useAuth.jsx:152` afirma que el criterio "es el mismo que el backend", pero **es el opuesto**. Consecuencia: la UI ofrece crear/predecir grupales que la RLS rechaza → flujo roto y posible corrupción de estado en formularios.
2. **Desincronización `config.plan_empresa` ↔ `usuarios.empresa`.** Cambiar el plan global **no** actualiza a los usuarios ya registrados (su `empresa` quedó sellada en el alta). Tras un "upgrade" a Pro, los usuarios viejos siguen siendo Basic → acceso inconsistente y soporte difícil de diagnosticar.
3. **Dependencia total de RLS como única barrera dura.** Si una política se despliega mal (p. ej. olvido de `NOT plan_basic()` o RLS deshabilitado), un usuario Basic podría insertar predicciones grupales. La defensa de plan no está duplicada en RPC de escritura de predicciones.

### 🟡 Medio (rendimiento, UX, sincronización)
4. **Ranking grupal costoso.** `ranking_apuestas_grupales` (CROSS JOIN + `rank()`) sin refresh agendado se degrada a escala (~4.500 usuarios) — afecta rendimiento del feature estrella de Pro.
5. **UX inconsistente por el punto (1).** Empresas mal configuradas (sin `plan_empresa`) verán botones Pro que fallan silenciosamente al guardar.
6. **Bloqueo de aprobación poco explicado.** En Pro, el botón de aprobar se deshabilita sin área; si el admin no creó áreas aún, no hay forma de aprobar usuarios → cuello de botella operativo.
7. **Caché de sesión de `empresa`.** El plan se guarda en `sessionStorage`; un cambio de plan en BD no se refleja hasta re‑login → ventana de inconsistencia.

### 🟢 Leve (mantenimiento, claridad)
8. **Detección por *string mágico*.** Cualquier valor ≠ `'plan_basic'` cuenta como Pro; un typo (`plan_pr0`) habilita Pro por accidente. Conviene un `enum`/constante validada.
9. **Doble propósito de la columna `empresa`.** Mezcla "nombre de empresa" y "plan", lo que confunde el modelo de datos.
10. **`tipo_usuario` muerto.** La UI sugiere "jefe de área" pero el backend lo fuerza a `general`; código y copy desalineados.
11. **Comentario engañoso** en `useAuth.jsx` (describe mal el criterio de default).

---

## 6. Observaciones: coexistencia de planes, escalabilidad y evolución

- **Escalabilidad (multi‑tenant):** el diseño actual asume **una empresa = una instalación = un plan global**. No soporta que conviva Basic y Pro en la misma instancia ni múltiples empresas. Escalar a SaaS multi‑empresa exigiría mover el plan a una entidad propia (p. ej. `empresas(id, plan)`) y referenciarla desde `usuarios`, en lugar del *string* sellado por fila.
- **Gestión de usuarios:** el sellado del plan en el alta crea **deuda de sincronización**. Cada cambio de plan obliga a una migración manual de `usuarios.empresa`. Recomendado: que `plan_basic()` lea siempre desde `config.plan_empresa` (vía join), eliminando la copia por usuario y la posibilidad de drift.
- **Evolución del proyecto:** añadir un tercer plan o features intermedias es frágil con el modelo booleano `isPro = !isPlanBasic`. Una matriz de capacidades (`plan_features`) y un único *resolver* (frontend + función SQL espejada con **el mismo default**) reducirían el riesgo crítico (1) y harían extensible el sistema.
- **Defensa en profundidad:** mantener RLS como barrera dura es correcto, pero conviene **alinear el frontend al backend** (tratar vacío como Basic) y, opcionalmente, validar el plan también en las RPC de escritura, para que la UI nunca ofrezca acciones que la BD vaya a rechazar.

---

### Apéndice — Mapa rápido de referencias

| Concepto | Ubicación |
|----------|-----------|
| Cálculo de plan (frontend) | `src/hooks/useAuth.jsx:151‑169` |
| Validador de plan (backend) | `public_schema.sql:727` (`plan_basic()`) |
| Sellado de plan en alta | `public_schema.sql:627` (`handle_new_user()`) |
| Reglas de aprobación por plan | `public_schema.sql:108` (`aprobar_usuario()`) |
| Barrera RLS de predicciones grupales | `public_schema.sql:1836‑1842` |
| Config global del plan | tabla `config`, clave `plan_empresa` |
