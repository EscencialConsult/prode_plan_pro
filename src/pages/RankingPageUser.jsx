/**
 * RankingPageUser.jsx — Diseño premium v6 (USER VERSION)
 * Ubicación: src/pages/RankingPageUser.jsx
 *
 * Mismo diseño que RankingPage.jsx pero:
 * - Sin expandir predicciones
 * - Solo muestra TOP 3
 * - Solo puntajes totales visibles
 *
 * v6.1 — Dimensiones alineadas con FixturePage (maxWidth:1400, padding:'2rem 1.5rem 3rem')
 *        y header con paleta navy + naranja de FixturePage
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
.rk-in { animation: rk-in .28s ease both }

/* Panel izquierdo */
.rk-sidebar { width:380px;flex-shrink:0;display:flex;flex-direction:column;overflow:hidden;background:#fcfaf6;border-right:1px solid #f0eadb }
.rk-sidebar-scroll { overflow-y:auto;flex:1 }
.rk-sidebar-scroll::-webkit-scrollbar { width:2px }
.rk-sidebar-scroll::-webkit-scrollbar-thumb { background:#e7dec6;border-radius:99px }

/* Fila apuesta */
.rk-row { display:flex;align-items:center;gap:10px;padding:11px 16px;cursor:pointer;border-bottom:1px solid #f5f3ee;position:relative;transition:background .13s }
.rk-row:hover { background:rgba(12,24,43,.03) }
.rk-row.sel { background:#0c182b;border-bottom-color:rgba(255,255,255,.06) }
.rk-row::before { content:'';position:absolute;left:0;top:25%;bottom:25%;width:3px;background:#FF7D00;border-radius:0 3px 3px 0;opacity:0;transition:opacity .13s }
.rk-row.sel::before { opacity:1 }

/* Panel derecho */
.rk-content { flex:1;min-width:0;overflow-y:auto;background:#faf7f0 }
.rk-content::-webkit-scrollbar { width:4px }
.rk-content::-webkit-scrollbar-thumb { background:#e7dec6;border-radius:99px }

/* Podio cards */
.rk-pcard { border-radius:16px;text-align:center;position:relative;overflow:visible;transition:transform .16s,box-shadow .16s }

/* Skeleton */
.rk-sk { background:linear-gradient(90deg,rgba(12,24,43,.06) 25%,rgba(12,24,43,.1) 50%,rgba(12,24,43,.06) 75%);background-size:400px 100%;animation:rk-shimmer 1.4s ease infinite;border-radius:8px }

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
export default function RankingPageUser() {
  const { bets, loading: lb } = useBets()
  const { user, isPro } = useAuth()
  const { toast } = useToast()

  const [sel, setSel] = useState(null)
  const [tabla, setTabla] = useState([])
  const [meta, setMeta] = useState({})
  const [loading, setLoading] = useState(false)

  // ── Ranking por área (apuesta seleccionada) ──
  const [tabActivo, setTabActivo] = useState('general') // 'general' | 'por_area'
  const [tablaArea, setTablaArea] = useState([])
  const [loadingArea, setLoadingArea] = useState(false)

  // ── Ranking global individual (se carga al montar) ──
  const [globalTabla, setGlobalTabla] = useState([])
  const [globalMeta, setGlobalMeta] = useState({})
  const [globalLoading, setGlobalLoading] = useState(false)

  // ── Ranking global Por región (plan_pro solamente) ──
  const [areasTabla, setAreasTabla] = useState([])
  const [areasLoading, setAreasLoading] = useState(false)

  // ── Ranking individual top 5 Por región ──
  const [areasIndividual, setAreasIndividual] = useState([])
  const [areasIndividualLoading, setAreasIndividualLoading] = useState(false)

  useEffect(() => {
    cargarRankingGlobal()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.user_id])

  useEffect(() => {
    if (!isPro) return
    cargarRankingAreas()
    cargarAreasIndividual()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro])

  async function cargarRankingGlobal() {
    setGlobalLoading(true)
    try {
      const r = await sheetsApi.predicciones.rankingGlobalTabla({
        user_id: user?.id || user?.user_id,
        limit: 50,
      })
      setGlobalTabla(r.tabla || [])
      setGlobalMeta({ total: r.total, mi_posicion: r.mi_posicion, esta_en_top: r.esta_en_top })
    } catch (e) { toast.error('Error cargando ranking global: ' + e.message) }
    finally { setGlobalLoading(false) }
  }

  async function cargarRankingAreas() {
    setAreasLoading(true)
    try {
      const r = await sheetsApi.predicciones.rankingGlobalAreas({ limit: 20 })
      setAreasTabla(r.tabla || [])
    } catch (e) { console.warn('Ranking Por región no disponible:', e.message) }
    finally { setAreasLoading(false) }
  }

  async function cargarAreasIndividual() {
    setAreasIndividualLoading(true)
    try {
      const r = await sheetsApi.predicciones.rankingGlobalPorArea({ topN: 5 })
      setAreasIndividual(r.areas || [])
    } catch (e) { console.warn('Ranking Por región individual no disponible:', e.message) }
    finally { setAreasIndividualLoading(false) }
  }

  const sortedBets = useMemo(() => {
    return [...bets].sort((a, b) => {
      const aOpen = isOpen(a)
      const bOpen = isOpen(b)

      if (aOpen && !bOpen) return -1
      if (!aOpen && bOpen) return 1

      const da = a.fecha_cierre ? new Date(a.fecha_cierre).getTime() : Infinity
      const db = b.fecha_cierre ? new Date(b.fecha_cierre).getTime() : Infinity

      if (aOpen && bOpen) {
        return da - db // closest to close first
      } else {
        return db - da // most recently closed first
      }
    })
  }, [bets])

  async function cargarRanking(bet) {
    if (sel?.id === bet.id) return
    setSel(bet); setLoading(true); setTabla([]); setMeta({})
    setTabActivo('general'); setTablaArea([])
    try {
      const [rT, rA] = await Promise.all([sheetsApi.predicciones.tabla(bet.id, {
        user_id: user?.id || user?.user_id,
        area_id: user?.area_id,
      }), sheetsApi.apuestas.obtener(bet.id)])
      setTabla(rT.tabla || [])
      setMeta({ total: rT.total, mi_posicion: rT.mi_posicion, esta_en_top: rT.esta_en_top })
      const apuestaFull = { ...(bet || {}), ...rA.apuesta }
      setSel(apuestaFull)
      // Cargar ranking por área para apuestas tipo libre
      if (apuestaFull.tipo === 'libre') {
        cargarTablaArea(bet.id)
      }
    } catch (e) { toast.error('Error cargando ranking: ' + e.message) }
    finally { setLoading(false) }
  }

  async function cargarTablaArea(apuestaId) {
    setLoadingArea(true)
    try {
      const { data, error } = await sheetsApi._supabase
        .from('ranking_cache')
        .select('user_id, nombre, area_id, area_nombre_cache, puntos_totales, posicion, posicion_en_area, aciertos_exactos, aciertos_diferencia, aciertos_resultado, predicciones')
        .eq('apuesta_id', apuestaId)
        .eq('es_grupal', false)
        .not('posicion_en_area', 'is', null)
        .order('area_id', { ascending: true })
        .order('posicion_en_area', { ascending: true })
      if (error) throw error
      setTablaArea(data || [])
    } catch (e) {
      console.warn('Error cargando ranking por área:', e.message)
      setTablaArea([])
    } finally {
      setLoadingArea(false)
    }
  }

  return (
    <AppShell>
      <style>{CSS}</style>

      {/* ⚡ Dimensiones alineadas con FixturePage */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem 1.5rem 3rem' }}>

        {/* Título página — RANKING navy + (subtítulo gris debajo) */}
        <div className="rk-in" style={{ marginBottom: '1.5rem' }}>
          <h1 style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 'clamp(2.4rem,6vw,3.5rem)',
            margin: '0 0 .3rem',
            lineHeight: 1,
            letterSpacing: '.02em',
          }}>
            <span style={{ color: '#0c182b' }}>RANKING</span>
          </h1>
          <p style={{ fontSize: '.84rem', color: '#5f6e8a', margin: 0 }}>
            {sel ? sel.titulo : 'Ranking global acumulado · Seleccioná una apuesta para ver su ranking individual'}
          </p>
        </div>

        {/* Shell principal — altura ajustada al nuevo padding */}
        <div className="rk-shell" style={{ display: 'flex', height: 'calc(100vh - 200px)', minHeight: 520, borderRadius: 20, overflow: 'hidden', boxShadow: '0 8px 48px rgba(12,24,43,.14)' }}>

          {/* ══ SIDEBAR CREAM ══ */}
          <div className="rk-sidebar">
            {/* Header sidebar */}
            <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid #f0eadb' }}>
              <p style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, letterSpacing: '.2em', color: '#a8b2c4', margin: '0 0 10px' }}>APUESTAS</p>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                <Pill color="#1b8a5a" label={`${sortedBets.filter(b => isOpen(b)).length} activas`} />
                <Pill color="#5f6e8a" label={`${sortedBets.filter(b => !isOpen(b)).length} cerradas`} />
              </div>

              <button
                onClick={() => setSel(null)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '700',
                  fontFamily: "'DM Sans', sans-serif",
                  background: !sel ? 'linear-gradient(135deg, #0c182b 0%, #1a3060 100%)' : '#fff',
                  color: !sel ? '#ebc32b' : '#0c182b',
                  border: `1.5px solid ${!sel ? '#0c182b' : '#e8e3db'}`,
                  cursor: 'pointer',
                  transition: 'all .15s',
                  boxShadow: !sel ? '0 4px 12px rgba(12,24,43,0.15)' : 'none',
                }}
                onMouseEnter={e => {
                  if (sel) {
                    e.currentTarget.style.borderColor = '#0c182b'
                    e.currentTarget.style.background = '#fcfaf6'
                  }
                }}
                onMouseLeave={e => {
                  if (sel) {
                    e.currentTarget.style.borderColor = '#e8e3db'
                    e.currentTarget.style.background = '#fff'
                  }
                }}
              >
                <span style={{ fontSize: '12px' }}>🌐</span> Ver Ranking Global
              </button>
            </div>

            <div className="rk-sidebar-scroll">
              {lb ? (
                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[...Array(6)].map((_, i) => <div key={i} className="rk-sk" style={{ height: 52 }} />)}
                </div>
              ) : (
                <>
                  {sortedBets.filter(b => isOpen(b)).length > 0 && (
                    <SideSection label="Activas" dot="#1b8a5a">
                      {sortedBets.filter(b => isOpen(b)).map(b => (
                        <BetRow key={b.id} bet={b} sel={sel?.id === b.id} onPick={cargarRanking} />
                      ))}
                    </SideSection>
                  )}
                  <SideSection label="Historial">
                    {sortedBets.filter(b => !isOpen(b)).map(b => (
                      <BetRow key={b.id} bet={b} sel={sel?.id === b.id} onPick={cargarRanking} />
                    ))}
                  </SideSection>
                </>
              )}
            </div>
          </div>

          {/* ══ CONTENIDO DERECHO ══ */}
          <div className="rk-content" style={{ padding: '24px 32px 32px' }}>

            {!sel ? (
              <RankingGlobal
                tabla={globalTabla}
                meta={globalMeta}
                loading={globalLoading}
                user={user}
                onRefresh={cargarRankingGlobal}
                areasTabla={areasTabla}
                areasLoading={areasLoading}
                areasIndividual={areasIndividual}
                areasIndividualLoading={areasIndividualLoading}
                isPro={isPro}
              />
            ) : (
              <div className="rk-in">

                {/* Banner */}
                <Banner apuesta={sel} meta={meta} loading={loading} />

                {/* Tabs: General / Por Área (solo para apuestas libre) */}
                {sel?.tipo === 'libre' && (
                  <div style={{ display: 'flex', borderBottom: '2px solid #f0eadb', marginBottom: 20, gap: 0 }}>
                    {[['general', 'General'], ['por_area', 'Por Área']].map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setTabActivo(key)}
                        style={{
                          padding: '8px 20px',
                          background: 'none',
                          border: 'none',
                          borderBottom: `2.5px solid ${tabActivo === key ? '#FF7D00' : 'transparent'}`,
                          marginBottom: -2,
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: "'DM Sans', sans-serif",
                          color: tabActivo === key ? '#0c182b' : '#a8b2c4',
                          transition: 'all .15s',
                          whiteSpace: 'nowrap',
                        }}
                      >{label}</button>
                    ))}
                  </div>
                )}

                {/* ── Pestaña GENERAL ── */}
                {tabActivo === 'general' && (
                  loading ? (
                    <SkeletonContent />
                  ) : tabla.length === 0 ? (
                    <SinParticipantes />
                  ) : (
                    <>
                      <Podio
                        top={tabla.slice(0, 3)}
                        miId={user?.id}
                        apuesta={sel}
                      />

                      {!meta.esta_en_top && meta.mi_posicion && (
                        <MiPosicion pos={meta.mi_posicion} />
                      )}

                      {tabla.length > 3 && (
                        <OtrosParticipantes tabla={tabla} user={user} />
                      )}

                      <LeyendaPuntos apuesta={sel} total={meta.total} />
                    </>
                  )
                )}

                {/* ── Pestaña POR ÁREA ── */}
                {tabActivo === 'por_area' && (
                  loadingArea ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[...Array(3)].map((_, i) => <div key={i} className="rk-sk" style={{ height: 80, borderRadius: 12 }} />)}
                    </div>
                  ) : tablaArea.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 24px', background: '#fff', borderRadius: 14, border: '1.5px solid #f0eadb' }}>
                      <p style={{ fontWeight: 700, color: '#5f6e8a', margin: '0 0 6px', fontSize: 15 }}>Sin datos por área</p>
                      <p style={{ fontSize: 12, color: '#a8b2c4', margin: 0 }}>El ranking por área se genera cuando los partidos tienen resultados calculados</p>
                    </div>
                  ) : (
                    <RankingPorAreaApuesta
                      tablaArea={tablaArea}
                      miId={user?.id || user?.user_id}
                      apuesta={sel}
                    />
                  )
                )}

              </div>
            )}
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
        <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em', color: '#a8b2c4' }}>{label}</span>
      </div>
      {children}
    </div>
  )
}

function BetRow({ bet, sel, onPick }) {
  const open = isOpen(bet)
  const fin = bet.estado === 'finalizada'
  const col = fin ? '#FF7D00' : open ? '#1b8a5a' : '#5f6e8a'
  const parts = bet.partidos_ids ? bet.partidos_ids.split(',').filter(Boolean).length : 0
  return (
    <div className={`rk-row${sel ? ' sel' : ''}`} onClick={() => onPick(bet)}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: col, flexShrink: 0, boxShadow: open ? `0 0 6px ${col}` : sel ? `0 0 4px ${col}` : 'none' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: sel ? '#fff' : '#0c182b', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {bet.titulo}
        </p>
        <p style={{ fontSize: 10, color: '#a8b2c4', margin: 0 }}>
          {bet.participantes || 0} part · {parts} partidos
        </p>
      </div>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={sel ? '#FF7D00' : '#a8b2c4'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  )
}

/* ══════════════════════════════════════════
   BANNER
══════════════════════════════════════════ */
function Banner({ apuesta, meta, loading }) {
  return (
    <div style={{ borderRadius: 14, marginBottom: 24, background: 'linear-gradient(125deg,#0c182b 0%,#1a2540 100%)', padding: '18px 22px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,125,0,.08)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -40, right: 80, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,125,0,.05)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, position: 'relative' }}>
        <div>
          <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.22em', color: 'rgba(255,125,0,.55)', display: 'block', marginBottom: 4 }}>
            TABLA DE POSICIONES
          </span>
          <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(22px,3vw,32px)', color: '#fff', margin: '0 0 6px', letterSpacing: '.02em', lineHeight: 1 }}>
            {apuesta.titulo}
          </h2>
          {apuesta.premio && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,125,0,.1)', border: '1px solid rgba(255,125,0,.2)', borderRadius: 99, padding: '3px 10px' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FF7D00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
              </svg>
              <span style={{ fontSize: 10, color: 'rgba(255,125,0,.8)', fontWeight: 600 }}>{apuesta.premio}</span>
            </div>
          )}
        </div>

        {!loading && (
          <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
            {meta.total > 0 && <BannerStat n={meta.total} label="Part." />}
            {meta.mi_posicion && <BannerStat n={`#${meta.mi_posicion.posicion}`} label="Tu pos." gold />}
          </div>
        )}
      </div>
    </div>
  )
}

function BannerStat({ n, label, gold }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: gold ? '#FF7D00' : 'rgba(255,255,255,.9)', margin: '0 0 1px', lineHeight: 1 }}>{n}</p>
      <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: 'rgba(255,255,255,.35)', margin: 0 }}>{label}</p>
    </div>
  )
}

/* ══════════════════════════════════════════
   PODIO (SIN EXPANDIR)
══════════════════════════════════════════ */
const PODIO_CFG = {
  0: { grad: 'linear-gradient(145deg,#f5d75a 0%,#a85f00 100%)', shadow: 'rgba(255,125,0,.5)', border: 'rgba(255,125,0,.7)', ring: 'rgba(255,125,0,.3)', emoji: '🥇', label: '1°' },
  1: { grad: 'linear-gradient(145deg,#f0eadb 0%,#a8b2c4 100%)', shadow: 'rgba(148,163,184,.4)', border: 'rgba(148,163,184,.5)', ring: 'rgba(148,163,184,.2)', emoji: '🥈', label: '2°' },
  2: { grad: 'linear-gradient(145deg,#fed7aa 0%,#c2720e 100%)', shadow: 'rgba(194,114,14,.4)', border: 'rgba(194,114,14,.5)', ring: 'rgba(194,114,14,.2)', emoji: '🥉', label: '3°' },
}

function Podio({ top, miId, apuesta }) {
  if (!top.length) return null

  const orden = top.length === 1 ? [top[0]] : top.length === 2 ? [top[1], top[0]] : [top[1], top[0], top[2]]
  const rankOf = u => top.findIndex(x => x.user_id === u.user_id)

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, letterSpacing: '.18em', color: '#a8b2c4' }}>TOP 3</span>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,#e7dec6,transparent)' }} />
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

          return (
            <div key={u.user_id} className="rk-pcard"
              style={{
                background: '#fff',
                border: `${isTop ? 2 : 1.5}px solid ${isTop ? cfg.border : '#f0eadb'}`,
                padding: isTop ? '20px 14px 14px' : '16px 12px 12px',
                boxShadow: isTop
                  ? `0 0 0 4px ${cfg.ring}, 0 12px 40px ${cfg.shadow}`
                  : '0 2px 12px rgba(12,24,43,.06)',
              }}>

              {isTop && (
                <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(90deg,#a85f00,#FF7D00)', color: '#fff', fontSize: 8, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', padding: '3px 14px', borderRadius: 99, whiteSpace: 'nowrap', boxShadow: '0 2px 10px rgba(255,125,0,.5)' }}>
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
                {me && <span style={{ fontSize: 10, color: '#a8b2c4', fontWeight: 400, marginLeft: 4 }}>(vos)</span>}
              </p>

              <p style={{ fontSize: 10, color: '#a8b2c4', margin: '0 0 12px' }}>
                {u.predicciones} pred · {u.aciertos_exactos} ✓
              </p>

              <div style={{
                background: isTop ? 'linear-gradient(135deg,rgba(255,125,0,.12),rgba(255,125,0,.06))' : 'rgba(12,24,43,.04)',
                border: isTop ? '1px solid rgba(255,125,0,.25)' : '1px solid #f0eadb',
                borderRadius: 10, padding: '8px 0',
              }}>
                <p style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: isTop ? 36 : 28, color: isTop ? '#a85f00' : '#0c182b', margin: 0, lineHeight: 1 }}>
                  {u.puntos_totales}
                </p>
                <p style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em', color: '#a8b2c4', margin: '2px 0 0' }}>puntos</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MI POSICIÓN (sticky) - SIN EXPANDIR
══════════════════════════════════════════ */
function MiPosicion({ pos }) {
  return (
    <div style={{ position: 'sticky', bottom: 12, marginTop: 12, zIndex: 10 }}>
      <div style={{ borderRadius: 13, overflow: 'hidden', boxShadow: '0 8px 32px rgba(12,24,43,.28)', border: '2px solid rgba(255,125,0,.45)' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '44px 1fr 100px 68px',
          padding: '10px 16px', gap: 8, alignItems: 'center',
          background: 'linear-gradient(90deg,#0c182b,#1a2540)',
        }}>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#FF7D00' }}>#{pos.posicion}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#FF7D00,#a85f00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: '#0c182b', flexShrink: 0 }}>
              {initials(pos.nombre)}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: '#fff', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pos.nombre}<span style={{ fontSize: 10, color: '#FF7D00', fontWeight: 400, marginLeft: 4 }}>(vos)</span>
              </p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', margin: 0 }}>{pos.predicciones} predicciones</p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {[['#1b8a5a', pos.aciertos_exactos], ['#FF7D00', pos.aciertos_diferencia || 0], ['rgba(255,255,255,.45)', pos.aciertos_resultado]].map(([c, n], i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: n > 0 ? c : 'rgba(255,255,255,.2)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: n > 0 ? c : 'rgba(255,255,255,.1)', display: 'inline-block' }} />
                {n}
              </span>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#FF7D00' }}>{pos.puntos_totales}</span>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,.3)', marginLeft: 2, letterSpacing: '.1em', fontWeight: 700, display: 'block' }}>PTS</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   LEYENDA Y ESTADOS VACÍOS
══════════════════════════════════════════ */
function LeyendaPuntos({ apuesta, total }) {
  const e = parseInt(apuesta?.puntos_exacto) || 5, d = parseInt(apuesta?.puntos_diferencia) || 3, r = parseInt(apuesta?.puntos_resultado) || 1
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 10, color: '#a8b2c4', paddingTop: 12, borderTop: '1px solid #f0eadb', marginTop: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {[['#1b8a5a', `Exacto +${e}pts`], ['#FF7D00', `Diferencia +${d}pts`], ['#a8b2c4', `Resultado +${r}pt${r === 1 ? '' : 's'}`], ['#e03252', 'Sin acierto 0pts']].map(([c, l]) => (
          <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: c, display: 'inline-block' }} />
            {l}
          </span>
        ))}
      </div>
      {total > 0 && <span>Mostrando top 3 de {total} participantes</span>}
    </div>
  )
}

/* ══════════════════════════════════════════
   RANKING GLOBAL (vista por defecto)
══════════════════════════════════════════ */
function RankingGlobal({ tabla, meta, loading, user, onRefresh, areasTabla, areasLoading, areasIndividual = [], areasIndividualLoading = false, isPro }) {
  const miId = user?.id || user?.user_id

  return (
    <div className="rk-in">
      {/* Header global */}
      <div style={{ borderRadius: 14, marginBottom: 24, background: 'linear-gradient(125deg,#0c182b 0%,#1a3060 100%)', padding: '18px 22px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(235,195,43,.08)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, position: 'relative' }}>
          <div>
            <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.22em', color: 'rgba(235,195,43,.55)', display: 'block', marginBottom: 4 }}>RANKING GLOBAL ACUMULADO</span>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(22px,3vw,32px)', color: '#fff', margin: '0 0 6px', letterSpacing: '.02em', lineHeight: 1 }}>Todas las apuestas</h2>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', margin: 0 }}>Suma de puntos de apuestas cerradas y finalizadas</p>
          </div>
          {!loading && (
            <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
              {meta.total > 0 && <BannerStat n={meta.total} label="Participantes" />}
              {meta.mi_posicion && <BannerStat n={`#${meta.mi_posicion.posicion}`} label="Tu pos." gold />}
              <button
                onClick={onRefresh}
                title="Actualizar ranking global"
                style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'rgba(255,255,255,.5)', display: 'flex', alignItems: 'center', alignSelf: 'flex-start' }}
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
          {/* Top 3 podio */}
          <Podio top={tabla.slice(0, 3)} miId={miId} apuesta={null} global />

          {/* Mi posición si no está en el top */}
          {!meta.esta_en_top && meta.mi_posicion && (
            <MiPosicion pos={meta.mi_posicion} />
          )}

          {/* Resto de participantes */}
          {tabla.length > 3 && (
            <OtrosParticipantes tabla={tabla} user={user} />
          )}

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 10, color: '#94a3b8', paddingTop: 12, borderTop: '1px solid #e8e3db', marginTop: 12 }}>
            <span>Seleccioná una apuesta del panel izquierdo para ver su ranking individual</span>
            {meta.total > 0 && <span>Mostrando top {Math.min(tabla.length, 50)} de {meta.total} participantes</span>}
          </div>
        </>
      )}

      {/* ── Ranking Top 5 Por región (plan_pro) ─────────── */}
      {isPro && (
        <div style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.22em', color: 'rgba(235,195,43,.7)' }}>
              RANKING Por región — TOP 5
            </span>
            <span style={{ flex: 1, height: 1, background: 'rgba(235,195,43,.15)' }} />
          </div>

          {areasIndividualLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(2)].map((_, i) => (
                <div key={i} className="rk-sk" style={{ height: 120, borderRadius: 12 }} />
              ))}
            </div>
          ) : areasIndividual.length === 0 ? (
            <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>
              Sin datos Por región todavía — aparecerá cuando haya apuestas cerradas o finalizadas con puntos calculados.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {areasIndividual.map((area) => (
                <AreaRankingCardUser key={area.area_id} area={area} miId={miId} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Tarjeta de ranking de área (versión usuario) ── */
function AreaRankingCardUser({ area, miId }) {
  const MEDALS = ['🥇', '🥈', '🥉']
  return (
    <div style={{
      background: '#fcfaf6',
      border: '1px solid #f0eadb',
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(12,24,43,.06)',
    }}>
      {/* Header del área */}
      <div style={{
        background: 'linear-gradient(135deg,#0c182b 0%,#1a2540 100%)',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ fontSize: 13 }}>🏢</span>
        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: '.06em', color: '#FF7D00', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {area.area_nombre || 'Sin nombre'}
        </span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,.35)', fontWeight: 600 }}>
          TOP {area.usuarios.length}
        </span>
      </div>
      {/* Lista de usuarios */}
      <div>
        {area.usuarios.map((u, idx) => {
          const esYo = u.user_id === miId
          return (
            <div key={u.user_id} style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr 52px',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderBottom: idx < area.usuarios.length - 1 ? '1px solid #f0eadb' : 'none',
              background: esYo ? 'rgba(255,125,0,.06)' : idx === 0 ? 'rgba(255,125,0,.02)' : 'transparent',
            }}>
              <span style={{ fontSize: idx < 3 ? 14 : 11, textAlign: 'center' }}>
                {MEDALS[idx] || <span style={{ fontWeight: 700, color: '#a8b2c4' }}>#{idx + 1}</span>}
              </span>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: esYo || idx === 0 ? 700 : 500, color: esYo ? '#FF7D00' : '#0c182b', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.nombre}{esYo && <span style={{ fontSize: 9, color: '#FF7D00', marginLeft: 4, fontWeight: 800 }}>(vos)</span>}
                </p>
                <p style={{ fontSize: 9, color: '#a8b2c4', margin: 0 }}>
                  #{u.posicion_global} global · {u.predicciones} pred
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: esYo ? '#FF7D00' : idx === 0 ? '#a85f00' : '#0c182b' }}>
                  {u.puntos_totales}
                </span>
                <span style={{ fontSize: 8, color: '#a8b2c4', display: 'block', lineHeight: 1 }}>pts</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
/* ══════════════════════════════════════════
   RANKING POR ÁREA — APUESTA INDIVIDUAL
══════════════════════════════════════════ */
function RankingPorAreaApuesta({ tablaArea, miId }) {
  const MEDALS = ['🥇', '🥈', '🥉']

  // Agrupar filas por área
  const grupos = useMemo(() => {
    const map = {}
    for (const row of tablaArea) {
      const areaKey = row.area_id || 'sin_area'
      const areaNombre = row.area_nombre_cache || 'Sin área'
      if (!map[areaKey]) map[areaKey] = { area_id: areaKey, area_nombre: areaNombre, usuarios: [] }
      map[areaKey].usuarios.push(row)
    }
    // Ordenar áreas por puntos del líder de cada área
    return Object.values(map).sort((a, b) =>
      (b.usuarios[0]?.puntos_totales || 0) - (a.usuarios[0]?.puntos_totales || 0)
    )
  }, [tablaArea])

  // Empezar con todas expandidas
  const [openAreas, setOpenAreas] = useState(new Set(grupos.map(g => g.area_id)))

  function toggle(areaId) {
    setOpenAreas(prev => {
      const next = new Set(prev)
      next.has(areaId) ? next.delete(areaId) : next.add(areaId)
      return next
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {grupos.map((grupo, gi) => {
        const isOpen = openAreas.has(grupo.area_id)
        const miArea = grupo.usuarios.some(u => u.user_id === miId)
        return (
          <div key={grupo.area_id} style={{
            background: '#fff',
            border: `1.5px solid ${miArea ? 'rgba(255,125,0,.25)' : '#f0eadb'}`,
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: miArea ? '0 2px 14px rgba(255,125,0,.08)' : '0 2px 8px rgba(12,24,43,.04)',
          }}>
            {/* Header del área */}
            <button
              onClick={() => toggle(grupo.area_id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '11px 14px',
                background: miArea ? 'rgba(255,125,0,.04)' : '#fcfaf6',
                border: 'none',
                cursor: 'pointer',
                borderBottom: isOpen ? '1px solid #f0eadb' : 'none',
              }}
            >
              <span style={{ fontSize: gi < 3 ? 16 : 12, width: 22, textAlign: 'center', flexShrink: 0 }}>
                {MEDALS[gi] || <span style={{ fontWeight: 700, color: '#a8b2c4' }}>#{gi + 1}</span>}
              </span>
              <span style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 15,
                letterSpacing: '.05em',
                color: miArea ? '#FF7D00' : '#0c182b',
                flex: 1,
                textAlign: 'left',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {grupo.area_nombre}
              </span>
              {miArea && (
                <span style={{ fontSize: 9, fontWeight: 800, color: '#FF7D00', background: 'rgba(255,125,0,.1)', border: '1px solid rgba(255,125,0,.2)', borderRadius: 99, padding: '2px 7px', flexShrink: 0 }}>
                  TU ÁREA
                </span>
              )}
              <span style={{ fontSize: 11, color: '#a8b2c4', flexShrink: 0 }}>
                {grupo.usuarios.length} {grupo.usuarios.length === 1 ? 'participante' : 'participantes'}
              </span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a8b2c4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Lista de usuarios del área */}
            {isOpen && (
              <div>
                {grupo.usuarios.map((u, idx) => {
                  const esYo = u.user_id === miId
                  return (
                    <div key={u.user_id} style={{
                      display: 'grid',
                      gridTemplateColumns: '32px 1fr 56px 56px',
                      alignItems: 'center',
                      gap: 8,
                      padding: '9px 14px',
                      borderBottom: idx < grupo.usuarios.length - 1 ? '1px solid #f5f3ee' : 'none',
                      background: esYo ? 'rgba(255,125,0,.05)' : 'transparent',
                    }}>
                      <span style={{ fontSize: idx < 3 ? 14 : 11, textAlign: 'center' }}>
                        {MEDALS[idx] || <span style={{ fontWeight: 700, color: '#a8b2c4' }}>#{u.posicion_en_area}</span>}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: esYo ? 700 : 500, color: esYo ? '#FF7D00' : '#0c182b', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.nombre}{esYo && <span style={{ fontSize: 9, marginLeft: 4, fontWeight: 800, color: '#FF7D00' }}>(vos)</span>}
                        </p>
                        <p style={{ fontSize: 9, color: '#a8b2c4', margin: 0 }}>
                          #{u.posicion} gral · {u.predicciones || 0} pred
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: u.aciertos_exactos > 0 ? '#1b8a5a' : '#cbd5e1' }}>
                          {u.aciertos_exactos || 0}✓
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: esYo ? '#FF7D00' : idx === 0 ? '#a85f00' : '#0c182b' }}>
                          {u.puntos_totales}
                        </span>
                        <span style={{ fontSize: 8, color: '#a8b2c4', display: 'block', lineHeight: 1 }}>pts</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function SinParticipantes() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', background: '#fff', borderRadius: 14, border: '1.5px solid #f0eadb' }}>
      <p style={{ fontWeight: 700, color: '#5f6e8a', margin: '0 0 6px', fontSize: 15 }}>Sin participantes todavía</p>
      <p style={{ fontSize: 12, color: '#a8b2c4', margin: 0, lineHeight: 1.6 }}>Las predicciones aparecerán cuando los participantes las carguen</p>
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
   OTROS PARTICIPANTES — Con toggle
══════════════════════════════════════════ */
function OtrosParticipantes({ tabla, user }) {
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
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em', color: '#a8b2c4' }}>
            Otros participantes
          </span>
          <span style={{ fontSize: 8, fontWeight: 700, background: 'rgba(12,24,43,.05)', color: '#a8b2c4', padding: '1px 6px', borderRadius: 4 }}>
            +{otros.length}
          </span>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,#f0eadb,transparent)', marginLeft: 8 }} />
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a8b2c4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: 'transform .2s', transform: exp ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0, marginLeft: 8 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {exp && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 12 }}>
          {otros.map((u, idx) => (
            <div key={u.user_id} style={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr 64px 56px',
              gap: 10,
              padding: '9px 12px',
              background: u.user_id === user?.id ? 'rgba(255,125,0,.1)' : '#fff',
              border: u.user_id === user?.id ? '1.5px solid #FF7D00' : '1px solid #f5f3ee',
              boxShadow: u.user_id === user?.id ? '0 0 0 1px rgba(255,125,0,.3), 0 2px 8px rgba(255,125,0,.12)' : 'none',
              borderRadius: 10,
              alignItems: 'center',
              transition: 'all .15s',
            }}
              onMouseEnter={e => {
                if (u.user_id !== user?.id) {
                  e.currentTarget.style.background = '#fcfaf6'
                  e.currentTarget.style.borderColor = '#f0eadb'
                }
              }}
              onMouseLeave={e => {
                if (u.user_id !== user?.id) {
                  e.currentTarget.style.background = '#fff'
                  e.currentTarget.style.borderColor = '#f5f3ee'
                }
              }}>

              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: '#a8b2c4', textAlign: 'center' }}>#{idx + 4}</span>

              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: u.user_id === user?.id ? 700 : 500, fontSize: 11, color: u.user_id === user?.id ? '#FF7D00' : '#0c182b', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.nombre}
                  {u.user_id === user?.id && (
                    <span style={{
                      fontSize: 8,
                      color: '#FF7D00',
                      marginLeft: 6,
                      fontWeight: 700,
                      background: 'rgba(255,125,0,.15)',
                      border: '1px solid rgba(255,125,0,.3)',
                      padding: '1px 5px',
                      borderRadius: 3,
                      textTransform: 'uppercase',
                      letterSpacing: '.05em'
                    }}>
                      (vos)
                    </span>
                  )}
                </p>
                <p style={{ fontSize: 8, color: '#a8b2c4', margin: 0 }}>{u.predicciones} pred</p>
              </div>

              <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-start' }}>
                {[{ v: u.aciertos_exactos, c: '#1b8a5a' }, { v: u.aciertos_diferencia || 0, c: '#FF7D00' }].map((x, i) => (
                  x.v > 0 && (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 5, background: `${x.c}12`, border: `1px solid ${x.c}25`, fontSize: 9, fontWeight: 600, color: x.c }}>{x.v}</span>
                  )
                ))}
              </div>

              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, fontWeight: 700, color: '#0c182b', textAlign: 'right' }}>{u.puntos_totales}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}