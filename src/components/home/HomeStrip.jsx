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

const ITEMS = [
  {
    bg: 'rgba(134,200,115,.1)', stroke: '#5A9E4A',
    title: 'Predicciones del Mundial',
    desc: 'Pronosticá los resultados de cada partido y sumá puntos con cada acierto.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
  {
    bg: 'rgba(58,125,68,.1)', stroke: '#3A7D44',
    title: 'Tabla de Posiciones',
    desc: 'Seguí tu puesto en tiempo real en el ranking general y competí con tus compañeros.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>,
  },
  {
    bg: 'rgba(95,201,138,.1)', stroke: '#5FC98A',
    title: 'Grandes Premios',
    desc: 'Participá por importantes premios y ganate el reconocimiento de toda la seccional.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34M12 2a6 6 0 0 1 6 6v5H6V8a6 6 0 0 1 6-6z"/></svg>,
  },
  {
    bg: 'rgba(134,200,115,.08)', stroke: '#86C873',
    title: 'Exclusivo Afiliados',
    desc: 'Una plataforma ágil, gratuita y exclusiva para la familia de Camioneros Tucumán.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
]

const MARQUEE = [
  'Camioneros Tucumán','Agrupación Moyano','Luis Barrionuevo 2026',
  'Siempre con el trabajador','Gran Prode Mundialista','Fixture Oficial',
  'Predicciones Copa','Premios Exclusivos','Camioneros Juega Unido',
]

export default function HomeStrip() {
  const cd = useCountdown('2026-06-11T19:00:00')

  return (
    <>
      <style>{`
        @keyframes marquee-scroll-anim { to { transform: translateX(-50%); } }
        .marquee-wrap-el {
          overflow: hidden;
          -webkit-mask: linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);
                  mask: linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);
        }
        .marquee-track-el {
          display: flex; gap: 2.5rem;
          animation: marquee-scroll-anim 38s linear infinite;
          width: max-content; align-items: center;
        }
        @keyframes pulse-dot-anim { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.45;transform:scale(.8)} }
        .pulse-dot-el { animation: pulse-dot-anim 1.6s ease infinite; }
      `}</style>

      {/* Countdown Band */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(10,15,10,0.92) 0%, rgba(20,38,20,0.96) 50%, rgba(10,15,10,0.92) 100%)',
        borderTop: '1.5px solid rgba(134,200,115,0.25)',
        borderBottom: '1.5px solid rgba(134,200,115,0.25)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        width: '100%',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0.65rem 1.5rem' }} className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full pulse-dot-el" style={{ background: '#86C873', boxShadow: '0 0 12px #86C873' }} />
            <span className="font-body font-bold text-xs sm:text-sm uppercase tracking-widest text-white">
              Falta para el inicio de <strong style={{ color: '#86C873' }}>PRODE LUIS BARRIONUEVO</strong>:
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {[{v:cd.days,l:'Días'},{v:cd.hours,l:'Hrs'},{v:cd.minutes,l:'Min'},{v:cd.seconds,l:'Seg'}].map(({v,l}) => (
              <div key={l} className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl flex items-center justify-center min-w-[46px] sm:min-w-[54px]"
                  style={{
                    background: 'rgba(134,200,115,0.06)',
                    border: '1px solid rgba(134,200,115,0.3)',
                    boxShadow: '0 0 15px rgba(134,200,115,0.08) inset'
                  }}>
                  <span className="font-display text-sm sm:text-2xl font-black leading-none" style={{ color: '#86C873', textShadow: '0 0 10px rgba(134,200,115,0.4)' }}>
                    {String(v).padStart(2,'0')}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs uppercase tracking-wider font-body font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {l}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4-feature strip */}
      <section style={{ background: '#f0f5ee', padding: '3.5rem 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {ITEMS.map(({ bg, stroke, title, desc, icon }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: bg, color: stroke }}>
                  {icon}
                </div>
                <div>
                  <h3 className="font-body font-semibold text-base mb-1" style={{ color: '#111811' }}>{title}</h3>
                  <p className="font-body text-sm leading-snug" style={{ color: '#4a6b50' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="marquee-wrap-el" style={{ background: '#e2eede', borderTop: '1px solid rgba(58,125,68,.2)', borderBottom: '1px solid rgba(58,125,68,.2)', padding: '.9rem 0' }}>
        <div className="marquee-track-el font-body font-bold text-xs uppercase tracking-widest" style={{ color: '#1e3020' }}>
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span key={i} className="flex items-center gap-2.5 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#86C873' }} />
              {item}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}