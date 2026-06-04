/* ============================================================
   PRODE ONE — API Client (SUPABASE)
   ============================================================
   Drop-in replacement del sheetsApi.js original.
   Mantiene exactamente la misma interfaz pública que la versión
   que hablaba con Apps Script, pero por dentro usa Supabase.

   El resto del frontend sigue funcionando sin cambios:
     - sheetsApi.auth.login(...)
     - sheetsApi.apuestas.listar(...)
     - sheetsApi.predicciones.tabla(...)
     - etc.

   IMPORTANTE: requiere las variables de entorno
     VITE_SUPABASE_URL
     VITE_SUPABASE_ANON_KEY
   ============================================================ */

import { createClient } from '@supabase/supabase-js'

// ── Configuración ─────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '⚠️ Faltan variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.\n' +
    'Verificá que el archivo .env esté en la raíz del proyecto y reiniciá el servidor de Vite.'
  )
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'prode_supabase_session',
  },
})

// ── Caché de cliente en memoria (idéntico al original) ────
const CLIENT_CACHE = new Map()
const CLIENT_CACHE_TTL = {
  'areas.listar': 60_000,
  'grupos.listar': 300_000,
  'partidos.listar': 30_000,
  'apuestas.listar': 30_000,
  'predicciones.mis': 15_000,
  'bootstrap': 15_000,
}

function cacheKey(action, params) {
  return action + '|' + JSON.stringify(params || {})
}
function getFromClientCache(action, params) {
  const ttl = CLIENT_CACHE_TTL[action]
  if (!ttl) return null
  const key = cacheKey(action, params)
  const entry = CLIENT_CACHE.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > ttl) {
    CLIENT_CACHE.delete(key)
    return null
  }
  return entry.data
}
function saveToClientCache(action, params, data) {
  if (!CLIENT_CACHE_TTL[action]) return
  CLIENT_CACHE.set(cacheKey(action, params), { ts: Date.now(), data })
}
function invalidateClientCache(prefix = '') {
  if (!prefix) { CLIENT_CACHE.clear(); return }
  for (const key of CLIENT_CACHE.keys()) {
    if (key.startsWith(prefix)) CLIENT_CACHE.delete(key)
  }
}

// ── Aviso visual cuando expira la sesión (idéntico al original) ───
let avisoSesionMostrado = false
function mostrarAvisoSesionExpirada() {
  if (avisoSesionMostrado) return
  avisoSesionMostrado = true

  const overlay = document.createElement('div')
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    background: rgba(12,24,43,.85);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Sans', sans-serif;
    animation: fadeInOverlay .25s ease both;
  `
  overlay.innerHTML = `
    <style>
      @keyframes fadeInOverlay { from{opacity:0} to{opacity:1} }
    </style>
    <div style="text-align: center; color: #fff; max-width: 320px; padding: 1.5rem;">
      <div style="
        width: 56px; height: 56px; border-radius: 50%;
        background: rgba(235,195,43,.15);
        border: 1px solid rgba(235,195,43,.4);
        margin: 0 auto 1rem;
        display: flex; align-items: center; justify-content: center;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ebc32b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      <p style="font-family: 'Bebas Neue', sans-serif; font-size: 1.6rem; margin: 0 0 .35rem; letter-spacing: .04em;">
        Sesión expirada
      </p>
      <p style="font-size: .85rem; color: rgba(255,255,255,.6); margin: 0;">
        Por seguridad, te llevamos al login para que vuelvas a entrar.
      </p>
    </div>
  `
  document.body.appendChild(overlay)
}

function manejarSesionExpirada() {
  invalidateClientCache()
  try { sessionStorage.removeItem('prode_user') } catch (e) { }
  const path = window.location.pathname
  const yaEnLogin =
    path === '/login' || path === '/' || path === '/home' ||
    path.startsWith('/forgot-password') || path.startsWith('/reset-password')
  if (!yaEnLogin) {
    mostrarAvisoSesionExpirada()
    setTimeout(() => { window.location.href = '/login' }, 1200)
    throw new Error('Sesión expirada — redirigiendo al login')
  }
}

// ── Helper: lanza error legible si falla una query ────────
function checkError(error, contexto = '') {
  if (!error) return
  const msg = error.message || String(error)
  // Error de auth típico
  if (
    error.code === 'PGRST301' ||
    msg.toLowerCase().includes('jwt') ||
    msg.toLowerCase().includes('unauthorized')
  ) {
    manejarSesionExpirada()
  }
  throw new Error(contexto ? `${contexto}: ${msg}` : msg)
}

// ── Gestión de sesión (compatibilidad con interfaz vieja) ──
function getToken() {
  // En la versión vieja se guardaba un session_token custom.
  // Acá simulamos: devolvemos algo truthy si hay sesión Supabase activa.
  // Lo único que importa es que useAuth pueda preguntar "hay sesión?".
  try {
    const raw = window.localStorage.getItem('prode_supabase_session')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.access_token || null
  } catch (e) {
    return null
  }
}
function saveToken(_t) {
  // No-op: Supabase ya maneja el token automáticamente.
}
function clearToken() {
  // Esto se llama cuando hay logout o sesión inválida.
  // Limpia el cache local; la sesión real la limpia auth.logout.
  invalidateClientCache()
}

// ── Helpers de transformación de datos ────────────────────

/**
 * Transforma una fila de la tabla `partidos` (con joins) al formato
 * que espera el frontend (igual al que devolvía Apps Script).
 */
function mapearPartido(p) {
  if (!p) return null
  const localSel = p.local_seleccion || null
  const visitSel = p.visit_seleccion || null
  return {
    id: p.id,
    equipo_local: localSel?.nombre || p.local || '',
    equipo_visitante: visitSel?.nombre || p.visitante || '',
    bandera_local: localSel?.bandera_url || '',
    bandera_visitante: visitSel?.bandera_url || '',
    codigo_local: p.local || '',
    codigo_visitante: p.visitante || '',
    fecha_partido: p.fecha_hora,
    goles_local: p.goles_local,
    goles_visitante: p.goles_visitante,
    penales_local: p.penales_local,
    penales_visit: p.penales_visit,
    estado: p.estado,
    estado_raw: p.estado_raw || '',
    minuto: extraerMinuto(p.estado_raw),
    fase: p.fase,
    grupo: p.grupo,
    jornada: p.jornada,
    sede: p.sede,
    es_eliminatoria: esFaseEliminatoria(p.fase),
  }
}

function extraerMinuto(estadoRaw) {
  if (!estadoRaw) return ''
  const str = String(estadoRaw)
  let m = str.match(/\(\s*(\d+\s*(?:\+\s*\d+)?)\s*'?\s*\)/)
  if (m) return m[1].replace(/\s+/g, '')
  m = str.match(/(\d+\s*(?:\+\s*\d+)?)'/)
  if (m) return m[1].replace(/\s+/g, '')
  return ''
}

function esFaseEliminatoria(fase) {
  if (!fase) return false
  return String(fase).trim().toLowerCase() !== 'grupos'
}

/**
 * Transforma una apuesta (con joins) al formato del frontend.
 * Convierte arrays de relación a CSV string (partidos_ids, areas_ids).
 */
function mapearApuesta(a) {
  if (!a) return null
  const partidosIds = (a.apuesta_partidos || [])
    .map(ap => ap.partido_id)
    .filter(Boolean)
    .join(',')
  const areasIds = (a.apuesta_areas || [])
    .map(aa => aa.area_id)
    .filter(Boolean)
    .join(',')
  return {
    id: a.id,
    titulo: a.titulo,
    descripcion: a.descripcion || '',
    tipo: a.tipo,
    premio: a.premio,
    fecha_cierre: a.fecha_cierre,
    estado: a.estado,
    puntos_exacto: a.puntos_exacto,
    puntos_diferencia: a.puntos_diferencia,
    puntos_resultado: a.puntos_resultado,
    puntos_clasificado: a.puntos_clasificado,
    creado_por: a.creado_por,
    fecha_creacion: a.fecha_creacion,
    partidos_ids: partidosIds,
    areas_ids: areasIds,
    total_participantes: a.total_participantes || 0,
    participantes: a.total_participantes || 0, // alias por compatibilidad
  }
}

// ════════════════════════════════════════════════════════════════
// MÓDULOS PÚBLICOS
// ════════════════════════════════════════════════════════════════

// ── sistema ──────────────────────────────────────────────
const sistema = {
  ping: async () => {
    // Health check: devolvemos OK si Supabase responde.
    try {
      const { error } = await supabase.from('config').select('clave').limit(1)
      if (error) return { ok: false, error: error.message }
      return { ok: true, message: 'Supabase activo' }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },
}

// ── auth ──────────────────────────────────────────────────
const auth = {
  login: async (emailOrDni, password) => {
    let email = emailOrDni.trim().toLowerCase()
    if (!email.includes('@')) {
      try {
        const { data: foundEmail } = await supabase.rpc('buscar_email_por_dni', { p_dni: email })
        if (foundEmail) {
          email = foundEmail
        } else {
          email = `${email}@prodetalento.com`
        }
      } catch (err) {
        console.error('Error in buscar_email_por_dni RPC:', err)
        email = `${email}@prodetalento.com`
      }
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw new Error(traducirErrorAuth(error))

    // Cargar perfil completo del usuario para verificar estado y rol
    const { data: perfil, error: errPerfil } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (errPerfil) {
      await supabase.auth.signOut()
      throw new Error('No se pudo cargar el perfil del usuario')
    }

    if (perfil.estado === 'pendiente') {
      await supabase.auth.signOut()
      throw new Error('Tu cuenta está pendiente de aprobación por el administrador')
    }
    if (perfil.estado === 'bloqueado') {
      await supabase.auth.signOut()
      throw new Error('Tu cuenta ha sido bloqueada')
    }

    invalidateClientCache()
    return {
      ok: true,
      session_token: data.session?.access_token || '',
      user: { ...perfil, user_id: perfil.id },
    }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut()
    } finally {
      clearToken()
      invalidateClientCache()
    }
    return { ok: true }
  },

  registro: async (nombre, email, dni, password) => {
    const authEmail = `${dni.trim()}@prodetalento.com`
    const { data, error } = await supabase.auth.signUp({
      email: authEmail,
      password,
      options: { 
        data: { 
          nombre: nombre.trim(),
          dni: dni.trim(),
          email_contacto: email.trim().toLowerCase()
        } 
      },
    })
    if (error) throw new Error(traducirErrorAuth(error))
    return {
      ok: true,
      message: 'Registro exitoso. Tu cuenta está pendiente de aprobación por el administrador.',
    }
  },

  // Recuperación de contraseña (flujo Supabase nativo).
  resetSolicitar: async (emailOrDni) => {
    let email = emailOrDni.trim().toLowerCase()
    
    // Si no contiene '@', asumimos que es DNI e intentamos buscar su email
    if (!email.includes('@')) {
      const { data: foundEmail, error: errRpc } = await supabase.rpc('buscar_email_por_dni', { p_dni: email })
      if (errRpc) {
        throw new Error('No se pudo verificar el DNI en el sistema.')
      }
      if (!foundEmail) {
        throw new Error('El DNI ingresado no corresponde a ningún usuario registrado.')
      }
      email = foundEmail
    }

    // Verificar si es un correo ficticio (@prodetalento.com)
    if (email.endsWith('@prodetalento.com')) {
      throw new Error('Tu cuenta tiene un correo por defecto de DNI y no posee un email real registrado. Por favor, solicitá al administrador de tu empresa que realice un "Blanqueo de Clave" para recuperar tu acceso.')
    }

    const redirectTo = `${window.location.origin}/reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo }
    )
    if (error) throw new Error(traducirErrorAuth(error))

    return {
      ok: true,
      message: 'Si el email está registrado, te enviamos un correo con instrucciones para restablecer tu contraseña.',
    }
  },

  /**
   * En Supabase, cuando el usuario clickea el link del email de reset,
   * llega a /reset-password con un fragmento que contiene los tokens.
   * Supabase los detecta automáticamente (gracias a detectSessionInUrl)
   * y crea una sesión temporal.
   *
   * Esta función simplemente verifica que haya una sesión activa
   * "tipo recovery" en este momento.
   */
  resetValidar: async (_token) => {
    const { data, error } = await supabase.auth.getSession()
    if (error || !data.session) {
      throw new Error('El link de recuperación no es válido o ya expiró. Pedí uno nuevo desde la pantalla de login.')
    }
    return {
      ok: true,
      email: data.session.user.email,
      nombre: data.session.user.user_metadata?.nombre || '',
    }
  },

  resetConfirmar: async (_token, password) => {
    if (!password || password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres.')
    }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw new Error(traducirErrorAuth(error))
    // Cerrar sesión: el usuario debe loguear con la nueva password
    await supabase.auth.signOut()
    return { ok: true, message: 'Tu contraseña se actualizó correctamente. Ya podés iniciar sesión.' }
  },

  verificarDniRecuperacion: async (dni) => {
    const { data: foundEmail, error: errRpc } = await supabase.rpc('buscar_email_por_dni', { p_dni: dni.trim() })
    if (errRpc) throw new Error('Error al verificar el DNI.')
    if (!foundEmail) throw new Error('El DNI ingresado no corresponde a ningún usuario registrado.')

    const esFalso = foundEmail.endsWith('@prodetalento.com')
    return {
      ok: true,
      email: foundEmail,
      esFalso
    }
  },

  recuperarAccesoPublico: async (dni, verificacion, nuevoEmail, nuevaPassword) => {
    const { data, error } = await supabase.rpc('recuperar_acceso_publico', {
      p_dni: dni.trim(),
      p_verificacion: verificacion.trim(),
      p_nuevo_email: nuevoEmail ? nuevoEmail.trim() : null,
      p_nueva_password: nuevaPassword.trim()
    })
    if (error) throw new Error(error.message)
    return { ok: true }
  },

  /**
   * Cambio de contraseña para un usuario YA logueado (sin email).
   *
   * Flujo seguro, alineado con la lógica de login:
   *   1. Verifica la contraseña ACTUAL re-autenticando con
   *      signInWithPassword → Supabase/GoTrue la compara contra el
   *      hash bcrypt almacenado en auth.users (misma vía que el login).
   *   2. Si es correcta, updateUser({ password }) genera y guarda el
   *      NUEVO hash bcrypt (GoTrue hashea internamente).
   *   3. No depende de links de recuperación por email.
   *
   * No cierra la sesión activa: el usuario sigue logueado tras el cambio.
   *
   * @param {string} currentPassword - contraseña actual
   * @param {string} newPassword     - contraseña nueva
   * @returns {Promise<{ok:true, message:string}>}
   */
  cambiarPassword: async (currentPassword, newPassword, newEmail) => {
    // ── 1. Validaciones de entrada (mínimas necesarias) ──
    if (!currentPassword || !newPassword) {
      throw new Error('Completá la contraseña actual y la nueva.')
    }
    if (newPassword.length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres.')
    }
    if (currentPassword === newPassword) {
      throw new Error('La nueva contraseña debe ser distinta de la actual.')
    }

    // ── 2. Resolver el email del usuario logueado (sin pedírselo) ──
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      manejarSesionExpirada()
      throw new Error('No hay una sesión activa. Volvé a iniciar sesión.')
    }

    // ── 3. Verificar la contraseña ACTUAL contra el hash almacenado ──
    //    Re-autenticación: GoTrue compara contra el hash bcrypt.
    const { error: errVerif } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })
    if (errVerif) {
      // No revelamos detalles internos del proveedor de auth.
      throw new Error('La contraseña actual es incorrecta.')
    }

    // ── 4. Actualizar email y contraseña usando la función segura (RPC) ──
    const targetEmail = newEmail && newEmail.trim() ? newEmail.trim().toLowerCase() : user.email
    
    // Validar formato de email
    if (!targetEmail.includes('@') || targetEmail.length < 5) {
      throw new Error('Ingresá un correo electrónico válido.')
    }

    const { data: resRpc, error: errRpc } = await supabase.rpc('cambiar_email_y_password', {
      p_user_id: user.id,
      p_new_email: targetEmail,
      p_new_password: newPassword
    })

    if (errRpc) {
      throw new Error('Error al actualizar datos: ' + errRpc.message)
    }

    return { ok: true, message: 'Tus datos se actualizaron correctamente.' }
  },
}

function traducirErrorAuth(error) {
  const msg = (error.message || '').toLowerCase()
  if (msg.includes('invalid login credentials')) return 'DNI o contraseña incorrectos'
  if (msg.includes('email not confirmed')) return 'Tu cuenta no fue confirmada todavía'
  if (msg.includes('user already registered')) return 'El DNI ya está registrado'
  if (msg.includes('password should be')) return 'La contraseña debe tener al menos 6 caracteres'
  if (msg.includes('rate limit')) return 'Demasiados intentos. Probá nuevamente en unos minutos'
  return error.message || 'Error de autenticación'
}

// ── usuarios (admin) ──────────────────────────────────────
const usuarios = {
  listar: async (opciones = '') => {
    let estado = ''
    let page = 0
    let pageSize = 50
    let search = ''

    if (typeof opciones === 'string') {
      estado = opciones
    } else if (opciones && typeof opciones === 'object') {
      estado = opciones.estado || ''
      page = opciones.page || 0
      pageSize = opciones.pageSize || 50
      search = opciones.search || ''
    }

    let q = supabase
      .from('usuarios')
      .select('*', { count: 'exact' })
      .order('fecha_registro', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)
    if (estado) q = q.eq('estado', estado)
    if (search) q = q.or(`nombre.ilike.%${search}%,email.ilike.%${search}%`)
    const { data, error, count } = await q
    checkError(error, 'usuarios.listar')
    return {
      ok: true,
      usuarios: (data || []).map(u => ({ ...u, user_id: u.id })),
      total: count,
      page,
      pageSize,
    }
  },

  obtener: async (user_id) => {
    const { data, error } = await supabase
      .from('usuarios').select('*').eq('id', user_id).single()
    checkError(error, 'usuarios.obtener')
    return { ok: true, usuario: { ...data, user_id: data.id } }
  },

  aprobar: async (user_id, tipo_usuario, area_id) => {
    const { data, error } = await supabase.rpc('aprobar_usuario', {
      p_user_id: user_id,
      p_tipo_usuario: tipo_usuario || 'general',
      p_area_id: area_id || null,
    })
    checkError(error, 'usuarios.aprobar')
    invalidateClientCache()
    return data
  },

  rechazar: async (user_id) => {
    const { error } = await supabase
      .from('usuarios').update({ estado: 'bloqueado' }).eq('id', user_id)
    checkError(error, 'usuarios.rechazar')
    invalidateClientCache()
    return { ok: true, message: 'Usuario rechazado' }
  },

  restablecerPasswordDni: async (target_user_id) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Sesión no válida o expirada.')
    const { data, error } = await supabase.rpc('admin_reset_password_to_dni', {
      p_admin_id: user.id,
      p_target_id: target_user_id
    })
    checkError(error, 'usuarios.restablecerPasswordDni')
    return { ok: true, message: 'La contraseña fue restablecida al DNI correctamente.' }
  },

  // Crear usuario manualmente (admin). Por ahora se hace via signUp normal,
  // requiere extension futura via Edge Function. Stub por compatibilidad.
  crear: async (_data) => {
    throw new Error('Función "crear usuario manual" todavía no implementada en la versión Supabase. Pedí al usuario que se registre normalmente y aprobalo.')
  },
}

// ── apuestas ──────────────────────────────────────────────
const apuestas = {
  listar: async (estado = '', signal) => {
    const cached = getFromClientCache('apuestas.listar', { estado })
    if (cached) return cached
    let q = supabase
      .from('apuestas')
      .select('*, apuesta_partidos(partido_id), apuesta_areas(area_id)')
      .order('fecha_creacion', { ascending: false })
    if (estado) q = q.eq('estado', estado)
    if (signal) q = q.abortSignal(signal)
    const { data, error } = await q
    checkError(error, 'apuestas.listar')
    const result = { ok: true, apuestas: (data || []).map(mapearApuesta) }
    saveToClientCache('apuestas.listar', { estado }, result)
    return result
  },

  obtener: async (apuesta_id) => {
    // Traer la apuesta con sus partidos enriquecidos
    const { data: a, error } = await supabase
      .from('apuestas')
      .select(`
        *,
        apuesta_partidos (
          partido:partidos (
            *,
            local_seleccion:selecciones!partidos_local_fkey(codigo,nombre,bandera_url),
            visit_seleccion:selecciones!partidos_visitante_fkey(codigo,nombre,bandera_url)
          )
        ),
        apuesta_areas (area_id)
      `)
      .eq('id', apuesta_id)
      .single()
    checkError(error, 'apuestas.obtener')
    if (!a) throw new Error('Apuesta no encontrada')

    const partidos = (a.apuesta_partidos || [])
      .map(ap => mapearPartido(ap.partido))
      .filter(Boolean)
    const partidosIds = (a.apuesta_partidos || []).map(ap => ap.partido_id).filter(Boolean).join(',')
    const areasIds = (a.apuesta_areas || []).map(aa => aa.area_id).filter(Boolean).join(',')

    return {
      ok: true,
      apuesta: {
        id: a.id,
        titulo: a.titulo,
        descripcion: a.descripcion || '',
        tipo: a.tipo,
        premio: a.premio,
        fecha_cierre: a.fecha_cierre,
        estado: a.estado,
        puntos_exacto: a.puntos_exacto,
        puntos_diferencia: a.puntos_diferencia,
        puntos_resultado: a.puntos_resultado,
        puntos_clasificado: a.puntos_clasificado,
        creado_por: a.creado_por,
        fecha_creacion: a.fecha_creacion,
        partidos_ids: partidosIds,
        areas_ids: areasIds,
        total_participantes: a.total_participantes || 0,
        participantes: a.total_participantes || 0,
        partidos,
      },
    }
  },

  crear: async (data) => {
    // data viene del frontend con { titulo, tipo, premio, fecha_cierre,
    //   partidos_ids: 'p001,p002,...', areas_ids?: 'uuid1,uuid2,...',
    //   puntos_exacto?, puntos_diferencia?, puntos_resultado?, puntos_clasificado?
    // }
    const partidosArr = String(data.partidos_ids || '').split(',').map(s => s.trim()).filter(Boolean)
    if (partidosArr.length === 0) {
      throw new Error('Debe incluir al menos un partido')
    }

    // 1) Crear la apuesta
    const { data: apuesta, error: e1 } = await supabase
      .from('apuestas')
      .insert({
        titulo: data.titulo,
        descripcion: data.descripcion || '',
        tipo: data.tipo,
        premio: data.premio,
        fecha_cierre: data.fecha_cierre,
        puntos_exacto: data.puntos_exacto ?? 5,
        puntos_diferencia: data.puntos_diferencia ?? 3,
        puntos_resultado: data.puntos_resultado ?? 1,
        puntos_clasificado: data.puntos_clasificado ?? 1,
      })
      .select()
      .single()
    checkError(e1, 'apuestas.crear')

    // 2) Insertar partidos asociados
    const partidosRows = partidosArr.map(pid => ({ apuesta_id: apuesta.id, partido_id: pid }))
    const { error: e2 } = await supabase.from('apuesta_partidos').insert(partidosRows)
    if (e2) {
      // Rollback manual
      await supabase.from('apuestas').delete().eq('id', apuesta.id)
      checkError(e2, 'apuestas.crear (partidos)')
    }

    // 3) Insertar áreas (solo si tipo grupos)
    if (data.tipo === 'grupos' && data.areas_ids) {
      const areasArr = String(data.areas_ids).split(',').map(s => s.trim()).filter(Boolean)
      if (areasArr.length) {
        const areasRows = areasArr.map(aid => ({ apuesta_id: apuesta.id, area_id: aid }))
        const { error: e3 } = await supabase.from('apuesta_areas').insert(areasRows)
        if (e3) {
          await supabase.from('apuestas').delete().eq('id', apuesta.id)
          checkError(e3, 'apuestas.crear (áreas)')
        }
      }
    }

    invalidateClientCache()
    return { ok: true, message: 'Apuesta creada correctamente', apuesta_id: apuesta.id }
  },

  cerrar: async (apuesta_id) => {
    const { error } = await supabase
      .from('apuestas').update({ estado: 'cerrada' }).eq('id', apuesta_id)
    checkError(error, 'apuestas.cerrar')
    invalidateClientCache()
    return { ok: true, message: 'Apuesta cerrada correctamente' }
  },

  finalizar: async (apuesta_id) => {
    const { data, error } = await supabase.rpc('finalizar_apuesta', { p_apuesta_id: apuesta_id })
    checkError(error, 'apuestas.finalizar')
    invalidateClientCache()
    return data
  },

  finalizar_listas: async () => {
    const { data, error } = await supabase.rpc('finalizar_apuestas_listas')
    checkError(error, 'apuestas.finalizar_listas')
    invalidateClientCache()
    return data
  },
}

// ── partidos ──────────────────────────────────────────────
const partidos = {
  listar: async ({ estado, fase, grupo, jornada, signal } = {}) => {
    const params = { estado: estado || '', fase: fase || '', grupo: grupo || '', jornada: jornada || '' }
    const cached = getFromClientCache('partidos.listar', params)
    if (cached) return cached
    let q = supabase
      .from('partidos')
      .select(`
        *,
        local_seleccion:selecciones!partidos_local_fkey(codigo,nombre,bandera_url),
        visit_seleccion:selecciones!partidos_visitante_fkey(codigo,nombre,bandera_url)
      `)
      .order('fecha_hora', { ascending: true })
    if (estado) q = q.eq('estado', estado)
    if (fase) q = q.eq('fase', fase)
    if (grupo) q = q.eq('grupo', grupo)
    if (jornada) q = q.eq('jornada', jornada)
    if (signal) q = q.abortSignal(signal)
    const { data, error } = await q
    checkError(error, 'partidos.listar')
    const result = { ok: true, partidos: (data || []).map(mapearPartido) }
    saveToClientCache('partidos.listar', params, result)
    return result
  },

  obtener: async (partido_id) => {
    const { data, error } = await supabase
      .from('partidos')
      .select(`
        *,
        local_seleccion:selecciones!partidos_local_fkey(codigo,nombre,bandera_url),
        visit_seleccion:selecciones!partidos_visitante_fkey(codigo,nombre,bandera_url)
      `)
      .eq('id', partido_id)
      .single()
    checkError(error, 'partidos.obtener')
    return { ok: true, partido: mapearPartido(data) }
  },

  actualizar: async (data, signal) => {
    const { partido_id, ...campos } = data
    const update = {}
    // Solo aceptar campos válidos
    if (campos.goles_local !== undefined) update.goles_local = campos.goles_local
    if (campos.goles_visitante !== undefined) update.goles_visitante = campos.goles_visitante
    if (campos.penales_local !== undefined) update.penales_local = campos.penales_local
    if (campos.penales_visit !== undefined) update.penales_visit = campos.penales_visit
    if (campos.estado !== undefined) update.estado = campos.estado
    if (campos.estado_raw !== undefined) update.estado_raw = campos.estado_raw

    let q = supabase.from('partidos').update(update).eq('id', partido_id)
    if (signal) q = q.abortSignal(signal)

    const { error } = await q
    checkError(error, 'partidos.actualizar')
    invalidateClientCache()
    return { ok: true, message: 'Partido actualizado correctamente' }
  },

  // No-op: la sincronización ahora corre automáticamente vía Apps Script
  // del sheet Mundial2026 (cada 5 min).
  sincronizar: async (_filtros = {}) => {
    return {
      ok: true,
      message: 'La sincronización corre automáticamente cada 5 minutos desde el sheet Mundial2026.',
    }
  },

  // Devuelve los partidos que están en uso en alguna apuesta activa
  // (abierta o cerrada). Usado por el panel admin para deshabilitar
  // visualmente los partidos que no se pueden volver a usar.
  bloqueados: async () => {
    const { data, error } = await supabase.rpc('partidos_bloqueados', { p_partido_ids: null })
    checkError(error, 'partidos.bloqueados')
    return { ok: true, partidos: data || [] }
  },
}


// ── predicciones ──────────────────────────────────────────
const predicciones = {
  guardar: async (data) => {
    // data: { apuesta_id, partido_id, pred_local, pred_visitante, pred_clasificado? }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const payload = {
      apuesta_id: data.apuesta_id,
      user_id: user.id,
      partido_id: data.partido_id,
      pred_local: parseInt(data.pred_local),
      pred_visitante: parseInt(data.pred_visitante),
      pred_clasificado: data.pred_clasificado || null,
      area_id: data.area_id || null,
    }

    const { error } = await supabase
      .from('predicciones')
      .upsert(payload, { onConflict: 'apuesta_id,user_id,partido_id' })
    checkError(error, 'predicciones.guardar')
    invalidateClientCache()
    return { ok: true, message: 'Predicción guardada correctamente' }
  },

  guardarBatch: async (data) => {
    const { data: result, error } = await supabase.rpc(
      'guardar_predicciones_apuesta', {
      p_apuesta_id: data.apuesta_id,
      p_predicciones: data.predicciones,
      p_area_id: data.area_id,
    }
    )
    checkError(error, 'predicciones.guardarBatch')
    invalidateClientCache()
    return result
  },

  mias: async (apuesta_id = '', user_id = '') => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const targetUserId = user_id || user.id

  let q = supabase
    .from('predicciones')
    .select('id, apuesta_id, user_id, partido_id, pred_local, pred_visitante, pred_clasificado, puntos, area_id')
    .eq('user_id', targetUserId)

  if (apuesta_id) {
    q = q.eq('apuesta_id', apuesta_id)
  }

  const { data, error } = await q

  checkError(error, 'predicciones.mias')

  return { ok: true, predicciones: data || [], mis: data || [] }
},

  /**
   * Predicciones de un usuario específico.
   * RLS valida automáticamente si el caller tiene permiso de ver esas predicciones.
   */
  deUsuario: async (apuesta_id, user_id) => {
    let q = supabase.from('predicciones').select('*').eq('user_id', user_id)
    if (apuesta_id && apuesta_id !== 'global') q = q.eq('apuesta_id', apuesta_id)
    const { data, error } = await q
    checkError(error, 'predicciones.deUsuario')
    return { ok: true, predicciones: data || [], mis: data || [] }
  },

  // Alias por compatibilidad (RankingPage.jsx usa este nombre)
  porUsuario: async function (apuesta_id, user_id) {
    return this.deUsuario(apuesta_id, user_id)
  },

  /**
   * Tabla de ranking. Usa la vista ranking_apuestas (creada en Supabase).
   * Devuelve formato compatible con el frontend actual.
   */
  tabla: async (apuesta_id, opciones = {}) => {
    const limit = Math.min(parseInt(opciones.limit) || 50, 200)

    // ✅ E-A4 FIX:
    // Recibimos usuario/área desde useAuth para evitar:
    // - supabase.auth.getUser()
    // - query extra a usuarios para area_id
    const currentUserId = opciones.user_id || ''
    const currentAreaId = opciones.area_id || ''

    // 1) Obtener título y tipo de la apuesta
    const { data: apuesta, error: apuestaError } = await supabase
      .from('apuestas')
      .select('titulo, tipo')
      .eq('id', apuesta_id)
      .single()

    checkError(apuestaError, 'predicciones.tabla (apuesta)')

    const esGrupal = apuesta?.tipo === 'grupos'

    // 2) Obtener ranking desde cache
    const { data: ranking, error } = await supabase
      .from('ranking_cache')
      .select('*')
      .eq('apuesta_id', apuesta_id)
      .eq('es_grupal', esGrupal)
      .order('posicion', { ascending: true })

    checkError(error, 'predicciones.tabla')

    const rankingArr = (ranking || []).map(r => {
      if (esGrupal) {
        return {
          user_id: r.area_id,
          nombre: r.nombre,
          email: '',
          puntos_totales: r.puntos_totales,
          posicion: r.posicion,
          aciertos_exactos: r.aciertos_exactos,
          aciertos_diferencia: r.aciertos_diferencia,
          aciertos_resultado: r.aciertos_resultado,
          aciertos_clasificado: r.aciertos_clasificado,
          predicciones: r.predicciones,
          miembros_participantes: r.miembros_participantes,
          apuesta_id: r.apuesta_id,
          es_grupal: true,
        }
      }

      return {
        user_id: r.user_id,
        nombre: r.nombre,
        email: '',
        puntos_totales: r.puntos_totales,
        posicion: r.posicion,
        aciertos_exactos: r.aciertos_exactos,
        aciertos_diferencia: r.aciertos_diferencia,
        aciertos_resultado: r.aciertos_resultado,
        aciertos_clasificado: r.aciertos_clasificado,
        predicciones: r.predicciones,
        apuesta_id: r.apuesta_id,
        es_grupal: false,
      }
    })

    const top = rankingArr.slice(0, limit)

    // 3) Mi posición sin consultar Auth ni usuarios
    let miPosicion = null

    if (esGrupal) {
      if (currentAreaId) {
        miPosicion = rankingArr.find(r => r.user_id === currentAreaId) || null
      }
    } else {
      if (currentUserId) {
        miPosicion = rankingArr.find(r => r.user_id === currentUserId) || null
      }
    }

    const estaEnTop = miPosicion
      ? Number(miPosicion.posicion) <= limit
      : false

    return {
      ok: true,
      apuesta_titulo: apuesta?.titulo || '',
      apuesta_tipo: apuesta?.tipo || 'libre',
      es_grupal: esGrupal,
      total: rankingArr.length,
      limit,
      tabla: top,
      mi_posicion: miPosicion,
      esta_en_top: estaEnTop,
    }
  },

  tablaGlobal: async function (opciones = {}) {
    const currentUserId = opciones.user_id || ''

    const { data: ranking, error } = await supabase
      .from('ranking_cache')
      .select('*')
      .eq('es_grupal', false)

    if (error) {
      console.error('Error fetching global ranking:', error)
      return { ok: false, error: error.message, tabla: [] }
    }

    const agrupado = {}
    for (const r of (ranking || [])) {
      if (!r.user_id) continue
      if (!agrupado[r.user_id]) {
        agrupado[r.user_id] = {
          user_id: r.user_id,
          nombre: r.nombre || 'Participante',
          puntos_totales: 0,
          aciertos_exactos: 0,
          aciertos_diferencia: 0,
          aciertos_resultado: 0,
          aciertos_clasificado: 0,
          predicciones: 0,
        }
      }
      const u = agrupado[r.user_id]
      u.puntos_totales += (r.puntos_totales || 0)
      u.aciertos_exactos += (r.aciertos_exactos || 0)
      u.aciertos_diferencia += (r.aciertos_diferencia || 0)
      u.aciertos_resultado += (r.aciertos_resultado || 0)
      u.aciertos_clasificado += (r.aciertos_clasificado || 0)
      u.predicciones += (r.predicciones || 0)
    }

    const sorted = Object.values(agrupado).sort((a, b) => b.puntos_totales - a.puntos_totales)

    let pos = 1
    const finalTabla = sorted.map((u, idx) => {
      if (idx > 0 && u.puntos_totales < sorted[idx - 1].puntos_totales) {
        pos = idx + 1
      }
      return {
        ...u,
        posicion: pos
      }
    })

    let miPosicion = null
    if (currentUserId) {
      miPosicion = finalTabla.find(r => r.user_id === currentUserId) || null
    }

    const limit = 200
    const top = finalTabla.slice(0, limit)
    const estaEnTop = miPosicion ? Number(miPosicion.posicion) <= 3 : false

    return {
      ok: true,
      apuesta_titulo: 'RANKING GLOBAL',
      apuesta_tipo: 'global',
      es_grupal: false,
      total: finalTabla.length,
      limit,
      tabla: top,
      mi_posicion: miPosicion,
      esta_en_top: estaEnTop,
    }
  },
}

// ── grupos (selecciones agrupadas por letra) ──────────────
const grupos = {
  listar: async () => {
    const cached = getFromClientCache('grupos.listar', {})
    if (cached) return cached
    const { data, error } = await supabase
      .from('selecciones')
      .select('*')
      .neq('codigo', 'TBD')
      .order('grupo', { ascending: true })
      .order('pos', { ascending: true })
    checkError(error, 'grupos.listar')

    const porGrupo = {}
      ; (data || []).forEach(s => {
        if (!s.grupo) return
        if (!porGrupo[s.grupo]) porGrupo[s.grupo] = []
        porGrupo[s.grupo].push({
          grupo: s.grupo, codigo: s.codigo, nombre: s.nombre, bandera_url: s.bandera_url,
          j: s.j, g: s.g, e: s.e, p: s.p, gf: s.gf, gc: s.gc, dif: s.dif, pts: s.pts, pos: s.pos,
        })
      })
    const grupos = Object.keys(porGrupo).sort().map(letra => ({
      letra, selecciones: porGrupo[letra],
    }))
    const result = { ok: true, grupos }
    saveToClientCache('grupos.listar', {}, result)
    return result
  },
}

// ── areas ─────────────────────────────────────────────────
const areas = {
  listar: async (solo_activas = true) => {
    const cached = getFromClientCache('areas.listar', { solo_activas })
    if (cached) return cached
    let q = supabase.from('areas').select('*').order('nombre', { ascending: true })
    if (solo_activas) q = q.eq('activa', true)
    const { data, error } = await q
    checkError(error, 'areas.listar')
    const result = { ok: true, areas: data || [] }
    saveToClientCache('areas.listar', { solo_activas }, result)
    return result
  },

  crear: async (data) => {
    const { data: nueva, error } = await supabase
      .from('areas')
      .insert({
        nombre: data.nombre.trim(),
        descripcion: (data.descripcion || '').trim(),
        activa: true,
      })
      .select()
      .single()
    checkError(error, 'areas.crear')
    invalidateClientCache()
    return { ok: true, message: 'Área creada correctamente', area_id: nueva.id }
  },

  editar: async (data) => {
    const update = { nombre: data.nombre.trim() }
    if (data.descripcion !== undefined) update.descripcion = (data.descripcion || '').trim()
    const { error } = await supabase
      .from('areas').update(update).eq('id', data.area_id)
    checkError(error, 'areas.editar')
    invalidateClientCache()
    return { ok: true, message: 'Área editada correctamente' }
  },

  toggle_activa: async (area_id) => {
    // Leer estado actual
    const { data: actual, error: e1 } = await supabase
      .from('areas').select('activa').eq('id', area_id).single()
    checkError(e1, 'areas.toggle_activa (lectura)')
    const nuevoEstado = !actual.activa
    const { error: e2 } = await supabase
      .from('areas').update({ activa: nuevoEstado }).eq('id', area_id)
    checkError(e2, 'areas.toggle_activa (escritura)')
    invalidateClientCache()
    return { ok: true, message: `Área ${nuevoEstado ? 'activada' : 'desactivada'}` }
  },
}

// ── bootstrap (compat) ─────────────────────────────────────
const bootstrap = {
  cargar: async () => {
    const cached = getFromClientCache('bootstrap', {})
    if (cached) return cached
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')
    // Llamadas en paralelo
    const [perfilR, apuestasR, partidosR, areasR, gruposR, prediccionesR] = await Promise.all([
      supabase.from('usuarios').select('*').eq('id', user.id).single(),
      apuestas.listar(),
      partidos.listar(),
      areas.listar(true),
      grupos.listar(),
      predicciones.mias(),
    ])
    const result = {
      ok: true,
      user: { ...perfilR.data, user_id: perfilR.data?.id },
      apuestas: apuestasR.apuestas,
      partidos: partidosR.partidos,
      areas: areasR.areas,
      grupos: gruposR.grupos,
      mis_predicciones: prediccionesR.predicciones,
      server_time: new Date().toISOString(),
    }
    saveToClientCache('bootstrap', {}, result)
    return result
  },
}

// ── Listener para invalidar cache cuando cambia la sesión ───
supabase.auth.onAuthStateChange((event, _session) => {
  if (event === 'SIGNED_OUT') {
    invalidateClientCache()
    try { sessionStorage.removeItem('prode_user') } catch (e) { }
  }
})

// ════════════════════════════════════════════════════════════════
// PROPUESTAS (buzón anónimo)
// ════════════════════════════════════════════════════════════════

const propuestas = {
  async enviar(area, propuesta) {
    const { data, error } = await supabase
      .from('propuestas')
      .insert([{ area, propuesta }])
      .select()
    if (error) throw error
    return data
  },

  async obtener() {
    const { data, error } = await supabase
      .from('propuestas')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },
}

// ════════════════════════════════════════════════════════════════
// EXPORT
// ════════════════════════════════════════════════════════════════

const sheetsApi = {
  sistema,
  bootstrap,
  auth,
  usuarios,
  apuestas,
  partidos,
  predicciones,
  grupos,
  areas,
  propuestas,
  _token: { get: getToken, save: saveToken, clear: clearToken },
  _cache: { invalidate: invalidateClientCache },
  _supabase: supabase, // expuesto para casos avanzados (realtime, etc)
}

export default sheetsApi