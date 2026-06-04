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
          backgroundImage: "linear-gradient(180deg,rgba(10,15,10,.35) 0%,rgba(17,24,17,.60) 70%,rgba(10,15,10,.95) 100%), url(/imgprode/stock/argentinagol.jpg)",
          backgroundSize: 'cover',
          backgroundPosition: 'center 25%',
          paddingTop: 'clamp(115px, 12vh, 140px)',
          paddingBottom: 'clamp(75px, 8vh, 110px)',
        }}>

        {/* Glow ambiental celeste/blanco de Argentina */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 50% at 85% 20%, rgba(123,163,192,.22), transparent 55%), radial-gradient(ellipse 50% 60% at 15% 90%, rgba(255,255,255,.12), transparent 60%)'
        }} />


        <div className="max-w-[1200px] w-full mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-12 gap-8 items-center">

            {/* ── COLUMNA IZQUIERDA (Info y textos) ── */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-left">
              {/* Badge de campaña */}
              <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-2 rounded-full"
                style={{ background: 'rgba(134,200,115,.18)', border: '1px solid rgba(134,200,115,.4)' }}>
                <span className="w-2 h-2 rounded-full pulse-dot-el" style={{ background: '#86C873', boxShadow: '0 0 8px #86C873' }} />
                <span className="text-[10px] sm:text-xs font-body font-bold uppercase tracking-widest text-[#86C873]">
                  🇦🇷 PRODE CAMIONERO - LUIS BARRIONUEVO 2026
                </span>
                <span style={{ color: 'rgba(255,255,255,.25)' }}>|</span>
                <span className="text-[10px] sm:text-xs font-body font-bold uppercase tracking-widest text-white">
                  ★ MOYANO CONDUCCIÓN
                </span>
              </div>

              {/* Titular */}
              <div className="space-y-2">
                <h1 className="font-display leading-[0.9] tracking-tight uppercase"
                  style={{ fontSize: 'clamp(2.5rem, 7vw, 4.8rem)' }}>
                  CAMINO
                  <br />
                  <span style={{
                    color: '#7BA3C0',
                    textShadow: '0 0 45px rgba(123,163,192,0.5)',
                  }}>
                    A LA GLORIA
                  </span>
                  <br />
                  CON LA SELECCIÓN
                </h1>
                <p className="text-sm sm:text-base font-body leading-relaxed max-w-xl" style={{ color: 'rgba(255,255,255,.75)' }}>
                  Pronosticá los partidos, sumá puntos y competí con tus compañeros. El prode oficial impulsado por la agrupación <strong className="text-white">Moyano Conducción</strong> ya está activo.
                </p>
              </div>

              {/* Features inline */}
              <div className="grid sm:grid-cols-3 gap-4 py-2">
                {[
                  ['Moyano Conducción', 'Fuerza y Lealtad'],
                  ['Más unión', 'Juntos por la victoria'],
                  ['Celeste y blanca', 'Pasión nacional'],
                ].map(([label, sub]) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(123,163,192,.18)', border: '1px solid rgba(123,163,192,.3)', color: '#7BA3C0' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
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
                  style={{ background: 'linear-gradient(135deg,#7BA3C0,#4A84B0)', color: '#fff', boxShadow: '0 8px 24px rgba(123,163,192,.35)', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 32px rgba(123,163,192,.55)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(123,163,192,.35)'; e.currentTarget.style.transform = '' }}>
                  Crear mi cuenta
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
                <Link to="/login" className="font-body font-semibold text-sm sm:text-base px-6 sm:px-7 py-3.5 sm:py-4 rounded-full inline-flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
                  style={{ color: '#fff', border: '1.5px solid rgba(255,255,255,.25)', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#7BA3C0'; e.currentTarget.style.color = '#7BA3C0' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.25)'; e.currentTarget.style.color = '#fff' }}>
                  Ya tengo cuenta →
                </Link>
              </div>

              {/* Alert box */}
              <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg max-w-xl"
                style={{ background: 'linear-gradient(135deg,rgba(123,163,192,.18),rgba(10,15,10,.05))', border: '1px solid rgba(123,163,192,.35)', borderLeft: '3px solid #7BA3C0' }}>
                <span className="text-xl shrink-0 mt-px text-[#7BA3C0]">★</span>
                <p className="text-xs sm:text-sm font-body leading-relaxed" style={{ color: 'rgba(255,255,255,.88)' }}>
                  <strong className="text-white">PRODE MOYANO CONDUCCIÓN.</strong>{' '}
                  El Mundial comienza el 11 de junio. Registrate antes de que arranque para sumarte a la jugada con toda la agrupación de Camioneros.
                </p>
              </div>
            </div>

            {/* ── COLUMNA DERECHA (Con Imagen de la Selección Argentina y frase) ── */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="float-medal-el rounded-2xl p-5 max-w-md w-full"
                style={{
                  background: 'rgba(10,15,10,0.75)',
                  border: '1.5px solid rgba(123,163,192,.35)',
                  boxShadow: '0 24px 64px rgba(0,0,0,.6), 0 0 40px rgba(123,163,192,.15)',
                  backdropFilter: 'blur(16px)',
                }}>
                <div className="flex justify-center mb-4">
                  <img
                    src="/imgprode/one-prode-blanco.png"
                    alt="Logo"
                    style={{ height: 170, width: 'auto', filter: 'drop-shadow(0 4px 16px rgba(134,200,115,0.5))' }}
                  />
                </div>
                <div className="relative overflow-hidden rounded-xl aspect-[16/10] mb-4">
                  <img
                    src="/imgprode/seleccion_argentina.png"
                    alt="Selección Argentina"
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />
                  <span className="absolute bottom-3 left-3 bg-[#7BA3C0] text-black font-body font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full backdrop-blur-sm shadow-md">
                    🇦🇷 Acompañando a la celeste y blanca
                  </span>
                </div>
                <div className="text-center px-2">
                  <p className="font-body font-bold text-sm text-[#7BA3C0] uppercase tracking-wider mb-2">
                    Moyano Conducción
                  </p>
                  <p className="font-body text-xs sm:text-sm text-white/85 leading-relaxed">
                    Viví la pasión de nuestra selección en cada partido del mundial. ¡Sumá tus pronósticos y alentá con tus compañeros!
                  </p>
                  <p className="font-body text-xs text-[#ebc32b] italic mt-2.5 font-semibold">
                    de la mano de Luis Barrionuevo
                  </p>
                </div>
              </div>
            </div>

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