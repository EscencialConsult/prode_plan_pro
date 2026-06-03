export default function AdminHeader({ bets = [], pendingUsers = [], isPro = false }) {
  const activeBets   = bets.filter(b => b.estado === 'abierta').length
  const closedBets   = bets.filter(b => b.estado === 'cerrada').length
  const finishedBets = bets.filter(b => b.estado === 'finalizada').length
  const totalBets    = bets.length

  const stats = [
    { label:'Total Apuestas', value:totalBets,           color:'#111811', accent:'rgba(17,24,17,.06)',  border:'rgba(17,24,17,.1)',   icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> },
    { label:'Activas',        value:activeBets,          color:'#1b8a5a', accent:'rgba(27,138,90,.07)', border:'rgba(27,138,90,.18)', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49"/></svg> },
    { label:'Finalizadas',    value:finishedBets,        color:'#5A9E4A', accent:'rgba(134,200,115,.07)',border:'rgba(134,200,115,.2)',  icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
    { label:'Pendientes',     value:pendingUsers.length, color: pendingUsers.length > 0 ? '#e03252' : '#4a6b50', accent: pendingUsers.length > 0 ? 'rgba(224,50,82,.07)' : 'rgba(95,110,138,.05)', border: pendingUsers.length > 0 ? 'rgba(224,50,82,.2)' : 'rgba(95,110,138,.12)', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ]

  return (
    <div style={{ marginBottom: '1.25rem' }}>

      {/* Banner Card con Imagen de Fondo Responsiva */}
      <div 
        className="rounded-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 relative overflow-hidden animate-fade-in"
        style={{ 
          background: '#111811', 
          border: '1px solid rgba(134,200,115,.2)', 
          boxShadow: '0 12px 40px rgba(17,24,17,.15)' 
        }}
      >
        {/* Fondo banner responsivo con efecto verde duotono */}
        <picture className="absolute inset-0 z-0 pointer-events-none opacity-50 grayscale transition-opacity duration-700">
          <source media="(max-width: 640px)" srcSet="/imgprode/fondo-banner-mobile.png" />
          <img src="/imgprode/fondo-banner.png" alt="" className="w-full h-full object-cover" />
        </picture>
        
        {/* Capa 1: Filtro de color verde (Blend Mode) */}
        <div className="absolute inset-0 z-0 pointer-events-none mix-blend-multiply opacity-80"
             style={{ background: '#4a6b50' }} />
        
        {/* Capa 2: Gradiente oscuro a la izquierda para que el texto sea siempre legible */}
        <div className="absolute inset-0 z-0 pointer-events-none"
             style={{ background: 'linear-gradient(to right, #111811 5%, rgba(17,24,17,0.7) 40%, transparent 100%)' }} />

        <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
             style={{ background: 'radial-gradient(circle at 80% 20%, rgba(134,200,115,.2), transparent 65%)' }} />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <img src="/imgprode/one-prode-placa.png" alt="Logo" className="w-16 sm:w-20 object-contain hidden sm:block" />
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="font-body font-bold text-xs uppercase tracking-widest" style={{ color: 'rgba(134,200,115,.7)' }}>
                  PRODE CAMIONERO
                </span>
              </div>
              <h1 style={{ 
                fontFamily: "'Bebas Neue',sans-serif", 
                fontSize: 'clamp(1.7rem, 5.5vw, 3.2rem)', 
                color: '#fff', 
                margin: 0, 
                lineHeight: 1.1, 
                letterSpacing: '.02em',
                textAlign: 'left'
              }}>
                PANEL DE <span style={{ color: '#86C873' }}>CONFIGURACIÓN</span>
              </h1>
              <p className="font-body text-xs mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Gestioná apuestas, usuarios {isPro ? 'y áreas ' : ''}del Prode.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {stats.map(({ label, value, color, accent, border, icon }) => (
          <div key={label}
            className="bg-white rounded-[14px] p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3.5 transition-all duration-200 cursor-default hover:-translate-y-0.5 hover:shadow-md"
            style={{ 
              border: `1px solid ${border}`, 
              boxShadow: '0 1px 0 rgba(17,24,17,.04)' 
            }}>
            <div 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: accent, border: `1px solid ${border}`, color }}>
              {icon}
            </div>
            <div className="min-w-0">
              <p className="font-display text-xl sm:text-2.5xl leading-none m-0" style={{ color }}>{value}</p>
              <p className="font-body text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#8aaa8e] mt-1 sm:mt-1.5 truncate">{label}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}