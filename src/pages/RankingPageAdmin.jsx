/**
 * RankingPageAdmin.jsx — Versión ADMIN CON FIX
 * Ubicación: src/pages/RankingPageAdmin.jsx
 *
 * CAMBIO: PrediccionRow ahora usa pred.puntos del backend
 */
import { useState, useMemo, useEffect } from 'react'
import AppShell from '../dashboard/AppShell.jsx'
import { useBets } from '../hooks/useBets.jsx'
import { useAuth } from '../hooks/useAuth.jsx'
import sheetsApi from '../services/sheetsApi.js'
import { useToast } from '../hooks/useToast.jsx'

/* ─── helpers ─── */
function isOpen(b) { return b.estado === 'abierta' && new Date(b.fecha_cierre) > Date.now() }
function initials(n) { return (n || '').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || '?' }

/* ─── estilos globales ─── */
const CSS = `
@keyframes rk-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes rk-fade { from{opacity:0} to{opacity:1} }
@keyframes rk-shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
@keyframes rk-spin { to { transform: rotate(360deg) } }
.rk-in { animation: rk-in .28s ease both }

/* Panel izquierdo */
.rk-sidebar { width:380px;flex-shrink:0;display:flex;flex-direction:column;overflow:hidden;background:#fcfaf6;border-right:1px solid #f0eadb }
.rk-sidebar-scroll::-webkit-scrollbar { width:2px }
.rk-sidebar-scroll::-webkit-scrollbar-thumb { background:#e2ddd6;border-radius:99px }

/* Fila apuesta */
.rk-row { display:flex;align-items:center;gap:10px;padding:11px 16px;cursor:pointer;border-bottom:1px solid #f5f3ee;position:relative;transition:background .13s }
.rk-row:hover { background:rgba(12,24,43,.03) }
.rk-row.sel { background:#0c182b;border-bottom-color:rgba(255,255,255,.06) }
.rk-row::before { content:'';position:absolute;left:0;top:25%;bottom:25%;width:3px;background:#ebc32b;border-radius:0 3px 3px 0;opacity:0;transition:opacity .13s }
.rk-row.sel::before { opacity:1 }

/* Panel derecho */
.rk-content { flex:1;min-width:0;overflow-y:auto;background:#faf7f0 }
.rk-content::-webkit-scrollbar { width:4px }
.rk-content::-webkit-scrollbar-thumb { background:#e2ddd6;border-radius:99px }

/* Podio cards */
.rk-pcard { border-radius:16px;text-align:center;position:relative;overflow:visible;transition:transform .16s,box-shadow .16s }

/* Skeleton */
.rk-sk { background:linear-gradient(90deg,rgba(12,24,43,.06) 25%,rgba(12,24,43,.1) 50%,rgba(12,24,43,.06) 75%);background-size:400px 100%;animation:rk-shimmer 1.4s ease infinite;border-radius:8px }

/* Spinner para botones de carga */
.rk-spinner { width:11px;height:11px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:rk-spin .65s linear infinite;display:inline-block;opacity:.6 }

/* Botón "Ver detalle" */
.rk-detail-btn {
  display:inline-flex;align-items:center;justify-content:center;gap:5px;
  font-family:'DM Sans',sans-serif;font-size:9px;font-weight:700;
  text-transform:uppercase;letter-spacing:.1em;
  border:none;cursor:pointer;border-radius:99px;padding:5px 10px;
  transition:all .15s;white-space:nowrap;
}
.rk-detail-btn:disabled { opacity:.7;cursor:wait }
.rk-detail-btn-podio {
  background:rgba(12,24,43,.06);color:#0c182b;
}
.rk-detail-btn-podio:hover:not(:disabled) { background:rgba(12,24,43,.12) }
.rk-detail-btn-podio.active { background:#0c182b;color:#ebc32b }

.rk-detail-btn-mini {
  background:rgba(12,24,43,.05);color:#5f6e8a;
  font-size:8px;padding:4px 8px;
}
.rk-detail-btn-mini:hover:not(:disabled) { background:rgba(12,24,43,.1);color:#0c182b }
.rk-detail-btn-mini.active { background:#0c182b;color:#ebc32b }

/* Mobile */
@media(max-width:720px) {
  .rk-shell { flex-direction:column!important;height:auto!important }
  .rk-sidebar { width:100%;max-height:220px;border-right:none!important;border-bottom:1px solid rgba(255,255,255,.08) }
  .rk-content { padding:16px!important }
  .rk-podio-grid { grid-template-columns:1fr!important;max-width:220px!important }
}
`

/* ══════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════ */
export default function RankingPageAdmin() {
  const { bets, loading: lb } = useBets()
  const { user } = useAuth()
  const { toast } = useToast()

  const [sel, setSel] = useState(null)
  const [tabla, setTabla] = useState([])
  const [meta, setMeta] = useState({})
  const [loading, setLoading] = useState(false)

  const [expandedUser, setExpandedUser] = useState(null)
  const [predicciones, setPredicciones] = useState({})
  const [loadingUser, setLoadingUser] = useState(null)

  // ── Ranking global (se carga al montar) ──
  const [globalTabla, setGlobalTabla] = useState([])
  const [globalMeta, setGlobalMeta] = useState({})
  const [globalLoading, setGlobalLoading] = useState(false)

  // ── Multi-select: ranking combinado (suma de varias apuestas) ──
  const [selectedIds, setSelectedIds]       = useState(new Set())
  const [tablaAcumulada, setTablaAcumulada] = useState([])
  const [loadingAcum, setLoadingAcum]       = useState(false)
  const modoAcumulado = selectedIds.size > 1

  useEffect(() => {
    cargarRankingGlobal()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.user_id])

  async function cargarRankingGlobal() {
    setGlobalLoading(true)
    try {
      const r = await sheetsApi.predicciones.tablaGlobal({ limit: 200 })
      setGlobalTabla(r.tabla || [])
      setGlobalMeta({ total: r.total, mi_posicion: r.mi_posicion, esta_en_top: r.esta_en_top })
    } catch (e) { toast.error('Error cargando ranking global: ' + e.message) }
    finally { setGlobalLoading(false) }
  }

  const partidosMap = useMemo(() => {
    const map = new Map()
    if (sel?.partidos) {
      sel.partidos.forEach(p => map.set(p.id, p))
    }
    return map
  }, [sel])

  async function cargarRanking(bet) {
    if (sel?.id === bet.id) return
    setSel(bet); setLoading(true); setTabla([]); setMeta({})
    setExpandedUser(null); setPredicciones({}); setLoadingUser(null)

    try {
      // Refrescar el cache de esta apuesta para mostrar datos al instante.
      // Si falla (ej: falta el GRANT en la base), seguimos con lo que haya.
      try { await sheetsApi.predicciones.refrescarRanking(bet.id) } catch (_) {}
      const [rT, rA] = await Promise.all([sheetsApi.predicciones.tabla(bet.id, {
        limit: 200,
        user_id: user?.id || user?.user_id,
        area_id: user?.area_id,
      }), sheetsApi.apuestas.obtener(bet.id)])
      setTabla(rT.tabla || [])
      setMeta({ total: rT.total, mi_posicion: rT.mi_posicion, esta_en_top: rT.esta_en_top })
      setSel(prev => ({ ...(prev || bet), ...rA.apuesta }))
    } catch (e) { toast.error('Error cargando ranking: ' + e.message) }
    finally { setLoading(false) }
  }

  // ── Tildar/destildar una apuesta del multi-select ──────────
  function toggleBet(bet) {
    let nextSize, nextId
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(bet.id)) next.delete(bet.id)
      else next.add(bet.id)
      nextSize = next.size
      if (next.size === 1) nextId = [...next][0]
      return next
    })
    setTablaAcumulada([])
    setTimeout(() => {
      if (nextSize === 0) {
        setSel(null); setTabla([]); setMeta({})
      } else if (nextSize === 1 && nextId) {
        const sola = bets.find(b => b.id === nextId)
        if (sola) { setSel(null); cargarRanking(sola) }
      } else {
        setSel(null); setTabla([]); setMeta({})
      }
    }, 20)
  }

  // ── Calcular el ranking combinado (suma de las seleccionadas) ──
  // Junta la tabla de cada apuesta y suma los puntos por usuario.
  async function cargarAcumulado() {
    if (selectedIds.size < 2) return
    setLoadingAcum(true); setTablaAcumulada([])
    try {
      // Refrescar el cache de cada apuesta antes de sumar (no-bloqueante:
      // si falta el GRANT, usa lo que haya en cache).
      await Promise.all(
        [...selectedIds].map(id => sheetsApi.predicciones.refrescarRanking(id).catch(() => {}))
      )
      const resultados = await Promise.all(
        // limit alto: sumar TODOS los participantes, no solo los primeros 200.
        [...selectedIds].map(id => sheetsApi.predicciones.tabla(id, { limit: 5000 }))
      )
      const mapa = {}
      resultados.forEach(r => {
        (r.tabla || []).forEach(u => {
          if (!mapa[u.user_id]) mapa[u.user_id] = {
            user_id: u.user_id, nombre: u.nombre,
            puntos_totales: 0, predicciones: 0,
            aciertos_exactos: 0, aciertos_diferencia: 0, aciertos_resultado: 0,
          }
          const e = mapa[u.user_id]
          e.puntos_totales      += parseInt(u.puntos_totales)      || 0
          e.predicciones        += parseInt(u.predicciones)        || 0
          e.aciertos_exactos    += parseInt(u.aciertos_exactos)    || 0
          e.aciertos_diferencia += parseInt(u.aciertos_diferencia) || 0
          e.aciertos_resultado  += parseInt(u.aciertos_resultado)  || 0
        })
      })
      setTablaAcumulada(
        Object.values(mapa)
          .sort((a, b) => b.puntos_totales - a.puntos_totales)
          .map((u, i) => ({ ...u, posicion: i + 1 }))
      )
    } catch (e) { toast.error('Error calculando ranking combinado: ' + e.message) }
    finally { setLoadingAcum(false) }
  }

  async function toggleUser(userId) {
    if (expandedUser === userId) {
      setExpandedUser(null)
      return
    }
    if (predicciones[userId]) {
      setExpandedUser(userId)
      return
    }
    setLoadingUser(userId)
    try {
      const r = await sheetsApi.predicciones.deUsuario(sel.id, userId)
      const predsRaw = r.mis || r.predicciones || []
      const predsEnriquecidas = predsRaw.map(pred => {
        const partido = partidosMap.get(pred.partido_id) || {}
        return {
          ...pred,
          equipo_local: partido.equipo_local || pred.partido_id,
          equipo_visitante: partido.equipo_visitante || '',
          codigo_local: partido.codigo_local || '',
          codigo_visitante: partido.codigo_visitante || '',
          bandera_local: partido.bandera_local || '',
          bandera_visitante: partido.bandera_visitante || '',
          fecha_partido: partido.fecha_partido || '',
          jornada: partido.jornada || '',
          fase: partido.fase || '',
          goles_local: partido.goles_local,
          goles_visitante: partido.goles_visitante,
          penales_local: partido.penales_local,
          penales_visit: partido.penales_visit,
          estado_partido: partido.estado || '',
        }
      })
      setPredicciones(prev => ({ ...prev, [userId]: predsEnriquecidas }))
      setExpandedUser(userId)
    } catch (e) {
      toast.error('Error al cargar predicciones: ' + e.message)
    } finally {
      setLoadingUser(null)
    }
  }

  return (
    <AppShell>
      <style>{CSS}</style>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem 1.5rem 3rem' }}>

        <div className="rk-in" style={{ marginBottom: '1.5rem' }}>
          <h1 style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 'clamp(2.4rem,6vw,3.5rem)',
            margin: '0 0 .3rem',
            lineHeight: 1,
            letterSpacing: '.02em',
          }}>
            <span style={{ color: '#0c182b' }}>RANKING </span>
            <span style={{ color: '#ebc32b' }}>ADMIN</span>
          </h1>
          <p style={{ fontSize: '.84rem', color: '#5f6e8a', margin: 0 }}>
            {sel ? sel.titulo : 'Ranking global acumulado · Seleccioná una apuesta para ver el detalle individual'}
          </p>
        </div>

        <div className="rk-shell" style={{ display: 'flex', height: 'calc(100vh - 200px)', minHeight: 520, borderRadius: 20, overflow: 'hidden', boxShadow: '0 8px 48px rgba(12,24,43,.14)' }}>

          <div className="rk-sidebar">
            <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #f0eadb' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, letterSpacing: '.2em', color: '#94a3b8', margin: 0 }}>APUESTAS</p>
                {selectedIds.size > 0 && (
                  <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(235,195,43,.15)', color: '#c99f16', border: '1px solid rgba(235,195,43,.35)', borderRadius: 99, padding: '2px 8px' }}>
                    {selectedIds.size} sel.
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <Pill color="#22c55e" label={`${bets.filter(b => isOpen(b)).length} activas`} />
                <Pill color="#64748b" label={`${bets.filter(b => !isOpen(b)).length} cerradas`} />
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                <button
                  onClick={() => { setSelectedIds(new Set(bets.map(b => b.id))); setTablaAcumulada([]); setSel(null); setTabla([]); setMeta({}) }}
                  style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', padding: '3px 8px', borderRadius: 6, border: '1px solid #e0d8cc', background: '#fff', color: '#5f6e8a', cursor: 'pointer', transition: 'all .14s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#0c182b'; e.currentTarget.style.color = '#0c182b' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e0d8cc'; e.currentTarget.style.color = '#5f6e8a' }}>
                  Selec. todas
                </button>
                {selectedIds.size > 0 && (
                  <button
                    onClick={() => { setSelectedIds(new Set()); setSel(null); setTabla([]); setMeta({}); setTablaAcumulada([]) }}
                    style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(224,50,82,.3)', background: '#fff', color: '#e03252', cursor: 'pointer', transition: 'all .14s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(224,50,82,.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            <div className="rk-sidebar-scroll">
              {lb ? (
                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[...Array(6)].map((_, i) => <div key={i} className="rk-sk" style={{ height: 52 }} />)}
                </div>
              ) : (
                <>
                  {bets.filter(b => isOpen(b)).length > 0 && (
                    <SideSection label="Activas" dot="#22c55e">
                      {bets.filter(b => isOpen(b)).map(b => (
                        <BetRow key={b.id} bet={b} checked={selectedIds.has(b.id)} onToggle={toggleBet} />
                      ))}
                    </SideSection>
                  )}
                  <SideSection label="Historial">
                    {bets.filter(b => !isOpen(b)).map(b => (
                      <BetRow key={b.id} bet={b} checked={selectedIds.has(b.id)} onToggle={toggleBet} />
                    ))}
                  </SideSection>
                </>
              )}
            </div>
          </div>

          <div className="rk-content" style={{ padding: '24px 32px 32px' }}>

            {selectedIds.size === 0 ? (
              <RankingGlobalAdmin
                tabla={globalTabla}
                meta={globalMeta}
                loading={globalLoading}
                onRefresh={cargarRankingGlobal}
              />
            ) : modoAcumulado && tablaAcumulada.length === 0 && !loadingAcum ? (
              <PromptAcumulado count={selectedIds.size} onCalcular={cargarAcumulado} />
            ) : modoAcumulado ? (
              <div className="rk-in">
                <BannerAcumulado count={selectedIds.size} bets={bets} selectedIds={selectedIds} />
                {loadingAcum ? (
                  <SkeletonContent />
                ) : tablaAcumulada.length === 0 ? (
                  <SinParticipantes />
                ) : (
                  <>
                    <Podio
                      top={tablaAcumulada.slice(0, 3)}
                      miId={null}
                      apuesta={null}
                      expandedUser={null}
                      loadingUser={null}
                      onToggle={() => {}}
                      showDetail={false}
                    />
                    {tablaAcumulada.length > 3 && (
                      <OtrosParticipantes
                        tabla={tablaAcumulada}
                        user={user}
                        apuesta={null}
                        expandedUser={null}
                        loadingUser={null}
                        predicciones={{}}
                        onToggle={() => {}}
                        showDetail={false}
                      />
                    )}
                    <div style={{ textAlign: 'center', paddingTop: 12, borderTop: '1px solid #e8e3db', marginTop: 16, fontSize: 10, color: '#94a3b8' }}>
                      {tablaAcumulada.length} participantes · suma de {selectedIds.size} apuestas
                    </div>
                  </>
                )}
              </div>
            ) : sel ? (
              <div className="rk-in">

                <Banner apuesta={sel} meta={meta} loading={loading} />

                {loading ? (
                  <SkeletonContent />
                ) : tabla.length === 0 ? (
                  <SinParticipantes />
                ) : (
                  <>
                    <Podio
                      top={tabla.slice(0, 3)}
                      miId={user?.id}
                      apuesta={sel}
                      expandedUser={expandedUser}
                      loadingUser={loadingUser}
                      onToggle={toggleUser}
                    />

                    {expandedUser && tabla.slice(0, 3).some(u => u.user_id === expandedUser) && (
                      <PrediccionesPanel
                        user={tabla.find(u => u.user_id === expandedUser)}
                        predicciones={predicciones[expandedUser] || []}
                        apuesta={sel}
                        onClose={() => setExpandedUser(null)}
                      />
                    )}

                    {tabla.length > 3 && (
                      <OtrosParticipantes
                        tabla={tabla}
                        user={user}
                        apuesta={sel}
                        expandedUser={expandedUser}
                        loadingUser={loadingUser}
                        predicciones={predicciones}
                        onToggle={toggleUser}
                      />
                    )}

                    <LeyendaPuntos apuesta={sel} total={meta.total} />

                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

/* ══════════════════════════════════════════
   SIDEBAR COMPONENTS
══════════════════════════════════════════ */
function Pill({ color, label }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 99, padding: '2px 8px' }}>
      {label}
    </span>
  )
}

function SideSection({ label, dot, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px 4px', position: 'sticky', top: 0, background: '#fcfaf6', zIndex: 2 }}>
        {dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: dot, display: 'inline-block', boxShadow: `0 0 6px ${dot}` }} />}
        <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em', color: '#b8c0cc' }}>{label}</span>
      </div>
      {children}
    </div>
  )
}

function BetRow({ bet, checked, onToggle }) {
  const open = isOpen(bet)
  const fin = bet.estado === 'finalizada'
  const col = fin ? '#ebc32b' : open ? '#22c55e' : '#475569'
  const parts = bet.partidos_ids ? bet.partidos_ids.split(',').filter(Boolean).length : 0
  return (
    <div className={`rk-row${checked ? ' sel' : ''}`} onClick={() => onToggle(bet)}>
      <div style={{
        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
        border: `1.5px solid ${checked ? '#ebc32b' : '#c8d0dc'}`,
        background: checked ? '#ebc32b' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .13s',
      }}>
        {checked && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#05090f" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: col, flexShrink: 0, boxShadow: open ? `0 0 6px ${col}` : 'none' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: checked ? '#fff' : '#0c182b', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {bet.titulo}
        </p>
        <p style={{ fontSize: 10, color: checked ? 'rgba(255,255,255,.55)' : '#94a3b8', margin: 0 }}>
          {bet.participantes || 0} part · {parts} partidos
        </p>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   BANNER
══════════════════════════════════════════ */
function Banner({ apuesta, meta, loading }) {
  return (
    <div style={{ borderRadius: 14, marginBottom: 24, background: 'linear-gradient(125deg,#0c182b 0%,#1a3060 100%)', padding: '18px 22px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(235,195,43,.08)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -40, right: 80, width: 120, height: 120, borderRadius: '50%', background: 'rgba(235,195,43,.05)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, position: 'relative' }}>
        <div>
          <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.22em', color: 'rgba(235,195,43,.55)', display: 'block', marginBottom: 4 }}>
            TABLA DE POSICIONES
          </span>
          <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(22px,3vw,32px)', color: '#fff', margin: '0 0 6px', letterSpacing: '.02em', lineHeight: 1 }}>
            {apuesta.titulo}
          </h2>
          {apuesta.premio && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(235,195,43,.1)', border: '1px solid rgba(235,195,43,.2)', borderRadius: 99, padding: '3px 10px' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ebc32b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
              </svg>
              <span style={{ fontSize: 10, color: 'rgba(235,195,43,.8)', fontWeight: 600 }}>{apuesta.premio}</span>
            </div>
          )}
        </div>

        {!loading && (
          <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
            {meta.total > 0 && <BannerStat n={meta.total} label="Part." />}
          </div>
        )}
      </div>
    </div>
  )
}

function BannerStat({ n, label, gold }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: gold ? '#ebc32b' : 'rgba(255,255,255,.9)', margin: '0 0 1px', lineHeight: 1 }}>{n}</p>
      <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: 'rgba(255,255,255,.35)', margin: 0 }}>{label}</p>
    </div>
  )
}

/* ══════════════════════════════════════════
   PODIO
══════════════════════════════════════════ */
const PODIO_CFG = {
  0: { grad: 'linear-gradient(145deg,#f5d75a 0%,#c99f16 100%)', shadow: 'rgba(235,195,43,.5)', border: 'rgba(235,195,43,.7)', ring: 'rgba(235,195,43,.3)', emoji: '🥇', label: '1°' },
  1: { grad: 'linear-gradient(145deg,#e2e8f0 0%,#94a3b8 100%)', shadow: 'rgba(148,163,184,.4)', border: 'rgba(148,163,184,.5)', ring: 'rgba(148,163,184,.2)', emoji: '🥈', label: '2°' },
  2: { grad: 'linear-gradient(145deg,#fed7aa 0%,#c2720e 100%)', shadow: 'rgba(194,114,14,.4)', border: 'rgba(194,114,14,.5)', ring: 'rgba(194,114,14,.2)', emoji: '🥉', label: '3°' },
}

function Podio({ top, miId, apuesta, expandedUser, loadingUser, onToggle, showDetail = true }) {
  if (!top.length) return null

  const orden = top.length === 1 ? [top[0]] : top.length === 2 ? [top[1], top[0]] : [top[1], top[0], top[2]]
  const rankOf = u => top.findIndex(x => x.user_id === u.user_id)

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, letterSpacing: '.18em', color: '#94a3b8' }}>TOP 3</span>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,#e2ddd6,transparent)' }} />
      </div>

      <div className="rk-podio-grid" style={{
        display: 'grid',
        gridTemplateColumns: top.length === 1 ? '1fr' : top.length === 2 ? '1fr 1fr' : '1fr 1.08fr 1fr',
        gap: 12, alignItems: 'end',
        maxWidth: top.length === 1 ? 200 : top.length === 2 ? 420 : '100%',
        margin: '0 auto',
      }}>
        {orden.map(u => {
          const rank = rankOf(u)
          const cfg = PODIO_CFG[rank]
          const isTop = rank === 0
          const me = u.user_id === miId
          const sz = isTop ? 60 : 48
          const isExpanded = expandedUser === u.user_id
          const isLoading = loadingUser === u.user_id

          return (
            <div key={u.user_id} className="rk-pcard"
              style={{
                background: '#fff',
                border: `${isTop ? 2 : 1.5}px solid ${isTop ? cfg.border : '#e8e3db'}`,
                padding: isTop ? '20px 14px 14px' : '16px 12px 12px',
                boxShadow: isTop
                  ? `0 0 0 4px ${cfg.ring}, 0 12px 40px ${cfg.shadow}`
                  : '0 2px 12px rgba(12,24,43,.06)',
              }}>

              {isTop && (
                <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(90deg,#c99f16,#ebc32b)', color: '#fff', fontSize: 8, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', padding: '3px 14px', borderRadius: 99, whiteSpace: 'nowrap', boxShadow: '0 2px 10px rgba(235,195,43,.5)' }}>
                  ★ LÍDER
                </div>
              )}

              <div style={{ fontSize: isTop ? 28 : 20, marginBottom: 10, lineHeight: 1 }}>{cfg.emoji}</div>

              <div style={{
                width: sz, height: sz, borderRadius: '50%',
                background: cfg.grad,
                margin: '0 auto 10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: isTop ? 22 : 17,
                color: '#fff',
                boxShadow: `0 0 0 3px #fff, 0 0 0 ${isTop ? 6 : 5}px ${cfg.ring}, 0 6px 20px ${cfg.shadow}`,
                letterSpacing: '.04em',
              }}>{initials(u.nombre)}</div>

              <p style={{ fontWeight: 700, fontSize: isTop ? 15 : 13, color: '#0c182b', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.nombre}
                {me && <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 400, marginLeft: 4 }}>(vos)</span>}
              </p>

              <p style={{ fontSize: 10, color: '#94a3b8', margin: '0 0 10px' }}>
                {u.predicciones} pred · {u.aciertos_exactos} ✓
              </p>

              <div style={{
                background: isTop ? 'linear-gradient(135deg,rgba(235,195,43,.12),rgba(235,195,43,.06))' : 'rgba(12,24,43,.04)',
                border: isTop ? '1px solid rgba(235,195,43,.25)' : '1px solid #f0eadb',
                borderRadius: 10, padding: '8px 0',
                marginBottom: showDetail ? 10 : 0,
              }}>
                <p style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: isTop ? 36 : 28, color: isTop ? '#c99f16' : '#0c182b', margin: 0, lineHeight: 1 }}>
                  {u.puntos_totales}
                </p>
                <p style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em', color: '#94a3b8', margin: '2px 0 0' }}>puntos</p>
              </div>

              {showDetail && (
                <button
                  onClick={() => onToggle(u.user_id)}
                  disabled={isLoading}
                  className={`rk-detail-btn rk-detail-btn-podio ${isExpanded ? 'active' : ''}`}
                  style={{ width: '100%' }}
                >
                  {isLoading ? (
                    <><span className="rk-spinner" /> Cargando…</>
                  ) : isExpanded ? (
                    <>Ocultar detalle
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </>
                  ) : (
                    <>Ver detalle
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   PANEL DE PREDICCIONES
══════════════════════════════════════════ */
function PrediccionesPanel({ user, predicciones, apuesta, onClose }) {
  return (
    <div className="rk-in" style={{
      background: '#fff',
      border: '1px solid #f0eadb',
      borderRadius: 14,
      padding: '1rem 1.2rem',
      marginBottom: 20,
      boxShadow: '0 4px 20px rgba(12,24,43,.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.9rem', paddingBottom: '.7rem', borderBottom: '1px solid #f0eadb' }}>
        <div>
          <p style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.22em', color: '#94a3b8', margin: '0 0 3px' }}>
            Predicciones de
          </p>
          <p style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#0c182b', margin: 0, letterSpacing: '.02em', lineHeight: 1 }}>
            {user?.nombre}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(12,24,43,.06)',
            border: 'none',
            borderRadius: '50%',
            width: 28, height: 28,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#0c182b',
            transition: 'all .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(12,24,43,.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(12,24,43,.06)'}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {predicciones.length > 0 ? (
        <PrediccionesGrid predicciones={predicciones} apuesta={apuesta} />
      ) : (
        <p style={{ fontSize: '.8rem', color: '#a8b2c4', margin: 0, textAlign: 'center', padding: '.8rem 0' }}>
          Sin predicciones cargadas
        </p>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   GRID DE PREDICCIONES
══════════════════════════════════════════ */
function PrediccionesGrid({ predicciones, apuesta }) {
  const ordenadas = useMemo(() => {
    return [...predicciones].sort((a, b) => {
      const ja = parseInt(a.jornada) || 999
      const jb = parseInt(b.jornada) || 999
      if (ja !== jb) return ja - jb
      const fa = a.fecha_partido ? new Date(a.fecha_partido).getTime() : 0
      const fb = b.fecha_partido ? new Date(b.fecha_partido).getTime() : 0
      return fa - fb
    })
  }, [predicciones])

  return (
    <div>
      <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em', color: '#94a3b8', margin: '0 0 .7rem' }}>
        {predicciones.length} predicciones
      </p>
      <div style={{ display: 'grid', gap: '.5rem' }}>
        {ordenadas.map((pred, i) => (
          <PrediccionRow key={pred.id || i} pred={pred} apuesta={apuesta} />
        ))}
      </div>
    </div>
  )
}

function PrediccionRow({ pred, apuesta }) {
  const tieneResultado = pred.goles_local !== '' && pred.goles_local !== null && pred.goles_local !== undefined
  const predLocal = parseInt(pred.pred_local)
  const predVisit = parseInt(pred.pred_visitante)
  const realLocal = parseInt(pred.goles_local)
  const realVisit = parseInt(pred.goles_visitante)

  let borderC = '#f0eadb'
  let bgC = '#fcfaf6'
  let badge = null

  const ptsExacto = parseInt(apuesta?.puntos_exacto) || 5
  const ptsDif = parseInt(apuesta?.puntos_diferencia) || 3
  const ptsRes = parseInt(apuesta?.puntos_resultado) || 1

  // ✅ SOLUCIÓN: Usar pred.puntos si existe (backend)
  const puntosDlBackend = pred.puntos !== undefined && pred.puntos !== null ? parseInt(pred.puntos) : null

  if (puntosDlBackend !== null) {
    // El backend YA calculó los puntos → úsalos SIEMPRE
    if (puntosDlBackend === ptsExacto) {
      borderC = '#22c55e40'; bgC = '#22c55e0a'; badge = { c: '#22c55e', label: `+${puntosDlBackend}` }
    } else if (puntosDlBackend === ptsDif) {
      borderC = '#ebc32b40'; bgC = '#ebc32b0a'; badge = { c: '#ebc32b', label: `+${puntosDlBackend}` }
    } else if (puntosDlBackend === ptsRes) {
      borderC = '#94a3b830'; bgC = '#94a3b808'; badge = { c: '#94a3b8', label: `+${puntosDlBackend}` }
    } else if (puntosDlBackend === 0) {
      if (tieneResultado) {
        borderC = '#f43f5e30'; bgC = '#f43f5e08'; badge = { c: '#f43f5e', label: '0' }
      } else {
        // Sin resultado aún = sin puntos
        borderC = '#f0eadb'; bgC = '#fcfaf6'; badge = null
      }
    }
  } else if (tieneResultado && !isNaN(realLocal) && !isNaN(realVisit) && !isNaN(predLocal) && !isNaN(predVisit)) {
    // Fallback: recalcular si no viene del backend (solo para fases de grupos sin clasificado)
    const exacto = predLocal === realLocal && predVisit === realVisit
    const dif = (predLocal - predVisit) === (realLocal - realVisit)
    const resultado = (predLocal > predVisit && realLocal > realVisit) ||
      (predLocal < predVisit && realLocal < realVisit) ||
      (predLocal === predVisit && realLocal === realVisit)

    if (exacto) { borderC = '#22c55e40'; bgC = '#22c55e0a'; badge = { c: '#22c55e', label: `+${ptsExacto}` } }
    else if (dif) { borderC = '#ebc32b40'; bgC = '#ebc32b0a'; badge = { c: '#ebc32b', label: `+${ptsDif}` } }
    else if (resultado) { borderC = '#94a3b830'; bgC = '#94a3b808'; badge = { c: '#94a3b8', label: `+${ptsRes}` } }
    else { borderC = '#f43f5e30'; bgC = '#f43f5e08'; badge = { c: '#f43f5e', label: '0' } }
  }

  const local = pred.equipo_local || pred.codigo_local || pred.partido_id
  const visit = pred.equipo_visitante || pred.codigo_visitante || ''

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 60px 60px auto',
      gap: '.7rem',
      padding: '.6rem .8rem',
      background: bgC,
      border: `1px solid ${borderC}`,
      borderRadius: 9,
      alignItems: 'center',
    }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: '.78rem', fontWeight: 600, color: '#0c182b', margin: '0 0 .12rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {local} {visit && <><span style={{ color: '#94a3b8' }}>vs</span> {visit}</>}
        </p>
        <p style={{ fontSize: '.62rem', color: '#94a3b8', margin: 0 }}>
          {pred.jornada && `Jornada ${pred.jornada}`}
          {pred.jornada && pred.fecha_partido && ' · '}
          {pred.fecha_partido && new Date(pred.fecha_partido).toLocaleDateString('es-AR')}
          {!pred.jornada && !pred.fecha_partido && '—'}
        </p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '.55rem', color: '#94a3b8', margin: '0 0 .1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Pred.</p>
        <p style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.05rem', fontWeight: 700, color: '#0c182b', margin: 0, letterSpacing: '.04em' }}>
          {isNaN(predLocal) ? '—' : `${predLocal}-${predVisit}`}
        </p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '.55rem', color: '#94a3b8', margin: '0 0 .1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Real</p>
        <p style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.05rem', fontWeight: 700, color: tieneResultado ? '#0c182b' : '#a8b2c4', margin: 0, letterSpacing: '.04em' }}>
          {tieneResultado ? `${realLocal}-${realVisit}` : '—'}
        </p>
      </div>
      {badge && (
        <span style={{
          background: `${badge.c}18`,
          border: `1px solid ${badge.c}40`,
          color: badge.c,
          fontSize: 9,
          fontWeight: 800,
          padding: '3px 7px',
          borderRadius: 5,
          letterSpacing: '.05em',
          minWidth: 32,
          textAlign: 'center',
        }}>
          {badge.label}
        </span>
      )}
      {!badge && (
        <span style={{
          background: 'rgba(12,24,43,.04)',
          border: '1px dashed #d8d2c5',
          color: '#a8b2c4',
          fontSize: 9,
          fontWeight: 700,
          padding: '3px 7px',
          borderRadius: 5,
          minWidth: 32,
          textAlign: 'center',
        }}>
          —
        </span>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   LEYENDA Y ESTADOS
══════════════════════════════════════════ */
function LeyendaPuntos({ apuesta, total }) {
  const e = parseInt(apuesta?.puntos_exacto) || 5, d = parseInt(apuesta?.puntos_diferencia) || 3, r = parseInt(apuesta?.puntos_resultado) || 1
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 10, color: '#94a3b8', paddingTop: 12, borderTop: '1px solid #e8e3db', marginTop: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {[['#22c55e', `Exacto +${e}pts`], ['#ebc32b', `Diferencia +${d}pts`], ['#94a3b8', `Resultado +${r}pt${r === 1 ? '' : 's'}`], ['#f43f5e', 'Sin acierto 0pts']].map(([c, l]) => (
          <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: c, display: 'inline-block' }} />
            {l}
          </span>
        ))}
      </div>
      {total > 0 && <span>{total} participantes</span>}
    </div>
  )
}

/* ══════════════════════════════════════════
   RANKING GLOBAL ADMIN (vista por defecto)
══════════════════════════════════════════ */
function RankingGlobalAdmin({ tabla, meta, loading, onRefresh }) {
  return (
    <div className="rk-in">
      {/* Header */}
      <div style={{ borderRadius: 14, marginBottom: 24, background: 'linear-gradient(125deg,#0c182b 0%,#1a3060 100%)', padding: '18px 22px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(235,195,43,.08)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, position: 'relative' }}>
          <div>
            <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.22em', color: 'rgba(235,195,43,.55)', display: 'block', marginBottom: 4 }}>RANKING GLOBAL ACUMULADO</span>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(22px,3vw,32px)', color: '#fff', margin: '0 0 6px', letterSpacing: '.02em', lineHeight: 1 }}>Todas las apuestas</h2>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', margin: 0 }}>Suma de puntos de apuestas cerradas y finalizadas · Vista de administrador</p>
          </div>
          {!loading && (
            <div style={{ display: 'flex', gap: 20, flexShrink: 0, alignItems: 'flex-start' }}>
              {meta.total > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: 'rgba(255,255,255,.9)', margin: '0 0 1px', lineHeight: 1 }}>{meta.total}</p>
                  <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: 'rgba(255,255,255,.35)', margin: 0 }}>Participantes</p>
                </div>
              )}
              <button
                onClick={onRefresh}
                title="Actualizar ranking global"
                style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'rgba(255,255,255,.5)', display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <SkeletonContent />
      ) : tabla.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: '#fff', borderRadius: 14, border: '1.5px solid #e8e3db' }}>
          <p style={{ fontWeight: 700, color: '#64748b', margin: '0 0 6px', fontSize: 15 }}>Sin datos en el ranking global</p>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>El ranking global se calcula cuando hay apuestas cerradas o finalizadas con puntos calculados</p>
        </div>
      ) : (
        <>
          {/* Podio top 3 */}
          <Podio
            top={tabla.slice(0, 3)}
            miId={null}
            apuesta={null}
            expandedUser={null}
            loadingUser={null}
            onToggle={() => {}}
            showDetail={false}
          />

          {/* Tabla completa */}
          {tabla.length > 3 && (
            <GlobalFullTable tabla={tabla} />
          )}

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 10, color: '#94a3b8', paddingTop: 12, borderTop: '1px solid #e8e3db', marginTop: 12 }}>
            <span>Seleccioná una apuesta del panel izquierdo para ver el ranking individual con predicciones detalladas</span>
            {meta.total > 0 && <span>Mostrando {tabla.length} de {meta.total} participantes</span>}
          </div>
        </>
      )}
    </div>
  )
}

function GlobalFullTable({ tabla }) {
  const [exp, setExp] = useState(true)
  const otros = tabla.slice(3)

  return (
    <div style={{ marginTop: 20 }}>
      <button
        onClick={() => setExp(!exp)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', transition: 'opacity .15s' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em', color: '#94a3b8' }}>Ranking completo</span>
          <span style={{ fontSize: 8, fontWeight: 700, background: 'rgba(12,24,43,.05)', color: '#c8d0dc', padding: '1px 6px', borderRadius: 4 }}>+{otros.length}</span>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,#e8e3db,transparent)', marginLeft: 8 }} />
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: 'transform .2s', transform: exp ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0, marginLeft: 8 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {exp && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 12 }}>
          {otros.map((u, idx) => (
            <div key={u.user_id} style={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr 80px 70px 56px',
              gap: 10,
              padding: '9px 12px',
              background: '#fff',
              border: '1px solid #f5f3ee',
              borderRadius: 10,
              alignItems: 'center',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fcfaf6'; e.currentTarget.style.borderColor = '#e8e3db' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#f5f3ee' }}
            >
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: '#94a3b8', textAlign: 'center' }}>#{idx + 4}</span>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 12, color: '#0c182b', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nombre}</p>
                <p style={{ fontSize: 9, color: '#c8d0dc', margin: 0 }}>{u.predicciones} pred · {u.apuestas_participadas || '—'} apuestas</p>
              </div>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-start' }}>
                {[{ v: u.aciertos_exactos, c: '#22c55e' }, { v: u.aciertos_diferencia || 0, c: '#ebc32b' }].map((x, i) => (
                  x.v > 0 && (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 5, background: `${x.c}12`, border: `1px solid ${x.c}25`, fontSize: 9, fontWeight: 600, color: x.c }}>{x.v}</span>
                  )
                ))}
              </div>
              <span style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center' }}>{u.apuestas_participadas || 0} ap.</span>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, fontWeight: 700, color: '#0c182b', textAlign: 'right' }}>{u.puntos_totales}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   RANKING COMBINADO (multi-select)
══════════════════════════════════════════ */
function PromptAcumulado({ count, onCalcular }) {
  return (
    <div className="rk-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 380, padding: '2rem' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(235,195,43,.12)', border: '1px solid rgba(235,195,43,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c99f16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      </div>
      <p style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: '#0c182b', margin: '0 0 6px', letterSpacing: '.03em' }}>RANKING COMBINADO</p>
      <p style={{ fontSize: 13, color: '#5f6e8a', margin: '0 0 20px', maxWidth: 360, lineHeight: 1.5 }}>
        Seleccionaste <strong>{count}</strong> apuestas. Se sumarán los puntos de todas para obtener un único ganador.
      </p>
      <button
        onClick={onCalcular}
        style={{ background: '#ebc32b', color: '#05090f', border: 'none', borderRadius: 99, padding: '.7rem 1.6rem', fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(235,195,43,.3)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        Calcular ranking combinado
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </div>
  )
}

function BannerAcumulado({ count, bets, selectedIds }) {
  const nombres = bets.filter(b => selectedIds.has(b.id)).map(b => b.titulo)
  return (
    <div style={{ borderRadius: 14, marginBottom: 24, background: 'linear-gradient(125deg,#0c182b 0%,#1a3060 100%)', padding: '18px 22px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(235,195,43,.08)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative' }}>
        <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.22em', color: 'rgba(235,195,43,.55)', display: 'block', marginBottom: 4 }}>
          RANKING COMBINADO
        </span>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(22px,3vw,32px)', color: '#fff', margin: '0 0 8px', letterSpacing: '.02em', lineHeight: 1 }}>
          {count} APUESTAS SUMADAS
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {nombres.slice(0, 6).map((n, i) => (
            <span key={i} style={{ fontSize: 10, color: 'rgba(235,195,43,.85)', background: 'rgba(235,195,43,.1)', border: '1px solid rgba(235,195,43,.2)', borderRadius: 99, padding: '2px 10px' }}>{n}</span>
          ))}
          {nombres.length > 6 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', padding: '2px 4px' }}>+{nombres.length - 6} más</span>}
        </div>
      </div>
    </div>
  )
}

function SinParticipantes() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', background: '#fff', borderRadius: 14, border: '1.5px solid #e8e3db' }}>
      <p style={{ fontWeight: 700, color: '#64748b', margin: '0 0 6px', fontSize: 15 }}>Sin participantes todavía</p>
      <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>Las predicciones aparecerán cuando los participantes las carguen</p>
    </div>
  )
}

function SkeletonContent() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.08fr 1fr', gap: 12, marginBottom: 24, alignItems: 'end' }}>
        {[110, 145, 110].map((h, i) => <div key={i} className="rk-sk" style={{ height: h, borderRadius: 16 }} />)}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   OTROS PARTICIPANTES
══════════════════════════════════════════ */
function OtrosParticipantes({ tabla, user, apuesta, expandedUser, loadingUser, predicciones, onToggle, showDetail = true }) {
  const [exp, setExp] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('otros_participantes_expanded')) ?? true
    } catch {
      return true
    }
  })

  useEffect(() => {
    sessionStorage.setItem('otros_participantes_expanded', JSON.stringify(exp))
  }, [exp])

  const otros = tabla.slice(3)

  return (
    <div style={{ marginTop: 20 }}>
      <button
        onClick={() => setExp(!exp)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          transition: 'opacity .15s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em', color: '#94a3b8' }}>
            Otros participantes
          </span>
          <span style={{ fontSize: 8, fontWeight: 700, background: 'rgba(12,24,43,.05)', color: '#c8d0dc', padding: '1px 6px', borderRadius: 4 }}>
            +{otros.length}
          </span>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,#e8e3db,transparent)', marginLeft: 8 }} />
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: 'transform .2s', transform: exp ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0, marginLeft: 8 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {exp && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 12 }}>
          {otros.map((u, idx) => {
            const isExpanded = expandedUser === u.user_id
            const isLoading = loadingUser === u.user_id
            const isMe = u.user_id === user?.id

            return (
              <div key={u.user_id} style={{
                background: isMe ? 'rgba(235,195,43,.1)' : '#fff',
                border: isMe ? '1.5px solid #ebc32b' : '1px solid #f5f3ee',
                boxShadow: isMe ? '0 0 0 1px rgba(235,195,43,.3), 0 2px 8px rgba(235,195,43,.12)' : 'none',
                borderRadius: 10,
                overflow: 'hidden',
                transition: 'all .15s',
              }}>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr 64px 56px auto',
                  gap: 10,
                  padding: '9px 12px',
                  alignItems: 'center',
                }}>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: '#94a3b8', textAlign: 'center' }}>#{idx + 4}</span>

                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: isMe ? 700 : 500, fontSize: 11, color: isMe ? '#ebc32b' : '#0c182b', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.nombre}
                      {isMe && (
                        <span style={{
                          fontSize: 8,
                          color: '#ebc32b',
                          marginLeft: 6,
                          fontWeight: 700,
                          background: 'rgba(235,195,43,.15)',
                          border: '1px solid rgba(235,195,43,.3)',
                          padding: '1px 5px',
                          borderRadius: 3,
                          textTransform: 'uppercase',
                          letterSpacing: '.05em'
                        }}>
                          (vos)
                        </span>
                      )}
                    </p>
                    <p style={{ fontSize: 8, color: '#c8d0dc', margin: 0 }}>{u.predicciones} pred</p>
                  </div>

                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-start' }}>
                    {[{ v: u.aciertos_exactos, c: '#22c55e' }, { v: u.aciertos_diferencia || 0, c: '#ebc32b' }].map((x, i) => (
                      x.v > 0 && (
                        <span key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 5, background: `${x.c}12`, border: `1px solid ${x.c}25`, fontSize: 9, fontWeight: 600, color: x.c }}>{x.v}</span>
                      )
                    ))}
                  </div>

                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, fontWeight: 700, color: '#0c182b', textAlign: 'right' }}>{u.puntos_totales}</div>

                  {showDetail ? (
                    <button
                      onClick={() => onToggle(u.user_id)}
                      disabled={isLoading}
                      className={`rk-detail-btn rk-detail-btn-mini ${isExpanded ? 'active' : ''}`}
                    >
                      {isLoading ? (
                        <><span className="rk-spinner" /></>
                      ) : isExpanded ? (
                        <>Ocultar
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="18 15 12 9 6 15" />
                          </svg>
                        </>
                      ) : (
                        <>Ver
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </>
                      )}
                    </button>
                  ) : <span />}
                </div>

                {isExpanded && (
                  <div style={{ borderTop: '1px solid #f0eadb', padding: '.8rem 1rem', background: '#fcfaf6' }}>
                    {(predicciones[u.user_id] || []).length > 0 ? (
                      <PrediccionesGrid predicciones={predicciones[u.user_id]} apuesta={apuesta} />
                    ) : (
                      <p style={{ fontSize: '.7rem', color: '#a8b2c4', margin: 0, textAlign: 'center' }}>Sin predicciones</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}