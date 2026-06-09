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
        @keyframes pulse-dot-anim { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.45;transform:scale(.8)} }
        .pulse-dot-el { animation: pulse-dot-anim 1.6s ease infinite; }
      `}</style>

      <section className="relative min-h-screen overflow-hidden flex items-center"
        style={{
          backgroundImage: "linear-gradient(100deg, rgba(15,17,21,.78) 0%, rgba(15,17,21,.58) 42%, rgba(15,17,21,.34) 72%, rgba(15,17,21,.42) 100%), url('./imgprode/fondo-banner.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 28%',
          color: '#ffffff',
          paddingTop: 'clamp(80px, 10vh, 120px)',
          paddingBottom: 'clamp(90px, 12vh, 140px)',
        }}>

        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 55% 45% at 85% 18%, rgba(192,39,39,.12), transparent 60%)'
        }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1rem' }}
          className="relative z-10 w-full">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-14 items-center">

            {/* ── COLUMNA IZQUIERDA ── */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6">

              {/* Pills superiores */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="inline-flex items-center gap-2 font-body font-bold text-xs uppercase tracking-widest px-3 py-1.5 rounded-full"
                  style={{ border: '1px solid rgba(255,255,255,.25)', color: '#ffffff', background: 'rgba(255,255,255,.12)', backdropFilter: 'blur(6px)' }}>
                  <span className="w-2 h-2 rounded-full pulse-dot-el" style={{ background: '#ff5a52' }} />
                  Prode Talento
                </span>
                <span className="hidden sm:flex items-center gap-2 text-xs font-body font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,.7)' }}>
                  <span className="h-px w-6" style={{ background: 'rgba(255,255,255,.4)' }} />
                  BERCOVICH
                </span>
              </div>

              {/* Títulos */}
              <div style={{ textShadow: '0 2px 16px rgba(0,0,0,.45)' }}>
                <h1 className="font-display leading-none block" style={{ fontSize: 'clamp(1.8rem,8vw,5rem)', letterSpacing: '.01em', color: '#ffffff' }}>
                  EL MUNDIAL
                </h1>
                <h1 className="font-display leading-none block" style={{ fontSize: 'clamp(2.8rem,12vw,7.5rem)', letterSpacing: '.01em', color: '#e23a34' }}>
                  SE VIVE
                </h1>
                <h1 className="font-display leading-none block" style={{ fontSize: 'clamp(1.8rem,8vw,5rem)', letterSpacing: '.01em', color: '#ffffff' }}>
                  ACÁ ADENTRO
                </h1>
              </div>

              {/* Descripción */}
              <p className="font-body text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl" style={{ color: 'rgba(255,255,255,.88)', textShadow: '0 1px 8px rgba(0,0,0,.4)' }}>
                Pronosticá los partidos, sumá puntos y competí con tu equipo.
                El <strong className="font-bold" style={{ color: '#ffffff' }}>prode interno</strong> de tu empresa ya está activo.
              </p>

              {/* Pills de beneficios */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
                {[
                  { label: 'Competencia sana', sub: 'Entre equipos y áreas', bg: '#c02727', ic: '#fff' },
                  { label: 'Más participación', sub: 'Todos suman al clima', bg: '#6e6f73', ic: '#fff' },
                  { label: 'Energía positiva', sub: 'Unión desde el deporte', bg: '#1b8a5a', ic: '#fff' },
                ].map(({ label, sub, bg, ic }) => (
                  <div key={label} className="flex items-center gap-3 rounded-full pl-2 pr-4 py-1.5 w-full sm:w-auto"
                    style={{ background: '#ffffff', border: '1px solid #e4e4e7', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
                    <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke={ic} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-body font-semibold leading-tight" style={{ color: '#232327' }}>{label}</p>
                      <p className="text-xs font-body leading-tight" style={{ color: '#8a8b90' }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/register" className="font-body font-bold text-sm sm:text-base px-6 sm:px-7 py-3.5 sm:py-4 rounded-full inline-flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
                  style={{ background: '#c02727', color: '#fff', boxShadow: '0 8px 22px rgba(192,39,39,.25)', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#a81f1f'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#c02727'; e.currentTarget.style.transform = '' }}>
                  Crear mi cuenta
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
                <Link to="/login" className="font-body font-semibold text-sm sm:text-base px-6 sm:px-7 py-3.5 sm:py-4 rounded-full inline-flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
                  style={{ color: '#ffffff', border: '1.5px solid rgba(255,255,255,.45)', textDecoration: 'none', backdropFilter: 'blur(4px)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.45)'; e.currentTarget.style.background = 'transparent' }}>
                  Ya tengo cuenta →
                </Link>
              </div>

              {/* Alert box */}
              <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg max-w-xl"
                style={{ background: 'rgba(192,39,39,.2)', border: '1px solid rgba(255,255,255,.18)', borderLeft: '3px solid #e23a34', backdropFilter: 'blur(6px)' }}>
                <svg viewBox="0 0 24 24" fill="#ff5a52" className="w-5 h-5 shrink-0 mt-0.5"><path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/></svg>
                <p className="text-xs sm:text-sm font-body leading-relaxed" style={{ color: 'rgba(255,255,255,.9)' }}>
                  <strong style={{ color: '#ffffff' }}>El Mundial comienza el 11 de junio.</strong>{' '}
                  Registrate antes de que arranque para no perderte los primeros partidos.
                </p>
              </div>
            </div>

            {/* ── COLUMNA DERECHA ── */}
            <div className="lg:col-span-5">
              {/* Medalla flotante */}
              <div className="relative mb-5 sm:mb-6 flex justify-center">
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(192,39,39,.3), transparent 62%)', filter: 'blur(30px)' }} />
                <img src="./imgprode/one-prode-dorado.png" alt="Prode Talento" className="relative float-medal-el"
                  style={{ width: 'clamp(140px, 30vw, 180px)', filter: 'drop-shadow(0 16px 32px rgba(0,0,0,.5))' }} />
              </div>

              {/* Panel principal */}
              <div className="rounded-2xl p-4 sm:p-5"
                style={{ background: '#ffffff', border: '1px solid #e4e4e7', boxShadow: '0 20px 50px rgba(0,0,0,.10)' }}>

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-body text-xs uppercase tracking-widest font-bold" style={{ color: '#232327' }}>Mundial 2026</span>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-body font-bold uppercase tracking-widest" style={{ color: '#c02727' }}>
                    <span className="w-1.5 h-1.5 rounded-full pulse-dot-el" style={{ background: '#c02727' }} />
                    En vivo
                  </span>
                </div>

                <div className="mb-4 h-px" style={{ background: '#e4e4e7' }} />

                {/* Countdown */}
                <p className="font-body font-bold text-xs uppercase tracking-widest mb-3 text-center" style={{ color: '#8a8b90' }}>
                  Falta para el inicio
                </p>
                <div className="grid grid-cols-4 gap-1.5 mb-4">
                  {[{v:cd.days,l:'Días'},{v:cd.hours,l:'Horas'},{v:cd.minutes,l:'Min'},{v:cd.seconds,l:'Seg'}].map(({v,l}) => (
                    <div key={l} className="py-2 sm:py-3 text-center rounded-lg"
                      style={{ background: '#f4f4f5', border: '1px solid #e4e4e7' }}>
                      <div className="font-display leading-none" style={{ fontSize: 'clamp(1.2rem,5vw,2rem)', color: '#232327' }}>
                        {String(v).padStart(2,'0')}
                      </div>
                      <div className="text-[10px] sm:text-xs uppercase tracking-wider mt-1 font-body" style={{ color: '#8a8b90' }}>{l}</div>
                    </div>
                  ))}
                </div>

                <div className="mb-4 h-px" style={{ background: '#e4e4e7' }} />

                {/* Predicciones recientes */}
                <p className="font-body font-bold text-xs uppercase tracking-widest mb-3" style={{ color: '#8a8b90' }}>Predicciones recientes</p>
                <div className="space-y-2.5 mb-4">
                  {PREDS.map(({user,pred,pts}) => (
                    <div key={user} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-body font-bold text-xs"
                          style={{ background: '#f0f0f2', color: '#6e6f73' }}>{user[0]}</div>
                        <div className="min-w-0">
                          <div className="font-body font-semibold text-xs" style={{ color: '#232327' }}>{user}</div>
                          <div className="font-body text-[10px] sm:text-xs truncate" style={{ color: '#8a8b90' }}>{pred}</div>
                        </div>
                      </div>
                      <span className="font-body font-bold text-xs flex-shrink-0" style={{ color: '#c02727' }}>{pts}</span>
                    </div>
                  ))}
                </div>

                {/* CTA final */}
                <Link to="/register" className="flex items-center justify-center gap-2 w-full font-body font-bold text-sm py-3 sm:py-3.5 rounded-full transition-all"
                  style={{ background: '#c02727', color: '#fff', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#a81f1f' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#c02727' }}>
                  Empezar a pronosticar
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Wave de transición hero (oscuro) → sección clara (#f4f4f5) */}
        <svg className="absolute bottom-0 left-0 w-full" style={{ display: 'block', height: 90, marginBottom: -2 }}
          viewBox="0 0 1440 90" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,55 C240,90 480,20 720,38 C960,56 1200,90 1440,55 L1440,90 L0,90 Z" fill="#f4f4f5" />
        </svg>
      </section>
    </>
  )
}
