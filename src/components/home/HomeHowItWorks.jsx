import { Link } from 'react-router-dom'

const STEPS = [
  {
    n: '01', title: 'INGRESÁ',
    desc: 'Iniciá sesión directamente con tu DNI y tu contraseña asignada para acceder al prode.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
  {
    n: '02', title: 'PRONOSTICÁ',
    desc: 'Antes de cada partido cargá el resultado que creés que va a pasar. Se cierra cuando arranca.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  },
  {
    n: '03', title: 'GANÁ',
    desc: 'Cada acierto suma puntos. El ranking final define al campeón del prode entre los camioneros.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  },
]

export default function HomeHowItWorks() {
  return (
    <section id="como-funciona" className="relative pt-10 pb-28 md:pt-20 md:pb-36" style={{ background: '#f0f5ee' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>

        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 font-body font-bold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full mb-5"
            style={{ border: '1px solid rgba(58,125,68,.4)', color: '#3A7D44', background: 'rgba(58,125,68,.08)' }}>
            Cómo funciona
          </span>
          <h2 className="font-display" style={{ fontSize: 'clamp(2.4rem,6vw,4rem)', color: '#111811', lineHeight: 1, letterSpacing: '.01em' }}>
            3 PASOS Y ESTÁS JUGANDO
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {STEPS.map(({ n, title, desc, icon }) => (
            <div key={n} className="relative rounded-2xl p-5 md:p-6 bg-white transition-all duration-300 overflow-hidden"
              style={{ border: '1.5px solid #e2eede', boxShadow: '0 2px 8px rgba(17,24,17,.03)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#86C873'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(17,24,17,.08)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2eede'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(17,24,17,.03)' }}>
              
              {/* Número flotante de fondo premium */}
              <div className="absolute right-3 top-[-15px] font-display select-none pointer-events-none"
                style={{ fontSize: '7rem', color: '#86C873', opacity: 0.12, lineHeight: 1 }}>
                {n}
              </div>

              {/* Cabecera: Icono + Título */}
              <div className="flex items-center gap-3.5 mb-3.5 relative z-10">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#111811,#3a5c3a)', color: '#86C873', boxShadow: '0 2px 8px rgba(134,200,115,.15)' }}>
                  {icon}
                </div>
                <h3 className="font-display text-xl sm:text-2.5xl m-0" style={{ color: '#111811', letterSpacing: '.01em' }}>
                  {title}
                </h3>
              </div>

              {/* Descripción */}
              <p className="font-body text-xs sm:text-sm leading-relaxed m-0 relative z-10" style={{ color: '#4a6b50' }}>
                {desc}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/login"
            className="inline-flex items-center gap-2 font-body font-bold text-base px-8 py-4 rounded-full transition-all"
            style={{ background: 'linear-gradient(135deg,#86C873,#5A9E4A)', color: '#0a0f0a', boxShadow: '0 8px 24px rgba(134,200,115,.28)', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 32px rgba(134,200,115,.4)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(134,200,115,.28)'; e.currentTarget.style.transform = '' }}>
            Ingresar ahora
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>
        </div>
      </div>

      {/* WAVE: howItWorks → features */}
      <svg className="absolute bottom-0 left-0 w-full" style={{ display: 'block', height: 72, marginBottom: -2 }}
        viewBox="0 0 1440 72" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="1440" height="72" fill="#f0f5ee" />
        <path d="M0,40 C360,72 720,0 1080,30 C1260,45 1380,60 1440,40 L1440,72 L0,72 Z" fill="#111811" />
      </svg>
    </section>
  )
}