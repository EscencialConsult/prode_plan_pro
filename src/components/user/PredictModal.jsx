/**
 * PredictModal.jsx — src/dashboard/components/PredictModal.jsx
 * v10 - BOTÓN CERRAR 100% FUNCIONAL GARANTIZADO
 */

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../hooks/useAuth.jsx'
import { timeLeft, isBetOpen } from '../../utils/index.js'
import { useToast } from '../../hooks/useToast.jsx'

function esEliminatoria(fase) {
  if (!fase) return false
  return String(fase).trim().toLowerCase() !== 'grupos'
}

function useDebounce(callback, delay, deps) {
  useEffect(() => {
    const handler = setTimeout(callback, delay)
    return () => clearTimeout(handler)
  }, [...deps, delay])
}

// predictions se recibe como prop desde el padre (BetsPage ya los tiene cargados).
// Así el modal siempre arranca con los datos reales de la DB, sin delay de red.
export default function PredictModal({ bet, predictions = {}, onSubmit, onClose, loading }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [scores, setScores] = useState({})
  const [clasificados, setClasificados] = useState({})
  const [activeMatchIdx, setActiveMatchIdx] = useState(0)
  const matchRefs = useRef({})
  const listRef = useRef(null)

  const esApuestaGrupos = bet?.tipo === 'grupos' || bet?.type === 'grupos'
  const areaUsuario = user?.area_id

  // En apuestas grupales, el usuario necesita tener área asignada
  const estaBloqueado = esApuestaGrupos && !areaUsuario

  let razonBloqueo = null
  if (estaBloqueado) {
    razonBloqueo = {
      titulo: 'No tenés un área asignada',
      detalle: 'Para participar en apuestas grupales necesitás tener un área asignada. Contactá al administrador para que te asigne una.',
    }
  }

  // ── Inicialización de scores ──────────────────────────────────────────
  // Se ejecuta UNA sola vez por bet (dep: bet?.id), NO cada vez que cambia
  // el objeto predictions. Así el usuario no pierde lo que está tipeando.
  //
  // Orden de prioridad (de mayor a menor):
  //   1. Predicción guardada en la DB  → viene en la prop `predictions`
  //   2. Borrador en localStorage      → sólo rellena campos SIN pred en DB
  //   3. Vacío                         → campo en blanco
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!bet?.partidos) return

    const initialScores = {}
    const initialClasif = {}

    // Paso 1 — DB es la fuente de verdad
    bet.partidos.forEach(p => {
      const dbPred = predictions?.[p.id]
      initialScores[p.id] = {
        local:     dbPred?.pred_local     != null ? String(dbPred.pred_local)     : '',
        visitante: dbPred?.pred_visitante != null ? String(dbPred.pred_visitante) : '',
      }
      initialClasif[p.id] = dbPred?.pred_clasificado || ''
    })

    // Paso 2 — Borrador rellena SOLO los partidos sin predicción en DB
    const userId = user?.id || user?.user_id || 'anon'
    const draftKey = `bet-${bet.id}-${userId}-draft`
    try {
      const raw = localStorage.getItem(draftKey)
      if (raw) {
        const { scores: dScores, clasificados: dClasif } = JSON.parse(raw)
        if (dScores) {
          Object.keys(dScores).forEach(pid => {
            // Usar borrador únicamente si no hay datos de DB para este partido
            if (initialScores[pid]?.local === '' && initialScores[pid]?.visitante === '') {
              initialScores[pid] = dScores[pid]
            }
          })
        }
        if (dClasif) {
          Object.keys(dClasif).forEach(pid => {
            if (!initialClasif[pid]) initialClasif[pid] = dClasif[pid]
          })
        }
      }
    } catch (e) {
      console.warn('Error loading draft:', e)
    }

    setScores(initialScores)
    setClasificados(initialClasif)
  }, [bet?.id, user?.id, user?.user_id]) // ← re-init también si cambia el usuario

  // Guarda el borrador 2s después del último cambio (recovery anti-cierre accidental)
  useDebounce(() => {
    if (!bet?.id) return
    const userId = user?.id || user?.user_id || 'anon'
    const draftKey = `bet-${bet.id}-${userId}-draft`
    try {
      localStorage.setItem(draftKey, JSON.stringify({ scores, clasificados }))
    } catch (e) {
      console.warn('Error saving draft:', e)
    }
  }, 2000, [scores, clasificados])

  useEffect(() => {
    if (!bet) return
    function handleKeyDown(e) { 
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [bet, onClose])

  useEffect(() => {
    if (!bet) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [bet])

  useEffect(() => {
    if (!bet?.partidos || !listRef.current) return
    
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.dataset.matchId
            const idx = bet.partidos.findIndex(p => String(p.id) === id)
            if (idx !== -1) setActiveMatchIdx(idx)
          }
        })
      },
      { root: listRef.current, threshold: 0.6 }
    )

    Object.values(matchRefs.current).forEach(el => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [bet?.partidos])

  if (!bet) return null

  const open = isBetOpen(bet)
  const remaining = timeLeft(bet.fecha_cierre)
  const isClosingSoon = open && remaining !== 'Cerrada' && !remaining.includes('d')
  const totalMatches = bet.partidos?.length || 0

  function predicionCompleta(match) {
    const sc = scores[match.id]
    if (!sc || sc.local === '' || sc.visitante === '') return false
    if (esEliminatoria(match.fase)) {
      const pl = parseInt(sc.local, 10)
      const pv = parseInt(sc.visitante, 10)
      if (!isNaN(pl) && !isNaN(pv) && pl === pv && !clasificados[match.id]) return false
    }
    return true
  }

  const filledCount = bet.partidos?.filter(predicionCompleta).length || 0
  const hadPredictions = bet.partidos?.some(p => predictions?.[p.id]) ?? false
  const progressPct = totalMatches > 0 ? (filledCount / totalMatches) * 100 : 0
  const pendingCount = totalMatches - filledCount

  function handleSubmit(e) {
    e.preventDefault()
    e.stopPropagation()
    
    if (estaBloqueado) return

    const matchPredictions = []
    const empatesSinClasificado = []

    for (const match of (bet.partidos || [])) {
      const vals = scores[match.id]
      if (!vals) continue
      const pl = parseInt(vals.local, 10)
      const pv = parseInt(vals.visitante, 10)
      if (isNaN(pl) || isNaN(pv)) continue

      const item = { partido_id: match.id, pred_local: pl, pred_visitante: pv }

      if (esEliminatoria(match.fase)) {
        if (pl !== pv) {
          item.pred_clasificado = pl > pv ? match.codigo_local : match.codigo_visitante
        } else {
          const clasif = clasificados[match.id]
          if (!clasif) {
            empatesSinClasificado.push(match.equipo_local + ' vs ' + match.equipo_visitante)
            continue
          }
          item.pred_clasificado = clasif
        }
      }
      matchPredictions.push(item)
    }

    if (empatesSinClasificado.length > 0) {
      toast.info(
        'Predijiste un empate y no indicaste quién pasa por penales. Falta el clasificado en: ' +
        empatesSinClasificado.join(', ')
      )
      return
    }

    if (matchPredictions.length === 0) {
      toast.info('Ingresá al menos una predicción válida.')
      return
    }

    onSubmit(bet.id, matchPredictions)
  }

  function updateScore(partidoId, side, value) {
    if (value !== '' && !/^\d{0,2}$/.test(value)) return
    setScores(prev => ({ ...prev, [partidoId]: { ...prev[partidoId], [side]: value } }))
    
    setClasificados(prev => {
      const match = bet.partidos?.find(p => p.id === partidoId)
      if (!match || !esEliminatoria(match.fase)) return prev
      const otherSide = side === 'local' ? 'visitante' : 'local'
      const otherVal = scores[partidoId]?.[otherSide]
      const newPl = side === 'local' ? parseInt(value, 10) : parseInt(otherVal, 10)
      const newPv = side === 'visitante' ? parseInt(value, 10) : parseInt(otherVal, 10)
      if (!isNaN(newPl) && !isNaN(newPv) && newPl !== newPv && prev[partidoId]) {
        const next = { ...prev }
        delete next[partidoId]
        return next
      }
      return prev
    })
  }

  function updateClasificado(partidoId, codigo) {
    setClasificados(prev => ({ ...prev, [partidoId]: codigo }))
  }

  function scrollToMatch(id, idx) {
    const el = matchRefs.current[id]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setActiveMatchIdx(idx)
    }
  }

  // ✅ FUNCIÓN SIMPLIFICADA QUE SÍ FUNCIONA
  const cerrarModal = () => {
    console.log('🔴 CERRANDO MODAL') // Para debug
    onClose()
  }

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-sm"
      onClick={cerrarModal}
    >
      <div 
        className="relative w-full h-full sm:h-auto sm:max-w-7xl sm:max-h-[95vh] bg-gradient-to-br from-zinc-50 to-red-50/30 sm:rounded-2xl shadow-2xl grid grid-cols-1 lg:grid-cols-[320px_1fr] grid-rows-1 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        
        {/* SIDEBAR - SIN CAMBIOS */}
        <aside className="hidden lg:flex flex-col bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900 text-red-50 border-r border-zinc-700/50 overflow-hidden">
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-red-700/10 to-transparent flex-shrink-0">
            <div className="text-[10px] font-bold tracking-[0.2em] text-red-600 uppercase mb-2.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              Mundial 2026
            </div>
            <h2 className="text-xl font-extrabold leading-tight text-white">{bet.titulo}</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 p-5 border-b border-white/10 flex-shrink-0">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/20 rounded-xl p-4 hover:scale-105 transition-transform">
              <div className="text-4xl font-black leading-none text-red-600 mb-2">{filledCount}</div>
              <div className="text-[10px] font-bold tracking-wider text-zinc-300 uppercase">Completadas</div>
            </div>
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/20 rounded-xl p-4 hover:scale-105 transition-transform">
              <div className={`text-4xl font-black leading-none mb-2 ${pendingCount === 0 ? 'text-green-400' : 'text-zinc-400'}`}>
                {pendingCount}
              </div>
              <div className="text-[10px] font-bold tracking-wider text-zinc-300 uppercase">Pendientes</div>
            </div>
          </div>

          <div className="p-5 border-b border-white/10 flex-shrink-0">
            {open ? (
              <div className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full text-[10px] font-bold tracking-wider uppercase border-2 ${
                isClosingSoon 
                  ? 'bg-red-500/20 text-red-300 border-red-500/50 animate-pulse shadow-lg shadow-red-500/20' 
                  : 'bg-red-700/20 text-red-400 border-red-700/50 shadow-lg shadow-red-700/20'
              }`}>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {remaining}
              </div>
            ) : (
              <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-zinc-700/50 text-zinc-400 border-2 border-zinc-600/50">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                Cerrada
              </div>
            )}
            <div className="mt-3 text-[13px] text-zinc-300 leading-relaxed">
              {open
                ? hadPredictions
                  ? 'Revisá o modificá tus predicciones antes del cierre.'
                  : 'Cargá tus predicciones para cada partido.'
                : 'La apuesta está cerrada. Modo solo lectura.'}
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 pb-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            <div className="px-3 py-3 text-[10px] font-bold tracking-[0.15em] text-zinc-400 uppercase">
              {totalMatches} Partidos
            </div>
            {bet.partidos?.map((m, idx) => {
              const done = predicionCompleta(m)
              const live = m.estado === 'en_vivo'
              const isActive = idx === activeMatchIdx
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`flex items-center gap-3 w-full px-3 py-2.5 text-left rounded-xl text-[13px] transition-all border-l-[3px] mb-2 ${
                    isActive 
                      ? 'bg-red-700/20 border-l-red-600 shadow-lg shadow-red-700/20' 
                      : done 
                        ? 'border-l-red-700 hover:bg-white/10 bg-white/5' 
                        : live 
                          ? 'border-l-red-500 hover:bg-white/10 bg-red-500/10 animate-pulse'
                          : 'border-l-transparent hover:bg-white/5'
                  }`}
                  onClick={() => scrollToMatch(m.id, idx)}
                >
                  <span className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold flex-shrink-0 ${
                    done 
                      ? 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-md'
                      : live 
                        ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md'
                        : 'bg-white/10 text-zinc-400 border border-white/20'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="flex-1 min-w-0 text-white font-medium">
                    <span className="block text-xs text-zinc-400 mb-0.5 truncate">
                      {m.codigo_local || m.equipo_local}
                    </span>
                    <span className="block text-xs text-zinc-400 truncate">
                      {m.codigo_visitante || m.equipo_visitante}
                    </span>
                  </span>
                  {done && (
                    <svg className="w-4 h-4 text-red-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* MAIN */}
        <div className="flex flex-col bg-white min-w-0 h-full overflow-hidden">
          
          {/* Header */}
          <header className="px-4 sm:px-6 py-3 bg-gradient-to-r from-white to-red-50/50 border-b border-zinc-200 flex items-center justify-between gap-4 flex-shrink-0 shadow-sm">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold tracking-[0.2em] text-red-700 uppercase mb-1 flex items-center gap-2">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                Centro de Predicciones
              </div>
              <h2 className="text-base sm:text-lg font-black text-zinc-900 leading-tight">
                {bet.titulo}
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {open && (
                <span className={`hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                  isClosingSoon 
                    ? 'bg-red-50 text-red-600 border-red-300' 
                    : 'bg-red-50 text-red-800 border-red-400'
                }`}>
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  {remaining}
                </span>
              )}
              {/* ✅ BOTÓN X TOTALMENTE AISLADO */}
              <div 
                className="w-9 h-9 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg hover:shadow-xl cursor-pointer select-none"
                style={{ position: 'relative', zIndex: 9999999 }}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  cerrarModal()
                }}
                onTouchEnd={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  cerrarModal()
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" style={{ pointerEvents: 'none' }}>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            </div>
          </header>

          {/* Mobile Nav Pills */}
          <div className="lg:hidden px-4 py-2 bg-white border-b border-zinc-200 overflow-x-auto scrollbar-none flex-shrink-0">
            <div className="inline-flex gap-2 min-w-min pb-1">
              {bet.partidos?.map((m, idx) => {
                const done = predicionCompleta(m)
                const live = m.estado === 'en_vivo'
                const isActive = idx === activeMatchIdx
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`w-9 h-9 inline-flex items-center justify-center rounded-lg text-xs font-bold flex-shrink-0 border-2 transition-all ${
                      isActive 
                        ? 'bg-gradient-to-br from-zinc-900 to-zinc-800 border-red-600 text-red-600 shadow-lg shadow-red-700/30 scale-110' 
                        : done 
                          ? 'bg-gradient-to-br from-red-600 to-red-700 border-red-700 text-white'
                          : live 
                            ? 'bg-gradient-to-br from-red-500 to-red-600 border-red-500 text-white animate-pulse'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                    }`}
                    onClick={() => scrollToMatch(m.id, idx)}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Matches List - IGUAL QUE ANTES, SIN CAMBIOS */}
          <div 
            className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 scroll-smooth scrollbar-thin scrollbar-thumb-zinc-300 hover:scrollbar-thumb-red-700 scrollbar-track-zinc-100"
            ref={listRef}
          >
            {/* ... TODO EL CONTENIDO DE LOS PARTIDOS IGUAL QUE ANTES ... */}
            {razonBloqueo && (
              <div className="flex gap-3 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 border-l-4 border-l-red-500 rounded-lg p-4 mb-3 shadow-sm">
                <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-red-500 text-white font-black text-lg flex items-center justify-center">
                  !
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-zinc-900 mb-1 text-sm">{razonBloqueo.titulo}</div>
                  <div className="text-xs text-zinc-600 leading-relaxed">{razonBloqueo.detalle}</div>
                </div>
              </div>
            )}

            {totalMatches === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                  <svg className="w-8 h-8 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-zinc-800 mb-1">No hay partidos disponibles</h3>
                <p className="text-sm text-zinc-500">Esta apuesta aún no tiene fixture cargado</p>
              </div>
            )}

            {bet.partidos?.map((match, idx) => {
              const isLive = match.estado === 'en_vivo'
              const isFinished = match.estado === 'finalizado'
              // ── Bloqueo por horario de inicio del partido ──
              // El partido se cierra automáticamente cuando llega su hora de
              // arranque (fecha_partido), aunque el sync todavía no haya
              // marcado el estado como 'en_vivo'. El estado queda como respaldo.
              const kickoff = match.fecha_partido ? new Date(match.fecha_partido) : null
              const matchStarted = kickoff && !isNaN(kickoff.getTime())
                ? kickoff.getTime() <= Date.now()
                : false
              const fmtKick = kickoff && !isNaN(kickoff.getTime())
                ? kickoff.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }).replace('.', '') +
                  ' · ' + kickoff.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                : null
              const isDisabled = !open || isLive || isFinished || estaBloqueado || matchStarted
              const sc = scores[match.id] || { local: '', visitante: '' }
              const hasScore = sc.local !== '' && sc.visitante !== ''
              const elim = esEliminatoria(match.fase)
              const pl = sc.local !== '' ? parseInt(sc.local, 10) : null
              const pv = sc.visitante !== '' ? parseInt(sc.visitante, 10) : null
              const empate = hasScore && pl === pv
              const clasifElegido = clasificados[match.id] || ''
              const completo = predicionCompleta(match)

              return (
                <div
                  key={match.id}
                  ref={el => { matchRefs.current[match.id] = el }}
                  data-match-id={match.id}
                  className={`bg-white rounded-xl mb-2.5 overflow-hidden shadow-sm border transition-all duration-200 hover:shadow-md ${
                    completo && !isLive && !isFinished 
                      ? 'border-red-600 shadow-red-700/10' 
                      : isLive 
                        ? 'border-red-500 shadow-red-500/10'
                        : 'border-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 text-white">
                    <div className="flex items-center gap-2">
                      <span className="bg-zinc-800 text-red-600 text-[10px] font-black px-2 py-0.5 rounded min-w-[32px] text-center border border-red-600/30">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-bold tracking-wider uppercase">Partido</span>
                      {elim && <span className="text-[9px] font-bold text-red-600 uppercase">· Elim</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isLive && (
                        <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[8px] font-black tracking-wider px-2 py-0.5 rounded-full animate-pulse">
                          <span className="w-1 h-1 rounded-full bg-white" />
                          VIVO
                        </span>
                      )}
                      {isFinished && (
                        <span className="inline-flex items-center bg-zinc-600 text-white text-[8px] font-black tracking-wider px-2 py-0.5 rounded-full">
                          FIN
                        </span>
                      )}
                      {!isLive && !isFinished && completo && (
                        <span className="inline-flex items-center gap-1 bg-red-600 text-white text-[8px] font-black tracking-wider px-2 py-0.5 rounded-full">
                          <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          OK
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-center">
                    <div className="flex items-center gap-2.5 p-3 bg-gradient-to-r from-zinc-50 to-white border-r border-zinc-200">
                      {match.bandera_local && (
                        <img src={match.bandera_local} alt="" className="w-10 h-7 object-cover rounded shadow-sm flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        {match.codigo_local && (
                          <div className="text-[9px] font-black tracking-wider text-red-700 uppercase mb-0.5">
                            {match.codigo_local}
                          </div>
                        )}
                        <div className="text-sm font-black text-zinc-900 leading-tight truncate">
                          {match.equipo_local}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        value={sc.local}
                        onChange={e => updateScore(match.id, 'local', e.target.value)}
                        placeholder="—"
                        disabled={isDisabled}
                        className="w-11 h-11 text-2xl text-center font-black bg-white text-zinc-900 border-2 border-red-600 rounded-lg outline-none transition-all focus:border-red-400 focus:shadow-lg focus:shadow-red-700/30 focus:scale-105 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:border-zinc-300 disabled:cursor-not-allowed tabular-nums"
                      />
                      <span className="text-2xl font-black text-red-600">:</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        value={sc.visitante}
                        onChange={e => updateScore(match.id, 'visitante', e.target.value)}
                        placeholder="—"
                        disabled={isDisabled}
                        className="w-11 h-11 text-2xl text-center font-black bg-white text-zinc-900 border-2 border-red-600 rounded-lg outline-none transition-all focus:border-red-400 focus:shadow-lg focus:shadow-red-700/30 focus:scale-105 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:border-zinc-300 disabled:cursor-not-allowed tabular-nums"
                      />
                    </div>

                    <div className="flex items-center gap-2.5 p-3 text-right bg-gradient-to-l from-zinc-50 to-white border-l border-zinc-200">
                      <div className="flex-1 min-w-0">
                        {match.codigo_visitante && (
                          <div className="text-[9px] font-black tracking-wider text-red-700 uppercase mb-0.5">
                            {match.codigo_visitante}
                          </div>
                        )}
                        <div className="text-sm font-black text-zinc-900 leading-tight truncate">
                          {match.equipo_visitante}
                        </div>
                      </div>
                      {match.bandera_visitante && (
                        <img src={match.bandera_visitante} alt="" className="w-10 h-7 object-cover rounded shadow-sm flex-shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Disponibilidad por partido (bloqueo automático al arrancar) */}
                  {open && !estaBloqueado && (
                    (matchStarted || isLive || isFinished) ? (
                      <div className="px-3 py-2 bg-zinc-100 border-t border-zinc-200 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                          <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        Cerrado · el partido ya comenzó
                      </div>
                    ) : fmtKick ? (
                      <div className="px-3 py-2 bg-green-50 border-t border-green-100 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-green-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                        Disponible hasta {fmtKick}
                      </div>
                    ) : null
                  )}

                  {elim && empate && (
                    <div className="px-3 py-3 bg-red-50 border-t border-dashed border-red-200">
                      <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase text-red-800 mb-2">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 6v6l4 2" />
                        </svg>
                        ¿Quién pasa por penales?
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={isDisabled}
                          onClick={() => updateClasificado(match.id, match.codigo_local)}
                          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide border-2 transition-all ${
                            clasifElegido === match.codigo_local
                              ? 'bg-zinc-900 border-red-600 text-red-600 shadow-md'
                              : 'bg-white border-zinc-200 text-zinc-700 hover:border-red-600 hover:bg-red-50'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {match.bandera_local && (
                            <img src={match.bandera_local} alt="" className="w-5 h-3.5 object-cover rounded" />
                          )}
                          <span className="text-[10px]">{match.equipo_local}</span>
                        </button>
                        <button
                          type="button"
                          disabled={isDisabled}
                          onClick={() => updateClasificado(match.id, match.codigo_visitante)}
                          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide border-2 transition-all ${
                            clasifElegido === match.codigo_visitante
                              ? 'bg-zinc-900 border-red-600 text-red-600 shadow-md'
                              : 'bg-white border-zinc-200 text-zinc-700 hover:border-red-600 hover:bg-red-50'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {match.bandera_visitante && (
                            <img src={match.bandera_visitante} alt="" className="w-5 h-3.5 object-cover rounded" />
                          )}
                          <span className="text-[10px]">{match.equipo_visitante}</span>
                        </button>
                      </div>
                      {!clasifElegido && (
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-red-600 font-bold">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          Falta elegir
                        </div>
                      )}
                    </div>
                  )}

                  {elim && hasScore && !empate && (
                    <div className="px-3 py-2.5 bg-green-50 border-t border-dashed border-green-200">
                      <div className="flex items-center gap-2.5 px-3 py-2 bg-white rounded-lg border border-green-200">
                        <span className="text-green-600 text-sm">✓</span>
                        <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-500">
                          Clasificado:
                        </span>
                        <span className="text-xs font-black text-zinc-900 uppercase inline-flex items-center gap-2">
                          {(() => {
                            const ganador = pl > pv
                              ? { nombre: match.equipo_local, bandera: match.bandera_local }
                              : { nombre: match.equipo_visitante, bandera: match.bandera_visitante }
                            return (
                              <>
                                {ganador.bandera && (
                                  <img src={ganador.bandera} alt="" className="w-5 h-3.5 object-cover rounded" />
                                )}
                                {ganador.nombre}
                              </>
                            )
                          })()}
                        </span>
                      </div>
                    </div>
                  )}

                  {(isLive || isFinished) && (match.goles_local != null || match.goles_visitante != null) && (
                    <div className="px-3 py-2.5 bg-zinc-100 border-t border-zinc-200">
                      <div className="flex items-center gap-3 px-3 py-2 bg-zinc-900 rounded-lg text-white">
                        <span className="text-[9px] font-black tracking-widest uppercase text-red-600">
                          {isLive ? '⚡ VIVO' : '🏁 FINAL'}
                        </span>
                        <span className="text-lg font-black tabular-nums">
                          {match.goles_local ?? 0} - {match.goles_visitante ?? 0}
                        </span>
                        {match.penales_local != null && match.penales_local !== '' &&
                          match.penales_visit != null && match.penales_visit !== '' && (
                            <span className="text-[10px] text-zinc-400 ml-auto font-bold">
                              (pen {match.penales_local}-{match.penales_visit})
                            </span>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <form onSubmit={handleSubmit} className="flex-shrink-0">
            <footer className="px-4 sm:px-6 py-3 bg-zinc-900 text-white border-t-2 border-red-600 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center">
              <div className="min-w-0">
                {open && (
                  <>
                    <div className="flex items-baseline justify-between text-[9px] tracking-wider uppercase mb-2">
                      <span className="text-zinc-400 font-bold">Progreso</span>
                      <span className="text-white font-bold">
                        <strong className="text-red-600 text-lg mr-1 font-black">{filledCount}</strong>
                        <span className="text-zinc-400">de</span> {totalMatches}
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-600 via-red-400 to-red-700 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-2 justify-stretch sm:justify-end">
                <button 
                  type="button" 
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-transparent border border-white/30 text-zinc-300 hover:border-white hover:text-white hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>
                {open && !estaBloqueado && (
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-red-600 via-red-500 to-red-700 text-white shadow-lg shadow-red-700/40 border border-red-600 hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none transition-all inline-flex items-center justify-center gap-2 active:scale-95"
                    disabled={loading || filledCount === 0}
                  >
                    {loading ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                          <polyline points="17 21 17 13 7 13 7 21" />
                          <polyline points="7 3 7 8 15 8" />
                        </svg>
                        {hadPredictions ? 'Actualizar' : 'Guardar'}
                      </>
                    )}
                  </button>
                )}
              </div>

              {open && !estaBloqueado && (
                <div className="col-span-full text-[10px] text-zinc-400 text-center tracking-wide">
                  💡 Podés modificar mientras esté abierta
                </div>
              )}
              {open && estaBloqueado && (
                <div className="col-span-full text-[10px] text-pink-300 text-center tracking-wide font-bold">
                  🔒 Solo lectura
                </div>
              )}
            </footer>
          </form>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}