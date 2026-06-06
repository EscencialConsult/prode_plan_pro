import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function useCountdown(target) {
  const calc = () => {
    const d = new Date(target) - new Date()
    if (d <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    return {
      days: Math.floor(d / 86400000),
      hours: Math.floor((d % 86400000) / 3600000),
      minutes: Math.floor((d % 3600000) / 60000),
      seconds: Math.floor((d % 60000) / 1000),
    }
  }
  const [t, setT] = useState(calc)
  useEffect(() => { const id = setInterval(() => setT(calc()), 1000); return () => clearInterval(id) }, [])
  return t
}

const PREDS = [
  { user: 'M. García', pred: 'Argentina 2 – 1 España', pts: '+10' },
  { user: 'C. López',  pred: 'Brasil 1 – 1 Francia',  pts: '+5'  },
  { user: 'P. Romero', pred: 'Uruguay 3 – 0 México',  pts: '+10' },
]

export default function HomeHero() {
  const cd = useCountdown('2026-06-11T19:00:00')

  return (
    <>
      <style>{`
        @keyframes float-medal-anim {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-12px) rotate(2deg); }
        }
        .float-medal-el { animation: float-medal-anim 5s ease-in-out infinite; }
      `}</style>

      <section className="relative min-h-screen text-white overflow-hidden flex items-center"
        style={{
          backgroundImage: "linear-gradient(180deg,rgba(255,255,255,.48) 0%,rgba(255,255,255,.18) 55%,rgba(255,255,255,.08) 100%), url('./imgprode/fondo-banner.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          paddingTop: 'clamp(100px, 12vh, 140px)',
          paddingBottom: 'clamp(60px, 8vh, 100px)',
        }}>

        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 50% at 85% 20%, rgba(255,255,255,.15), transparent 55%), radial-gradient(ellipse 50% 60% at 15% 90%, rgba(66,91,139,.28), transparent 60%)'
        }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1rem' }}
          className="relative z-10 w-full">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-14 items-center">

            {/* ── COLUMNA IZQUIERDA ── */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6">
              
              {/* Pills superiores */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="inline-flex items-center gap-1.5 font-body font-bold text-xs uppercase tracking-widest px-3.5 py-1.5 rounded-full"
                  style={{ color: '#0057B8', background: 'rgba(0, 87, 184, 0.08)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0057B8]" />
                  PRODE TALENTO
                </span>
                <span className="flex items-center gap-1.5 text-xs font-body font-bold uppercase tracking-widest" style={{ color: '#0B1F44' }}>
                  <span style={{ color: '#0B1F44', opacity: 0.6 }}>—</span>
                  CGCET
                </span>
              </div>

              {/* Títulos */}
              <div>
                <h1 className="font-display leading-none block text-[#0B1F44]" style={{ fontSize: 'clamp(1.8rem,8vw,5rem)', letterSpacing: '.01em' }}>
                  EL MUNDIAL
                </h1>
                <h1 className="font-display leading-none block" style={{ fontSize: 'clamp(2.8rem,12vw,7.5rem)', letterSpacing: '.01em', color: '#0057B8' }}>
                  SE VIVE
                </h1>
                <h1 className="font-display leading-none block text-[#0B1F44]" style={{ fontSize: 'clamp(1.8rem,8vw,5rem)', letterSpacing: '.01em' }}>
                  ACÁ ADENTRO
                </h1>
              </div>

              {/* Descripción */}
              <p className="font-body text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl" style={{ color: '#334155' }}>
                Pronosticá los partidos, sumá puntos y competí con tu equipo.
                El <strong className="font-bold" style={{ color: '#0057B8' }}>prode interno</strong> de tu empresa ya está activo.
              </p>

              {/* Pills de beneficios */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
                {[
                  {
                    label: 'Competencia sana',
                    sub: 'Entre equipos y áreas',
                    icon: (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    )
                  },
                  {
                    label: 'Más participación',
                    sub: 'Todos suman al clima',
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    )
                  },
                  {
                    label: 'Energía positiva',
                    sub: 'Unión desde el deporte',
                    icon: (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                    )
                  },
                ].map(({ label, sub, icon }) => (
                  <div key={label} className="flex items-center gap-3 rounded-full pl-2 pr-4 py-1.5 w-full sm:w-auto"
                    style={{ background: 'rgba(255,255,255,.78)', border: '1px solid rgba(0,87,184,.15)', backdropFilter: 'blur(6px)' }}>
                    <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#0057B8' }}>
                      {icon}
                    </span>
                    <div>
                      <p className="text-sm font-body font-semibold leading-tight" style={{ color: '#0B1F44' }}>{label}</p>
                      <p className="text-xs font-body leading-tight" style={{ color: '#5F6B7A' }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/register" className="font-body font-bold text-sm sm:text-base px-6 sm:px-7 py-3.5 sm:py-4 rounded-full inline-flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
                  style={{ background: '#0057B8', color: '#ffffff', boxShadow: '0 4px 14px rgba(0,87,184,.25)', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#00479A'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#0057B8'; e.currentTarget.style.transform = '' }}>
                  Crear mi cuenta
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
                <Link to="/login" className="font-body font-semibold text-sm sm:text-base px-6 sm:px-7 py-3.5 sm:py-4 rounded-full inline-flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
                  style={{ background: '#ffffff', color: '#0057B8', border: '1.5px solid #0057B8', textDecoration: 'none', boxShadow: '0 4px 14px rgba(0,87,184,.08)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.transform = '' }}>
                  Ya tengo cuenta
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
              </div>

              {/* Alert box */}
              <div className="flex items-center gap-4 p-4 rounded-2xl max-w-xl"
                style={{ background: 'rgba(255, 255, 255, 0.85)', border: '1px solid rgba(0, 87, 184, 0.1)', backdropFilter: 'blur(6px)' }}>
                <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0, 87, 184, 0.08)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#0057B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
                <p className="text-xs sm:text-sm font-body leading-relaxed" style={{ color: '#0B1F44' }}>
                  <strong className="font-bold">El Mundial comienza el 11 de junio.</strong><br />
                  Registrate antes de que arranque para no quedarte afuera del prode.
                </p>
              </div>
            </div>

            {/* ── COLUMNA DERECHA ── */}
            <div className="lg:col-span-5">
              {/* Medalla flotante */}
              <div className="relative mb-5 sm:mb-6 flex justify-center">
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,255,255,.72) 0%, rgba(255,255,255,.38) 30%, rgba(255,255,255,.12) 55%, transparent 75%)', filter: 'blur(40px)' }} />
                <img src="./imgprode/colegio-logo-azul.png" alt="Prode Talento" className="relative float-medal-el"
                  style={{ width: 'clamp(140px, 30vw, 180px)', filter: 'drop-shadow(0 0 28px rgba(255,255,255,.35)) drop-shadow(0 12px 24px rgba(0,0,0,.25))' }} />
              </div>

              {/* Panel principal */}
              <div className="rounded-2xl p-4 sm:p-5"
                style={{ background: '#ffffff', border: '1px solid rgba(0,87,184,.08)', backdropFilter: 'blur(6px)', boxShadow: '0 18px 40px rgba(2,6,23,.08)' }}>
                
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#0057B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                      <path d="M4 22h16" />
                      <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
                      <path d="M12 2a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4Z" />
                    </svg>
                    <span className="font-body text-xs font-bold uppercase tracking-widest" style={{ color: '#0B1F44' }}>MUNDIAL 2026</span>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-body font-bold uppercase tracking-widest" style={{ color: '#0057B8' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0057B8]" />
                    En vivo
                  </span>
                </div>

                <div className="mb-4 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(0,87,184,.12),transparent)' }} />

                {/* Countdown */}
                <p className="font-body font-bold text-xs uppercase tracking-widest mb-3 text-center" style={{ color: '#0B1F44' }}>
                  Falta para el inicio
                </p>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[{v:cd.days,l:'Días'},{v:cd.hours,l:'Horas'},{v:cd.minutes,l:'Min'},{v:cd.seconds,l:'Seg'}].map(({v,l}) => (
                    <div key={l} className="py-2.5 sm:py-3 text-center rounded-xl"
                        style={{ background: '#ffffff', border: '1px solid rgba(0,87,184,.12)', boxShadow: '0 2px 6px rgba(0,87,184,.04)' }}>
                      <div className="font-display leading-none font-bold" style={{ fontSize: 'clamp(1.4rem,5vw,2.2rem)', color: '#0057B8' }}>
                          {String(v).padStart(2,'0')}
                        </div>
                        <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-1.5 font-body" style={{ color: '#5F6B7A' }}>{l}</div>
                      </div>
                  ))}
                </div>

                <div className="mb-4 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(0,87,184,.06),transparent)' }} />

                {/* Predicciones recientes */}
                <p className="font-body font-bold text-xs uppercase tracking-widest mb-3.5" style={{ color: '#0057B8' }}>Predicciones recientes</p>
                <div className="space-y-3 mb-5">
                  {PREDS.map(({user,pred,pts}) => (
                    <div key={user} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-body font-bold text-xs"
                          style={{ background: 'rgba(0, 87, 184, 0.08)', color: '#0057B8' }}>{user[0]}</div>
                        <div className="min-w-0">
                          <div className="text-[#0B1F44] font-body font-semibold text-sm">{user}</div>
                          <div className="font-body text-xs truncate" style={{ color: '#5F6B7A' }}>{pred}</div>
                        </div>
                      </div>
                      <span className="font-body font-bold text-sm flex-shrink-0" style={{ color: '#0057B8' }}>{pts}</span>
                    </div>
                  ))}
                </div>

                {/* CTA final */}
                <Link to="/register" className="flex items-center justify-center gap-2 w-full font-body font-bold text-sm py-3.5 rounded-full transition-all"
                  style={{ background: '#0057B8', color: '#ffffff', textDecoration: 'none', boxShadow: '0 4px 12px rgba(0,87,184,0.15)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#00479A' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#0057B8' }}>
                  <span>Empezar a pronosticar</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}