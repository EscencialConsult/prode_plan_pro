import { Link } from 'react-router-dom'

const FEATURES = [
  { title: 'Predicciones por partido', desc: 'Cargá tu resultado antes del cierre. El sistema acepta pronósticos hasta el inicio del partido.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { title: 'Ranking en tiempo real', desc: 'Posiciones actualizadas automáticamente. Seguí tu puesto y el de tus compañeros.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { title: 'Apuestas por grupos', desc: 'Competí representando a tu sector. El puntaje individual suma al total de tu grupo.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { title: 'Historial de pronósticos', desc: 'Revisá todos tus aciertos y errores. Seguí tu progreso durante todo el torneo.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { title: 'Fixture completo', desc: 'Todos los partidos del torneo, estados actualizados y resultados en tiempo real.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { title: 'Tablas de grupos', desc: 'Seguí las posiciones de cada grupo. Visualizá el avance de las selecciones.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
  { title: 'Panel de administración', desc: 'Para el equipo organizador: aprobá usuarios, gestioná y controlá el torneo completo.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 1.64 13.49M4.93 4.93A10 10 0 0 0 3.29 18.42"/></svg> },
  { title: 'Acceso mobile', desc: 'La plataforma está optimizada para celular. Solo un link, sin instalación.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg> },
]

export default function HomeFeatures() {
  return (
    <section id="funcionalidades" className="relative pt-12 pb-28 md:pt-20 md:pb-36" style={{ background: '#111811' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>

        <div className="grid lg:grid-cols-2 gap-6 md:gap-10 items-end mb-8 md:mb-14">
          <div>
            <span className="inline-flex items-center gap-2 font-body font-bold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full mb-5"
              style={{ border: '1px solid rgba(134,200,115,.4)', color: '#86C873', background: 'rgba(134,200,115,.08)' }}>
              Todo lo que incluye
            </span>
            <h2 className="font-display text-white" style={{ fontSize: 'clamp(2.4rem,6vw,4rem)', lineHeight: 1, letterSpacing: '.01em' }}>
              UNA PLATAFORMA<br /><span style={{ color: '#86C873' }}>COMPLETA</span>
            </h2>
          </div>
          <p className="font-body text-base leading-relaxed" style={{ color: '#8aaa8e' }}>
            Todo lo que necesitás para participar, seguir el torneo y competir con tus compañeros camioneros está en un solo lugar.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {FEATURES.map(({ title, desc, icon }) => (
            <div key={title} className="rounded-xl p-3 sm:p-5 flex items-center sm:items-start gap-3 transition-all duration-300 flex-row sm:flex-col"
              style={{ background: 'linear-gradient(155deg,rgba(58,92,58,.2),rgba(58,92,58,.05))', border: '1px solid rgba(134,200,115,.12)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(134,200,115,.45)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 20px 48px rgba(0,0,0,.4)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(134,200,115,.12)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
              <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#1a241a,#3a5c3a)', color: '#86C873' }}>
                {icon}
              </div>
              <div className="min-w-0">
                <h3 className="font-body font-semibold text-xs sm:text-sm text-white">{title}</h3>
                <p className="hidden sm:block font-body text-xs leading-relaxed mt-2" style={{ color: '#8aaa8e' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link to="/login"
            className="inline-flex items-center gap-2 font-body font-bold text-base px-8 py-4 rounded-full transition-all"
            style={{ background: 'linear-gradient(135deg,#86C873,#5A9E4A)', color: '#0a0f0a', boxShadow: '0 8px 24px rgba(134,200,115,.25)', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 32px rgba(134,200,115,.4)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(134,200,115,.25)'; e.currentTarget.style.transform = '' }}>
            Ingresar y participar
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>
        </div>
      </div>

      {/* WAVE: features → FAQ */}
      <svg className="absolute bottom-0 left-0 w-full" style={{ display: 'block', height: 80, marginBottom: -2 }}
        viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="1440" height="80" fill="#111811" />
        <path d="M0,30 C320,80 640,0 960,38 C1120,55 1320,22 1440,32 L1440,80 L0,80 Z" fill="#f0f5ee" />
      </svg>
    </section>
  )
}