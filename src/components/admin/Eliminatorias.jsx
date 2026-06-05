import { useState, useMemo, useEffect } from 'react'
import sheetsApi from '../../services/sheetsApi.js'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useToast } from '../../hooks/useToast.jsx'
import { fmtFecha, inputLocalAIsoUtc } from '../../utils/index.js'

/* ── Constantes ─────────────────────────────────────────── */
const INITIAL = { titulo: '', type: 'libre', premio: '', fecha_cierre: '', partidos_ids: [], areas_ids: [] }

// ✅ Mundial 2026 tiene 48 equipos: Fase de Grupos → 16avos (32 equipos) → Octavos (16 equipos) → etc.
const ORDEN_FASES = ['grupos', '16avos', 'octavos', 'cuartos', 'semis', '3er_puesto', 'final']
const LABEL_FASE = {
  grupos: 'Fase de Grupos', 
  '16avos': 'Dieciseisavos de Final', 
  octavos: 'Octavos de Final',
  cuartos: 'Cuartos de Final', 
  semis: 'Semifinales', 
  '3er_puesto': 'Tercer y Cuarto Puesto', 
  final: 'Final'
}

function isTBD(m) {
  return !m.equipo_local || !m.equipo_visitante ||
    m.equipo_local === 'TBD' || m.equipo_visitante === 'TBD' ||
    m.codigo_local === 'TBD' || m.codigo_visitante === 'TBD'
}

function estaDisponible(m) { return true }

function partidoYaTerminado(partido) {
  if (!partido.fecha_partido) return false
  const fechaPartido = new Date(partido.fecha_partido)
  const ahora = new Date()
  const partidoTerminado = new Date(fechaPartido.getTime() + (2 * 60 * 60 * 1000))
  return ahora >= partidoTerminado
}

function faseYaTerminada(partidos, fase) {
  const partidosDeFase = partidos.filter(p => p.fase === fase)
  if (partidosDeFase.length === 0) return false
  return partidosDeFase.every(p => partidoYaTerminado(p) || p.estado === 'finalizado')
}

/* ── Sub-componentes de UI internos ─────────────────────── */
function Field({ label, error, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-body font-bold text-xs uppercase tracking-widest"
        style={{ color: error ? '#e03252' : '#4a6b50' }}>
        {label}
      </label>
      <input
        {...props}
        className="w-full px-3 py-2.5 rounded-xl font-body text-sm outline-none transition-all"
        style={{ 
          background: '#fff', 
          border: `1px solid ${error ? '#e03252' : '#b8c0cc'}`, 
          color: '#111811' 
        }}
        onFocus={e => {
          e.target.style.borderColor = error ? '#e03252' : '#86C873'
          e.target.style.boxShadow = error 
            ? '0 0 0 3px rgba(224,50,82,.12)' 
            : '0 0 0 3px rgba(134,200,115,.12)'
        }}
        onBlur={e => {
          e.target.style.borderColor = error ? '#e03252' : '#b8c0cc'
          e.target.style.boxShadow = 'none'
        }}
      />
      {error && (
        <span className="font-body text-xs" style={{ color: '#e03252' }}>
          {error}
        </span>
      )}
    </div>
  )
}

function FilterChip({ active, onClick, children, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="px-2.5 py-1 rounded-full font-body font-semibold transition-all whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        fontSize: 11,
        background: active ? '#111811' : '#fff',
        border: `1px solid ${active ? '#111811' : '#b8c0cc'}`,
        color: active ? '#86C873' : '#4a6b50',
      }}
      onMouseEnter={e => { if (!active && !disabled) { e.currentTarget.style.borderColor = '#111811'; e.currentTarget.style.color = '#111811' } }}
      onMouseLeave={e => { if (!active && !disabled) { e.currentTarget.style.borderColor = '#b8c0cc'; e.currentTarget.style.color = '#4a6b50' } }}
    >
      {children}
    </button>
  )
}

/* ── Componente principal ───────────────────────────────── */
export default function CreateBetForm({ onSubmit, loading, matches = [] }) {
  const { isPro } = useAuth()
  const { toast } = useToast()
  const [form, setForm] = useState(INITIAL)
  const [areas, setAreas] = useState([])
  const [filtroFase, setFiltroFase] = useState('todas')
  const [filtroJornada, setFiltroJornada] = useState('todas')
  const [filtroGrupo, setFiltroGrupo] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [errorFecha, setErrorFecha] = useState('')

  useEffect(() => {
    sheetsApi.areas.listar(true).then(res => setAreas(res.areas || [])).catch(console.error)
  }, [])

  const partidosDisponibles = useMemo(
    () => matches.filter(m => estaDisponible(m)),
    [matches]
  )

  const fasesDisponibles = useMemo(() => {
    const set = new Set(partidosDisponibles.map(m => m.fase).filter(Boolean))
    return ORDEN_FASES.filter(f => set.has(f))
  }, [partidosDisponibles])

  const gruposDisponibles = useMemo(() => {
    const rel = filtroFase === 'todas' ? partidosDisponibles : partidosDisponibles.filter(m => m.fase === filtroFase)
    return [...new Set(rel.map(m => m.grupo).filter(Boolean))].sort()
  }, [partidosDisponibles, filtroFase])

  const jornadasDisponibles = useMemo(() => {
    const rel = filtroFase === 'todas' ? partidosDisponibles : partidosDisponibles.filter(m => m.fase === filtroFase)
    return [...new Set(rel.map(m => m.jornada).filter(j => j !== '' && j !== null && j !== undefined).map(String))].sort()
  }, [partidosDisponibles, filtroFase])

  const partidosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return partidosDisponibles.filter(m => {
      if (filtroFase !== 'todas' && m.fase !== filtroFase) return false
      if (filtroJornada !== 'todas' && String(m.jornada) !== filtroJornada) return false
      if (filtroGrupo !== 'todos' && m.grupo !== filtroGrupo) return false
      if (q && !(`${m.equipo_local} ${m.equipo_visitante}`.toLowerCase().includes(q))) return false
      return true
    })
  }, [partidosDisponibles, filtroFase, filtroJornada, filtroGrupo, busqueda])

  const agrupados = useMemo(() => {
    const map = {}
    partidosFiltrados.forEach(m => {
      const f = m.fase || 'otros'
      const j = m.jornada ? `Jornada ${m.jornada}` : ''
      const g = m.grupo ? `Grupo ${m.grupo}` : ''
      const key = `${f}|${j}|${g}`
      if (!map[key]) map[key] = { fase: f, jornada: j, grupo: g, partidos: [] }
      map[key].partidos.push(m)
    })
    const order = new Map(ORDEN_FASES.map((f, i) => [f, i]))
    return Object.values(map).sort((a, b) => {
      const oa = order.get(a.fase) ?? 99, ob = order.get(b.fase) ?? 99
      if (oa !== ob) return oa - ob
      if (a.jornada !== b.jornada) return a.jornada.localeCompare(b.jornada)
      return a.grupo.localeCompare(b.grupo)
    })
  }, [partidosFiltrados])

  const seleccionados = form.partidos_ids.length

  useEffect(() => {
    if (!form.fecha_cierre || form.partidos_ids.length === 0) {
      setErrorFecha('')
      return
    }

    const fechaLimite = new Date(form.fecha_cierre)
    const partidosSeleccionados = partidosDisponibles.filter(m => form.partidos_ids.includes(m.id))
    
    const partidoMasTemprano = partidosSeleccionados.reduce((earliest, current) => {
      const currentDate = new Date(current.fecha_partido)
      const earliestDate = new Date(earliest.fecha_partido)
      return currentDate < earliestDate ? current : earliest
    }, partidosSeleccionados[0])

    const fechaPrimerPartido = new Date(partidoMasTemprano.fecha_partido)

    if (fechaLimite >= fechaPrimerPartido) {
      setErrorFecha(`La fecha límite debe ser ANTES del ${fmtFecha(partidoMasTemprano.fecha_partido)} (${partidoMasTemprano.equipo_local} vs ${partidoMasTemprano.equipo_visitante})`)
    } else {
      setErrorFecha('')
    }
  }, [form.fecha_cierre, form.partidos_ids, partidosDisponibles])

  function toggleMatch(id) {
    setForm(prev => ({
      ...prev,
      partidos_ids: prev.partidos_ids.includes(id)
        ? prev.partidos_ids.filter(x => x !== id)
        : [...prev.partidos_ids, id]
    }))
  }

  function toggleVisibles() {
    const ids = partidosFiltrados.map(m => m.id)
    const todos = ids.every(id => form.partidos_ids.includes(id))
    setForm(prev => ({
      ...prev,
      partidos_ids: todos
        ? prev.partidos_ids.filter(id => !ids.includes(id))
        : [...new Set([...prev.partidos_ids, ...ids])]
    }))
  }

  function limpiarSeleccion() { 
    setForm(prev => ({ ...prev, partidos_ids: [] }))
    setErrorFecha('')
  }

  function handleChangeFase(f) { 
    setFiltroFase(f)
    setFiltroJornada('todas')
    setFiltroGrupo('todos')
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (form.partidos_ids.length === 0) {
      toast.error('Seleccioná al menos un partido para la apuesta.')
      return
    }

    if (errorFecha) {
      toast.error('Corregí la fecha límite antes de continuar.')
      return
    }

    try {
      const payload = {
        titulo: form.titulo,
        tipo: form.type,
        premio: form.premio,
        fecha_cierre: inputLocalAIsoUtc(form.fecha_cierre),
        partidos_ids: form.partidos_ids.join(',')
      }
      if (isPro && form.type === 'grupos') {
        if (form.areas_ids.length < 2) { 
          toast.error('Para apuestas por áreas seleccioná al menos 2 áreas.')
          return 
        }
        payload.areas_ids = form.areas_ids.join(',')
      }
      await onSubmit(payload)
      toast.success('Apuesta creada exitosamente')
      setForm(INITIAL)
      setFiltroFase('todas')
      setFiltroJornada('todas')
      setFiltroGrupo('todos')
      setBusqueda('')
      setErrorFecha('')
    } catch (err) { 
      toast.error('Error al crear apuesta: ' + err.message) 
    }
  }

  const canSubmit = !loading && seleccionados > 0 && !errorFecha

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* Título + Tipo en una fila */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        <Field
          label="Título de la apuesta"
          value={form.titulo}
          onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
          required
          placeholder="Ej: Fase de grupos · Jornada 1"
        />

        {/* Tipo — solo Plan Pro */}
        {isPro && (
          <div className="flex flex-col gap-1.5">
            <span className="font-body font-bold text-xs uppercase tracking-widest" style={{ color: '#4a6b50' }}>
              Tipo
            </span>
            <div className="flex gap-2">
              {['libre', 'grupos'].map(t => {
                const active = form.type === t
                return (
                  <button key={t} type="button"
                    onClick={() => setForm(p => ({ ...p, type: t }))}
                    className="flex-1 py-2.5 rounded-xl font-body font-semibold text-sm transition-all"
                    style={{
                      background: active ? '#111811' : '#fff',
                      border: `1px solid ${active ? '#111811' : '#b8c0cc'}`,
                      color: active ? '#86C873' : '#4a6b50',
                    }}>
                    {t === 'grupos' ? 'Por Áreas' : 'Libre'}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Áreas — solo Plan Pro y tipo grupos */}
      {isPro && form.type === 'grupos' && (
        <div className="flex flex-col gap-2 p-3 rounded-xl"
          style={{ border: '1px solid rgba(134,200,115,.25)', background: 'rgba(134,200,115,.04)' }}>
          <span className="font-body font-bold text-xs uppercase tracking-widest" style={{ color: '#4a6b50' }}>
            Áreas participantes (Mín. 2)
          </span>
          <div className="flex flex-wrap gap-2">
            {areas.map(a => {
              const active = form.areas_ids.includes(a.id)
              return (
                <FilterChip key={a.id} active={active}
                  onClick={() => setForm(p => ({
                    ...p,
                    areas_ids: active
                      ? p.areas_ids.filter(id => id !== a.id)
                      : [...p.areas_ids, a.id]
                  }))}>
                  {a.nombre}
                </FilterChip>
              )
            })}
          </div>
        </div>
      )}

      {/* Partidos */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-body font-bold text-xs uppercase tracking-widest" style={{ color: '#4a6b50' }}>
            Partidos
          </span>
          <span className="font-body text-xs" style={{ color: '#8aaa8e' }}>
            <span className="font-bold" style={{ color: '#5A9E4A' }}>{seleccionados}</span>
            {' / '}{partidosDisponibles.length} seleccionados
          </span>
        </div>

        {/* Filtros de Fase - ahora en 4 columnas */}
        {fasesDisponibles.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="font-body font-semibold text-xs uppercase tracking-wider"
              style={{ color: '#8aaa8e' }}>Fases</span>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleChangeFase('todas')}
                className="px-3 py-2 rounded-lg font-body font-semibold text-sm transition-all"
                style={{
                  background: filtroFase === 'todas' ? '#111811' : '#fff',
                  border: `1px solid ${filtroFase === 'todas' ? '#111811' : '#b8c0cc'}`,
                  color: filtroFase === 'todas' ? '#86C873' : '#4a6b50',
                }}
              >
                Todas las fases
              </button>
              {fasesDisponibles.map(f => {
                const terminada = faseYaTerminada(partidosDisponibles, f)
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => handleChangeFase(f)}
                    className="px-3 py-2 rounded-lg font-body font-semibold text-sm transition-all relative"
                    style={{
                      background: filtroFase === f ? '#111811' : '#fff',
                      border: `1px solid ${filtroFase === f ? '#111811' : '#b8c0cc'}`,
                      color: filtroFase === f ? '#86C873' : '#4a6b50',
                    }}
                  >
                    {LABEL_FASE[f] || f}
                    {terminada && (
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full font-body font-bold uppercase"
                        style={{ 
                          fontSize: 8, 
                          background: '#e03252', 
                          color: '#fff',
                          letterSpacing: '.05em'
                        }}>
                        Finalizada
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Filtros de Jornada y Grupo en una fila */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {jornadasDisponibles.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-body font-semibold uppercase w-14"
                style={{ fontSize: 10, color: '#8aaa8e', letterSpacing: '.1em' }}>Jornada</span>
              <FilterChip active={filtroJornada === 'todas'} onClick={() => setFiltroJornada('todas')}>Todas</FilterChip>
              {jornadasDisponibles.map(j => (
                <FilterChip key={j} active={filtroJornada === j} onClick={() => setFiltroJornada(j)}>{j}</FilterChip>
              ))}
            </div>
          )}

          {gruposDisponibles.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-body font-semibold uppercase w-14"
                style={{ fontSize: 10, color: '#8aaa8e', letterSpacing: '.1em' }}>Grupo</span>
              <FilterChip active={filtroGrupo === 'todos'} onClick={() => setFiltroGrupo('todos')}>Todos</FilterChip>
              {gruposDisponibles.map(g => (
                <FilterChip key={g} active={filtroGrupo === g} onClick={() => setFiltroGrupo(g)}>{g}</FilterChip>
              ))}
            </div>
          )}
        </div>

        {/* Búsqueda */}
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar equipo..."
          className="w-full px-3 py-2 rounded-xl font-body text-sm outline-none transition-all"
          style={{ background: '#fff', border: '1px solid #b8c0cc', color: '#111811' }}
          onFocus={e => { e.target.style.borderColor = '#86C873'; e.target.style.boxShadow = '0 0 0 3px rgba(134,200,115,.12)' }}
          onBlur={e => { e.target.style.borderColor = '#b8c0cc'; e.target.style.boxShadow = 'none' }}
        />

        {/* Acciones */}
        <div className="flex items-center justify-between gap-2 text-xs font-body">
          <button type="button" onClick={toggleVisibles} disabled={partidosFiltrados.length === 0}
            className="transition-colors disabled:opacity-40" style={{ color: '#5A9E4A' }}
            onMouseEnter={e => { if (partidosFiltrados.length > 0) e.currentTarget.style.color = '#86C873' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#5A9E4A' }}>
            {partidosFiltrados.every(m => form.partidos_ids.includes(m.id)) && partidosFiltrados.length > 0
              ? `✕ Deseleccionar visibles (${partidosFiltrados.length})`
              : `✓ Seleccionar visibles (${partidosFiltrados.length})`}
          </button>
          {seleccionados > 0 && (
            <button type="button" onClick={limpiarSeleccion}
              className="transition-colors" style={{ color: '#8aaa8e' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#e03252' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#8aaa8e' }}>
              Limpiar selección
            </button>
          )}
        </div>

        {/* Lista de partidos - más alta */}
        <div className="max-h-80 overflow-y-auto rounded-xl"
          style={{ 
            border: '1px solid rgba(134,200,115,0.2)', 
            boxShadow: '0 4px 16px rgba(17,24,17,0.03)' 
          }}>
          <div className="max-h-80 overflow-y-auto"
            style={{ 
              background: '#fff',
              scrollbarWidth: 'thin',
              scrollbarColor: '#86C873 transparent'
            }}>
            {agrupados.length === 0 ? (
              <p className="font-body text-xs text-center p-4" style={{ color: '#8aaa8e' }}>
                No hay partidos que coincidan.
              </p>
            ) : agrupados.map(gr => {
              const header = [LABEL_FASE[gr.fase] || gr.fase, gr.jornada, gr.grupo].filter(Boolean).join(' · ')
              return (
                <div key={`${gr.fase}-${gr.jornada}-${gr.grupo}`}>
                  {/* Header de grupo */}
                  <div className="sticky top-0 z-10 px-4 py-2.5 flex items-center justify-between backdrop-blur-md"
                    style={{ 
                      background: 'rgba(10, 15, 10, 0.94)', 
                      borderBottom: '1px solid rgba(134,200,115,0.15)',
                    }}>
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-md flex items-center justify-center font-body font-extrabold text-[10px]"
                        style={{ background: '#86C873', color: '#0a0f0a', boxShadow: '0 2px 6px rgba(134,200,115,0.2)' }}>
                        {gr.partidos.length}
                      </span>
                      <span className="font-body font-extrabold uppercase text-[10px] tracking-widest"
                        style={{ color: '#86C873' }}>
                        {header}
                      </span>
                    </div>
                  </div>

                  {gr.partidos.map(m => {
                    const checked = form.partidos_ids.includes(m.id)
                    return (
                      <label key={m.id}
                        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all border-b border-gray-100"
                        style={{
                          background: checked ? 'rgba(134,200,115,0.05)' : '#fff',
                          boxShadow: checked ? 'inset 3px 0 0 #86C873' : 'none',
                        }}
                        onMouseEnter={e => { if (!checked) e.currentTarget.style.background = '#f9fbf8' }}
                        onMouseLeave={e => { if (!checked) e.currentTarget.style.background = '#fff' }}
                      >
                        <span className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200"
                          style={{
                            border: `1.5px solid ${checked ? '#86C873' : '#b8c0cc'}`,
                            background: checked ? '#86C873' : '#fff',
                            boxShadow: checked ? '0 2px 6px rgba(134,200,115,0.35)' : 'none',
                            transform: checked ? 'scale(1.05)' : 'scale(1)',
                          }}>
                          {checked && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0a0f0a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleMatch(m.id)}
                          className="sr-only"
                        />
                        {/* Equipos */}
                        <div className="flex-1 flex items-center justify-center min-w-0 gap-1 sm:gap-2">
                          {/* Local */}
                          <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                            <span className="hidden sm:inline font-body font-bold text-xs uppercase tracking-wider text-[#111811] truncate text-right">
                              {m.equipo_local}
                            </span>
                            {m.bandera_local && (
                              <img src={m.bandera_local} alt="" 
                                className="w-7 h-5 object-cover rounded shadow-sm border border-gray-100 flex-shrink-0" />
                            )}
                          </div>
                          
                          {/* VS separator */}
                          <div className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#e2eede] text-[#4a6b50] mx-0.5 sm:mx-1 select-none">
                            vs
                          </div>
                          
                          {/* Visitante */}
                          <div className="flex-1 flex items-center justify-start gap-2 min-w-0">
                            {m.bandera_visitante && (
                              <img src={m.bandera_visitante} alt="" 
                                className="w-7 h-5 object-cover rounded shadow-sm border border-gray-100 flex-shrink-0" />
                            )}
                            <span className="hidden sm:inline font-body font-bold text-xs uppercase tracking-wider text-[#111811] truncate">
                              {m.equipo_visitante}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-body font-semibold px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 uppercase tracking-wider transition-colors"
                          style={{ 
                            background: 'rgba(95,110,138,0.05)', 
                            color: '#8aaa8e',
                            border: '1px solid rgba(95,110,138,0.1)'
                          }}>
                          {fmtFecha(m.fecha_partido)}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Premio + Fecha */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field
          label="Premio / Incentivo"
          value={form.premio}
          onChange={e => setForm(p => ({ ...p, premio: e.target.value }))}
          required
          placeholder="Ej: Gift card $50"
        />
        <Field
          label="Fecha límite (debe ser ANTES del primer partido)"
          type="datetime-local"
          value={form.fecha_cierre}
          onChange={e => setForm(p => ({ ...p, fecha_cierre: e.target.value }))}
          error={errorFecha}
          required
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full mt-1 py-3.5 rounded-full font-body font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: canSubmit ? '#111811' : 'rgba(17,24,17,.2)',
          color: canSubmit ? '#86C873' : '#8aaa8e',
          boxShadow: canSubmit ? '0 4px 16px rgba(17,24,17,.2)' : 'none',
        }}
        onMouseEnter={e => { if (canSubmit) { e.currentTarget.style.background = '#263328'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
        onMouseLeave={e => { if (canSubmit) { e.currentTarget.style.background = '#111811'; e.currentTarget.style.transform = '' } }}
      >
        {loading
          ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Creando...</>
          : <>Crear Apuesta{seleccionados > 0 && ` · ${seleccionados} partidos`}</>
        }
      </button>
    </form>
  )
}