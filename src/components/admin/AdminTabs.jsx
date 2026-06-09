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
              background: active ? '#1f1f23' : 'transparent',
              color: active ? '#ffffff' : '#6B7280',
              border: active ? '1px solid rgba(192,39,39,0.55)' : '1px solid transparent',
            }}
          >
            <span>{item.label}</span>

            {item.count > 0 && (
              <span
                className="inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px]"
                style={{
                  background: active ? 'rgba(192,39,39,0.85)' : 'rgba(31,31,35,0.08)',
                  color: active ? '#ffffff' : '#1f1f23',
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