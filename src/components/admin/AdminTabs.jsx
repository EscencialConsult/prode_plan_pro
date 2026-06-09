import { useEffect } from 'react'

export default function AdminTabs({
  tab,
  setTab,
  pendingCount = 0,
  activeBetsCount = 0,
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
    {
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
  ]

  return (
    <div
      className="mb-6 flex items-center gap-2 rounded-xl p-1"
      style={{
        background: 'rgba(255,255,255,0.75)',
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
      }}
    >
      {tabs.map(item => {
        const active = tab === item.key

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-body font-bold uppercase tracking-wider transition-all"
            style={{
              background: active ? '#071A3A' : 'transparent',
              color: active ? '#7dd3fc' : '#6B7280',
              border: active ? '1px solid rgba(125,211,252,0.45)' : '1px solid transparent',
            }}
          >
            <span>{item.label}</span>

            {item.count > 0 && (
              <span
                className="inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px]"
                style={{
                  background: active ? 'rgba(125,211,252,0.18)' : 'rgba(7,26,58,0.08)',
                  color: active ? '#7dd3fc' : '#071A3A',
                }}
              >
                {item.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}