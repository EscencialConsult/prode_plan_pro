import { Clock, TrendingUp, Users, Smartphone } from 'lucide-react'

const ITEMS = [
  {
    bgClass: 'bg-primary/10',
    iconClass: 'text-primary',
    title: 'Predicciones en minutos',
    desc: 'Cargá tu pronóstico antes de cada partido. Simple y desde cualquier dispositivo.',
    icon: Clock,
  },
  {
    bgClass: 'bg-emerald-500/10',
    iconClass: 'text-emerald-600',
    title: 'Ranking automático',
    desc: 'Tu posición se actualiza sola después de cada resultado. Sin cálculos manuales.',
    icon: TrendingUp,
  },
  {
    bgClass: 'bg-accent/15',
    iconClass: 'text-[#0E5DA8]',
    title: 'Competencia por áreas',
    desc: 'Tu puntaje suma al total de tu sector. Toda la empresa compite junta.',
    icon: Users,
  },
  {
    bgClass: 'bg-sky-500/10',
    iconClass: 'text-sky-600',
    title: 'Acceso desde cualquier lugar',
    desc: 'Celular, tablet o compu. No hay nada que instalar, solo un enlace para entrar.',
    icon: Smartphone,
  },
]

const MARQUEE = [
  'Competencia sana',
  'Más participación',
  'Clima laboral positivo',
  'Plataforma lista',
  'Personalizada con tu marca',
  'Sin riesgo legal',
  'Precio fijo',
  'Ranking en tiempo real',
  'Fácil de usar',
]

export default function HomeStrip() {
  return (
    <>
      <style>{`
        @keyframes marquee-scroll-anim { 
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); } 
        }
        .marquee-wrap-el {
          overflow: hidden;
          -webkit-mask: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
          mask: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
        }
        .marquee-track-el {
          display: flex; 
          gap: 3.5rem;
          animation: marquee-scroll-anim 40s linear infinite;
          width: max-content; 
          align-items: center;
        }
        .marquee-track-el:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* ── 4-FEATURE STRIP ── */}
      <section className="bg-[#f4f7fa] py-16 border-t border-slate-200/40" aria-label="Beneficios principales">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {ITEMS.map(({ bgClass, iconClass, title, desc, icon: Icon }) => (
              <div 
                key={title} 
                className="group flex items-start gap-4 p-5 rounded-2xl  hover:bg-white hover:shadow-xl hover:shadow-slate-100 hover:-translate-y-1 transition-all duration-300 cursor-default"
              >
                {/* Icon wrapper */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110 ${bgClass}`}>
                  <Icon className={`w-5 h-5 ${iconClass}`} aria-hidden="true" />
                </div>
                {/* Text Block */}
                <div>
                  <h3 className="font-body font-bold text-base !text-bg-dark mb-1 group-hover:!text-primary transition-colors duration-200">
                    {title}
                  </h3>
                  <p className="font-body text-xs sm:text-sm text-slate-500 leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCROLLING MARQUEE ── */}
      <div 
        className="marquee-wrap-el bg-[#e2eaf0] border-t border-accent/20 border-b border-accent/20 py-4 shadow-inner"
        role="marquee"
        aria-label="Atributos de la plataforma"
      >
        <div className="marquee-track-el font-body font-bold text-xs uppercase tracking-widest text-[#081730]">
          {/* Double map to ensure seamless looping */}
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span key={i} className="flex items-center gap-3 whitespace-nowrap select-none">
              <span className="w-2 h-2 rounded-full bg-accent pulse-dot-el flex-shrink-0" />
              <span>{item}</span>
            </span>
          ))}
        </div>
      </div>
    </>
  )
}