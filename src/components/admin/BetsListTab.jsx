import { isBetOpen, timeLeft } from '../../utils/index.js'
import { useToast, useConfirm } from '../../hooks/useToast.jsx'

function getBetStatus(bet) {
  if (bet.estado === 'abierta' && isBetOpen(bet))
    return { color: '#1b8a5a', bg: 'rgba(27,138,90,.08)', border: 'rgba(27,138,90,.2)', label: 'Activa', dot: true }
  if (bet.estado === 'finalizada')
    return { color: '#9e1f1f', bg: 'rgba(192,39,39,.1)', border: 'rgba(192,39,39,.25)', label: 'Finalizada', dot: false }
  if (bet.estado === 'cerrada')
    return { color: '#6e6f73', bg: 'rgba(110,111,115,.06)', border: 'rgba(110,111,115,.15)', label: 'Cerrada', dot: false }
  return { color: '#6e6f73', bg: 'rgba(110,111,115,.06)', border: 'rgba(110,111,115,.12)', label: bet.estado || '—', dot: false }
}

function BetRow({ bet, onClose, onFinalize }) {
  const status = getBetStatus(bet)
  const matchCount = bet.partidos_ids ? bet.partidos_ids.split(',').filter(Boolean).length : (bet.partidos?.length || 0)
  const remaining = bet.fecha_cierre ? timeLeft(bet.fecha_cierre) : null
  const isOpen = isBetOpen(bet)

  return (
    <div
      className="rounded-xl p-4 transition-all"
      style={{
        background: '#fff',
        border: `1px solid ${status.border}`,
        boxShadow: '0 2px 8px rgba(31,31,35,.04)',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(31,31,35,.08)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(31,31,35,.04)' }}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {/* Status badge */}
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-body font-bold uppercase tracking-wider"
              style={{ background: status.bg, color: status.color, border: `1px solid ${status.border}` }}
            >
              {status.dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.color }} />}
              {status.label}
            </span>
            {/* Type badge */}
            <span
              className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-body font-semibold uppercase tracking-wider"
              style={{ background: 'rgba(31,31,35,.04)', color: '#a9a9ae', border: '1px solid #faecec' }}
            >
              {bet.tipo === 'grupos' ? 'Áreas' : 'Libre'}
            </span>
          </div>

          <p className="font-display text-lg truncate" style={{ color: '#1f1f23', letterSpacing: '.01em' }}>
            {bet.titulo}
          </p>

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {matchCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-body" style={{ color: '#6e6f73' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {matchCount} {matchCount === 1 ? 'partido' : 'partidos'}
              </span>
            )}
            {bet.premio && (
              <span className="flex items-center gap-1 text-xs font-body" style={{ color: '#9e1f1f' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                {bet.premio}
              </span>
            )}
            {remaining && isOpen && (
              <span className="flex items-center gap-1 text-xs font-body" style={{ color: '#6e6f73' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Cierra en {remaining}
              </span>
            )}
            {bet.participantes > 0 && (
              <span className="text-xs font-body" style={{ color: '#a9a9ae' }}>
                {bet.participantes} participantes
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          {isOpen && onClose && (
            <button
              onClick={() => onClose(bet.id)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-body font-semibold transition-all"
              style={{ fontSize: 11, background: 'transparent', border: '1px solid rgba(224,50,82,.3)', color: '#e03252' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(224,50,82,.06)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              Cerrar
            </button>
          )}
          {bet.estado === 'cerrada' && onFinalize && (
            <button
              onClick={() => onFinalize(bet.id)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-body font-bold transition-all"
              style={{ fontSize: 11, background: 'rgba(192,39,39,.1)', border: '1px solid rgba(192,39,39,.35)', color: '#9e1f1f' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#c02727'; e.currentTarget.style.color = '#ffffff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(192,39,39,.1)'; e.currentTarget.style.color = '#9e1f1f' }}
            >
              Finalizar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BetsListTab({ bets, loading, closeBet, finalizeBet }) {
  const { toast } = useToast()
  const confirm   = useConfirm()

  const openBets = bets.filter(b => isBetOpen(b))
  const closedBets = bets.filter(b => (b.estado === 'cerrada' || b.estado === 'abierta') && !isBetOpen(b))
  const finishedBets = bets.filter(b => b.estado === 'finalizada')

  async function handleClose(id) {
    const ok = await confirm({
      titulo: '¿Cerrar apuesta?',
      mensaje: 'Los usuarios ya no podrán cargar predicciones.',
      confirmarTxt: 'Sí, cerrar',
      tipo: 'warning',
    })
    if (!ok) return
    try { await closeBet(id); toast.success('Apuesta cerrada correctamente') }
    catch (e) { toast.error('Error al cerrar: ' + e.message) }
  }

  async function handleFinalize(id) {
    const ok = await confirm({
      titulo: '¿Finalizar apuesta?',
      mensaje: 'Esto calculará los puntajes finales. No se puede deshacer.',
      confirmarTxt: 'Sí, finalizar',
      tipo: 'danger',
    })
    if (!ok) return
    try { await finalizeBet(id); toast.success('Apuesta finalizada y puntajes calculados') }
    catch (e) { toast.error('Error al finalizar: ' + e.message) }
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in delay-2">

      {loading && bets.length === 0 && (
        <div className="text-center py-16">
          <span className="inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#c02727' }} />
          <p className="font-body text-sm mt-3" style={{ color: '#6e6f73' }}>Cargando apuestas...</p>
        </div>
      )}

      {!loading && bets.length === 0 && (
        <div className="rounded-2xl p-12 text-center" style={{ background: '#fff', border: '1px dashed #e8dfd0' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(192,39,39,.08)', border: '1px solid rgba(192,39,39,.2)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9e1f1f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          </div>
          <h3 className="font-display text-xl mb-2" style={{ color: '#1f1f23', letterSpacing: '.02em' }}>
            No hay apuestas creadas
          </h3>
          <p className="font-body text-sm" style={{ color: '#a9a9ae' }}>
            Creá tu primera apuesta desde la pestaña "Nueva Apuesta"
          </p>
        </div>
      )}

      {openBets.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-display text-xl" style={{ color: '#1f1f23', letterSpacing: '.02em' }}>ACTIVAS</h3>
            <span className="font-display text-lg" style={{ color: '#1b8a5a' }}>({openBets.length})</span>
          </div>
          <div className="flex flex-col gap-3">
            {openBets.map(bet => (<BetRow key={bet.id} bet={bet} onClose={handleClose} />))}
          </div>
        </div>
      )}

      {closedBets.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-display text-xl" style={{ color: '#1f1f23', letterSpacing: '.02em' }}>CERRADAS</h3>
            <span className="font-display text-lg" style={{ color: '#6e6f73' }}>({closedBets.length})</span>
          </div>
          <div className="flex flex-col gap-3">
            {closedBets.map(bet => (<BetRow key={bet.id} bet={bet} onFinalize={handleFinalize} />))}
          </div>
        </div>
      )}

      {finishedBets.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-display text-xl" style={{ color: '#1f1f23', letterSpacing: '.02em' }}>FINALIZADAS</h3>
            <span className="font-display text-lg" style={{ color: '#9e1f1f' }}>({finishedBets.length})</span>
          </div>
          <div className="flex flex-col gap-3">
            {finishedBets.map(bet => (<BetRow key={bet.id} bet={bet} />))}
          </div>
        </div>
      )}
    </div>
  )
}