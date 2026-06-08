import { Mail, Globe, ChevronRight } from 'lucide-react'
import AlianzaMark from '../brand/AlianzaMark.jsx'
import AlianzaWordmark from '../brand/AlianzaWordmark.jsx'

export default function HomeFooter() {
  const torneoLinks = [
    { label: 'Reglamento del Torneo', href: '#' },
    { label: 'Fixture Oficial', href: '#/partidos' },
    { label: 'Tabla de Posiciones', href: '#/ranking' },
    { label: 'Premios y Premiaciones', href: '#' }
  ]

  const valoresLinks = [
    'Solidez y Respaldo',
    'Cercanía y Confianza',
    'Innovación Constante',
    'Compromiso Social'
  ]

  const institucionalLinks = [
    { label: 'Portal Corporativo', href: 'https://www.alianzaseguros.com.ar' },
    { label: 'Código de Ética', href: '#' },
    { label: 'Políticas de Privacidad', href: '#' },
    { label: 'Términos de Uso', href: '#' }
  ]

  return (
    <footer className="relative overflow-hidden bg-[#040D1D] text-slate-300 border-t border-slate-900/60 font-body">
      {/* Decorative Brand Ambient Glow */}
      <div 
        className="absolute bottom-0 left-0 w-[400px] h-[250px] bg-gradient-to-tr from-accent/10 via-primary/5 to-transparent blur-3xl pointer-events-none rounded-full"
        style={{ transform: 'translate(-10%, 20%)' }}
      />
      <div 
        className="absolute top-0 right-0 w-[300px] h-[200px] bg-gradient-to-bl from-primary/8 via-transparent to-transparent blur-3xl pointer-events-none rounded-full"
        style={{ transform: 'translate(10%, -20%)' }}
      />

      {/* Main Body Grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-y-12 gap-x-8">
          
          {/* Column 1: Brand block (Spans 4 columns) */}
          <div className="lg:col-span-4 flex flex-col space-y-6">
            <div className="flex items-center gap-3">
              <AlianzaMark size={36} />
              <div className="flex flex-col justify-center lineHeight-1">
                <AlianzaWordmark size={18} color="#fff" />
                <span className="font-sans text-[8px] font-bold tracking-[0.05em] uppercase text-slate-400">
                  Grupo Asegurador
                </span>
              </div>
            </div>

            <p className="text-[13px] text-slate-400 leading-relaxed max-w-sm">
              Alianza Grupo Asegurador. Más de 75 años brindando solidez y confianza en el mercado. Comprometidos con el desarrollo integral y la cercanía con nuestros clientes y colaboradores.
            </p>
          </div>

          {/* Column 2: Torneo (Spans 3 columns) */}
          <div className="lg:col-span-3 flex flex-col">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent mb-6 font-sans">
              El Torneo
            </h3>
            <ul className="space-y-4">
              {torneoLinks.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="group inline-flex items-center gap-2 text-sm text-slate-400 hover:text-accent transition-colors duration-200 focus-visible:outline-none focus-visible:text-accent rounded"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-accent/50 group-hover:text-accent group-hover:translate-x-0.5 transition-transform" />
                    <span>{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Valores (Spans 2 columns) */}
          <div className="lg:col-span-2 flex flex-col">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent mb-6 font-sans">
              Valores
            </h3>
            <ul className="space-y-4">
              {valoresLinks.map((label) => (
                <li key={label}>
                  <span className="group inline-flex items-center gap-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors duration-200 cursor-default">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent/40 group-hover:bg-accent group-hover:scale-125 transition-all duration-200" />
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Institucional (Spans 3 columns) */}
          <div className="lg:col-span-3 flex flex-col">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent mb-6 font-sans">
              Institucional
            </h3>
            <ul className="space-y-4">
              {institucionalLinks.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 text-sm text-slate-400 hover:text-accent transition-colors duration-200 focus-visible:outline-none focus-visible:text-accent rounded"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-accent/50 group-hover:text-accent group-hover:translate-x-0.5 transition-transform" />
                    <span>{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-800/80 to-transparent" />
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Copyright info */}
          <div className="flex items-center gap-3">
            <AlianzaMark size={16} className="opacity-30 select-none pointer-events-none brightness-0 invert" />
            <span className="text-xs text-slate-500 font-sans">
              © {new Date().getFullYear()} Alianza Grupo Asegurador. Todos los derechos reservados.
            </span>
          </div>

          {/* Version / platform info */}
          <div className="flex items-center gap-3 text-xs text-slate-500 font-sans">
            <span className="opacity-50">Plataforma ONE Prode</span>
            <span 
              className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800 text-slate-500"
            >
              V1.2.0
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}