import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'



const PREDS = [
  { user: 'M. García', pred: 'Argentina 2 – 1 España', pts: '+10' },
  { user: 'C. López',  pred: 'Brasil 1 – 1 Francia',  pts: '+5'  },
  { user: 'P. Romero', pred: 'Uruguay 3 – 0 México',  pts: '+10' },
]

export default function HomeHero() {

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

      <section className="relative min-h-0 md:min-h-screen text-white overflow-hidden flex flex-col justify-start md:justify-center"
        style={{
          backgroundImage: "linear-gradient(180deg,rgba(10,15,10,.40) 0%,rgba(17,24,17,.65) 70%,rgba(10,15,10,.95) 100%), var(--bg-banner)",
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          paddingTop: 'clamp(75px, 8vh, 100px)',
          paddingBottom: 'clamp(75px, 8vh, 110px)',
        }}>

        {/* Glow ambiental verde */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 50% at 85% 20%, rgba(134,200,115,.12), transparent 55%), radial-gradient(ellipse 50% 60% at 15% 90%, rgba(58,125,68,.22), transparent 60%)'
        }} />


        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1rem' }}
          className="relative z-10 w-full">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-14 items-center">

            {/* ── COLUMNA IZQUIERDA (Original, alineada a la izquierda) ── */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6">

              {/* Pills superiores */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="inline-flex items-center gap-2 font-body font-bold text-xs uppercase tracking-widest px-3 py-1.5 rounded-full"
                  style={{ border: '1px solid rgba(134,200,115,.45)', color: '#86C873', background: 'rgba(134,200,115,.08)' }}>
                  <span className="w-2 h-2 rounded-full pulse-dot-el" style={{ background: '#86C873' }} />
                  PRODE LUIS BARRIONUEVO
                </span>
                <span className="hidden sm:flex items-center gap-2 text-xs font-body font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,.55)' }}>
                  <span className="h-px w-6" style={{ background: 'rgba(134,200,115,.4)' }} />
                  SINDICATO DE CAMIONEROS
                </span>
              </div>

              {/* Títulos */}
              <div>
                <h1 className="font-display leading-none block text-white" style={{ fontSize: 'clamp(1.8rem,8vw,5rem)', letterSpacing: '.01em' }}>
                  EL MUNDIAL
                </h1>
                <h1 className="font-display leading-none block" style={{ fontSize: 'clamp(2.8rem,12vw,7.5rem)', letterSpacing: '.01em', color: '#86C873', textShadow: '0 0 40px rgba(134,200,115,.4)' }}>
                  SE VIVE
                </h1>
                <h1 className="font-display leading-none block text-white" style={{ fontSize: 'clamp(1.8rem,8vw,5rem)', letterSpacing: '.01em' }}>
                  ACÁ ADENTRO
                </h1>
              </div>

              {/* Descripción */}
              <p className="font-body text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl" style={{ color: 'rgba(255,255,255,.82)' }}>
                Pronosticá los partidos, sumá puntos y competí con tus compañeros.
                El <strong className="font-bold text-white">prode del sindicato</strong> ya está activo.
              </p>

              {/* Pills de beneficios */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
                {[
                  { label: 'Competencia sana', sub: 'Entre compañeros', bg: 'linear-gradient(135deg,#86C873,#5A9E4A)', ic: '#0a0f0a' },
                  { label: 'Más unión', sub: 'El sindicato juega junto', bg: 'linear-gradient(135deg,#5a825a,#3a5c3a)', ic: '#fff' },
                  { label: 'Energía positiva', sub: 'Deporte y compañerismo', bg: 'linear-gradient(135deg,#3A7D44,#2a5c32)', ic: '#fff' },
                ].map(({ label, sub, bg, ic }) => (
                  <div key={label} className="flex items-center gap-3 rounded-full pl-2 pr-4 py-1.5 w-full sm:w-auto"
                    style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(134,200,115,.15)', backdropFilter: 'blur(6px)' }}>
                    <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke={ic} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-body font-semibold text-white leading-tight">{label}</p>
                      <p className="text-xs font-body leading-tight" style={{ color: 'rgba(255,255,255,.5)' }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/register" className="font-body font-bold text-sm sm:text-base px-6 sm:px-7 py-3.5 sm:py-4 rounded-full inline-flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
                  style={{ background: 'linear-gradient(135deg,#86C873,#5A9E4A)', color: '#0a0f0a', boxShadow: '0 8px 24px rgba(134,200,115,.3)', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 32px rgba(134,200,115,.5)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(134,200,115,.3)'; e.currentTarget.style.transform = '' }}>
                  Crear mi cuenta
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
                <Link to="/login" className="font-body font-semibold text-sm sm:text-base px-6 sm:px-7 py-3.5 sm:py-4 rounded-full inline-flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
                  style={{ color: '#fff', border: '1.5px solid rgba(255,255,255,.25)', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#86C873'; e.currentTarget.style.color = '#86C873' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.25)'; e.currentTarget.style.color = '#fff' }}>
                  Ya tengo cuenta →
                </Link>
              </div>

              {/* Alert box */}
              <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg max-w-xl"
                style={{ background: 'linear-gradient(135deg,rgba(184,69,46,.12),rgba(184,69,46,.05))', border: '1px solid rgba(184,69,46,.35)', borderLeft: '3px solid #b8452e' }}>
                <svg viewBox="0 0 24 24" fill="#b8452e" className="w-5 h-5 shrink-0 mt-0.5"><path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/></svg>
                <p className="text-xs sm:text-sm font-body leading-relaxed" style={{ color: 'rgba(255,255,255,.88)' }}>
                  <strong className="text-white">El Mundial comienza el 11 de junio.</strong>{' '}
                  Registrate antes de que arranque para no perderte los primeros partidos.
                </p>
              </div>
            </div>

            {/* ── COLUMNA DERECHA (Completamente limpia y vacía) ── */}
            <div className="lg:col-span-5" />

          </div>
        </div>

        {/* Wave hero → cream */}
        <svg className="absolute bottom-0 left-0 w-full" style={{ display: 'block', height: 100, marginBottom: -2 }}
          viewBox="0 0 1440 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="hero-wave-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#111811" stopOpacity="0" />
              <stop offset="100%" stopColor="#111811" stopOpacity="1" />
            </linearGradient>
          </defs>
          <rect width="1440" height="100" fill="url(#hero-wave-grad)" />
          <path d="M0,60 C240,100 480,15 720,35 C960,55 1200,100 1440,60 L1440,100 L0,100 Z" fill="#f0f5ee" />
        </svg>
      </section>
    </>
  )
}