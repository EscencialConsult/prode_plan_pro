import { useEffect } from 'react'

export default function AdminTabs({
  tab,
  setTab,
  pendingCount = 0,
  activeBetsCount = 0,
  isPro = false,
}) {
  const tabs = [
    {
      key: 'NuevaApuesta',
      label: 'Nueva Apuesta',
    },
    {
      key: 'ApuestasCreadas',
      label: 'Apuestas Creadas',
      count: activeBetsCount,
    },
    isPro && {
      key: 'Areas',
      label: 'Áreas',
    },
    {
      key: 'Usuarios',
      label: 'Usuarios',
      count: pendingCount,
    },
    {
      key: 'UsuariosActivos',
      label: 'Usuarios Activos',
    },
  ].filter(Boolean)

  return (
    <>
      <style>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="sm:hidden flex items-center justify-end gap-1 mb-2 pr-1 text-[10px] font-body font-bold text-[#5A9E4A] uppercase tracking-wider animate-pulse">
        <span>Deslizar para ver más opciones</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </div>

      <div
        className="mb-6 flex items-center gap-2 rounded-xl p-1 overflow-x-auto scrollbar-none"
        style={{
          background: 'rgba(255,255,255,0.75)',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {tabs.map(item => {
          const active = tab === item.key

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-body font-bold uppercase tracking-wider transition-all flex-shrink-0"
              style={{
                background: active ? '#161D17' : 'transparent',
                color: active ? '#86C873' : '#6B7280',
                border: active ? '1px solid rgba(134,200,115,0.45)' : '1px solid transparent',
              }}
            >
              <span>{item.label}</span>

              {item.count > 0 && (
                <span
                  className="inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] flex-shrink-0"
                  style={{
                    background: active ? 'rgba(134,200,115,0.18)' : 'rgba(22,29,23,0.08)',
                    color: active ? '#86C873' : '#161D17',
                  }}
                >
                  {item.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </>
  )
}