import { useState, useEffect, useMemo } from 'react'
import sheetsApi from '../../services/sheetsApi.js'
import { isBetOpen, timeLeft, isoUtcAInputLocal, inputLocalAIsoUtc, fmtFecha } from '../../utils/index.js'
import { useToast, useConfirm } from '../../hooks/useToast.jsx'

function getBetStatus(bet) {
  if (bet.estado === 'abierta' && isBetOpen(bet))
    return { color: '#1b8a5a', bg: 'rgba(27,138,90,.08)', border: 'rgba(27,138,90,.2)', label: 'Activa', dot: true }
  if (bet.estado === 'finalizada')
    return { color: '#c99f16', bg: 'rgba(235,195,43,.1)', border: 'rgba(235,195,43,.25)', label: 'Finalizada', dot: false }
  if (bet.estado === 'cerrada')
    return { color: '#5f6e8a', bg: 'rgba(95,110,138,.06)', border: 'rgba(95,110,138,.15)', label: 'Cerrada', dot: false }
  return { color: '#5f6e8a', bg: 'rgba(95,110,138,.06)', border: 'rgba(95,110,138,.12)', label: bet.estado || '—', dot: false }
}

function BetRow({ bet, onEdit, onDelete }) {
  const status = getBetStatus(bet)
  const matchCount = bet.partidos_ids ? bet.partidos_ids.split(',').filter(Boolean).length : (bet.partidos?.length || 0)
  const remaining = bet.fecha_cierre ? timeLeft(bet.fecha_cierre) : null
  const isOpen = isBetOpen(bet)
  const puedeEliminar = bet.estado === 'abierta'

  return (
    <div
      className="rounded-xl p-4 transition-all"
      style={{
        background: '#fff',
        border: `1px solid ${status.border}`,
        boxShadow: '0 2px 8px rgba(12,24,43,.04)',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(12,24,43,.08)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(12,24,43,.04)' }}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-body font-bold uppercase tracking-wider"
              style={{ background: status.bg, color: status.color, border: `1px solid ${status.border}` }}
            >
              {status.dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.color }} />}
              {status.label}
            </span>
            <span
              className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-body font-semibold uppercase tracking-wider"
              style={{ background: 'rgba(12,24,43,.04)', color: '#a8b2c4', border: '1px solid #f0eadb' }}
            >
              {bet.tipo === 'grupos' ? 'Áreas' : 'Libre'}
            </span>
          </div>

          <p className="font-display text-lg truncate" style={{ color: '#0c182b', letterSpacing: '.01em' }}>
            {bet.titulo}
          </p>

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {matchCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-body" style={{ color: '#5f6e8a' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {matchCount} {matchCount === 1 ? 'partido' : 'partidos'}
              </span>
            )}
            {bet.premio && (
              <span className="flex items-center gap-1 text-xs font-body" style={{ color: '#c99f16' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                {bet.premio}
              </span>
            )}
            {remaining && isOpen && (
              <span className="flex items-center gap-1 text-xs font-body" style={{ color: '#5f6e8a' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Cierra en {remaining}
              </span>
            )}
            {bet.participantes > 0 && (
              <span className="text-xs font-body" style={{ color: '#a8b2c4' }}>
                {bet.participantes} participantes
              </span>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button
            onClick={() => onEdit(bet)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-body font-semibold transition-all"
            style={{ fontSize: 11, background: 'transparent', border: '1px solid rgba(12,24,43,.2)', color: '#5f6e8a' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(12,24,43,.04)'; e.currentTarget.style.borderColor = '#FF7D00'; e.currentTarget.style.color = '#FF7D00' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(12,24,43,.2)'; e.currentTarget.style.color = '#5f6e8a' }}
          >
            Editar
          </button>
          {puedeEliminar && (
            <button
              onClick={() => onDelete(bet.id)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-body font-semibold transition-all"
              style={{ fontSize: 11, background: 'transparent', border: '1px solid rgba(224,50,82,.3)', color: '#e03252' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(224,50,82,.06)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Modal de edición ────────────────────────────────────── */
function EditBetModal({ bet, matches, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    titulo: bet.titulo || '',
    descripcion: bet.descripcion || '',
    premio: bet.premio || '',
    fecha_cierre: bet.fecha_cierre ? isoUtcAInputLocal(bet.fecha_cierre) : '',
  })

  const initialPartidos = useMemo(() => {
    return (bet.partidos_ids || '').split(',').map(s => s.trim()).filter(Boolean)
  }, [bet.partidos_ids])

  const [partidosIds, setPartidosIds] = useState(initialPartidos)
  const [predicCount, setPredicCount] = useState(null)
  const [loadingCount, setLoadingCount] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    let cancelado = false
    setLoadingCount(true)
    sheetsApi.apuestas.contarPredicciones(bet.id)
      .then(r => { if (!cancelado) setPredicCount(r.count) })
      .catch(() => { if (!cancelado) setPredicCount(0) })
      .finally(() => { if (!cancelado) setLoadingCount(false) })
    return () => { cancelado = true }
  }, [bet.id])

  const partidosEditables = predicCount === 0

  const partidosDisponibles = useMemo(() => {
    return (matches || []).filter(m =>
      m.equipo_local && m.equipo_visitante &&
      m.codigo_local !== 'TBD' && m.codigo_visitante !== 'TBD'
    )
  }, [matches])

  const partidosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return partidosDisponibles
    return partidosDisponibles.filter(m =>
      `${m.equipo_local} ${m.equipo_visitante}`.toLowerCase().includes(q)
    )
  }, [partidosDisponibles, busqueda])

  // Recalcular fecha_cierre cuando cambia el set de partidos editables.
  useEffect(() => {
    if (!partidosEditables) return
    if (partidosIds.length === 0) return
    const seleccionados = partidosDisponibles.filter(m => partidosIds.includes(m.id))
    if (seleccionados.length === 0) return
    const primero = seleccionados.reduce((min, p) =>
      new Date(p.fecha_partido) < new Date(min.fecha_partido) ? p : min, seleccionados[0])
    const fecha = new Date(primero.fecha_partido)
    fecha.setMinutes(fecha.getMinutes() - 10)
    const sugerida = isoUtcAInputLocal(fecha.toISOString())
    setForm(prev => prev.fecha_cierre === sugerida ? prev : { ...prev, fecha_cierre: sugerida })
  }, [partidosIds, partidosDisponibles, partidosEditables])

  function toggleMatch(id) {
    setPartidosIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function handleSubmit(e) {
    e.preventDefault()

    if (!form.titulo.trim()) return
    if (!form.fecha_cierre) return
    if (partidosEditables && partidosIds.length === 0) return

    const payload = {
      apuesta_id: bet.id,
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      premio: form.premio.trim(),
      fecha_cierre: inputLocalAIsoUtc(form.fecha_cierre),
    }
    if (partidosEditables) {
      payload.partidos_ids = partidosIds.join(',')
    }
    onSave(payload)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(12,24,43,.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        className="rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: '#fff', boxShadow: '0 24px 60px rgba(0,0,0,.4)' }}
      >
        <div className="px-6 py-5 flex items-center justify-between"
          style={{ borderBottom: '1px solid #f0eadb' }}>
          <h2 className="font-display text-xl" style={{ color: '#0c182b', letterSpacing: '.02em' }}>
            EDITAR APUESTA
          </h2>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ color: '#5f6e8a' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(12,24,43,.06)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">

          <div>
            <label className="font-body font-bold text-xs uppercase tracking-widest block mb-1.5" style={{ color: '#5f6e8a' }}>
              Título
            </label>
            <input
              type="text"
              value={form.titulo}
              onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
              required
              className="w-full px-4 py-3 rounded-xl font-body text-sm outline-none"
              style={{ background: '#fff', border: '1.5px solid #f0eadb', color: '#0c182b' }}
            />
          </div>

          <div>
            <label className="font-body font-bold text-xs uppercase tracking-widest block mb-1.5" style={{ color: '#5f6e8a' }}>
              Descripción
            </label>
            <textarea
              value={form.descripcion}
              onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
              rows={2}
              className="w-full px-4 py-3 rounded-xl font-body text-sm outline-none resize-none"
              style={{ background: '#fff', border: '1.5px solid #f0eadb', color: '#0c182b' }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-body font-bold text-xs uppercase tracking-widest block mb-1.5" style={{ color: '#5f6e8a' }}>
                Premio / Incentivo
              </label>
              <input
                type="text"
                value={form.premio}
                onChange={e => setForm(p => ({ ...p, premio: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl font-body text-sm outline-none"
                style={{ background: '#fff', border: '1.5px solid #f0eadb', color: '#0c182b' }}
              />
            </div>
            <div>
              <label className="font-body font-bold text-xs uppercase tracking-widest block mb-1.5" style={{ color: '#5f6e8a' }}>
                Fecha de cierre
              </label>
              <input
                type="datetime-local"
                value={form.fecha_cierre}
                onChange={e => setForm(p => ({ ...p, fecha_cierre: e.target.value }))}
                required
                className="w-full px-4 py-3 rounded-xl font-body text-sm outline-none"
                style={{ background: '#fff', border: '1.5px solid #f0eadb', color: '#0c182b' }}
              />
            </div>
          </div>

          {/* Partidos */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-body font-bold text-xs uppercase tracking-widest" style={{ color: '#5f6e8a' }}>
                Partidos {partidosEditables && `(${partidosIds.length})`}
              </label>
              {loadingCount && (
                <span className="text-xs font-body" style={{ color: '#a8b2c4' }}>Verificando predicciones...</span>
              )}
            </div>

            {!loadingCount && !partidosEditables && (
              <div className="rounded-xl p-3 mb-3"
                style={{ background: 'rgba(224,50,82,.05)', border: '1px solid rgba(224,50,82,.2)' }}>
                <p className="text-xs font-body" style={{ color: '#a8324c' }}>
                  ⚠ No puedes modificar los partidos porque ya hay <strong>{predicCount}</strong> {predicCount === 1 ? 'predicción cargada' : 'predicciones cargadas'} en esta apuesta.
                </p>
              </div>
            )}

            {!loadingCount && partidosEditables && (
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar equipo..."
                className="w-full px-4 py-2.5 rounded-xl font-body text-sm outline-none mb-2"
                style={{ background: '#fff', border: '1.5px solid #f0eadb', color: '#0c182b' }}
              />
            )}

            <div className="rounded-xl overflow-hidden max-h-72 overflow-y-auto"
              style={{ border: '1.5px solid #f0eadb', background: '#fafafa' }}>
              {(partidosEditables ? partidosFiltrados : partidosDisponibles.filter(m => initialPartidos.includes(m.id))).map(m => {
                const checked = partidosIds.includes(m.id)
                return (
                  <label key={m.id}
                    className="flex items-center gap-3 px-3 py-2.5"
                    style={{
                      background: checked ? 'rgba(255,125,0,0.08)' : '#fff',
                      borderBottom: '1px solid #f5f5f5',
                      cursor: partidosEditables ? 'pointer' : 'default',
                      opacity: partidosEditables ? 1 : 0.85,
                    }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!partidosEditables}
                      onChange={() => partidosEditables && toggleMatch(m.id)}
                      className="hidden"
                    />
                    <span className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all"
                      style={{
                        border: `2px solid ${checked ? '#FF7D00' : '#e8dfd0'}`,
                        background: checked ? '#FF7D00' : '#fff',
                      }}>
                      {checked && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0c182b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </span>
                    <span className="font-body text-sm flex-1 min-w-0 truncate" style={{ color: '#0c182b' }}>
                      {m.equipo_local} vs {m.equipo_visitante}
                    </span>
                    <span className="text-[11px] font-body whitespace-nowrap" style={{ color: '#5f6e8a' }}>
                      {fmtFecha(m.fecha_partido)}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 flex justify-end gap-2"
          style={{ borderTop: '1px solid #f0eadb', background: '#faf7f0' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-xs font-body font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
            style={{ background: '#fff', border: '1.5px solid #f0eadb', color: '#5f6e8a' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || loadingCount}
            className="px-6 py-2.5 rounded-xl text-xs font-body font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #FF7D00 0%, #a85f00 100%)', color: '#0c182b', boxShadow: '0 2px 8px rgba(255,125,0,.25)' }}
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}

/* ── Componente principal ────────────────────────────────── */
export default function BetsListTab({ bets, matches, loading, editBet, deleteBet }) {
  const { toast } = useToast()
  const confirm = useConfirm()
  const [editingBet, setEditingBet] = useState(null)
  const [saving, setSaving] = useState(false)

  const openBets = bets.filter(b => isBetOpen(b))
  const closedBets = bets.filter(b => (b.estado === 'cerrada' || b.estado === 'abierta') && !isBetOpen(b))
  const finishedBets = bets.filter(b => b.estado === 'finalizada')

  async function handleDelete(id) {
    const ok = await confirm({
      titulo: '¿Eliminar apuesta?',
      mensaje: 'Se eliminará la apuesta y todas sus predicciones de forma permanente. Esta acción no se puede deshacer.',
      confirmarTxt: 'Sí, eliminar',
      tipo: 'danger',
    })
    if (!ok) return
    try {
      await deleteBet(id)
      toast.success('Apuesta eliminada correctamente')
    } catch (e) {
      toast.error('Error al eliminar: ' + e.message)
    }
  }

  function handleEdit(bet) {
    setEditingBet(bet)
  }

  async function handleSaveEdit(payload) {
    setSaving(true)
    try {
      await editBet(payload)
      toast.success('Apuesta editada correctamente')
      setEditingBet(null)
    } catch (e) {
      toast.error('Error al editar: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in delay-2">

      {loading && bets.length === 0 && (
        <div className="text-center py-16">
          <span className="inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#ebc32b' }} />
          <p className="font-body text-sm mt-3" style={{ color: '#5f6e8a' }}>Cargando apuestas...</p>
        </div>
      )}

      {!loading && bets.length === 0 && (
        <div className="rounded-2xl p-12 text-center" style={{ background: '#fff', border: '1px dashed #e8dfd0' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(235,195,43,.08)', border: '1px solid rgba(235,195,43,.2)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c99f16" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          </div>
          <h3 className="font-display text-xl mb-2" style={{ color: '#0c182b', letterSpacing: '.02em' }}>
            No hay apuestas creadas
          </h3>
          <p className="font-body text-sm" style={{ color: '#a8b2c4' }}>
            Crea tu primera apuesta desde la pestaña "Nueva Apuesta"
          </p>
        </div>
      )}

      {openBets.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-display text-xl" style={{ color: '#0c182b', letterSpacing: '.02em' }}>ACTIVAS</h3>
            <span className="font-display text-lg" style={{ color: '#1b8a5a' }}>({openBets.length})</span>
          </div>
          <div className="flex flex-col gap-3">
            {openBets.map(bet => (<BetRow key={bet.id} bet={bet} onEdit={handleEdit} onDelete={handleDelete} />))}
          </div>
        </div>
      )}

      {closedBets.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-display text-xl" style={{ color: '#0c182b', letterSpacing: '.02em' }}>CERRADAS</h3>
            <span className="font-display text-lg" style={{ color: '#5f6e8a' }}>({closedBets.length})</span>
          </div>
          <div className="flex flex-col gap-3">
            {closedBets.map(bet => (<BetRow key={bet.id} bet={bet} onEdit={handleEdit} onDelete={handleDelete} />))}
          </div>
        </div>
      )}

      {finishedBets.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-display text-xl" style={{ color: '#0c182b', letterSpacing: '.02em' }}>FINALIZADAS</h3>
            <span className="font-display text-lg" style={{ color: '#c99f16' }}>({finishedBets.length})</span>
          </div>
          <div className="flex flex-col gap-3">
            {finishedBets.map(bet => (<BetRow key={bet.id} bet={bet} onEdit={handleEdit} onDelete={handleDelete} />))}
          </div>
        </div>
      )}

      {editingBet && (
        <EditBetModal
          bet={editingBet}
          matches={matches || []}
          saving={saving}
          onClose={() => !saving && setEditingBet(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  )
}
