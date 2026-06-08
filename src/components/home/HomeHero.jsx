import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Trophy, Users, Heart, Sparkles, Calendar } from 'lucide-react'
import AlianzaMark from '../brand/AlianzaMark.jsx'

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
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000)
    return () => clearInterval(id)
  }, [])
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
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-12px) rotate(1.5deg); }
        }
        .float-medal-el { animation: float-medal-anim 6s ease-in-out infinite; }
        @keyframes pulse-dot-anim { 
          0%, 100% { opacity: 1; transform: scale(1); } 
          50%      { opacity: 0.4; transform: scale(0.8); } 
        }
        .pulse-dot-el { animation: pulse-dot-anim 1.8s ease infinite; }
      `}</style>

      <section 
        className="relative min-h-screen text-white overflow-hidden flex items-center bg-[#05090f]"
        style={{
          backgroundImage: "linear-gradient(180deg, rgba(5, 9, 15, 0.6) 0%, rgba(12, 24, 43, 0.82) 55%, rgba(12, 24, 43, 0.98) 100%), url('./imgprode/fondo-banner.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          paddingTop: 'clamp(90px, 12vh, 140px)',
          paddingBottom: 'clamp(80px, 10vh, 120px)',
        }}
      >
        {/* Background Decorative Radial Gradients */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle 800px at 85% 20%, rgba(166, 201, 52, 0.12), transparent 70%), radial-gradient(circle 600px at 15% 90%, rgba(14, 93, 168, 0.22), transparent 70%)'
        }} />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* ── LEFT COLUMN: Text & Info ── */}
            <div className="lg:col-span-7 space-y-7 sm:space-y-8">
              
              {/* Top Pills */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 font-body font-bold text-xs uppercase tracking-widest px-3.5 py-1.5 rounded-full border border-accent/30 text-accent bg-accent/8">
                  <span className="w-2 h-2 rounded-full bg-green-400 pulse-dot-el" />
                  Prode Alianza Seguros
                </span>
                <span className="hidden sm:flex items-center gap-2 text-xs font-body font-semibold uppercase tracking-widest text-slate-400">
                  <span className="h-px w-6 bg-accent/40" />
                  Grupo Asegurador
                </span>
              </div>

              {/* Title Headers */}
              <div className="space-y-1">
                <h1 className="font-display leading-none block text-white text-5xl sm:text-7xl lg:text-8xl tracking-tight">
                  EL MUNDIAL
                </h1>
                <h1 className="font-display leading-none block text-accent text-6xl sm:text-8xl lg:text-9xl tracking-tight filter drop-shadow-[0_0_35px_rgba(166,201,52,0.3)]">
                  SE VIVE
                </h1>
                <h1 className="font-display leading-none block text-white text-5xl sm:text-7xl lg:text-8xl tracking-tight">
                  ACÁ ADENTRO
                </h1>
              </div>

              {/* Description Tagline */}
              <p className="font-body text-base sm:text-lg lg:text-xl leading-relaxed text-slate-300 max-w-xl">
                Pronosticá los partidos, sumá puntos y competí con tu equipo.
                El <strong className="font-bold text-white border-b border-accent/30 pb-0.5">prode interno</strong> de tu empresa ya está activo.
              </p>

              {/* Feature Benefit Badges */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
                {[
                  { label: 'Competencia sana', sub: 'Entre equipos y áreas', icon: Trophy, bg: 'bg-gradient-to-br from-accent to-[#0e5da8]', text: 'text-[#040D1D]' },
                  { label: 'Más participación', sub: 'Todos suman al clima', icon: Users, bg: 'bg-gradient-to-br from-[#6e83ad] to-[#425b8b]', text: 'text-white' },
                  { label: 'Energía positiva', sub: 'Unión desde el deporte', icon: Heart, bg: 'bg-gradient-to-br from-[#1b8a5a] to-[#146a46]', text: 'text-white' },
                ].map(({ label, sub, icon: Icon, bg, text }) => (
                  <div 
                    key={label} 
                    className="flex items-center gap-3.5 rounded-2xl pl-2.5 pr-5 py-2 w-full sm:w-auto bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/8 hover:border-white/15 transition-all duration-300"
                  >
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${bg} ${text}`}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <div>
                      <p className="text-[13px] font-body font-bold text-white leading-tight">{label}</p>
                      <p className="text-xs font-body text-slate-400 mt-0.5 leading-tight">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Call to Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
                <Link 
                  to="/register" 
                  className="font-body font-bold text-sm sm:text-base px-7 py-4 rounded-full inline-flex items-center justify-center gap-2 bg-accent text-[#040D1D] hover:bg-[#bde04b] hover:text-[#040D1D] hover:shadow-[0_8px_30px_rgba(166,201,52,0.45)] hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-300 w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
                >
                  Crear mi cuenta
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link 
                  to="/login" 
                  className="font-body font-semibold text-sm sm:text-base px-7 py-4 rounded-full inline-flex items-center justify-center gap-2 border border-slate-700 text-slate-200 hover:text-white hover:border-slate-400 hover:bg-white/5 active:scale-98 transition-all duration-200 w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Ya tengo cuenta
                </Link>
              </div>

              {/* Warning Alert Box */}
              <div className="flex items-start gap-3.5 p-4 rounded-2xl max-w-xl bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/30 border-l-[4px] border-l-red-500 shadow-lg">
                <Calendar className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm font-body leading-relaxed text-slate-300">
                  <strong className="text-white font-bold">El Mundial comienza el 11 de junio.</strong>{' '}
                  Registrate antes de que arranque para no perderte los primeros partidos.
                </p>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Logo Mark & Countdown Widget ── */}
            <div className="lg:col-span-5 flex flex-col items-center">
              
              {/* Floating brand mark medal */}
              <div className="relative mb-8 flex justify-center w-full">
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle 180px, rgba(166,201,52,0.22), transparent 70%)', filter: 'blur(30px)' }} />
                <div className="relative float-medal-el filter drop-shadow-[0_16px_36px_rgba(0,0,0,0.65)] hover:scale-105 transition-transform duration-300 cursor-pointer">
                  <AlianzaMark size={160} />
                </div>
              </div>

              {/* Glassmorphic countdown panel */}
              <div className="w-full max-w-md rounded-2xl p-5 sm:p-6 bg-slate-950/65 backdrop-blur-xl border border-accent/20 shadow-2xl relative">
                
                {/* Panel Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <AlianzaMark size={20} color="#fff" />
                    <span className="font-body text-[11px] font-bold uppercase tracking-widest text-slate-400">· Mundial 2026</span>
                  </div>
                  <span className="flex items-center gap-1.5 text-[10px] font-body font-bold uppercase tracking-widest text-accent">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot-el" />
                    En vivo
                  </span>
                </div>

                <div className="mb-5 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

                {/* Countdown Timer */}
                <p className="font-body font-bold text-[10px] uppercase tracking-widest mb-3.5 text-center text-accent">
                  Falta para el inicio
                </p>
                <div className="grid grid-cols-4 gap-2.5 mb-5">
                  {[
                    { v: cd.days, l: 'Días' },
                    { v: cd.hours, l: 'Horas' },
                    { v: cd.minutes, l: 'Min' },
                    { v: cd.seconds, l: 'Seg' }
                  ].map(({ v, l }) => (
                    <div 
                      key={l} 
                      className="py-3.5 text-center rounded-xl bg-accent/5 border border-accent/15 hover:border-accent/30 hover:bg-accent/8 transition-all duration-300"
                    >
                      <div className="font-display leading-none text-2xl sm:text-3xl text-accent font-extrabold tracking-wide">
                        {String(v).padStart(2, '0')}
                      </div>
                      <div className="text-[10px] uppercase tracking-widest mt-1.5 font-body text-slate-400 font-bold">{l}</div>
                    </div>
                  ))}
                </div>

                <div className="mb-5 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

                {/* Recent predictions activity feed */}
                <div className="flex items-center gap-1.5 mb-4">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <p className="font-body font-bold text-[11px] uppercase tracking-widest text-accent">Predicciones recientes</p>
                </div>
                
                <div className="space-y-3 mb-6">
                  {PREDS.map(({ user, pred, pts }) => (
                    <div 
                      key={user} 
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-colors duration-250"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-body font-bold text-xs bg-slate-800 text-slate-300 border border-slate-700/50">
                          {user[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="text-white font-body font-bold text-xs">{user}</div>
                          <div className="font-body text-xs text-slate-400 truncate mt-0.5">{pred}</div>
                        </div>
                      </div>
                      <span className="font-body font-bold text-xs flex-shrink-0 text-accent bg-accent/10 px-2 py-1 rounded-lg">
                        {pts}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Call to Action Button */}
                <Link 
                  to="/register" 
                  className="flex items-center justify-center gap-2 w-full font-body font-bold text-sm py-3.5 rounded-xl bg-accent text-[#040D1D] hover:bg-[#bde04b] hover:text-[#040D1D] hover:shadow-[0_4px_20px_rgba(166,201,52,0.3)] active:scale-98 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Empezar a pronosticar
                  <ArrowRight className="w-4.5 h-4.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Wave Divider at Bottom */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none">
          <svg 
            className="relative block w-full" 
            style={{ height: 100, marginBottom: -2 }}
            viewBox="0 0 1440 100" 
            preserveAspectRatio="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="hero-wave-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#081730" stopOpacity="0" />
                <stop offset="100%" stopColor="#081730" stopOpacity="1" />
              </linearGradient>
            </defs>
            <rect width="1440" height="100" fill="url(#hero-wave-grad)" />
            <path d="M0,60 C240,100 480,15 720,35 C960,55 1200,100 1440,60 L1440,100 L0,100 Z" fill="#f4f7fa" />
          </svg>
        </div>
      </section>
    </>
  )
}