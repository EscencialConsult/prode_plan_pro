import { useState } from 'react'

const EJES = [
  {
    letra: 'A',
    titulo: 'Defensa Salarial y Laboral',
    subtitulo: 'El bolsillo del trabajador',
    color: '#86C873',
    colorDim: 'rgba(134,200,115,.12)',
    colorBorder: 'rgba(134,200,115,.3)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:26,height:26}}>
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    items: [
      { titulo: 'Paritarias y Viáticos', desc: 'Actualizaciones constantes adaptadas a la inflación y realidad económica de la región NOA.' },
      { titulo: 'Control de Convenio', desc: 'Inspecciones rigurosas para erradicar el trabajo no registrado y garantizar el CCT.' },
      { titulo: 'Asesoría Legal 24/7', desc: 'Cuerpo de abogados sindicales de guardia para conflictos laborales, despidos y accidentes en ruta.' },
    ],
  },
  {
    letra: 'B',
    titulo: 'Salud y Familia',
    subtitulo: 'La tranquilidad del hogar',
    color: '#5FC98A',
    colorDim: 'rgba(95,201,138,.12)',
    colorBorder: 'rgba(95,201,138,.3)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:26,height:26}}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    items: [
      { titulo: 'Obra Social Mejorada', desc: 'Ampliar cobertura médica en capital e interior, más farmacias y agilización de turnos.' },
      { titulo: 'Salud Integral en Ruta', desc: 'Chequeos preventivos físicos y psicológicos exclusivos para choferes.' },
      { titulo: 'Acción Social', desc: 'Kits escolares, beneficios por nacimiento, matrimonio y turismo social para la familia camionera.' },
    ],
  },
  {
    letra: 'C',
    titulo: 'Infraestructura y Seguridad',
    subtitulo: 'El respaldo en la ruta',
    color: '#4AB8A0',
    colorDim: 'rgba(74,184,160,.12)',
    colorBorder: 'rgba(74,184,160,.3)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:26,height:26}}>
        <rect x="1" y="3" width="15" height="13" rx="2"/>
        <path d="M16 8h4l3 3v4h-7V8z"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    items: [
      { titulo: 'Paradores Seguros', desc: 'Gestionar creación y mantenimiento de paradores con duchas, comedores y vigilancia en rutas estratégicas.' },
      { titulo: 'Seguridad Vial y Patrimonial', desc: 'Corredores seguros y protocolos de asistencia rápida ante robos o accidentes.' },
    ],
  },
  {
    letra: 'D',
    titulo: 'Participación y Transparencia',
    subtitulo: 'El sindicato de puertas abiertas',
    color: '#7AB8E8',
    colorDim: 'rgba(122,184,232,.12)',
    colorBorder: 'rgba(122,184,232,.3)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:26,height:26}}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    items: [
      { titulo: 'Fortalecimiento de Delegados', desc: 'Capacitación constante para defender a los compañeros en cada empresa y galpón.' },
      { titulo: 'Asambleas Abiertas', desc: 'Asambleas periódicas en delegaciones de toda la provincia para escuchar directamente a los afiliados.' },
    ],
  },
]

export default function HomeCampaignGoals() {
  const [activeEje, setActiveEje] = useState(0)
  const eje = EJES[activeEje]

  return (
    <>
      <style>{`
        @keyframes eje-slide-in {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .eje-content-anim { animation: eje-slide-in .28s ease both; }

        @keyframes obj-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .obj-item-anim { animation: obj-fade-up .35s ease both; }
        .obj-delay-1 { animation-delay: .05s; }
        .obj-delay-2 { animation-delay: .12s; }
        .obj-delay-3 { animation-delay: .19s; }

        @keyframes manifesto-glow {
          0%, 100% { box-shadow: 0 0 30px rgba(134,200,115,.08); }
          50%       { box-shadow: 0 0 50px rgba(134,200,115,.18); }
        }
        .manifesto-glow { animation: manifesto-glow 4s ease-in-out infinite; }

        .eje-tab {
          transition: all .2s ease;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .eje-tab:active { transform: scale(.97); }
      `}</style>

      <section id="objetivos" className="relative" style={{ background: '#f0f5ee', paddingTop: '4.5rem', paddingBottom: '5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.25rem' }}>

          {/* Header */}
          <div className="text-center mb-10 sm:mb-14">
            <span className="inline-flex items-center gap-2 font-body font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-full mb-5"
              style={{ border: '1.5px solid rgba(58,125,68,.4)', color: '#3A7D44', background: 'rgba(58,125,68,.08)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              Objetivos de Campaña 2026
            </span>

            <h2 className="font-display" style={{ fontSize: 'clamp(2.2rem,6vw,4rem)', color: '#111811', lineHeight: .95, letterSpacing: '.01em' }}>
              PROPUESTA DE<br />
              <span style={{ color: '#3A7D44' }}>GESTIÓN SINDICAL</span>
            </h2>
            <p className="font-body text-sm sm:text-base mt-4 max-w-2xl mx-auto leading-relaxed" style={{ color: '#4a6b50' }}>
              Consolidar un sindicato fuerte, unido y presente en toda Tucumán, garantizando salarios, salud
              y condiciones dignas para todos los camioneros.
            </p>
          </div>

          {/* Objetivo general */}
          <div className="mb-10 rounded-2xl p-5 sm:p-7 manifesto-glow"
            style={{
              background: 'linear-gradient(135deg,#111811 0%,#1a241a 100%)',
              border: '1px solid rgba(134,200,115,.3)',
              position: 'relative', overflow: 'hidden'
            }}>
            {/* Decoración */}
            <div style={{ position:'absolute', top:0, right:0, width:'180px', height:'100%', background:'radial-gradient(ellipse at 90% 50%, rgba(134,200,115,.12), transparent 65%)', pointerEvents:'none' }} />

            <div className="flex items-start gap-4">
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0, marginTop: 2,
                background: 'rgba(134,200,115,.12)', border: '1px solid rgba(134,200,115,.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86C873'
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}>
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="6"/>
                  <circle cx="12" cy="12" r="2"/>
                </svg>
              </div>
              <div>
                <p className="font-body font-bold text-xs uppercase tracking-widest mb-2" style={{ color: 'rgba(134,200,115,.65)' }}>
                  Objetivo General
                </p>
                <p className="font-body text-sm sm:text-base leading-relaxed" style={{ color: 'rgba(255,255,255,.88)' }}>
                  Consolidar un sindicato <strong style={{ color: '#86C873' }}>fuerte, unido y presente</strong> en toda la provincia de Tucumán,
                  que garantice la defensa irrestricta de los salarios, la salud y las condiciones de trabajo de todos
                  los camioneros, bajo la bandera de <em style={{ color: '#A8E096' }}>"Siempre con el trabajador"</em>.
                </p>
              </div>
            </div>
          </div>

          {/* Ejes de gestión */}
          <div>
            <p className="font-body font-bold text-xs uppercase tracking-widest mb-5 text-center" style={{ color: '#8aaa8e', letterSpacing: '.2em' }}>
              Ejes de Gestión
            </p>

            {/* Tabs ejes — mobile scroll horizontal */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {EJES.map((e, i) => {
                const isActive = activeEje === i
                return (
                  <button key={e.letra} className="eje-tab flex-shrink-0 rounded-xl px-4 py-3 text-left"
                    style={{
                      background: isActive ? e.colorDim : 'rgba(17,24,17,.06)',
                      border: `1.5px solid ${isActive ? e.colorBorder : 'rgba(17,24,17,.1)'}`,
                      outline: 'none', minWidth: 130
                    }}
                    onClick={() => setActiveEje(i)}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-display text-base" style={{ color: isActive ? e.color : '#8aaa8e' }}>EJE {e.letra}</span>
                    </div>
                    <p className="font-body font-semibold text-xs leading-tight" style={{ color: isActive ? '#111811' : '#8aaa8e' }}>
                      {e.titulo}
                    </p>
                  </button>
                )
              })}
            </div>

            {/* Contenido eje activo */}
            <div key={activeEje} className="eje-content-anim rounded-2xl p-5 sm:p-7"
              style={{
                background: '#fff',
                border: `1.5px solid ${eje.colorBorder}`,
                boxShadow: `0 8px 32px ${eje.colorDim}`
              }}>

              {/* Eje header */}
              <div className="flex items-start sm:items-center gap-4 mb-6">
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: eje.colorDim, border: `1.5px solid ${eje.colorBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: eje.color
                }}>
                  {eje.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-display text-sm" style={{ color: eje.color, letterSpacing: '.12em' }}>EJE {eje.letra}</span>
                    <span className="font-body text-xs px-2 py-0.5 rounded-full"
                      style={{ background: eje.colorDim, color: eje.color, border: `1px solid ${eje.colorBorder}` }}>
                      {eje.subtitulo}
                    </span>
                  </div>
                  <h3 className="font-display" style={{ fontSize: 'clamp(1.4rem,4vw,2rem)', color: '#111811', letterSpacing: '.02em', lineHeight: 1 }}>
                    {eje.titulo.toUpperCase()}
                  </h3>
                </div>
              </div>

              {/* Items */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {eje.items.map(({ titulo, desc }, idx) => (
                  <div key={titulo} className={`obj-item-anim obj-delay-${idx + 1} rounded-xl p-4 sm:p-5`}
                    style={{ background: eje.colorDim, border: `1px solid ${eje.colorBorder}` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: eje.color, flexShrink: 0 }} />
                      <h4 className="font-body font-bold text-sm" style={{ color: '#111811' }}>{titulo}</h4>
                    </div>
                    <p className="font-body text-xs sm:text-sm leading-relaxed" style={{ color: '#4a6b50' }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Manifiesto */}
          <div className="mt-12 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(134,200,115,.25)' }}>
            <div style={{ background: 'linear-gradient(135deg,#111811,#1a241a)', padding: '14px 20px', borderBottom: '1px solid rgba(134,200,115,.2)' }}>
              <p className="font-body font-bold text-xs uppercase tracking-widest flex items-center gap-2" style={{ color: 'rgba(134,200,115,.7)', margin: 0 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Discurso de apertura · Luis Barrionuevo
              </p>
            </div>
            <div style={{ background: '#f0f5ee', padding: '20px 24px' }}>
              <blockquote style={{ margin: 0, borderLeft: '3px solid #86C873', paddingLeft: '1.25rem' }}>
                <p className="font-body text-sm sm:text-base leading-relaxed italic" style={{ color: '#1e3020', margin: 0 }}>
                  "Compañeros camioneros de Tucumán: <strong>la ruta nos enseña que solos no llegamos a ningún lado</strong>.
                  Hoy el modelo que representamos desde Moyano Conducción es el de la lealtad, la fuerza y la unión.
                  Me postulo a Secretario General porque conozco el sacrificio que hacen ustedes cada vez que encienden el motor
                  y dejan a sus familias. No vengo a prometer desde un escritorio, vengo a comprometerme desde la calle y la base.
                  Vamos por salarios dignos, por una obra social que responda y por el respeto que nuestra profesión merece.
                  Como dice nuestro lema: <em style={{ color: '#3A7D44' }}>vamos a estar, hoy y siempre, con el trabajador</em>."
                </p>
                <footer className="mt-3 font-body font-bold text-xs uppercase tracking-widest" style={{ color: '#5A9E4A' }}>
                  — Luis Barrionuevo, Candidato a Secretario General
                </footer>
              </blockquote>
            </div>
          </div>

        </div>

        {/* Wave → How it works */}
        <svg className="absolute bottom-0 left-0 w-full" style={{ display: 'block', height: 60, marginBottom: -2 }}
          viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="1440" height="60" fill="#f0f5ee" />
          <path d="M0,30 C360,60 720,0 1080,25 C1260,36 1380,50 1440,30 L1440,60 L0,60 Z" fill="#111811" />
        </svg>
      </section>
    </>
  )
}
