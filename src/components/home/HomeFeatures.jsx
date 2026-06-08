import { Link } from 'react-router-dom'
import { Clock, TrendingUp, Users, History, Calendar, Trophy, Settings, Palette, ArrowRight } from 'lucide-react'

const FEATURES = [
  { 
    title: 'Predicciones por partido', 
    desc: 'Cargá tu resultado antes del cierre. El sistema acepta pronósticos hasta el inicio del partido.', 
    icon: Clock 
  },
  { 
    title: 'Ranking en tiempo real', 
    desc: 'Posiciones actualizadas automáticamente. Seguí tu puesto y el de tus compañeros.', 
    icon: TrendingUp 
  },
  { 
    title: 'Apuestas por áreas', 
    desc: 'Competí representando a tu sector. El puntaje individual suma al total de tu área.', 
    icon: Users 
  },
  { 
    title: 'Historial de pronósticos', 
    desc: 'Revisá todos tus aciertos y errores. Seguí tu progreso durante todo el torneo.', 
    icon: History 
  },
  { 
    title: 'Fixture completo', 
    desc: 'Todos los partidos del torneo, estados actualizados y resultados en tiempo real.', 
    icon: Calendar 
  },
  { 
    title: 'Tablas de grupos', 
    desc: 'Seguí las posiciones de cada grupo. Visualizá el avance de las selecciones.', 
    icon: Trophy 
  },
  { 
    title: 'Panel de administración', 
    desc: 'Para Recursos Humanos: aprobá usuarios, gestioná áreas y controlá el torneo completo.', 
    icon: Settings 
  },
  { 
    title: 'Branding corporativo', 
    desc: 'La plataforma se adapta con el logo e identidad visual de tu organización.', 
    icon: Palette 
  },
]

export default function HomeFeatures() {
  return (
    <section 
      id="funcionalidades" 
      className="relative bg-[#081730] pt-24 pb-28 text-white overflow-hidden"
      aria-label="Funcionalidades de la plataforma"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="grid lg:grid-cols-12 gap-8 items-end mb-16">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 font-body font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-full mb-5 border border-accent/40 text-accent bg-accent/8">
              Todo lo que incluye
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight uppercase">
              UNA PLATAFORMA<br />
              <span className="text-accent filter drop-shadow-[0_0_30px_rgba(166,201,52,0.25)]">COMPLETA</span>
            </h2>
          </div>
          <p className="lg:col-span-5 font-body text-slate-400 text-sm sm:text-base leading-relaxed lg:pl-4">
            Todo lo que necesitás para participar, seguir el torneo y competir con tu equipo está disponible en un solo lugar y en cualquier dispositivo.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map(({ title, desc, icon: Icon }) => (
            <div 
              key={title} 
              className="rounded-2xl p-6 bg-slate-900/40 border border-accent/15 hover:border-accent hover:bg-slate-900/70 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40 transition-all duration-300 group cursor-default"
            >
              {/* Icon wrapper */}
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 bg-gradient-to-br from-[#081730] to-[#25427b] text-accent shadow-md transition-transform duration-300 group-hover:scale-110">
                <Icon className="w-5 h-5 text-accent" aria-hidden="true" />
              </div>

              {/* Title & Desc */}
              <h3 className="font-body font-bold text-sm text-white mb-2 group-hover:text-accent transition-colors duration-200">
                {title}
              </h3>
              <p className="font-body text-xs text-slate-400 leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="mt-16 text-center">
          <Link 
            to="/register"
            className="inline-flex items-center gap-2 font-body font-bold text-base px-8 py-4 rounded-full bg-accent text-[#040D1D] hover:bg-[#bde04b] hover:text-[#040D1D] hover:shadow-[0_8px_28px_rgba(166,201,52,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Crear mi cuenta y empezar
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Decorative Wave Transition (features -> FAQ) */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none">
        <svg 
          className="relative block w-full" 
          style={{ height: 80, marginBottom: -2 }}
          viewBox="0 0 1440 80" 
          preserveAspectRatio="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="1440" height="80" fill="#081730" />
          <path d="M0,30 C320,80 640,0 960,38 C1120,55 1320,22 1440,32 L1440,80 L0,80 Z" fill="#f4f7fa" />
        </svg>
      </div>
    </section>
  )
}