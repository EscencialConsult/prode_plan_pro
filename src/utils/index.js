/* ── Utilidades Generales ───────────────────────────────────
   Funciones helper reutilizables en todo el proyecto.
   Todas las fechas viajan como ISO UTC y se muestran en hora
   local del navegador del usuario.
   ─────────────────────────────────────────────────────────── */

/* ══════════════════════════════════════════════════════════
   FECHAS
   ══════════════════════════════════════════════════════════ */

/** Formatea una fecha ISO a "24/11/2026 16:00" en hora local */
export function formatDate(iso, opts = {}) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    ...opts,
  })
}

/** Solo día y mes + hora: "24 nov 16:00" (separador personalizable) */
export function fmtFecha(iso, separador = ' ') {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return (
    d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) +
    separador +
    d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  )
}

/**
 * Devuelve la fecha (YYYY-MM-DD) en zona LOCAL del navegador.
 * Útil para agrupar partidos por día sin que se "cambien de día"
 * al convertir a UTC. Ej: un partido 24/11 21:00 AR no debe
 * aparecer como del 25/11 solo porque en UTC lo es.
 */
export function diaLocalIso(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = n => String(n).padStart(2, '0')
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

/** Solo fecha sin hora: "24/11/2026" */
export function fmtFechaSola(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

/** Solo hora: "16:00" */
export function fmtHora(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

/** Fecha estilo "lunes 24 de noviembre" para agrupadores */
export function fmtFechaLarga(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-AR', {
    weekday: 'long', day: '2-digit', month: 'long'
  })
}

/**
 * Convierte una fecha que viene del backend (formato ISO con Z)
 * interpretándola como hora Argentina, no UTC.
 * Backend guarda "2026-04-29T13:30:00.000Z" queriendo decir 13:30 Argentina.
 * Esta función lo convierte a un timestamp correcto.
 */
function fechaArgentinaATimestamp(fechaISO) {
  if (!fechaISO) return null
  const str = String(fechaISO).trim()
  
  // Si termina en Z, asumir que es hora Argentina (no UTC)
  if (/Z$/.test(str)) {
    const sinZ = str.replace(/Z$/, '')
    const conOffset = `${sinZ}-03:00` // Argentina UTC-3
    const date = new Date(conOffset)
    if (isNaN(date.getTime())) return null
    return date.getTime()
  }
  
  // Si no tiene Z, parsearlo normalmente
  const date = new Date(str)
  if (isNaN(date.getTime())) return null
  return date.getTime()
}

/** Tiempo restante hasta una fecha límite: "2d 5h", "45m", "Cerrada" */
export function timeLeft(fechaCierre) {
  const timestamp = fechaArgentinaATimestamp(fechaCierre)
  if (!timestamp) return 'Cerrada'
  
  const diff = timestamp - Date.now()
  if (diff <= 0) return 'Cerrada'
  
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

/**
 * Convierte el valor de un <input type="datetime-local"> a ISO UTC.
 *
 * El input datetime-local devuelve "2026-11-24T16:00" sin zona.
 * Por default JavaScript lo interpreta en la zona del navegador
 * (lo cual es lo que queremos: el admin escribe en SU hora local
 * y cada usuario lo ve en la suya). El ISO resultante es UTC puro
 * y se puede guardar sin ambigüedad.
 *
 * @param {string} valorInput - valor crudo del input datetime-local
 * @returns {string} ISO UTC ej. "2026-11-24T19:00:00.000Z"
 */
export function inputLocalAIsoUtc(valorInput) {
  if (!valorInput) return ''
  const d = new Date(valorInput)
  if (isNaN(d.getTime())) return ''
  return d.toISOString()
}

/**
 * Convierte un ISO UTC a formato "YYYY-MM-DDTHH:mm" que espera un
 * <input type="datetime-local">, usando la zona local del navegador.
 * Útil para precargar inputs al editar.
 */
export function isoUtcAInputLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = n => String(n).padStart(2, '0')
  return (
    d.getFullYear() + '-' +
    pad(d.getMonth() + 1) + '-' +
    pad(d.getDate()) + 'T' +
    pad(d.getHours()) + ':' +
    pad(d.getMinutes())
  )
}

/* ══════════════════════════════════════════════════════════
   APUESTAS
   ══════════════════════════════════════════════════════════ */

/** Devuelve true si una apuesta está abierta para apostar
 *  (estado abierto Y fecha límite no superada) */
export function isBetOpen(bet) {
  if (bet.estado !== 'abierta') return false
  if (!bet.fecha_cierre) return true
  return new Date(bet.fecha_cierre) > new Date()
}

/* ── Bloqueo por PARTIDO individual (modelo sogefi) ──────────
   Cada partido se cierra solo a su hora de inicio, mientras la
   apuesta sigue abierta hasta el inicio del último partido.

   Comparación por INSTANTE UTC (no hora local): new Date(iso) parsea
   el timestamptz como un instante absoluto, así funciona en cualquier
   zona horaria del navegador. NO usar el parche de timeLeft acá.
   ──────────────────────────────────────────────────────────── */

/** El campo de fecha del partido viene mapeado como `fecha_partido`
 *  (= partidos.fecha_hora). Aceptamos ambos por robustez. */
function fechaInicioPartido(match) {
  return match?.fecha_partido || match?.fecha_hora || null
}

/** true si el partido ya está cerrado para predecir:
 *  estado en_vivo/finalizado/cancelado, o su hora de inicio ya pasó. */
export function isMatchLocked(match, now = Date.now()) {
  if (!match) return true
  if (['en_vivo', 'finalizado', 'cancelado'].includes(match.estado)) return true
  const iso = fechaInicioPartido(match)
  if (!iso) return false // sin fecha conocida → no bloqueamos por hora
  const t = new Date(iso).getTime()
  if (isNaN(t)) return false
  return t <= now
}

/** Etiqueta de estado del partido para la UI (modelo sogefi).
 *  Devuelve { txt, tone } con tone ∈ 'open' | 'live' | 'done'. */
export function matchStatusInfo(match, now = Date.now()) {
  if (!match) return { txt: '—', tone: 'done' }
  if (match.estado === 'en_vivo')    return { txt: 'EN VIVO',   tone: 'live' }
  if (match.estado === 'finalizado') return { txt: 'FINAL',     tone: 'done' }
  if (match.estado === 'cancelado')  return { txt: 'CANCELADO', tone: 'done' }
  if (isMatchLocked(match, now))     return { txt: 'CERRADO',   tone: 'done' }
  const iso = fechaInicioPartido(match)
  return { txt: iso ? `Disponible hasta ${fmtFecha(iso)}` : 'Disponible', tone: 'open' }
}

/** true si la apuesta tiene al menos un partido todavía abierto. */
export function betHasOpenMatches(bet, now = Date.now()) {
  if (!bet?.partidos?.length) return false
  return bet.partidos.some(m => !isMatchLocked(m, now))
}

/** Clases CSS para el estado de una apuesta */
export function betStatusClass(estado) {
  return {
    abierta: 'text-accent',
    cerrada: 'text-muted',
    finalizada: 'text-warn',
  }[estado] ?? 'text-muted'
}

/** Clases CSS para el estado de un partido */
export function matchStateLabel(estado) {
  return {
    programado:  { label: 'Programado', class: 'text-muted' },
    en_vivo:     { label: 'EN VIVO',    class: 'text-accent animate-pulse-accent' },
    finalizado:  { label: 'Finalizado', class: 'text-warn' },
    cancelado:   { label: 'Cancelado',  class: 'text-danger' }
  }[estado] ?? { label: estado || '-', class: 'text-muted' }
}

/* ══════════════════════════════════════════════════════════
   OTROS
   ══════════════════════════════════════════════════════════ */

/** Trunca texto a n caracteres */
export function truncate(str, n = 40) {
  if (!str) return ''
  return str.length > n ? str.slice(0, n) + '…' : str
}