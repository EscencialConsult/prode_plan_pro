import { useState } from 'react'
import { Link } from 'react-router-dom'

const FAQS = [
  { q: '¿Cómo me registro?', a: 'Hacé clic en "Registrarse", ingresá tu nombre y email y elegí una contraseña. Un administrador aprueba tu acceso — generalmente en minutos.' },
  { q: '¿Cómo cargo mis predicciones?', a: 'Una vez dentro, entrá a la sección "Apuestas", encontrá un partido abierto y cargá el resultado que creés que va a pasar. La apuesta cierra cuando arranca el partido.' },
  { q: '¿Cómo se calculan los puntos?', a: 'Acertar el resultado exacto suma más puntos que acertar solo quién gana. El sistema lo calcula automáticamente y actualiza el ranking después de cada partido.' },
  { q: '¿Puedo ver mis predicciones anteriores?', a: 'Sí. En "Mis Predicciones" encontrás el historial completo de tus pronósticos, cuántos acertaste y cómo evolucionó tu puntaje durante el torneo.' },
  { q: '¿La plataforma funciona en el celular?', a: 'Sí, está optimizada para cualquier dispositivo. Solo necesitás el link y tu usuario — no hay nada que instalar.' },
  { q: '¿Quién organiza este prode?', a: 'El prode es una iniciativa del Sindicato de Camioneros de Tucumán, para que los afiliados puedan vivir el Mundial juntos y competir sanamente.' },
]

export default function HomeFaq() {
  const [open, setOpen] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState(null)

  return (
    <section id="faq" className="relative pt-12 pb-32 md:pt-24 md:pb-40" style={{ background: '#f0f5ee' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">

          {/* Left */}
          <div className="lg:sticky" style={{ top: '7rem' }}>
            <span className="inline-flex items-center gap-2 font-body font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-full mb-6"
              style={{ border: '1.5px solid rgba(58,125,68,.4)', color: '#3A7D44', background: 'rgba(58,125,68,.08)' }}>
              Ayuda
            </span>
            <h2 className="font-display mb-6" style={{ fontSize: 'clamp(2.5rem,6vw,4.2rem)', color: '#111811', lineHeight: 0.95, letterSpacing: '.01em' }}>
              PREGUNTAS<br />FRECUENTES
            </h2>
            <p className="font-body text-base leading-relaxed mb-10" style={{ color: '#4a6b50', maxWidth: '28rem' }}>
              Todo lo que necesitás saber para empezar a participar y sacarle el máximo a la plataforma.
            </p>
            <Link to="/register"
              className="inline-flex items-center gap-2 font-body font-bold text-sm px-7 py-4 rounded-full transition-all duration-300"
              style={{ background: '#111811', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 14px rgba(17,24,17,.2)' }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#1a241a'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(17,24,17,.3)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#111811'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(17,24,17,.2)'
              }}>
              Registrarme ahora
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>
          </div>

          {/* Accordion */}
          <div className="space-y-4">
            {FAQS.map(({ q, a }, i) => {
              const isOpen = open === i
              const isHovered = hoveredIndex === i

              return (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden bg-white transition-all duration-300"
                  style={{
                    border: isOpen ? `2px solid rgba(134,200,115,.55)` : isHovered ? '2px solid #e2eede' : '2px solid transparent',
                    boxShadow: isOpen
                      ? '0 8px 24px rgba(134,200,115,.15), 0 2px 8px rgba(134,200,115,.1)'
                      : isHovered
                        ? '0 4px 12px rgba(17,24,17,.06)'
                        : '0 2px 4px rgba(17,24,17,.04)',
                  }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}>
                  <button
                    className="w-full flex items-start justify-between gap-4 text-left px-6 py-5 transition-colors duration-200"
                    style={{ background: isOpen ? 'rgba(134,200,115,.04)' : 'transparent' }}
                    onClick={() => setOpen(isOpen ? -1 : i)}>
                    <span className="font-body font-bold text-base leading-snug"
                      style={{ color: isOpen ? '#111811' : '#1e3020' }}>
                      {q}
                    </span>
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                      style={isOpen
                        ? { background: '#86C873', color: '#0a0f0a', transform: 'rotate(180deg)' }
                        : { background: isHovered ? '#e2eede' : '#eaf0ea', color: '#4a6b50', transform: 'rotate(0deg)' }
                      }>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </span>
                  </button>

                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{
                      maxHeight: isOpen ? '300px' : '0',
                      opacity: isOpen ? 1 : 0,
                    }}>
                    <div className="px-6 pb-6 pt-2" style={{ borderTop: isOpen ? '1px solid #e2eede' : 'none' }}>
                      <p className="font-body text-sm leading-relaxed pt-3" style={{ color: '#4a6b50' }}>
                        {a}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Wave FAQ → footer */}
      <svg className="absolute bottom-0 left-0 w-full" style={{ display: 'block', height: 120, marginBottom: -2 }}
        viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,40 C360,110 720,10 1080,55 C1260,70 1380,45 1440,38 L1440,120 L0,120 Z" fill="#0a0f0a" />
      </svg>
    </section>
  )
}