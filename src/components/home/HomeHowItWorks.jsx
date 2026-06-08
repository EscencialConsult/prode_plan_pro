import { Link } from 'react-router-dom'
import { UserPlus, Edit3, Trophy, ArrowRight } from 'lucide-react'

const STEPS = [
  {
    n: '01', 
    title: 'REGISTRATE',
    desc: 'Ingresá con tu email de empresa. Recursos Humanos aprueba tu acceso en minutos y ya estás listo para jugar.',
    icon: UserPlus,
  },
  {
    n: '02', 
    title: 'PRONOSTICÁ',
    desc: 'Antes de cada partido, cargá el resultado que creés que va a ocurrir. Las predicciones cierran cuando inicia el encuentro.',
    icon: Edit3,
  },
  {
    n: '03', 
    title: 'GANÁ',
    desc: 'Cada acierto suma puntos. El ranking se actualiza en tiempo real para definir el podio final corporativo.',
    icon: Trophy,
  },
]

export default function HomeHowItWorks() {
  return (
    <section 
      id="como-funciona" 
      className="relative bg-[#f4f7fa] pt-20 pb-28" 
      aria-label="Proceso de participación"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 font-body font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-full mb-5 border border-accent/40 text-primary bg-accent/12">
            Cómo funciona
          </span>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl !text-bg-dark leading-none tracking-tight uppercase">
            3 PASOS Y ESTÁS JUGANDO
          </h2>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {STEPS.map(({ n, title, desc, icon: Icon }) => (
            <div 
              key={n} 
              className="group relative rounded-2xl p-8 bg-white border border-[#e2eaf0] shadow-[0_2px_4px_rgba(12,24,43,0.03)] hover:border-accent hover:-translate-y-1 hover:shadow-xl hover:shadow-[#0c2145]/5 transition-all duration-300 cursor-default"
            >
              {/* Large background step number */}
              <div className="absolute top-4 right-6 font-display leading-none text-7xl sm:text-8xl text-slate-100 font-extrabold select-none transition-colors duration-300 group-hover:text-accent/20">
                {n}
              </div>

              {/* Icon wrapper */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-gradient-to-br from-[#081730] to-[#25427b] text-accent shadow-md transition-transform duration-300 group-hover:scale-110">
                <Icon className="w-5 h-5 text-accent" aria-hidden="true" />
              </div>

              {/* Title & Desc */}
              <h3 className="font-display text-2xl !text-bg-dark tracking-wide mb-3 uppercase group-hover:!text-primary transition-colors duration-200">
                {title}
              </h3>
              <p className="font-body text-sm text-slate-500 leading-relaxed pr-6">
                {desc}
              </p>
            </div>
          ))}
        </div>

        {/* Call to Action Button */}
        <div className="text-center">
          <Link 
            to="/register"
            className="inline-flex items-center gap-2 font-body font-bold text-base px-8 py-4 rounded-full bg-accent text-[#040D1D] hover:bg-[#bde04b] hover:text-[#040D1D] hover:shadow-[0_8px_28px_rgba(166,201,52,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Empezar ahora
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Decorative Wave Transition (howItWorks -> features section) */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none">
        <svg 
          className="relative block w-full" 
          style={{ height: 72, marginBottom: -2 }}
          viewBox="0 0 1440 72" 
          preserveAspectRatio="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="1440" height="72" fill="#f4f7fa" />
          <path d="M0,40 C360,72 720,0 1080,30 C1260,45 1380,60 1440,40 L1440,72 L0,72 Z" fill="#081730" />
        </svg>
      </div>
    </section>
  )
}