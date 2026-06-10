const ITEMS = [
  {
    bg: 'linear-gradient(135deg,rgba(255,125,0,.18),rgba(70,0,155,.18))', stroke: '#FF7D00',
    title: 'Predicciones en minutos',
    desc: 'Ingresa tu pronóstico antes de cada partido. Simple y desde cualquier dispositivo.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  },
  {
    bg: 'linear-gradient(135deg,rgba(70,0,155,.18),rgba(170,0,100,.18))', stroke: '#46009B',
    title: 'Ranking automático',
    desc: 'Tu posición se actualiza sola después de cada resultado. Sin cálculos manuales.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  },
  {
    bg: 'linear-gradient(135deg,rgba(255,125,0,.18),rgba(170,0,100,.18))', stroke: '#AA0064',
    title: 'Competencia por áreas',
    desc: 'Tu puntaje suma al total de tu sector. Toda la empresa compite junta.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    bg: 'linear-gradient(135deg,rgba(88,88,87,.18),rgba(70,0,155,.18))', stroke: '#FF7D00',
    title: 'Acceso desde cualquier lugar',
    desc: 'Teléfono, tablet o computadora. No hay nada que instalar, solo un enlace para entrar.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
  },
]

const MARQUEE = [
  'Competencia sana','Más participación','Clima laboral positivo',
  'Plataforma lista','Personalizada con tu marca','Sin riesgo legal',
  'Precio fijo','Ranking en tiempo real','Fácil de usar',
]

export default function HomeStrip() {
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
          animation: marquee-scroll-anim 36s linear infinite;
          width: max-content; align-items: center;
        }
      `}</style>

      {/* 4-feature strip */}
      <section style={{ background: '#faf7f0', padding: '3.5rem 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {ITEMS.map(({ bg, stroke, title, desc, icon }) => (
              <div key={title} className="flex items-start gap-4"
                style={{ background: 'rgba(255,255,255,.96)', border: '1px solid rgba(88,88,87,.06)', borderRadius: '1rem', padding: '1rem' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: bg, color: stroke }}>
                  {icon}
                </div>
                <div>
                  <h3 className="font-body font-semibold text-base mb-1" style={{ color: '#0c182b' }}>{title}</h3>
                  <p className="font-body text-sm leading-snug" style={{ color: 'rgba(12,24,43,.78)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="marquee-wrap-el" style={{ background: '#faf7f0', borderTop: '1px solid rgba(255,125,0,.16)', borderBottom: '1px solid rgba(170,0,100,.12)', padding: '.9rem 0' }}>
        <div className="marquee-track-el font-body font-bold text-xs uppercase tracking-widest" style={{ color: 'rgba(12,24,43,.85)' }}>
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span key={i} className="flex items-center gap-2.5 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#FF7D00' }} />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── WAVE: strip (#faf7f0) → how-it-works (#faf7f0 same, wave goes to #0c182b later)
          Actually strip → howItWorks both cream, no wave needed here.
          HowItWorks has its own wave at the bottom. So no wave needed on strip.        */}
    </>
  )
}