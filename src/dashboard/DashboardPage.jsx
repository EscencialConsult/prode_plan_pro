/**
 * DashboardPage.jsx
 * Ubicación: src/dashboard/DashboardPage.jsx
 * ✅ INTEGRADO CON PredictModal
 * ✅ INTEGRADO CON Loading OVERLAY
 */
import { useState, useEffect } from 'react'
import AppShell from '../dashboard/AppShell.jsx'
import { useAuth } from '../hooks/useAuth.jsx'
import { useBets } from '../hooks/useBets.jsx'
import { isBetOpen, timeLeft } from '../utils/index.js'
import { Link } from 'react-router-dom'
import PredictModal from '../components/user/PredictModal.jsx'
import Loading from '../hooks/Loading.jsx'
import sheetsApi from '../services/sheetsApi.js'
import { useToast } from '../hooks/useToast.jsx'

function StatCard({ label, value, sub, icon, gold = false, live = false }) {
  const accentColor = live ? '#e03252' : gold ? '#5A9E4A' : '#3a5c3a'
  const borderColor = live ? 'rgba(224,50,82,.2)' : gold ? 'rgba(90,158,74,.3)' : '#c8dbcc'
  const iconBg = live ? 'rgba(224,50,82,.08)' : gold ? 'rgba(134,200,115,.1)' : 'rgba(58,92,58,.08)'
  return (
    <div className="bg-white rounded-[14px] p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3.5 transition-all duration-200 cursor-default hover:-translate-y-0.5 hover:shadow-md"
      style={{ border: `1px solid ${borderColor}`, boxShadow: '0 1px 0 rgba(17,24,17,.04)' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(17,24,17,.08)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 0 rgba(17,24,17,.04)' }}
    >
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0" 
        style={{ background: iconBg, border: `1px solid ${borderColor}`, color: accentColor }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-display text-xl sm:text-2.5xl leading-none m-0" style={{ color: accentColor }}>{value}</p>
        <p className="font-body text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#8aaa8e] mt-1 sm:mt-1.5 truncate">{label}</p>
        {sub && <p className="hidden sm:block font-body text-[9px] text-[#8aaa8e] mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  )
}

function BetRow({ bet, onPredict }) {
  const matchCount = bet.partidos?.length || 0
  const remaining = isBetOpen(bet) ? timeLeft(bet.fecha_cierre) : 'Cerrada'
  const closingSoon = remaining !== 'Cerrada' && !remaining.includes('d')
  const hasLive = bet.partidos?.some(p => p.estado === 'en_vivo')
  return (
    <div
      onClick={() => onPredict(bet)}
      className="flex items-center gap-3 p-3.5 rounded-xl transition-all group cursor-pointer"
      style={{ background: '#fff', border: '1px solid #c8dbcc', boxShadow: '0 1px 0 rgba(17,24,17,.04)' }}
      onMouseEnter={e => { e.currentTarget.style.background = '#f6f9f6'; e.currentTarget.style.borderColor = '#86C873'; e.currentTarget.style.transform = 'translateX(3px)' }}
      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#c8dbcc'; e.currentTarget.style.transform = '' }}
    >
      <span className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: hasLive ? '#e03252' : '#86C873', boxShadow: hasLive ? '0 0 8px rgba(224,50,82,.5)' : '0 0 6px rgba(134,200,115,.5)' }} />
      <div className="flex-1 min-w-0">
        <p className="font-body font-semibold text-sm truncate" style={{ color: '#111811' }}>{bet.titulo}</p>
        <p className="font-body text-xs mt-0.5" style={{ color: '#4a6b50' }}>
          {matchCount} {matchCount === 1 ? 'partido' : 'partidos'}
          {bet.premio && <span> · 🏆 {bet.premio}</span>}
        </p>
      </div>
      <span className="font-body text-xs font-semibold flex-shrink-0" style={{ color: closingSoon ? '#5A9E4A' : '#111811' }}>{remaining}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8aaa8e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 transition-transform group-hover:translate-x-1">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  )
}

function LiveCard({ bet, predictions, onPredict }) {
  const liveMatch = bet.partidos?.find(p => p.estado === 'en_vivo') || bet.partidos?.[0]
  const myPred = liveMatch ? predictions[liveMatch.id] : null
  return (
    <div
      onClick={() => onPredict(bet)}
      className="rounded-2xl p-4 md:p-5 cursor-pointer transition-all"
      style={{ background: '#fff', border: '1.5px solid rgba(224,50,82,.3)', boxShadow: '0 4px 16px rgba(224,50,82,.08)' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(224,50,82,.15)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(224,50,82,.08)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full animate-pulse-live" style={{ background: '#e03252' }} />
        <span className="font-body font-bold text-xs uppercase tracking-widest" style={{ color: '#e03252' }}>
          {liveMatch?.minuto ? `EN VIVO · ${liveMatch.minuto}'` : 'EN VIVO'}
        </span>
        <span className="font-body text-xs ml-auto truncate" style={{ color: '#4a6b50' }}>{bet.titulo}</span>
      </div>
      {liveMatch && (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="font-body font-semibold text-sm truncate" style={{ color: '#111811' }}>
              {liveMatch.equipo_local} <span style={{ color: '#8aaa8e' }}>vs</span> {liveMatch.equipo_visitante}
            </p>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-center">
              <p style={{ fontSize: 9, color: '#8aaa8e', textTransform: 'uppercase', letterSpacing: '.1em' }} className="font-body mb-0.5">Mi pred.</p>
              <p className="font-display text-xl leading-none" style={{ color: '#5A9E4A' }}>
                {myPred ? `${myPred.pred_local}-${myPred.pred_visitante}` : '—'}
              </p>
            </div>
            <div className="w-px h-8" style={{ background: '#c8dbcc' }} />
            <div className="text-center">
              <p style={{ fontSize: 9, color: '#8aaa8e', textTransform: 'uppercase', letterSpacing: '.1em' }} className="font-body mb-0.5">Real</p>
              <p className="font-display text-xl leading-none" style={{ color: '#111811' }}>
                {liveMatch.goles_local ?? 0}-{liveMatch.goles_visitante ?? 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Empty({ icon, text, sub, to, cta }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-2xl"
      style={{ background: '#fff', border: '1.5px dashed #c8dbcc' }}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
        style={{ background: 'rgba(134,200,115,.08)', border: '1px solid rgba(134,200,115,.2)' }}>
        <div style={{ color: '#5A9E4A' }}>{icon}</div>
      </div>
      <p className="font-body font-semibold text-sm" style={{ color: '#4a6b50' }}>{text}</p>
      {sub && <p className="font-body text-xs mt-1" style={{ color: '#8aaa8e' }}>{sub}</p>}
      {to && cta && (
        <Link to={to} className="mt-4 inline-flex items-center gap-1.5 font-body font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-full transition-all"
          style={{ background: '#86C873', color: '#0a0f0a', textDecoration: 'none' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#A8E096' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#86C873' }}>
          {cta}
        </Link>
      )}
    </div>
  )
}

function SectionHead({ title, to, cta }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-display" style={{ fontSize: '1.5rem', color: '#111811', letterSpacing: '.02em' }}>{title}</h2>
      {to && (
        <Link to={to} className="font-body font-semibold text-xs flex items-center gap-1.5 transition-colors"
          style={{ color: '#5A9E4A', textDecoration: 'none' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#111811' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#5A9E4A' }}>
          {cta}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const esAdmin = isAdmin || user?.rol === 'admin' || user?.es_admin === true || user?.tipo_usuario === 'admin'
  const { bets, predictions, loadMyPredictions, loading } = useBets()

  // ✅ ESTADO PARA CONTROLAR EL MODAL
  const [selectedBet, setSelectedBet] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rankingData, setRankingData] = useState(null)

  const activeBets = bets.filter(b => isBetOpen(b))

  useEffect(() => {
    if (user) {
      sheetsApi.predicciones.tablaGlobal({
        user_id: user?.id || user?.user_id,
      })
        .then(res => {
          if (res.ok && res.mi_posicion) {
            setRankingData(res.mi_posicion)
          }
        })
        .catch(console.error)
    }
  }, [user])
  const liveBets = bets.filter(b => b.partidos?.some(p => p.estado === 'en_vivo'))
  const myPredCount = Object.keys(predictions).length
  const nombre = (user?.nombre || '').split(' ')[0].toUpperCase()

  // ✅ FUNCIÓN PARA ABRIR EL MODAL
  const handlePredict = (bet) => {
    setSelectedBet(bet)
  }

  // ✅ FUNCIÓN PARA CERRAR EL MODAL
  const handleCloseModal = () => {
    setSelectedBet(null)
  }

  // ✅ FUNCIÓN PARA GUARDAR PREDICCIONES transaccional batch
  const handleSubmitPredictions = async (betId, matchPredictions) => {
    setIsSubmitting(true)

    try {
      // Detectar si esta apuesta es de tipo "grupos" para incluir area_id en el payload
      const bet = bets.find(b => b.id === betId)
      const esGrupal = bet?.tipo === 'grupos'
      const areaUsuario = user?.area_id || null

      const predictionsPayload = matchPredictions.map(p => {
        const payload = {
          partido_id: p.partido_id,
          pred_local: parseInt(p.pred_local, 10),
          pred_visitante: parseInt(p.pred_visitante, 10),
        }
        if (p.pred_clasificado) {
          payload.pred_clasificado = p.pred_clasificado
        }
        return payload
      })

      await sheetsApi.predicciones.guardarBatch({
        apuesta_id: betId,
        predicciones: predictionsPayload,
        area_id: esGrupal ? areaUsuario : null,
      })

      // Limpiar borrador local de manera segura
      try {
        localStorage.removeItem(`bet-${betId}-draft`)
      } catch (e) { }

      // Recargar predicciones locales
      await loadMyPredictions(betId)

      // Cerrar modal después de guardar exitosamente
      setSelectedBet(null)
      setIsSubmitting(false)
    } catch (error) {
      console.error('Error guardando predicciones:', error)
      toast.error(error.message || 'Error al guardar predicciones. Por fvor intentá de nuevo.')
      setIsSubmitting(false)
    }
  }

  // ✅ MOSTRAR LOADING MIENTRAS CARGA DATOS INICIALES (Antes de AppShell)
  if (loading && bets.length === 0) {
    return <Loading message="Cargando dashboard..." />
  }

  return (
    <AppShell>
      {/* ✅ CONTENIDO - Siempre se renderiza */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem 1.5rem 3rem' }}>

        <div className="rounded-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 relative overflow-hidden animate-fade-in"
          style={{ background: '#111811', border: '1px solid rgba(134,200,115,.2)', boxShadow: '0 12px 40px rgba(17,24,17,.15)' }}>
          
          {/* Fondo banner responsivo con efecto verde duotono */}
          <picture className="absolute inset-0 z-0 pointer-events-none opacity-50 grayscale transition-opacity duration-700">
            <source media="(max-width: 640px)" srcSet="/imgprode/fondo-banner-mobile.png" />
            <img src="/imgprode/fondo-banner.png" alt="" className="w-full h-full object-cover" />
          </picture>
          
          {/* Capa 1: Filtro de color verde (Blend Mode) */}
          <div className="absolute inset-0 z-0 pointer-events-none mix-blend-multiply opacity-80"
               style={{ background: '#4a6b50' }} />
          
          {/* Capa 2: Gradiente oscuro a la izquierda para que el texto sea siempre legible */}
          <div className="absolute inset-0 z-0 pointer-events-none"
               style={{ background: 'linear-gradient(to right, #111811 5%, rgba(17,24,17,0.7) 40%, transparent 100%)' }} />

          <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 80% 20%, rgba(134,200,115,.2), transparent 65%)' }} />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-5">
            <div className="flex items-center gap-5">
              <img src="/imgprode/one-prode-placa.png" alt="Logo" className="w-16 sm:w-20 object-contain hidden sm:block" />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-live" />
                  <span className="font-body font-bold text-xs uppercase tracking-widest" style={{ color: 'rgba(134,200,115,.7)' }}>
                    PRODE CAMIONERO
                  </span>
                </div>
                <h1 className="font-display leading-none mb-1" style={{ fontSize: 'clamp(2.2rem,6vw,3.5rem)', letterSpacing: '.02em' }}>
                  <span className="text-white">HOLA, </span>
                  <span style={{ color: '#86C873' }}>{nombre}</span>
                </h1>
                <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,.6)' }}>
                  {esAdmin
                    ? 'Panel de control de administración.'
                    : activeBets.length > 0
                    ? `Tenés ${activeBets.length} apuesta${activeBets.length > 1 ? 's' : ''} activa${activeBets.length > 1 ? 's' : ''} disponible${activeBets.length > 1 ? 's' : ''}.`
                    : 'Acá está el resumen de tu actividad en Prode Talento.'}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/50 font-body">
                  <span>⚽ Competición por puntos, no monetizada</span>
                  <span style={{ color: 'rgba(134,200,115,.4)' }}>|</span>
                  <span>🚛 Solo para afiliados titulares</span>
                </div>
                {!esAdmin && (
                  <div className="mt-4 sm:mt-5 relative z-20">
                    <p className="font-body font-bold text-[10px] uppercase tracking-widest mb-2" style={{ color: 'rgba(134,200,115,.65)' }}>
                      ACCESOS RÁPIDOS
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Link to="/apuestas" className="font-body font-bold text-xs uppercase tracking-widest px-5 py-2.5 rounded-full inline-flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
                        style={{ background: '#86C873', color: '#0a0f0a', boxShadow: '0 4px 14px rgba(134,200,115,.25)', textDecoration: 'none' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
                        IR A APUESTAS
                      </Link>
                      <Link to="/ranking" className="font-body font-bold text-xs uppercase tracking-widest px-5 py-2.5 rounded-full inline-flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
                        style={{ background: '#86C873', color: '#0a0f0a', boxShadow: '0 4px 14px rgba(134,200,115,.25)', textDecoration: 'none' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                        IR A RANKING
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Logo de Moyano Conducción grande a la derecha */}
            <div className="hidden sm:block self-start sm:self-center text-right pr-2 select-none">
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', letterSpacing: '.06em', textShadow: '0 4px 16px rgba(0,0,0,0.85)', lineHeight: 1 }}>
                <span style={{ color: '#7BA3C0' }}>MOYANO </span>
                <span style={{ color: '#fff' }}>C</span>
                <span style={{ color: '#ebc32b' }}>O</span>
                <span style={{ color: '#fff' }}>N</span>
                <span style={{ color: '#7BA3C0' }}>DUCCIÓN</span>
              </div>
            </div>

          </div>
        </div>

        {/* Cartel de Alerta de Seguridad - Solo se muestra si el correo sigue siendo el ficticio */}
        {user?.email?.endsWith('@prodetalento.com') && (
          <div className="bg-amber-50/90 backdrop-blur-sm border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3.5 shadow-sm animate-fade-in"
            style={{ border: '1px solid rgba(217, 119, 6, 0.25)', background: 'rgba(254, 243, 199, 0.95)' }}>
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-display font-bold text-sm text-amber-900 m-0" style={{ letterSpacing: '.01em' }}>Recomendación de Seguridad</h4>
              <p className="font-body text-xs text-amber-800 mt-1 leading-relaxed">
                Recordá que, por motivos de seguridad, se solicita actualizar tu contraseña luego del primer ingreso. Podés cambiarla fácilmente ingresando a <Link to="/cambiar-password" className="font-bold underline hover:text-amber-950">Cambiar Contraseña</Link>.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6 sm:mb-8 animate-fade-in delay-1">
          {esAdmin ? (
            <>
              <StatCard label="Total Apuestas" value={bets.length} sub="Configuradas en el sistema"
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>}
              />
              <StatCard label="Apuestas Activas" value={activeBets.length} sub="Disponibles para usuarios" gold
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
              />
              <StatCard label="Partidos en Fixture" value={bets.reduce((acc, b) => acc + (b.partidos?.length || 0), 0)} sub="Registrados para pronóstico"
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
              />
            </>
          ) : (
            <>
              <StatCard label="Puntos totales" value={rankingData ? rankingData.puntos_totales : "—"} sub="Acumulado global" gold
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>}
              />
              <StatCard label="Posición" value={rankingData ? `#${rankingData.posicion}` : "—"} sub="Ranking global" gold
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>}
              />
              <StatCard label="Predicciones" value={myPredCount || '—'} sub="Cargadas hasta ahora"
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>}
              />
            </>
          )}
          <StatCard label="En vivo" value={liveBets.length} sub="Partidos ahora mismo" live={liveBets.length > 0}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" /></svg>}
          />
        </div>

        {liveBets.length > 0 && (
          <div className="mb-8 animate-fade-in delay-2">
            <SectionHead title="EN VIVO AHORA" />
            <div className="grid gap-3">
              {liveBets.map(bet => <LiveCard key={bet.id} bet={bet} predictions={predictions} onPredict={handlePredict} />)}
            </div>
          </div>
        )}

        {esAdmin ? (
          <div className="grid lg:grid-cols-3 gap-6 animate-fade-in delay-2">
            <div className="lg:col-span-2">
              <SectionHead title="PANEL DE ADMINISTRACIÓN" />
              <div
                className="p-6 rounded-2xl flex flex-col justify-between"
                style={{
                  background: 'linear-gradient(135deg, #111811, #1e3020)',
                  border: '1px solid rgba(134,200,115,.25)',
                  boxShadow: '0 8px 32px rgba(0,0,0,.15)',
                  minHeight: 220,
                }}
              >
                <div>
                  <h3 className="font-display text-lg text-white mb-2" style={{ letterSpacing: '.02em' }}>
                    GESTIONAR EL PRODE
                  </h3>
                  <p className="font-body text-xs sm:text-sm" style={{ color: 'rgba(255,255,255,.6)', lineHeight: 1.6 }}>
                    Como administrador, tenés acceso completo para gestionar los partidos, publicar apuestas, cargar los resultados reales del fixture, computar los puntajes de los participantes y ver los rankings de juego.
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/admin"
                    className="inline-flex items-center gap-2 font-body font-bold text-xs uppercase tracking-widest px-6 py-3.5 rounded-full transition-all"
                    style={{ background: '#86C873', color: '#0a0f0a', textDecoration: 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#A8E096'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#86C873'; e.currentTarget.style.transform = '' }}>
                    Acceder al Panel Admin
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </Link>
                  <Link to="/ranking"
                    className="inline-flex items-center gap-2 font-body font-bold text-xs uppercase tracking-widest px-6 py-3.5 rounded-full transition-all"
                    style={{ border: '1px solid rgba(255,255,255,.2)', color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(134,200,115,.4)'; e.currentTarget.style.color = '#86C873' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.2)'; e.currentTarget.style.color = 'rgba(255,255,255,.7)' }}>
                    Ver Ranking
                  </Link>
                </div>
              </div>
            </div>

            <div>
              <SectionHead title="ACCESOS RÁPIDOS" />
              <div className="flex flex-col gap-3">
                {[
                  { to: '/partidos', label: 'Fixture', sub: 'Partidos del Mundial', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
                  { to: '/ranking', label: 'Ranking', sub: 'Tabla de posiciones', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /></svg> },
                  { to: '/manual-admin', label: 'Manual Admin', sub: 'Guía de administración', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
                ].map(({ to, label, sub, icon }) => (
                  <Link key={to} to={to}
                    className="flex items-center gap-3 p-3.5 rounded-xl transition-all group"
                    style={{ background: '#fff', border: '1px solid #c8dbcc', textDecoration: 'none', boxShadow: '0 1px 0 rgba(17,24,17,.04)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f6f9f6'; e.currentTarget.style.borderColor = '#86C873'; e.currentTarget.style.transform = 'translateX(3px)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#c8dbcc'; e.currentTarget.style.transform = '' }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#111811,#3a5c3a)', color: '#86C873' }}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-semibold text-sm" style={{ color: '#111811' }}>{label}</p>
                      <p className="font-body text-xs" style={{ color: '#4a6b50' }}>{sub}</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8aaa8e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      className="flex-shrink-0 transition-transform group-hover:translate-x-1">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6 animate-fade-in delay-2">

            <div className="lg:col-span-2">
              <SectionHead title="APUESTAS ACTIVAS" to="/apuestas" cta="Ver todas" />
              {activeBets.length === 0 ? (
                <Empty
                  icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>}
                  text="No hay apuestas activas"
                  sub="Aparecerán acá cuando el admin publique una."
                  to="/apuestas"
                  cta="Ver apuestas"
                />
              ) : (
                <div className="flex flex-col gap-2">
                  {activeBets.slice(0, 5).map(bet => <BetRow key={bet.id} bet={bet} onPredict={handlePredict} />)}
                  {activeBets.length > 5 && (
                    <Link to="/apuestas" className="text-center font-body text-sm py-2 transition-colors"
                      style={{ color: '#5A9E4A', textDecoration: 'none' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#111811' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#5A9E4A' }}>
                      +{activeBets.length - 5} más →
                    </Link>
                  )}
                </div>
              )}
            </div>

            <div>
              <SectionHead title="ACCESOS RÁPIDOS" />
              <div className="flex flex-col gap-3">
                {[
                  { to: '/apuestas', label: 'Apuestas', sub: 'Cargá tus pronósticos', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg> },
                  { to: '/partidos', label: 'Fixture', sub: 'Partidos del Mundial', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
                  { to: '/mis-predicciones', label: 'Mis Predicciones', sub: 'Historial de pronósticos', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg> },
                  { to: '/ranking', label: 'Ranking', sub: 'Tabla de posiciones', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /></svg> },
                  { to: '/manual', label: 'Manual de Usuario', sub: 'Guía para participantes', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg> },
                ].map(({ to, label, sub, icon }) => (
                  <Link key={to} to={to}
                    className="flex items-center gap-3 p-3.5 rounded-xl transition-all group"
                    style={{ background: '#fff', border: '1px solid #c8dbcc', textDecoration: 'none', boxShadow: '0 1px 0 rgba(17,24,17,.04)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f6f9f6'; e.currentTarget.style.borderColor = '#86C873'; e.currentTarget.style.transform = 'translateX(3px)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#c8dbcc'; e.currentTarget.style.transform = '' }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#111811,#3a5c3a)', color: '#86C873' }}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-semibold text-sm" style={{ color: '#111811' }}>{label}</p>
                      <p className="font-body text-xs" style={{ color: '#4a6b50' }}>{sub}</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8aaa8e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      className="flex-shrink-0 transition-transform group-hover:translate-x-1">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ✅ MODAL DE PREDICCIONES */}
      {selectedBet && (
        <PredictModal
          bet={selectedBet}
          onClose={handleCloseModal}
          onSubmit={handleSubmitPredictions}
          loading={isSubmitting}
        />
      )}
    </AppShell>
  )
}