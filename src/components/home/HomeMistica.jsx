import { Link } from 'react-router-dom'

const MISTICA_PLAYERS = [
  {
    name: 'Lionel Messi',
    role: 'El MVP del Ranking',
    phrase: 'Festejá como el mejor. El puntero de la tabla lidera la empresa como el gran capitán.',
    img: '/imgprode/stock/messi.jpg',
    badge: '🥇 LÍDER / MVP',
  },
  {
    name: 'Rodrigo De Paul',
    role: 'Garra y Confirmación',
    phrase: 'Pura garra en cada pronóstico. Cargá tus partidos y jugá con el corazón celeste y blanco.',
    img: '/imgprode/stock/depaul.jpg',
    badge: '💪 DETERMINACIÓN',
  },
  {
    name: 'Dibu Martínez',
    role: 'El que salva las papas',
    phrase: '¡Que no te metan el gol! Asegurá tus predicciones antes de que cierre el tiempo límite.',
    img: '/imgprode/stock/dibu.jpg',
    badge: '🧤 ARQUERO / SEGURIDAD',
  },
  {
    name: 'Julián Álvarez',
    role: 'Festejo de la Araña',
    phrase: 'Para los puntajes perfectos. Celebrá cada marcador exacto con la mística del campeón.',
    img: '/imgprode/stock/julian.png',
    badge: '🕷️ PUNTAJE PERFECTO',
  },
  {
    name: 'Leandro Paredes',
    role: 'Desafío Versus',
    phrase: 'Competitividad sana en la oficina. Demostrá quién sabe más de fútbol en cada fecha.',
    img: '/imgprode/stock/paredes.jpg',
    badge: '⚔️ VERSUS / DUELOS',
  },
  {
    name: 'La Selección',
    role: 'El Abrazo de Gol',
    phrase: 'En el sindicato jugamos en equipo. Reforzá la unión y sumá puntos junto a tus compañeros.',
    img: '/imgprode/stock/argentinagol.jpg',
    badge: '👥 TRABAJO EN EQUIPO',
  },
]

export default function HomeMistica() {
  return (
    <section id="mistica" className="relative pt-12 pb-24 md:pt-20 md:pb-32" style={{ background: '#111811' }}>
      {/* Glow decorativo */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(circle at 50% 10%, rgba(134,200,115,.08), transparent 60%)'
      }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* Encabezado de la sección */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 font-body font-bold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full mb-5"
            style={{ border: '1px solid rgba(245,197,24,.4)', color: '#F5C518', background: 'rgba(245,197,24,.08)' }}>
            ★ Acompañando a la celeste y blanca
          </span>
          <h2 className="font-display text-white" style={{ fontSize: 'clamp(2.4rem,6vw,4rem)', lineHeight: 1, letterSpacing: '.01em' }}>
            VIVÍ LA MÍSTICA DEL MUNDIAL
          </h2>
          <p className="font-body text-sm sm:text-base max-w-xl mx-auto mt-4 text-[#8aaa8e]">
            Sentí la pasión de nuestra Selección en cada jugada. Sumá tus pronósticos en la plataforma de <strong className="text-white">Moyano Conducción</strong>.
          </p>
          <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #86C873 50%, transparent)', borderRadius: 99, width: 140, margin: '1rem auto 0' }} />
        </div>

        {/* Grid de Jugadores */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {MISTICA_PLAYERS.map((p, idx) => (
            <div key={idx} className="bg-black/35 backdrop-blur-md rounded-2xl overflow-hidden flex flex-col transition-all duration-300 group hover:-translate-y-1.5"
              style={{ border: '1.5px solid rgba(134,200,115,.15)', boxShadow: '0 8px 32px rgba(0,0,0,.2)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#86C873'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(134,200,115,.15)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(134,200,115,.15)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,.2)' }}>
              
              {/* Imagen del Jugador */}
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <img src={p.img} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                
                {/* Badge flotante */}
                <span className="absolute top-3 left-3 bg-[#111811]/90 backdrop-blur-sm text-[#86C873] font-body font-bold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full border border-rgba(134,200,115,.3)">
                  {p.badge}
                </span>

                <div className="absolute bottom-3 left-4">
                  <h3 className="font-display text-white text-lg sm:text-xl m-0 leading-tight tracking-wide uppercase">
                    {p.name}
                  </h3>
                  <p className="font-body text-[10px] text-[#86C873] uppercase tracking-wider font-bold m-0 mt-0.5">
                    {p.role}
                  </p>
                </div>
              </div>

              {/* Contenido / Frase */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <p className="font-body text-xs sm:text-sm text-white/70 leading-relaxed m-0 mb-4">
                  "{p.phrase}"
                </p>
              </div>

            </div>
          ))}
        </div>

        {/* CTA final de la sección */}
        <div className="text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '2.5rem' }}>
          <div className="inline-flex flex-col items-center gap-3">
            <Link to="/register"
              className="inline-flex items-center gap-2 font-body font-bold text-base px-8 py-4 rounded-full transition-all"
              style={{ background: 'linear-gradient(135deg,#ebc32b,#c29a0e)', color: '#0a0f0a', boxShadow: '0 8px 24px rgba(235,195,43,.25)', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 32px rgba(235,195,43,.45)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(235,195,43,.25)'; e.currentTarget.style.transform = '' }}>
              Unirme al prode de la Lista Verde
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
            <p className="font-body text-[10px] text-white/40 uppercase tracking-widest mt-1">
              Impulsado por Moyano Conducción
            </p>
          </div>
        </div>

      </div>
    </section>
  )
}
