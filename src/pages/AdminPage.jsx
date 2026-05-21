import { useState, useEffect } from 'react'
import AppShell from '../dashboard/AppShell.jsx'
import { useBets } from '../hooks/useBets.jsx'
import { useAuth } from '../hooks/useAuth.jsx'
import { formatDate, isBetOpen } from '../utils/index.js'
import sheetsApi from '../services/sheetsApi.js'

import AdminHeader from '../components/admin/AdminHeader.jsx'
import AdminTabs from '../components/admin/AdminTabs.jsx'
import CreateBetTab from '../components/admin/CreateBetTab.jsx'
import BetsListTab from '../components/admin/BetsListTab.jsx'
import Loading from '../hooks/Loading.jsx'

/* ── Helpers ────────────────────────────────────────────── */

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() || '')
    .join('')
}

function getBetStatusColor(bet) {
  if (isBetOpen(bet)) return { color: 'var(--color-accent)', bg: 'rgba(34,217,223,0.12)', border: 'rgba(34,217,223,0.4)', label: 'Activa' }
  if (bet.estado === 'finalizada') return { color: 'var(--color-warn)', bg: 'rgba(244,180,42,0.1)', border: 'rgba(244,180,42,0.3)', label: 'Finalizada' }
  return { color: 'var(--color-text-muted)', bg: 'rgba(132,153,194,0.1)', border: 'var(--color-border)', label: 'Cerrada' }
}

export default function AdminPage() {
  const { bets, loading: betsLoading, createBet, closeBet, finalizeBet, matches, loadBets } = useBets({ 
    autoLoad: false, 
    autoLoadPredictions: false 
  })
  const { isPro } = useAuth()

  // ✅ Estado de loading inicial
  const [initialLoading, setInitialLoading] = useState(true)

  const [tab, setTab] = useState('NuevaApuesta')

  /* ── Usuarios ─────────────────────────────────────────── */
  const [pendingUsers, setPendingUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [areas, setAreas] = useState([])
  const [approvingUser, setApprovingUser] = useState(null)
  const [approvingInProgress, setApprovingInProgress] = useState(false)
  const [rejectingUser, setRejectingUser] = useState(null)
  const [rejectingInProgress, setRejectingInProgress] = useState(false)

  /* ── Usuarios activos ─────────────────────────────────── */
  const [activeUsers, setActiveUsers] = useState([])
  const [loadingActiveUsers, setLoadingActiveUsers] = useState(false)

  /* ── Áreas ────────────────────────────────────────────── */
  const [areasAll, setAreasAll] = useState([])
  const [loadingAreas, setLoadingAreas] = useState(false)
  const [editingArea, setEditingArea] = useState(null)
  const [newArea, setNewArea] = useState({ nombre: '', descripcion: '' })
  const [savingArea, setSavingArea] = useState(false)

/* ── Efectos ──────────────────────────────────────────── */

/* ── Carga inicial ──────────────────────────────────────── */
useEffect(() => {
  async function loadInitialData() {
    setInitialLoading(true)
    try {
      await loadBets()
    } catch (error) {
      console.error('Error cargando datos iniciales:', error)
    } finally {
      setInitialLoading(false)
    }
  }
  loadInitialData()
}, [loadBets])

useEffect(() => {
  if (tab === 'Usuarios') {
    loadPendingUsers()
    if (isPro) loadAreas()
  }
  if (tab === 'UsuariosActivos') {
    loadActiveUsers()
    if (isPro) loadAreas()
  }
  if (tab === 'Areas') {
    loadAreasAll()
  }
}, [tab, isPro])

  /* ── Funciones: Áreas ─────────────────────────────────── */
  async function loadAreas() {
    try { const r = await sheetsApi.areas.listar(true); setAreas(r.areas || []) }
    catch (e) { console.error('Error cargando áreas:', e) }
  }

  async function loadAreasAll() {
    setLoadingAreas(true)
    try { const r = await sheetsApi.areas.listar(false); setAreasAll(r.areas || []) }
    catch (e) { alert('Error cargando áreas: ' + e.message) }
    finally { setLoadingAreas(false) }
  }

  async function handleCreateArea(e) {
    e.preventDefault()
    if (!newArea.nombre.trim()) return alert('El nombre del área es obligatorio.')
    setSavingArea(true)
    try {
      await sheetsApi.areas.crear({ nombre: newArea.nombre.trim(), descripcion: newArea.descripcion.trim() })
      setNewArea({ nombre: '', descripcion: '' })
      await loadAreasAll()
    } catch (e) { alert('Error creando área: ' + e.message) }
    finally { setSavingArea(false) }
  }

  async function handleSaveEdit() {
    if (!editingArea.nombre.trim()) return alert('El nombre no puede estar vacío.')
    setSavingArea(true)
    try {
      await sheetsApi.areas.editar({ area_id: editingArea.id, nombre: editingArea.nombre.trim(), descripcion: editingArea.descripcion?.trim() || '' })
      setEditingArea(null)
      await loadAreasAll()
    } catch (e) { alert('Error guardando cambios: ' + e.message) }
    finally { setSavingArea(false) }
  }

  async function handleToggleArea(area, currentlyActive) {
    if (!window.confirm(`¿Seguro que querés ${currentlyActive ? 'desactivar' : 'reactivar'} el área "${area.nombre}"?`)) return
    try { await sheetsApi.areas.toggle_activa(area.id); await loadAreasAll() }
    catch (e) { alert('Error: ' + e.message) }
  }

  /* ── Funciones: Usuarios ──────────────────────────────── */
  async function loadPendingUsers() {
    setLoadingUsers(true)
    try { const r = await sheetsApi.usuarios.listar('pendiente'); setPendingUsers(r.usuarios || []) }
    catch (e) { alert('Error cargando usuarios: ' + e.message) }
    finally { setLoadingUsers(false) }
  }

  async function loadActiveUsers() {
    setLoadingActiveUsers(true)
    try { const r = await sheetsApi.usuarios.listar('activo'); setActiveUsers(r.usuarios || []) }
    catch (e) { alert('Error cargando usuarios activos: ' + e.message) }
    finally { setLoadingActiveUsers(false) }
  }

  async function confirmApprove(id) {
    if (isPro && !approvingUser.area_id) {
      return alert('Debés seleccionar el área del usuario.')
    }
    
    setApprovingInProgress(true)
    
    try {
      await sheetsApi.usuarios.aprobar(
        id,
        '',
        isPro ? approvingUser.area_id : ''
      )
      setApprovingUser(null)
      await loadPendingUsers()
      loadActiveUsers().catch(() => {})
    } catch (e) {
      alert('Error aprobando: ' + e.message)
    } finally {
      setApprovingInProgress(false)
    }
  }

  async function confirmReject(id) {
    setRejectingInProgress(true)
    
    try {
      await sheetsApi.usuarios.rechazar(id)
      setPendingUsers(prev => prev.filter(u => u.id !== id))
      setRejectingUser(null)
    } catch (e) { 
      alert(e.message || 'Error al rechazar usuario') 
    } finally {
      setRejectingInProgress(false)
    }
  }

// ✅ MOSTRAR LOADING MIENTRAS CARGA DATOS INICIALES
if (initialLoading) {
  return <Loading message="Cargando panel de administración..." />
}

/* ── Render ───────────────────────────────────────────── */
  return (
    <AppShell>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shimmer{to{transform:translateX(200%)}}
      `}</style>
      
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem 1.5rem 3rem' }}>

        <AdminHeader bets={bets} pendingUsers={pendingUsers} />

        {/* Divider */}
        <div className="mb-6 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(235,195,43,.25) 30%,rgba(235,195,43,.25) 70%,transparent)' }} />

        <AdminTabs
          tab={tab}
          setTab={setTab}
          pendingCount={pendingUsers.length}
          activeBetsCount={bets.filter(b => b.estado === 'abierta').length}
        />

        {/* TAB 1: Nueva Apuesta */}
        {tab === 'NuevaApuesta' && (
<CreateBetTab
  createBet={createBet}
  loading={betsLoading}
  matches={matches}
/>
        )}

        {/* TAB 2: Apuestas Creadas */}
        {tab === 'ApuestasCreadas' && (
<BetsListTab
  bets={bets}
  loading={betsLoading}
  closeBet={closeBet}
  finalizeBet={finalizeBet}
/>
        )}

        {/* TAB: Áreas */}
        {tab === 'Areas' && (
          <div className="animate-fade-in space-y-6">
            {/* Crear nueva área */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: '#fff',
                border: '1px solid #f0eadb',
                boxShadow: '0 4px 16px rgba(12,24,43,.06)',
              }}
            >
              <h3 className="font-display text-xl mb-4" style={{ color: '#0a1226' }}>
                Crear nueva área
              </h3>
              <form onSubmit={handleCreateArea} className="space-y-3">
                <div>
                  <label className="text-[11px] font-body font-bold uppercase tracking-[0.15em] mb-2 block" style={{ color: '#c99f16' }}>
                    Nombre del área *
                  </label>
                  <input
                    type="text"
                    value={newArea.nombre}
                    onChange={e => setNewArea({ ...newArea, nombre: e.target.value })}
                    placeholder="Ej: Recursos Humanos"
                    className="w-full px-4 py-3 rounded-xl font-body text-sm outline-none"
                    style={{ background: '#fff', border: '1px solid #e8dfd0', color: '#0c182b' }}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-body font-bold uppercase tracking-[0.15em] mb-2 block" style={{ color: '#c99f16' }}>
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={newArea.descripcion}
                    onChange={e => setNewArea({ ...newArea, descripcion: e.target.value })}
                    placeholder="Descripción breve del área"
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl font-body text-sm outline-none resize-none"
                    style={{ background: '#fff', border: '1px solid #e8dfd0', color: '#0c182b' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingArea || !newArea.nombre.trim()}
                  className="px-6 py-2.5 rounded-xl text-xs font-body font-bold uppercase tracking-wider transition-all disabled:opacity-40"
                  style={{
                    background: 'linear-gradient(135deg, #ebc32b 0%, #d4a017 100%)',
                    color: '#0a1226',
                  }}
                >
                  {savingArea ? 'Guardando...' : 'Crear área'}
                </button>
              </form>
            </div>

            {/* Lista de áreas existentes */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: '#fff',
                border: '1px solid #f0eadb',
                boxShadow: '0 4px 16px rgba(12,24,43,.06)',
              }}
            >
              <h3 className="font-display text-xl mb-4" style={{ color: '#0a1226' }}>
                Áreas existentes ({areasAll.length})
              </h3>
              {loadingAreas ? (
                <p className="text-sm font-body" style={{ color: '#5f6e8a' }}>Cargando...</p>
              ) : areasAll.length === 0 ? (
                <p className="text-sm font-body" style={{ color: '#5f6e8a' }}>
                  Todavía no hay áreas creadas.
                </p>
              ) : (
                <div className="space-y-2">
                  {areasAll.map(a => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-3 p-4 rounded-xl"
                      style={{
                        background: a.activa ? 'rgba(235,195,43,0.05)' : 'rgba(95,110,138,0.04)',
                        border: `1px solid ${a.activa ? 'rgba(235,195,43,0.15)' : 'rgba(95,110,138,0.15)'}`,
                      }}
                    >
                      {editingArea?.id === a.id ? (
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={editingArea.nombre}
                            onChange={e => setEditingArea({ ...editingArea, nombre: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{ background: '#fff', border: '1px solid #e8dfd0', color: '#0c182b' }}
                          />
                          <textarea
                            value={editingArea.descripcion || ''}
                            onChange={e => setEditingArea({ ...editingArea, descripcion: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                            style={{ background: '#fff', border: '1px solid #e8dfd0', color: '#0c182b' }}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveEdit}
                              disabled={savingArea}
                              className="px-4 py-1.5 rounded-lg text-xs font-bold"
                              style={{ background: '#ebc32b', color: '#0a1226' }}
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditingArea(null)}
                              className="px-4 py-1.5 rounded-lg text-xs"
                              style={{ background: 'transparent', border: '1px solid #e8dfd0', color: '#5f6e8a' }}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <p className="font-body font-bold text-sm" style={{ color: a.activa ? '#0a1226' : '#9aa5b8' }}>
                              {a.nombre}
                              {!a.activa && <span className="ml-2 text-xs font-normal">(inactiva)</span>}
                            </p>
                            {a.descripcion && (
                              <p className="text-xs font-body mt-1" style={{ color: '#5f6e8a' }}>
                                {a.descripcion}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => setEditingArea({ id: a.id, nombre: a.nombre, descripcion: a.descripcion || '' })}
                              className="px-3 py-1.5 rounded-lg text-xs font-body"
                              style={{ background: 'transparent', border: '1px solid rgba(12,24,43,.2)', color: '#5f6e8a' }}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleToggleArea(a, a.activa)}
                              className="px-3 py-1.5 rounded-lg text-xs font-body"
                              style={{
                                background: 'transparent',
                                border: `1px solid ${a.activa ? 'rgba(224,50,82,.35)' : 'rgba(16,185,129,.35)'}`,
                                color: a.activa ? '#e03252' : '#10b981',
                              }}
                            >
                              {a.activa ? 'Desactivar' : 'Reactivar'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Usuarios */}
{tab === 'Usuarios' && (
  <div className="animate-fade-in delay-2">
    {/* Header */}
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h2 className="font-display text-2xl md:text-3xl tracking-wide"
          style={{ color: '#0a1226', letterSpacing: '0.02em' }}>
          USUARIOS PENDIENTES
        </h2>
        {pendingUsers.length > 0 && (
          <p className="text-sm font-body mt-1.5"
            style={{ color: '#5f6e8a' }}>
            {pendingUsers.length} {pendingUsers.length === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'} de aprobación
          </p>
        )}
      </div>

      <button
        onClick={loadPendingUsers}
        disabled={loadingUsers}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-body font-bold uppercase tracking-wider transition-all disabled:opacity-50"
        style={{
          background: loadingUsers ? 'rgba(235,195,43,0.1)' : '#fff',
          border: '1.5px solid #f0eadb',
          color: loadingUsers ? '#c99f16' : '#5f6e8a',
          boxShadow: '0 1px 0 rgba(10,18,38,0.03)',
        }}
        onMouseEnter={e => {
          if (!loadingUsers) {
            e.currentTarget.style.borderColor = '#ebc32b'
            e.currentTarget.style.color = '#c99f16'
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(235,195,43,0.15)'
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = '#f0eadb'
          e.currentTarget.style.color = '#5f6e8a'
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 1px 0 rgba(10,18,38,0.03)'
        }}
      >
        {loadingUsers ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Actualizando...
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Actualizar
          </>
        )}
      </button>
    </div>

    {/* Loading state */}
    {loadingUsers && pendingUsers.length === 0 ? (
      <div className="text-center py-20">
        <span className="inline-block w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#ebc32b', borderTopColor: 'transparent' }} />
        <p className="font-body text-sm mt-4" style={{ color: '#5f6e8a' }}>
          Cargando usuarios...
        </p>
      </div>
    ) : pendingUsers.length === 0 ? (
      /* Empty state */
      <div
        className="rounded-2xl p-16 text-center"
        style={{
          background: '#fff',
          border: '1.5px dashed #f0eadb',
          boxShadow: '0 1px 0 rgba(10,18,38,0.03)',
        }}
      >
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(235,195,43,0.08)', border: '1px solid rgba(235,195,43,0.2)' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c99f16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <p className="font-body font-semibold text-lg mb-2" style={{ color: '#0a1226' }}>
          Todo aprobado
        </p>
        <p className="font-body text-sm max-w-md mx-auto" style={{ color: '#5f6e8a' }}>
          No hay usuarios pendientes de aprobación. Las nuevas solicitudes aparecerán acá automáticamente.
        </p>
      </div>
    ) : (
      /* Lista de usuarios */
      <div className="grid gap-4">
        {pendingUsers.map(u => {
          const isApproving = approvingUser?.id === u.id
          const isRejecting = rejectingUser === u.id
          
          return (
            <div
              key={u.id}
              className="rounded-2xl overflow-hidden transition-all"
              style={{
                background: '#fff',
                border: `1.5px solid ${isApproving ? '#ebc32b' : isRejecting ? '#ff4d6d' : '#f0eadb'}`,
                boxShadow: isApproving || isRejecting 
                  ? '0 8px 24px rgba(10,18,38,0.12)' 
                  : '0 1px 0 rgba(10,18,38,0.03)',
              }}
            >
              {/* Cabecera del usuario */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Avatar con iniciales */}
                    <div
                      className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center font-display text-xl tracking-wide"
                      style={{
                        background: 'linear-gradient(135deg, #ebc32b 0%, #d4a017 100%)',
                        color: '#0a1226',
                        boxShadow: '0 4px 12px rgba(235,195,43,0.25)',
                      }}
                    >
                      {getInitials(u.nombre)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-body font-bold text-base truncate mb-0.5"
                        style={{ color: '#0a1226' }}>
                        {u.nombre}
                      </p>
                      <p className="text-sm font-body truncate mb-1.5"
                        style={{ color: '#5f6e8a' }}>
                        {u.email}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-body font-semibold uppercase tracking-wider"
                          style={{ 
                            background: 'rgba(235,195,43,0.08)', 
                            color: '#c99f16',
                            border: '1px solid rgba(235,195,43,0.2)'
                          }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {formatDate(u.fecha_registro)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!isApproving && !isRejecting && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setApprovingUser({ id: u.id, area_id: '' })}
                        className="px-5 py-2.5 rounded-xl text-xs font-body font-bold uppercase tracking-wider transition-all"
                        style={{
                          background: 'linear-gradient(135deg, #ebc32b 0%, #d4a017 100%)',
                          color: '#0a1226',
                          boxShadow: '0 2px 8px rgba(235,195,43,0.25)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(235,195,43,0.4)'
                          e.currentTarget.style.transform = 'translateY(-2px)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(235,195,43,0.25)'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => setRejectingUser(u.id)}
                        className="px-5 py-2.5 rounded-xl text-xs font-body font-bold uppercase tracking-wider transition-all"
                        style={{
                          background: '#fff',
                          border: '1.5px solid rgba(255,77,109,0.3)',
                          color: '#ff4d6d',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(255,77,109,0.05)'
                          e.currentTarget.style.borderColor = 'rgba(255,77,109,0.5)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = '#fff'
                          e.currentTarget.style.borderColor = 'rgba(255,77,109,0.3)'
                        }}
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Panel de confirmación de rechazo */}
              {isRejecting && (
                <div className="px-5 pb-5">
                  <div
                    className="rounded-xl p-5"
                    style={{
                      background: 'rgba(255,77,109,0.04)',
                      border: '1.5px solid rgba(255,77,109,0.2)',
                    }}
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff4d6d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <div>
                        <p className="font-body font-bold text-sm mb-1" style={{ color: '#0a1226' }}>
                          ¿Estás seguro de rechazar este usuario?
                        </p>
                        <p className="text-xs font-body" style={{ color: '#5f6e8a' }}>
                          Esta acción eliminará permanentemente la solicitud de <strong style={{ color: '#0a1226' }}>{u.nombre}</strong>. No se podrá deshacer.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setRejectingUser(null)}
                        disabled={rejectingInProgress}
                        className="px-4 py-2 rounded-lg text-xs font-body font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
                        style={{
                          background: '#fff',
                          border: '1px solid #f0eadb',
                          color: '#5f6e8a',
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => confirmReject(u.id)}
                        disabled={rejectingInProgress}
                        className="px-5 py-2 rounded-lg text-xs font-body font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                        style={{
                          background: rejectingInProgress 
                            ? 'rgba(255,77,109,0.3)' 
                            : 'linear-gradient(135deg, #ff4d6d 0%, #ff6b8a 100%)',
                          color: '#fff',
                          boxShadow: rejectingInProgress ? 'none' : '0 2px 8px rgba(255,77,109,0.3)',
                        }}
                      >
                        {rejectingInProgress && (
                          <span 
                            className="absolute inset-0"
                            style={{
                              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                              animation: 'shimmer 1.5s infinite',
                            }}
                          />
                        )}
                        <span className="relative inline-flex items-center gap-2">
                          {rejectingInProgress ? (
                            <>
                              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              Rechazando...
                            </>
                          ) : (
                            'Confirmar rechazo'
                          )}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Panel de aprobación expandido */}
              {isApproving && (
                <div className="px-5 pb-5">
                  <div
                    className="rounded-xl p-5 flex flex-col gap-5"
                    style={{
                      background: 'rgba(235,195,43,0.04)',
                      border: '1.5px solid rgba(235,195,43,0.15)',
                    }}
                  >

                    {/* Selector de área — solo Plan_pro */}
                    {isPro && (
                      <div>
                        <p className="text-[11px] font-body font-bold uppercase tracking-[0.15em] mb-3 flex items-center gap-2"
                          style={{ color: '#c99f16' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                          </svg>
                          Área de trabajo
                        </p>
                        {areas.length === 0 ? (
                          <div className="p-4 rounded-xl"
                            style={{
                              background: 'rgba(244,180,42,0.05)',
                              border: '1.5px solid rgba(244,180,42,0.2)',
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f4b42a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                              </svg>
                              <div>
                                <p className="text-xs font-body font-semibold mb-1" style={{ color: '#0a1226' }}>
                                  No hay áreas disponibles
                                </p>
                                <p className="text-[10px] font-body" style={{ color: '#5f6e8a' }}>
                                  Creá áreas primero en la sección de Gestión para poder asignar usuarios.
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {areas.map(a => {
                              const isActive = approvingUser.area_id === a.id
                              return (
                                <button
                                  key={a.id}
                                  type="button"
                                  onClick={() => setApprovingUser({ ...approvingUser, area_id: a.id })}
                                  className="px-4 py-2 rounded-full text-xs font-body font-bold transition-all"
                                  style={{
                                    background: isActive ? '#ebc32b' : '#fff',
                                    border: `1.5px solid ${isActive ? '#ebc32b' : '#f0eadb'}`,
                                    color: isActive ? '#0a1226' : '#5f6e8a',
                                  }}
                                >
                                  {a.nombre}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mensaje informativo para Plan_basic */}
                    {!isPro && (
                      <div
                        className="p-4 rounded-xl"
                        style={{
                          background: 'rgba(235,195,43,0.06)',
                          border: '1px solid rgba(235,195,43,0.15)',
                        }}
                      >
                        <p className="text-xs font-body flex items-start gap-2" style={{ color: '#5f6e8a' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c99f16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                          </svg>
                          <span>Al confirmar, el usuario quedará activo y podrá participar en todas las apuestas de la empresa.</span>
                        </p>
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div className="flex gap-3 justify-end pt-2">
                      <button
                        onClick={() => setApprovingUser(null)}
                        disabled={approvingInProgress}
                        className="px-5 py-2.5 rounded-xl text-xs font-body font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
                        style={{
                          background: '#fff',
                          border: '1.5px solid #f0eadb',
                          color: '#5f6e8a',
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => confirmApprove(u.id)}
                        disabled={approvingInProgress || (isPro && !approvingUser.area_id)}
                        className="px-6 py-2.5 rounded-xl text-xs font-body font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden"
                        style={{
                          background: approvingInProgress 
                            ? 'rgba(235,195,43,0.3)' 
                            : 'linear-gradient(135deg, #ebc32b 0%, #d4a017 100%)',
                          color: '#0a1226',
                          boxShadow: approvingInProgress ? 'none' : '0 2px 8px rgba(235,195,43,0.25)',
                        }}
                      >
                        {approvingInProgress && (
                          <span 
                            className="absolute inset-0"
                            style={{
                              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                              animation: 'shimmer 1.5s infinite',
                            }}
                          />
                        )}
                        <span className="relative inline-flex items-center gap-2">
                          {approvingInProgress ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              Aprobando...
                            </>
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Confirmar aprobación
                            </>
                          )}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )}
  </div>
)}

        {/* TAB: Usuarios Activos */}
        {tab === 'UsuariosActivos' && (
          <div className="animate-fade-in delay-2">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="font-display text-2xl md:text-3xl tracking-wide"
                  style={{ color: '#0a1226', letterSpacing: '0.02em' }}>
                  USUARIOS ACTIVOS
                </h2>
                {activeUsers.length > 0 && (
                  <p className="text-sm font-body mt-1.5" style={{ color: '#5f6e8a' }}>
                    {activeUsers.length} {activeUsers.length === 1 ? 'usuario aprobado' : 'usuarios aprobados'}
                  </p>
                )}
              </div>

              <button
                onClick={loadActiveUsers}
                disabled={loadingActiveUsers}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-body font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                style={{
                  background: loadingActiveUsers ? 'rgba(235,195,43,0.1)' : '#fff',
                  border: '1.5px solid #f0eadb',
                  color: loadingActiveUsers ? '#c99f16' : '#5f6e8a',
                  boxShadow: '0 1px 0 rgba(10,18,38,0.03)',
                }}
              >
                {loadingActiveUsers ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                    Actualizar
                  </>
                )}
              </button>
            </div>

            {/* Loading */}
            {loadingActiveUsers && activeUsers.length === 0 ? (
              <div className="text-center py-20">
                <span className="inline-block w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: '#ebc32b', borderTopColor: 'transparent' }} />
                <p className="font-body text-sm mt-4" style={{ color: '#5f6e8a' }}>
                  Cargando usuarios...
                </p>
              </div>
            ) : activeUsers.length === 0 ? (
              /* Empty */
              <div
                className="rounded-2xl p-16 text-center"
                style={{
                  background: '#fff',
                  border: '1.5px dashed #f0eadb',
                  boxShadow: '0 1px 0 rgba(10,18,38,0.03)',
                }}
              >
                <p className="font-body font-semibold text-lg mb-2" style={{ color: '#0a1226' }}>
                  Todavía no hay usuarios activos
                </p>
                <p className="font-body text-sm max-w-md mx-auto" style={{ color: '#5f6e8a' }}>
                  A medida que apruebes solicitudes pendientes, los usuarios van a aparecer acá.
                </p>
              </div>
            ) : (
              /* Tabla / lista */
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: '#fff',
                  border: '1.5px solid #f0eadb',
                  boxShadow: '0 1px 0 rgba(10,18,38,0.03)',
                }}
              >
                {/* Encabezado tabla */}
                <div
                  className="hidden md:grid gap-3 px-5 py-3 text-[10px] font-body font-bold uppercase tracking-[0.15em]"
                  style={{
                    gridTemplateColumns: '1.6fr 1.6fr 1fr 0.8fr 0.8fr 1fr',
                    background: 'rgba(235,195,43,0.06)',
                    color: '#c99f16',
                    borderBottom: '1px solid #f0eadb',
                  }}
                >
                  <span>Nombre</span>
                  <span>Email</span>
                  <span>Área</span>
                  <span>Tipo</span>
                  <span>Rol</span>
                  <span>Registrado</span>
                </div>

                {/* Filas */}
                {activeUsers.map((u, idx) => {
                  const area = areas.find(a => a.id === u.area_id)
                  const areaNombre = area?.nombre || (u.area_id ? '—' : 'Sin área')
                  return (
                    <div
                      key={u.id}
                      className="grid gap-3 px-5 py-4 items-center"
                      style={{
                        gridTemplateColumns: '1.6fr 1.6fr 1fr 0.8fr 0.8fr 1fr',
                        borderBottom: idx === activeUsers.length - 1 ? 'none' : '1px solid #f5efe3',
                      }}
                    >
                      {/* Nombre con avatar */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-display text-sm"
                          style={{
                            background: 'linear-gradient(135deg, #ebc32b 0%, #d4a017 100%)',
                            color: '#0a1226',
                          }}
                        >
                          {getInitials(u.nombre)}
                        </div>
                        <p className="font-body font-bold text-sm truncate" style={{ color: '#0a1226' }}>
                          {u.nombre}
                        </p>
                      </div>

                      {/* Email */}
                      <p className="font-body text-sm truncate" style={{ color: '#5f6e8a' }}>
                        {u.email}
                      </p>

                      {/* Área */}
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-body font-semibold w-fit"
                        style={{
                          background: area ? 'rgba(27,138,90,0.08)' : 'rgba(95,110,138,0.06)',
                          color: area ? '#1b8a5a' : '#9aa5b8',
                          border: `1px solid ${area ? 'rgba(27,138,90,0.2)' : 'rgba(95,110,138,0.15)'}`,
                        }}>
                        {areaNombre}
                      </span>

                      {/* Tipo usuario */}
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-body font-semibold w-fit uppercase tracking-wider"
                        style={{
                          background: u.tipo_usuario === 'jefe' ? 'rgba(235,195,43,0.1)' : 'rgba(12,24,43,0.05)',
                          color: u.tipo_usuario === 'jefe' ? '#c99f16' : '#5f6e8a',
                          border: `1px solid ${u.tipo_usuario === 'jefe' ? 'rgba(235,195,43,0.25)' : 'rgba(12,24,43,0.1)'}`,
                        }}>
                        {u.tipo_usuario === 'jefe' ? 'Jefe' : 'General'}
                      </span>

                      {/* Rol */}
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-body font-semibold w-fit uppercase tracking-wider"
                        style={{
                          background: u.rol === 'admin' ? 'rgba(224,50,82,0.07)' : 'rgba(12,24,43,0.05)',
                          color: u.rol === 'admin' ? '#e03252' : '#5f6e8a',
                          border: `1px solid ${u.rol === 'admin' ? 'rgba(224,50,82,0.2)' : 'rgba(12,24,43,0.1)'}`,
                        }}>
                        {u.rol}
                      </span>

                      {/* Fecha */}
                      <p className="font-body text-xs" style={{ color: '#5f6e8a' }}>
                        {formatDate(u.fecha_registro)}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}