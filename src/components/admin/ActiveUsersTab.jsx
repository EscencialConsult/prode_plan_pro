import { formatDate } from '../../utils/index.js'

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() || '')
    .join('')
}

export default function ActiveUsersTab({
  activeTotal, loadingActiveUsers, loadActiveUsers,
  activeSearch, setActiveSearch, activePage, setActivePage,
  activeUsers, areas, activePageSize = 25
}) {
  return (
    <div className="animate-fade-in delay-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl md:text-3xl tracking-wide"
            style={{ color: '#0a1226', letterSpacing: '0.02em' }}>
            USUARIOS ACTIVOS
          </h2>
          {activeTotal > 0 && (
            <p className="text-sm font-body mt-1.5" style={{ color: '#5f6e8a' }}>
              {activeTotal} {activeTotal === 1 ? 'usuario aprobado' : 'usuarios aprobados'}
            </p>
          )}
        </div>

        <button
          onClick={() => loadActiveUsers(activePage, activeSearch)}
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

      {/* Barra de Búsqueda */}
      <div className="mb-6 flex gap-2 max-w-md">
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={activeSearch}
          onChange={e => setActiveSearch(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              setActivePage(0)
              loadActiveUsers(0, activeSearch)
            }
          }}
          className="w-full px-4 py-2.5 rounded-xl font-body text-sm outline-none border transition-all"
          style={{
            background: '#fff',
            border: '1.5px solid #f0eadb',
            color: '#0c182b',
          }}
        />
        <button
          onClick={() => {
            setActivePage(0)
            loadActiveUsers(0, activeSearch)
          }}
          className="px-5 py-2.5 rounded-xl text-xs font-body font-bold uppercase tracking-wider transition-all"
          style={{
            background: 'linear-gradient(135deg, #ebc32b 0%, #d4a017 100%)',
            color: '#0a1226',
            boxShadow: '0 2px 8px rgba(235,195,43,0.15)',
          }}
        >
          Buscar
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
        <>
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

        {/* Pagination controls for Active Users */}
        {activeTotal > activePageSize && (
          <div className="flex items-center justify-between mt-6 px-2">
            <span className="text-xs font-body" style={{ color: '#5f6e8a' }}>
              Mostrando {activePage * activePageSize + 1} - {Math.min((activePage + 1) * activePageSize, activeTotal)} de {activeTotal}
            </span>
            <div className="flex gap-2">
              <button
                disabled={activePage === 0 || loadingActiveUsers}
                onClick={() => {
                  const newPage = activePage - 1
                  setActivePage(newPage)
                  loadActiveUsers(newPage, activeSearch)
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all disabled:opacity-40"
                style={{ background: '#fff', borderColor: '#f0eadb', color: '#5f6e8a' }}
              >
                Anterior
              </button>
              <button
                disabled={(activePage + 1) * activePageSize >= activeTotal || loadingActiveUsers}
                onClick={() => {
                  const newPage = activePage + 1
                  setActivePage(newPage)
                  loadActiveUsers(newPage, activeSearch)
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all disabled:opacity-40"
                style={{ background: '#fff', borderColor: '#f0eadb', color: '#5f6e8a' }}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  )
}
