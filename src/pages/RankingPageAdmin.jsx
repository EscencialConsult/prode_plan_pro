/**
 * RankingPageAdmin.jsx — Versión ADMIN CON FIX
 * Ubicación: src/pages/RankingPageAdmin.jsx
 *
 * CAMBIO: PrediccionRow ahora usa pred.puntos del backend
 */
import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import AppShell from '../dashboard/AppShell.jsx'
import { useBets } from '../hooks/useBets.jsx'
import { useAuth } from '../hooks/useAuth.jsx'
import sheetsApi from '../services/sheetsApi.js'
import { useToast } from '../hooks/useToast.jsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
.rk-sidebar-scroll { overflow-y:auto;flex:1 }
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

/* Tabs Por región */
.rk-tab { padding:7px 18px;border:none;background:transparent;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;color:#94a3b8;border-bottom:2.5px solid transparent;transition:color .15s,border-color .15s;white-space:nowrap }
.rk-tab.active { color:#0c182b;border-bottom-color:#ebc32b }
.rk-tab:hover:not(.active) { color:#0c182b }
.rk-area-header { display:flex;align-items:center;gap:8px;padding:10px 0 6px;margin-top:4px }
.rk-area-row { display:grid;grid-template-columns:40px 1fr 80px;align-items:center;gap:8px;padding:9px 14px;border-bottom:1px solid #f5f3ee;transition:background .12s }
.rk-area-row:hover { background:rgba(12,24,43,.025) }
.rk-area-row.me { background:rgba(255,125,0,.04) }

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
  const { user, isPro } = useAuth()
  const { toast } = useToast()

  const [sel, setSel] = useState(null)
  const [tabla, setTabla] = useState([])
  const [meta, setMeta] = useState({})
  const [loading, setLoading] = useState(false)

  const [expandedUser, setExpandedUser] = useState(null)
  const [predicciones, setPredicciones] = useState({})
  const [loadingUser, setLoadingUser] = useState(null)

  // ── Tab Por región (solo apuestas libre) ──
  const [tabActivo, setTabActivo] = useState('individual') // 'individual' | 'por_area'
  const [tablaArea, setTablaArea] = useState([])
  const [loadingArea, setLoadingArea] = useState(false)

  // ── Modal de Ranking Completo por Área ──
  const [modalArea, setModalArea] = useState(null) // { area_id, area_nombre }
  const [modalTabla, setModalTabla] = useState([])
  const [modalLoading, setModalLoading] = useState(false)

  // ── Multi-bet accumulated ranking states ──
  const [selectedIds, setSelectedIds] = useState([])
  const [loadingCustom, setLoadingCustom] = useState(false)
  const [customTabla, setCustomTabla] = useState([])
  const [customMeta, setCustomMeta] = useState({})
  const [customTablaArea, setCustomTablaArea] = useState([])
  const [customAreasIndividual, setCustomAreasIndividual] = useState([])

  useEffect(() => {
    const allSelected = bets.length > 0 && selectedIds.length === bets.length
    if (selectedIds.length > 1 && !allSelected) {
      cargarRankingAcumulado(selectedIds)
    } else if (selectedIds.length === 1) {
      const bet = bets.find(b => b.id === selectedIds[0])
      if (bet) {
        cargarRanking(bet)
      }
    } else {
      // 0 seleccionadas o TODAS seleccionadas → mostrar ranking global precalculado
      setSel(null)
      setTabla([])
      setMeta({})
      setTabActivo('individual')
      setTablaArea([])
    }
  }, [selectedIds, bets])

  function handleToggleBet(betId) {
    setSelectedIds(prev => {
      if (prev.includes(betId)) {
        return prev.filter(id => id !== betId)
      } else {
        return [...prev, betId]
      }
    })
  }

  function handleSelectAll() {
    setSelectedIds(prev => {
      if (prev.length === bets.length) {
        return []
      } else {
        return bets.map(b => b.id)
      }
    })
  }

  async function cargarRankingAcumulado(ids) {
    setLoadingCustom(true)
    setSel({
      id: 'accumulated',
      titulo: ids.length === bets.length ? 'TODAS LAS APUESTAS' : 'APUESTAS SELECCIONADAS',
      tipo: 'libre',
      isAccumulated: true,
    })
    setTabActivo('individual')
    setCustomTabla([])
    setCustomMeta([])
    setCustomTablaArea([])
    setCustomAreasIndividual([])

    try {
      // Consultas en paralelo para evitar el límite de 1000 filas de PostgREST
      const queries = ids.map(id =>
        sheetsApi._supabase
          .from('ranking_cache')
          .select('user_id, nombre, area_id, area_nombre_cache, puntos_totales, aciertos_exactos, aciertos_diferencia, aciertos_resultado, predicciones')
          .eq('apuesta_id', id)
          .eq('es_grupal', false)
      )
      const results = await Promise.all(queries)

      const data = []
      for (const r of results) {
        if (r.error) throw r.error
        if (r.data) data.push(...r.data)
      }

      const userMap = new Map()
      ;(data || []).forEach(row => {
        const uid = row.user_id
        if (!uid) return
        if (!userMap.has(uid)) {
          userMap.set(uid, {
            user_id: uid,
            nombre: row.nombre || 'Sin nombre',
            area_id: row.area_id,
            area_nombre_cache: row.area_nombre_cache || 'Sin área',
            puntos_totales: 0,
            aciertos_exactos: 0,
            aciertos_diferencia: 0,
            aciertos_resultado: 0,
            predicciones: 0,
          })
        }
        const accum = userMap.get(uid)
        accum.puntos_totales += (parseInt(row.puntos_totales) || 0)
        accum.aciertos_exactos += (parseInt(row.aciertos_exactos) || 0)
        accum.aciertos_diferencia += (parseInt(row.aciertos_diferencia) || 0)
        accum.aciertos_resultado += (parseInt(row.aciertos_resultado) || 0)
        accum.predicciones += (parseInt(row.predicciones) || 0)
      })

      const userList = Array.from(userMap.values())
      userList.sort((a, b) => {
        if (b.puntos_totales !== a.puntos_totales) return b.puntos_totales - a.puntos_totales
        if (b.aciertos_exactos !== a.aciertos_exactos) return b.aciertos_exactos - a.aciertos_exactos
        if (b.aciertos_diferencia !== a.aciertos_diferencia) return b.aciertos_diferencia - a.aciertos_diferencia
        if (b.aciertos_resultado !== a.aciertos_resultado) return b.aciertos_resultado - a.aciertos_resultado
        return a.nombre.localeCompare(b.nombre)
      })

      userList.forEach((u, idx) => {
        u.posicion = idx + 1
      })

      const miId = user?.id || user?.user_id
      const miPos = userList.find(u => u.user_id === miId) || null

      setCustomTabla(userList)
      setCustomMeta({
        total: userList.length,
        mi_posicion: miPos,
        esta_en_top: miPos ? miPos.posicion <= 50 : false
      })

      const areaGrouped = {}
      userList.forEach(u => {
        const areaId = u.area_id || 'sin_area'
        if (!areaGrouped[areaId]) {
          areaGrouped[areaId] = []
        }
        areaGrouped[areaId].push(u)
      })

      const listArea = []
      Object.keys(areaGrouped).forEach(areaId => {
        const arr = areaGrouped[areaId]
        arr.forEach((u, localIdx) => {
          listArea.push({
            user_id: u.user_id,
            nombre: u.nombre,
            area_id: u.area_id,
            area_nombre_cache: u.area_nombre_cache,
            puntos_totales: u.puntos_totales,
            posicion: u.posicion,
            posicion_en_area: localIdx + 1,
            aciertos_exactos: u.aciertos_exactos,
            aciertos_diferencia: u.aciertos_diferencia,
            aciertos_resultado: u.aciertos_resultado,
            predicciones: u.predicciones,
          })
        })
      })

      setCustomTablaArea(listArea)

      // Generate customAreasIndividual
      const porArea = {}
      userList.forEach(row => {
        if (!row.area_id) return
        if (!porArea[row.area_id]) {
          porArea[row.area_id] = { area_id: row.area_id, area_nombre: row.area_nombre_cache, usuarios: [] }
        }
        if (porArea[row.area_id].usuarios.length < 5) {
          porArea[row.area_id].usuarios.push({
            user_id: row.user_id,
            nombre: row.nombre,
            puntos_totales: row.puntos_totales,
            posicion_global: row.posicion,
            aciertos_exactos: row.aciertos_exactos || 0,
            aciertos_diferencia: row.aciertos_diferencia || 0,
            aciertos_resultado: row.aciertos_resultado || 0,
            predicciones: row.predicciones || 0,
          })
        }
      })

      const areasList = Object.values(porArea)
        .filter(a => a.usuarios.length > 0)
        .sort((a, b) => (b.usuarios[0]?.puntos_totales || 0) - (a.usuarios[0]?.puntos_totales || 0))

      setCustomAreasIndividual(areasList)

    } catch (err) {
      toast.error('Error al calcular ranking acumulado: ' + err.message)
    } finally {
      setLoadingCustom(false)
    }
  }

  async function abrirModalArea(area) {
    setModalArea(area)
    if (selectedIds.length > 1) {
      const filtered = customTabla
        .filter(u => u.area_id === area.area_id)
        .map((u, idx) => ({
          user_id: u.user_id,
          nombre: u.nombre,
          area_id: u.area_id,
          puntos_totales: u.puntos_totales,
          posicion: u.posicion,
          aciertos_exactos: u.aciertos_exactos,
          aciertos_diferencia: u.aciertos_diferencia,
          aciertos_resultado: u.aciertos_resultado,
          predicciones: u.predicciones,
          posicion_en_area: idx + 1,
        }))
      setModalTabla(filtered)
      setModalLoading(false)
    } else {
      setModalLoading(true)
      setModalTabla([])
      try {
        const { data, error } = await sheetsApi._supabase
          .from('ranking_global_cache')
          .select('user_id, nombre, area_id, puntos_totales, posicion, aciertos_exactos, aciertos_diferencia, aciertos_resultado, predicciones')
          .eq('area_id', area.area_id)
          .order('posicion', { ascending: true })
        if (error) throw error
        setModalTabla(data || [])
      } catch (e) {
        toast.error('Error al cargar ranking completo: ' + e.message)
      } finally {
        setModalLoading(false)
      }
    }
  }

  function exportarA_PDF() {
    try {
      const doc = new jsPDF()
      
      const isAccum = selectedIds.length > 1 && selectedIds.length < bets.length
      const isSingle = selectedIds.length === 1
      const isGlobal = !sel || (bets.length > 0 && selectedIds.length === bets.length)

      let title = 'Reporte de Ranking'
      let subtitle = ''
      let dataToExport = []

      if (isGlobal) {
        title = 'Reporte de Ranking Global Acumulado'
        subtitle = `Todas las apuestas · Generado por Administrador el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}`
        dataToExport = globalTabla
      } else if (isAccum) {
        title = 'Reporte de Ranking Acumulado Personalizado'
        subtitle = `Apuestas seleccionadas (${selectedIds.length}) · Generado el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}`
        dataToExport = customTabla
      } else if (isSingle && sel) {
        title = `Reporte de Apuesta: ${sel.titulo}`
        subtitle = `Estado: ${sel.estado || '—'} · Generado el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}`
        dataToExport = tabla
      }

      // Add navy header bar
      doc.setFillColor(12, 24, 43)
      doc.rect(0, 0, 210, 32, 'F')
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(235, 195, 43) // Gold color
      doc.text(title.toUpperCase(), 14, 15)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(255, 255, 255)
      doc.text(subtitle, 14, 24)

      // Columns definition
      const columns = [
        { header: '#', dataKey: 'pos' },
        { header: 'Participante', dataKey: 'nombre' },
        { header: 'Puntos', dataKey: 'puntos' },
        { header: 'Exactos', dataKey: 'exactos' },
        { header: 'Diferencia', dataKey: 'diferencia' },
        { header: 'Resultado', dataKey: 'resultado' },
        { header: 'Predicciones', dataKey: 'predicciones' }
      ]

      // Format rows
      const rows = dataToExport.map((u, idx) => ({
        pos: u.posicion || idx + 1,
        nombre: u.nombre || '—',
        puntos: u.puntos_totales ?? 0,
        exactos: u.aciertos_exactos ?? 0,
        diferencia: u.aciertos_diferencia ?? 0,
        resultado: u.aciertos_resultado ?? 0,
        predicciones: u.predicciones ?? 0
      }))

      // AutoTable call — usando API standalone para compatibilidad con ES modules
      autoTable(doc, {
        columns: columns,
        body: rows,
        startY: 38,
        theme: 'striped',
        headStyles: {
          fillColor: [26, 48, 96],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [40, 40, 40]
        },
        alternateRowStyles: {
          fillColor: [250, 249, 246]
        },
        margin: { left: 14, right: 14 },
        didDrawPage: function() {
          const str = 'Pagina ' + doc.internal.getNumberOfPages()
          doc.setFontSize(8)
          doc.setTextColor(150, 150, 150)
          doc.text(str, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10)
        }
      })

      // ── Sección: Ranking por Región ──────────────────────────────────
      // Agrupar los participantes del reporte actual por área
      const areaMap = new Map()
      dataToExport.forEach((u, idx) => {
        const areaKey = u.area_id || 'sin_area'
        const areaNombre = u.area_nombre_cache || u.area_nombre || 'Sin región'
        if (!areaMap.has(areaKey)) {
          areaMap.set(areaKey, { nombre: areaNombre, usuarios: [] })
        }
        areaMap.get(areaKey).usuarios.push({
          pos: u.posicion || idx + 1,
          nombre: u.nombre || '—',
          puntos: u.puntos_totales ?? 0,
          exactos: u.aciertos_exactos ?? 0,
          diferencia: u.aciertos_diferencia ?? 0,
          resultado: u.aciertos_resultado ?? 0,
          predicciones: u.predicciones ?? 0,
        })
      })

      if (areaMap.size > 0) {
        // Nueva página para la sección regional
        doc.addPage()

        // Cabecera de sección
        doc.setFillColor(12, 24, 43)
        doc.rect(0, 0, 210, 28, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(14)
        doc.setTextColor(235, 195, 43)
        doc.text('RANKING POR REGIÓN', 14, 13)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(255, 255, 255)
        doc.text(`${areaMap.size} regiones · ${dataToExport.length} participantes en total`, 14, 22)

        const colsArea = [
          { header: '#', dataKey: 'pos' },
          { header: 'Participante', dataKey: 'nombre' },
          { header: 'Puntos', dataKey: 'puntos' },
          { header: 'Exactos', dataKey: 'exactos' },
          { header: 'Diferencia', dataKey: 'diferencia' },
          { header: 'Resultado', dataKey: 'resultado' },
          { header: 'Predicciones', dataKey: 'predicciones' },
        ]

        let startY = 34
        const areas = Array.from(areaMap.values())

        areas.forEach((area, aIdx) => {
          // Asignar posición dentro del área (ya están ordenados globalmente)
          const areaRows = area.usuarios.map((u, i) => ({ ...u, pos: i + 1 }))

          // Encabezado de área
          const needsPage = startY > doc.internal.pageSize.height - 60
          if (needsPage) {
            doc.addPage()
            startY = 14
          }

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10)
          doc.setTextColor(26, 48, 96)
          doc.text(area.nombre.toUpperCase(), 14, startY + 5)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8)
          doc.setTextColor(100, 116, 139)
          doc.text(`${areaRows.length} participantes`, 14, startY + 10)

          autoTable(doc, {
            columns: colsArea,
            body: areaRows,
            startY: startY + 14,
            theme: 'striped',
            headStyles: {
              fillColor: [26, 48, 96],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 8,
            },
            bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
            alternateRowStyles: { fillColor: [250, 249, 246] },
            margin: { left: 14, right: 14 },
            didDrawPage: function() {
              const str = 'Pagina ' + doc.internal.getNumberOfPages()
              doc.setFontSize(8)
              doc.setTextColor(150, 150, 150)
              doc.text(str, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10)
            }
          })

          // Actualizamos startY con espacio entre áreas
          startY = doc.lastAutoTable.finalY + 16
        })
      }

      doc.save(`reporte-ranking-${new Date().toISOString().slice(0,10)}.pdf`)
      toast.success('Reporte PDF descargado con éxito')
    } catch (e) {
      toast.error('Error al generar PDF: ' + e.message)
      console.error(e)
    }
  }

  // ── Ranking global (se carga al montar) ──
  const [globalTabla, setGlobalTabla] = useState([])
  const [globalMeta, setGlobalMeta] = useState({})
  const [globalLoading, setGlobalLoading] = useState(false)

  // ── Ranking global Por región (plan_pro solamente) ──
  const [areasTabla, setAreasTabla] = useState([])
  const [areasLoading, setAreasLoading] = useState(false)

  // ── Ranking individual agrupado Por región (top 5 Por región) ──
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
      const r = await sheetsApi.predicciones.rankingGlobalTabla({ limit: 200 })
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

  const partidosMap = useMemo(() => {
    const map = new Map()
    if (sel?.partidos) {
      sel.partidos.forEach(p => map.set(p.id, p))
    }
    return map
  }, [sel])

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
    setExpandedUser(null); setPredicciones({}); setLoadingUser(null)
    setTabActivo('individual'); setTablaArea([])

    try {
      const [rT, rA] = await Promise.all([sheetsApi.predicciones.tabla(bet.id, {
        limit: 200,
        user_id: user?.id || user?.user_id,
        area_id: user?.area_id,
      }), sheetsApi.apuestas.obtener(bet.id)])
      setTabla(rT.tabla || [])
      setMeta({ total: rT.total, mi_posicion: rT.mi_posicion, esta_en_top: rT.esta_en_top })
      const apuestaFull = { ...(bet || {}), ...rA.apuesta }
      setSel(apuestaFull)
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
      console.warn('Error cargando ranking Por región:', e.message)
      setTablaArea([])
    } finally {
      setLoadingArea(false)
    }
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
            <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid #f0eadb' }}>
              <p style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, letterSpacing: '.2em', color: '#94a3b8', margin: '0 0 10px' }}>APUESTAS</p>
              <div style={{ display: 'flex', gap: 6 }}>
                <Pill color="#22c55e" label={`${sortedBets.filter(b => isOpen(b)).length} activas`} />
                <Pill color="#64748b" label={`${sortedBets.filter(b => !isOpen(b)).length} cerradas`} />
              </div>

              {/* Botón SELEC. TODAS */}
              <button
                onClick={handleSelectAll}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  width: '100%',
                  marginTop: 12,
                  padding: '7px 12px',
                  borderRadius: 10,
                  border: `1.5px solid ${selectedIds.length === bets.length && bets.length > 0 ? '#ebc32b' : '#e8e3db'}`,
                  background: selectedIds.length === bets.length && bets.length > 0 ? 'rgba(235,195,43,.12)' : 'transparent',
                  color: selectedIds.length === bets.length && bets.length > 0 ? '#c8960a' : '#5f6e8a',
                  fontWeight: 700,
                  fontSize: 10,
                  cursor: 'pointer',
                  transition: 'all .18s',
                  textAlign: 'left',
                  letterSpacing: '.04em',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {selectedIds.length === bets.length && bets.length > 0 ? 'DESELEC. TODAS' : 'SELEC. TODAS'}
                {selectedIds.length > 0 && selectedIds.length < bets.length && (
                  <span style={{ marginLeft: 'auto', fontSize: 8, background: 'rgba(235,195,43,.15)', color: '#c8960a', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>
                    {selectedIds.length} sel.
                  </span>
                )}
              </button>

              {/* Botón persistente Ver Ranking Global */}
              <button
                onClick={() => { setSel(null); setSelectedIds([]) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  width: '100%',
                  marginTop: 8,
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: `1.5px solid ${!sel ? '#0c182b' : '#e8e3db'}`,
                  background: !sel ? '#0c182b' : 'transparent',
                  color: !sel ? '#ebc32b' : '#5f6e8a',
                  fontWeight: 700,
                  fontSize: 11,
                  cursor: 'pointer',
                  transition: 'all .18s',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { if (sel) { e.currentTarget.style.background = 'rgba(12,24,43,.06)'; e.currentTarget.style.borderColor = '#0c182b'; e.currentTarget.style.color = '#0c182b' } }}
                onMouseLeave={e => { if (sel) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#e8e3db'; e.currentTarget.style.color = '#5f6e8a' } }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                Ver Ranking Global
                {!sel && (
                  <span style={{ marginLeft: 'auto', fontSize: 8, background: 'rgba(235,195,43,.2)', color: '#ebc32b', padding: '2px 6px', borderRadius: 4, fontWeight: 800, letterSpacing: '.06em' }}>
                    ACTIVO
                  </span>
                )}
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
                    <SideSection label="Activas" dot="#22c55e">
                      {sortedBets.filter(b => isOpen(b)).map(b => (
                        <BetRow key={b.id} bet={b} sel={sel?.id === b.id}
                          checked={selectedIds.includes(b.id)}
                          onToggleCheck={handleToggleBet}
                          onPick={() => {
                            setSelectedIds([b.id])
                          }}
                        />
                      ))}
                    </SideSection>
                  )}
                  <SideSection label="Historial">
                    {sortedBets.filter(b => !isOpen(b)).map(b => (
                      <BetRow key={b.id} bet={b} sel={sel?.id === b.id}
                        checked={selectedIds.includes(b.id)}
                        onToggleCheck={handleToggleBet}
                        onPick={() => {
                          setSelectedIds([b.id])
                        }}
                      />
                    ))}
                  </SideSection>
                </>
              )}
            </div>
          </div>

          <div className="rk-content" style={{ padding: '24px 32px 32px' }}>

            {!sel ? (
              <RankingGlobalAdmin
                tabla={selectedIds.length > 1 ? customTabla : globalTabla}
                meta={selectedIds.length > 1 ? customMeta : globalMeta}
                loading={selectedIds.length > 1 ? loadingCustom : globalLoading}
                onRefresh={cargarRankingGlobal}
                areasTabla={areasTabla}
                areasLoading={areasLoading}
                areasIndividual={selectedIds.length > 1 ? customAreasIndividual : areasIndividual}
                areasIndividualLoading={selectedIds.length > 1 ? loadingCustom : areasIndividualLoading}
                isPro={isPro}
                onOpenArea={abrirModalArea}
                onExportPDF={exportarA_PDF}
              />
            ) : (() => {
              const isAccum = selectedIds.length > 1
              const displayTabla = isAccum ? customTabla : tabla
              const displayMeta = isAccum ? customMeta : meta
              const displayLoading = isAccum ? loadingCustom : loading
              const displayTablaArea = isAccum ? customTablaArea : tablaArea
              const displaySel = sel

              return (
                <div className="rk-in">

                  <Banner apuesta={displaySel} meta={displayMeta} loading={displayLoading} onExportPDF={exportarA_PDF} />

                  {/* Tabs de tipo de ranking (Solo para apuestas libres) */}
                  {displaySel.tipo === 'libre' && (
                    <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #f0eadb', marginBottom: 20 }}>
                      <button
                        className={`rk-tab ${tabActivo === 'individual' ? 'active' : ''}`}
                        onClick={() => setTabActivo('individual')}
                      >
                        Individual
                      </button>
                      <button
                        className={`rk-tab ${tabActivo === 'por_area' ? 'active' : ''}`}
                        onClick={() => setTabActivo('por_area')}
                      >
                        Por región
                      </button>
                    </div>
                  )}

                  {displayLoading ? (
                    <SkeletonContent />
                  ) : tabActivo === 'por_area' ? (
                    <RankingPorArea
                      tabla={displayTablaArea}
                      loading={isAccum ? loadingCustom : loadingArea}
                      miAreaId={user?.area_id}
                    />
                  ) : displayTabla.length === 0 ? (
                    <SinParticipantes />
                  ) : (
                    <>
                      <Podio
                        top={displayTabla.slice(0, 3)}
                        miId={user?.id}
                        apuesta={displaySel}
                        expandedUser={isAccum ? null : expandedUser}
                        loadingUser={isAccum ? null : loadingUser}
                        onToggle={isAccum ? () => {} : toggleUser}
                      />

                      {!isAccum && expandedUser && displayTabla.slice(0, 3).some(u => u.user_id === expandedUser) && (
                        <PrediccionesPanel
                          user={displayTabla.find(u => u.user_id === expandedUser)}
                          predicciones={predicciones[expandedUser] || []}
                          apuesta={displaySel}
                          onClose={() => setExpandedUser(null)}
                        />
                      )}

                      {displayTabla.length > 3 && (
                        <OtrosParticipantes
                          tabla={displayTabla}
                          user={user}
                          apuesta={isAccum ? { ...displaySel, tipo: 'grupos' } : displaySel}
                          expandedUser={isAccum ? null : expandedUser}
                          loadingUser={isAccum ? null : loadingUser}
                          predicciones={predicciones}
                          onToggle={isAccum ? () => {} : toggleUser}
                        />
                      )}

                      <LeyendaPuntos apuesta={displaySel} total={displayMeta.total} />

                    </>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      </div>

      {/* Modal Ranking Completo por Área */}
      {modalArea && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(12, 24, 43, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          animation: 'rk-fade 0.2s ease both',
        }} onClick={() => setModalArea(null)}>
          <div style={{
            background: '#fff',
            border: '1px solid #f0eadb',
            borderRadius: 20,
            width: '90%',
            maxWidth: 550,
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(12,24,43,0.25)',
            animation: 'rk-in 0.28s ease both',
          }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg,#0c182b 0%,#1a2540 100%)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>🏢</span>
                <div>
                  <p style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.15em', color: 'rgba(235,195,43,0.6)', margin: 0 }}>
                    Ranking Completo
                  </p>
                  <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: '.04em', color: '#fff', margin: 0 }}>
                    {modalArea.area_nombre || 'Sin nombre'}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setModalArea(null)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  transition: 'all .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: 20,
              background: '#faf7f0',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              minHeight: 180,
            }}>
              {modalLoading ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: '40px 0' }}>
                  <div className="rk-spinner" style={{ width: 24, height: 24, borderWidth: 3, color: '#ebc32b' }} />
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, fontWeight: 500 }}>Cargando participantes...</p>
                </div>
              ) : modalTabla.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', margin: 0 }}>No hay participantes registrados en esta región.</p>
                </div>
              ) : (
                modalTabla.map((u, idx) => {
                  const MEDALS = ['🥇', '🥈', '🥉']
                  return (
                    <div key={u.user_id} style={{
                      display: 'grid',
                      gridTemplateColumns: '36px 1fr 64px 56px',
                      gap: 10,
                      padding: '9px 12px',
                      background: '#fff',
                      border: '1px solid #f5f3ee',
                      borderRadius: 12,
                      alignItems: 'center',
                      boxShadow: '0 2px 6px rgba(12,24,43,0.02)',
                    }}>
                      <span style={{ fontSize: idx < 3 ? 14 : 11, textAlign: 'center', fontWeight: 700, color: '#94a3b8' }}>
                        {MEDALS[idx] || `#${idx + 1}`}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 12, color: '#0c182b', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.nombre}
                        </p>
                        <p style={{ fontSize: 9, color: '#94a3b8', margin: 0 }}>
                          #{u.posicion} global · {u.predicciones || 0} pred
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-start' }}>
                        {[{ v: u.aciertos_exactos, c: '#22c55e' }, { v: u.aciertos_diferencia || 0, c: '#ebc32b' }].map((x, i) => (
                          x.v > 0 && (
                            <span key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 5, background: `${x.c}12`, border: `1px solid ${x.c}25`, fontSize: 9, fontWeight: 600, color: x.c }}>{x.v}</span>
                          )
                        ))}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: idx === 0 ? '#c99f16' : '#0c182b' }}>
                          {u.puntos_totales}
                        </span>
                        <span style={{ fontSize: 8, color: '#94a3b8', display: 'block', lineHeight: 1 }}>pts</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div style={{
              background: '#fff',
              borderTop: '1px solid #f0eadb',
              padding: '12px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>
                Total: {modalTabla.length} participante{modalTabla.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => setModalArea(null)}
                style={{
                  background: '#0c182b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '6px 14px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
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

function BetRow({ bet, sel, checked, onToggleCheck, onPick }) {
  const open = isOpen(bet)
  const fin = bet.estado === 'finalizada'
  const col = fin ? '#ebc32b' : open ? '#22c55e' : '#475569'
  const parts = bet.partidos_ids ? bet.partidos_ids.split(',').filter(Boolean).length : 0
  return (
    <div className={`rk-row${sel ? ' sel' : ''}`} onClick={() => onPick(bet)} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Checkbox custom */}
      <div
        onClick={(e) => {
          e.stopPropagation()
          onToggleCheck(bet.id)
        }}
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          border: '1.5px solid #cbd5e1',
          background: checked ? '#ebc32b' : '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'all 0.12s',
        }}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>

      {/* Dot estado */}
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: col, flexShrink: 0, boxShadow: open ? `0 0 6px ${col}` : sel ? `0 0 4px ${col}` : 'none' }} />
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: sel ? '#fff' : '#0c182b', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {bet.titulo}
        </p>
        <p style={{ fontSize: 10, color: sel ? 'rgba(255,255,255,0.6)' : '#94a3b8', margin: 0 }}>
          {bet.participantes || 0} part · {parts} partidos
        </p>
      </div>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={sel ? '#ebc32b' : '#c8d0dc'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  )
}

/* ══════════════════════════════════════════
   BANNER
══════════════════════════════════════════ */
function Banner({ apuesta, meta, loading, onExportPDF }) {
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
          <div style={{ display: 'flex', gap: 20, flexShrink: 0, alignItems: 'center' }}>
            {meta.total > 0 && <BannerStat n={meta.total} label="Part." />}
            {onExportPDF && (
              <button
                onClick={onExportPDF}
                title="Descargar PDF"
                style={{
                  background: 'rgba(255,255,255,.06)',
                  border: '1px solid rgba(255,255,255,.12)',
                  borderRadius: 8,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  color: '#ebc32b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  fontWeight: 'bold',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                PDF
              </button>
            )}
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
                marginBottom: (showDetail && apuesta?.tipo !== 'grupos') ? 10 : 0,
              }}>
                <p style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: isTop ? 36 : 28, color: isTop ? '#c99f16' : '#0c182b', margin: 0, lineHeight: 1 }}>
                  {u.puntos_totales}
                </p>
                <p style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em', color: '#94a3b8', margin: '2px 0 0' }}>puntos</p>
              </div>

              {/* Detalle oculto para apuestas grupales por volumen — funcionalidad preservada */}
              {showDetail && apuesta?.tipo !== 'grupos' && (
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
function RankingGlobalAdmin({ tabla, meta, loading, onRefresh, areasTabla = [], areasLoading = false, areasIndividual = [], areasIndividualLoading = false, isPro = false, onOpenArea, onExportPDF }) {
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
            <div style={{ display: 'flex', gap: 20, flexShrink: 0, alignItems: 'center' }}>
              {meta.total > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: 'rgba(255,255,255,.9)', margin: '0 0 1px', lineHeight: 1 }}>{meta.total}</p>
                  <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: 'rgba(255,255,255,.35)', margin: 0 }}>Participantes</p>
                </div>
              )}
              {onExportPDF && (
                <button
                  onClick={onExportPDF}
                  title="Descargar Reporte PDF"
                  style={{
                    background: 'rgba(255,255,255,.06)',
                    border: '1px solid rgba(255,255,255,.12)',
                    borderRadius: 8,
                    padding: '6px 10px',
                    cursor: 'pointer',
                    color: '#ebc32b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 'bold',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.12)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  PDF
                </button>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {areasIndividual.map((area) => (
                <AreaRankingCard key={area.area_id} area={area} onOpenArea={onOpenArea} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Tarjeta de ranking de área con top-5 ── */
function AreaRankingCard({ area, onOpenArea }) {
  const MEDALS = ['🥇', '🥈', '🥉']
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #f0eadb',
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(12,24,43,.06)',
      display: 'flex',
      flexDirection: 'column',
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
        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: '.06em', color: '#ebc32b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {area.area_nombre || 'Sin nombre'}
        </span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,.35)', fontWeight: 600 }}>
          TOP {area.usuarios.length}
        </span>
      </div>
      {/* Lista de usuarios */}
      <div style={{ flex: 1 }}>
        {area.usuarios.map((u, idx) => (
          <div key={u.user_id} style={{
            display: 'grid',
            gridTemplateColumns: '28px 1fr 52px',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderBottom: idx < area.usuarios.length - 1 ? '1px solid #f5f3ee' : 'none',
            background: idx === 0 ? 'rgba(235,195,43,.04)' : 'transparent',
          }}>
            <span style={{ fontSize: idx < 3 ? 14 : 11, textAlign: 'center' }}>
              {MEDALS[idx] || <span style={{ fontWeight: 700, color: '#94a3b8' }}>#{idx + 1}</span>}
            </span>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: idx === 0 ? 700 : 500, color: '#0c182b', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.nombre}
              </p>
              <p style={{ fontSize: 9, color: '#94a3b8', margin: 0 }}>
                #{u.posicion_global} global · {u.predicciones} pred
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: idx === 0 ? '#c99f16' : '#0c182b' }}>
                {u.puntos_totales}
              </span>
              <span style={{ fontSize: 8, color: '#94a3b8', display: 'block', lineHeight: 1 }}>pts</span>
            </div>
          </div>
        ))}
      </div>
      {/* Botón Ver ranking completo */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid #f5f3ee', textAlign: 'center', background: '#faf9f6' }}>
        <button
          onClick={() => onOpenArea && onOpenArea({ area_id: area.area_id, area_nombre: area.area_nombre })}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#0c182b',
            fontSize: 10,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '.05em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            borderRadius: 6,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(12,24,43,0.05)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          Ver ranking completo
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function GlobalFullTable({ tabla }) {
  const [exp, setExp] = useState(false)
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
function OtrosParticipantes({ tabla, user, apuesta, expandedUser, loadingUser, predicciones, onToggle }) {
  const [exp, setExp] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('otros_participantes_expanded')) ?? false
    } catch {
      return false
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
                  gridTemplateColumns: apuesta?.tipo === 'grupos' ? '32px 1fr 64px 56px' : '32px 1fr 64px 56px auto',
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

                  {/* Detalle oculto para apuestas grupales por volumen — funcionalidad preservada */}
                  {apuesta?.tipo !== 'grupos' && (
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
                  )}
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

/* ══════════════════════════════════════════
   RANKING Por región (apuestas tipo libre)
══════════════════════════════════════════ */
function RankingPorArea({ tabla, loading, miId, miAreaId }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1, 2, 3].map(i => (
          <div key={i}>
            <div className="rk-sk" style={{ height: 32, borderRadius: 8, marginBottom: 6 }} />
            {[1, 2].map(j => <div key={j} className="rk-sk" style={{ height: 44, borderRadius: 0, marginTop: 1 }} />)}
          </div>
        ))}
      </div>
    )
  }

  if (!tabla || tabla.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', background: '#fff', borderRadius: 14, border: '1.5px solid #e8e3db' }}>
        <p style={{ fontSize: 28, margin: '0 0 8px' }}>🏢</p>
        <p style={{ fontWeight: 700, color: '#64748b', margin: '0 0 6px', fontSize: 15 }}>Sin datos Por región todavía</p>
        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
          Los rankings Por región se calculan en el próximo ciclo del sistema.<br />
          Asegúrate de que los participantes tengan un área asignada.
        </p>
      </div>
    )
  }

  // Agrupar filas Por región
  const grupos = tabla.reduce((acc, row) => {
    const key = row.area_id || '_sin_area'
    const nombre = row.area_nombre_cache || 'Sin área'
    if (!acc[key]) acc[key] = { area_id: key, area_nombre: nombre, filas: [] }
    acc[key].filas.push(row)
    return acc
  }, {})

  const gruposList = Object.values(grupos).sort((a, b) => a.area_nombre.localeCompare(b.area_nombre))

  // Colores para las áreas (rotación)
  const AREA_COLORS = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ec4899','#8b5cf6','#14b8a6']
  const colorForArea = (idx) => AREA_COLORS[idx % AREA_COLORS.length]

  return (
    <div className="rk-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Info header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, letterSpacing: '.18em', color: '#94a3b8' }}>
          RANKING Por región — {tabla.length} participantes · {gruposList.length} áreas
        </span>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,#e2ddd6,transparent)' }} />
      </div>

      {gruposList.map((grupo, gIdx) => {
        const esMiArea = grupo.area_id === miAreaId
        const color = colorForArea(gIdx)

        return (
          <div key={grupo.area_id} style={{
            borderRadius: 14,
            overflow: 'hidden',
            border: `1.5px solid ${esMiArea ? 'rgba(235,195,43,.4)' : '#e8e3db'}`,
            boxShadow: esMiArea ? '0 0 0 3px rgba(235,195,43,.08)' : '0 2px 8px rgba(12,24,43,.04)',
          }}>
            {/* Header del área */}
            <div style={{
              background: esMiArea
                ? 'linear-gradient(90deg,#0c182b,#17376a)'
                : `linear-gradient(90deg,${color}18,${color}08)`,
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              borderBottom: `1px solid ${esMiArea ? 'rgba(255,255,255,.08)' : `${color}20`}`,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: esMiArea ? '#ebc32b' : color,
                boxShadow: esMiArea ? '0 0 8px rgba(235,195,43,.6)' : `0 0 6px ${color}80`,
                flexShrink: 0,
              }} />
              <span style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 13,
                letterSpacing: '.06em',
                color: esMiArea ? '#fff' : '#0c182b',
                flex: 1,
              }}>
                {grupo.area_nombre}
              </span>
              {esMiArea && (
                <span style={{
                  fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: '.16em', color: '#ebc32b',
                  background: 'rgba(235,195,43,.12)', border: '1px solid rgba(235,195,43,.25)',
                  borderRadius: 99, padding: '2px 10px',
                }}>
                  Tu área
                </span>
              )}
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: esMiArea ? 'rgba(255,255,255,.5)' : '#94a3b8',
              }}>
                {grupo.filas.length} participante{grupo.filas.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Tabla de participantes del área */}
            <div style={{ background: '#fff' }}>
              {/* Col header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '40px 1fr 80px',
                padding: '6px 16px', background: 'rgba(12,24,43,.02)',
                borderBottom: '1px solid #f0eadb', gap: 8,
              }}>
                {['#', 'Participante', 'Pts'].map((h, i) => (
                  <span key={i} style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#b8c0cc', textAlign: i === 2 ? 'center' : 'left' }}>{h}</span>
                ))}
              </div>

              {grupo.filas.map((row, rIdx) => {
                const esYo = row.user_id === miId
                const pos = row.posicion_en_area
                const posColor = pos === 1 ? '#ebc32b' : pos === 2 ? '#94a3b8' : pos === 3 ? '#c2720e' : '#c8d0dc'

                return (
                  <div key={row.user_id} className={`rk-area-row${esYo ? ' me' : ''}`}
                    style={{ borderBottom: rIdx < grupo.filas.length - 1 ? '1px solid #f5f3ee' : 'none' }}>
                    {/* Posición */}
                    <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: posColor, lineHeight: 1 }}>
                      {pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : pos}
                    </span>
                    {/* Nombre */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        background: esYo ? 'linear-gradient(135deg,#ebc32b,#ffe169)' : `linear-gradient(135deg,${color}40,${color}20)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "'Bebas Neue',sans-serif", fontSize: 11,
                        color: esYo ? '#0c182b' : color,
                        boxShadow: esYo ? '0 0 0 2px rgba(235,195,43,.3)' : 'none',
                      }}>
                        {initials(row.nombre)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: esYo ? 700 : 600, fontSize: 12, color: esYo ? '#ebc32b' : '#0c182b', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.nombre}
                          {esYo && <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 400, marginLeft: 4 }}>(tú)</span>}
                        </p>
                        <p style={{ fontSize: 9, color: '#94a3b8', margin: 0 }}>
                          #{row.posicion} global · {row.predicciones} pred
                        </p>
                      </div>
                    </div>
                    {/* Puntos */}
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#0c182b', lineHeight: 1 }}>{row.puntos_totales}</span>
                      <span style={{ fontSize: 7, color: '#94a3b8', marginLeft: 2, fontWeight: 700, display: 'block', letterSpacing: '.1em' }}>PTS</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}