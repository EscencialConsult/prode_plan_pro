import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ArrowRight } from 'lucide-react'

const FAQS = [
  { q: '¿Cómo me registro?', a: 'Hacé clic en "Crear mi cuenta", ingresá tu nombre y email de la empresa y elegí una contraseña. Un administrador aprueba tu acceso — generalmente en minutos.' },
  { q: '¿Cómo cargo mis predicciones?', a: 'Una vez dentro, entrá a la sección "Apuestas", encontrá un partido abierto y cargá el resultado que creés que va a pasar. La apuesta cierra cuando arranca el partido.' },
  { q: '¿Cómo se calculan los puntos?', a: 'Acertar el resultado exacto suma más puntos que acertar solo quién gana. El sistema lo calcula automáticamente y actualiza el ranking después de cada partido.' },
  { q: '¿Qué es una apuesta grupal por área?', a: 'Es una dinámica donde tu puntaje individual también suma para tu sector. Toda el área compite como equipo contra las demás áreas de la empresa.' },
  { q: '¿Puedo ver mis predicciones anteriores?', a: 'Sí. En "Mis Predicciones" encontrás el historial completo de tus pronósticos, cuántos acertaste y cómo evolucionó tu puntaje durante el torneo.' },
  { q: '¿La plataforma funciona en el celular?', a: 'Sí, está optimizada para cualquier dispositivo. Solo necesitás el link y tu usuario — no hay nada que instalar.' },
]

export default function HomeFaq() {
  const [open, setOpen] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState(null)

  return (
    <section id="faq" className="relative bg-[#f4f7fa] pt-24 pb-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">

          {/* ── LEFT SIDE: Title & Register CTA (Spans 5 columns) ── */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <span className="inline-flex items-center gap-2 font-body font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-full mb-6 border border-accent/40 text-primary bg-accent/12">
              Ayuda
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl !text-bg-dark leading-[1.05] tracking-tight mb-6 uppercase">
              PREGUNTAS<br />FRECUENTES
            </h2>
            <p className="font-body text-slate-500 text-sm sm:text-base leading-relaxed mb-8 max-w-sm">
              Todo lo que necesitás saber para empezar a participar y sacarle el máximo provecho a la plataforma.
            </p>
            <Link 
              to="/register"
              className="inline-flex items-center gap-2 font-body font-bold text-sm px-7 py-4 rounded-full bg-[#081730] text-white hover:bg-[#18243f] hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-300 shadow-[0_4px_14px_rgba(12,24,43,0.2)] hover:shadow-[0_6px_20px_rgba(12,24,43,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Registrarme ahora
              <ArrowRight className="w-4.5 h-4.5" />
            </Link>
          </div>

          {/* ── RIGHT SIDE: Accordion List (Spans 7 columns) ── */}
          <div className="lg:col-span-7 space-y-4 w-full">
            {FAQS.map(({ q, a }, i) => {
              const isOpen = open === i
              const isHovered = hoveredIndex === i
              
              return (
                <div 
                  key={i} 
                  className={`rounded-2xl overflow-hidden bg-white border transition-all duration-300 ${
                    isOpen 
                      ? 'border-accent shadow-[0_8px_24px_rgba(166,201,52,0.18)] scale-[1.01]' 
                      : isHovered 
                        ? 'border-[#e2eaf0] shadow-[0_4px_12px_rgba(12,24,43,0.06)]' 
                        : 'border-transparent shadow-[0_2px_4px_rgba(12,24,43,0.03)]'
                  }`}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <button
                    className={`w-full flex items-center justify-between gap-4 text-left px-6 py-5 transition-colors duration-250 focus-visible:outline-none focus-visible:bg-slate-50 ${
                      isOpen ? 'bg-accent/4' : 'bg-transparent'
                    }`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${i}`}
                  >
                    <span className={`font-body font-bold text-base leading-snug transition-colors duration-200 ${
                      isOpen ? 'text-[#081730]' : 'text-[#2b3a5a]'
                    }`}>
                      {q}
                    </span>
                    <span 
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        isOpen 
                          ? 'bg-accent text-[#040D1D] rotate-180' 
                          : isHovered 
                            ? 'bg-accent/15 text-primary' 
                            : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>
                  
                  <div 
                    id={`faq-answer-${i}`}
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{
                      maxHeight: isOpen ? '250px' : '0',
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <div className="px-6 pb-6 pt-1 border-t border-slate-100/80">
                      <p className="font-body text-sm leading-relaxed text-slate-500 pt-3">
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

      {/* Decorative Wave Transition → Footer */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none">
        <svg 
          className="relative block w-full" 
          style={{ height: 120, marginBottom: -2 }}
          viewBox="0 0 1440 120" 
          preserveAspectRatio="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0,40 C360,110 720,10 1080,55 C1260,70 1380,45 1440,38 L1440,120 L0,120 Z" fill="#040D1D" />
        </svg>
      </div>
    </section>
  )
}