export default function AdminTabs({
  tab,
  setTab,
  pendingCount = 0,
  activeBetsCount = 0,
}) {
  const C = {
    ink: '#0c182b',
    steel: '#5f6e8a',
    mute: '#a8b2c4',
    line: '#f0eadb',
    gold: '#FF7D00',
    goldSoft: 'rgba(255,125,0,.08)',
    goldBorder: 'rgba(255,125,0,.25)',
  }

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
        border: `1px solid ${C.line}`,
        boxShadow: '0 8px 24px rgba(12,24,43,0.05)',
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
              background: active ? C.ink : 'transparent',
              color: active ? C.gold : C.steel,
              border: active ? `1px solid ${C.goldBorder}` : '1px solid transparent',
              boxShadow: active ? '0 2px 10px rgba(12,24,43,.18)' : 'none',
            }}
          >
            <span>{item.label}</span>

            {item.count > 0 && (
              <span
                className="inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px]"
                style={{
                  background: active ? C.goldSoft : 'rgba(12,24,43,0.06)',
                  color: active ? C.gold : C.ink,
                  border: active ? `1px solid ${C.goldBorder}` : '1px solid rgba(12,24,43,.08)',
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