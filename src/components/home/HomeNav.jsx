import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function HomeNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const links = [
    ['#como-funciona', '¿Cómo funciona?'],
    ['#funcionalidades', 'Funcionalidades'],
    ['#faq', 'Ayuda'],
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={scrolled
        ? { background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(16px)', boxShadow: '0 1px 0 rgba(0,87,184,.08),0 8px 24px rgba(0,87,184,.12)', padding: '.7rem 0' }
        : { background: 'transparent', padding: '1rem 0' }
      }>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src="./imgprode/colegio-logo-azul.png" alt="Prode Talento"
          style={{ height: 60, width: 'auto' }} />

        <div className="hidden lg:flex items-center gap-8">
          {links.map(([href, label]) => (
            <a key={href} href={href} className="font-body font-medium text-sm transition-colors"
              style={{ color: '#0B1F44', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#0057B8' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#0B1F44' }}>
              {label}
            </a>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <Link to="/login" className="font-body font-semibold text-sm px-5 py-2.5 rounded-full transition-all"
            style={{ background: '#ffffff', color: '#0057B8', border: '1.5px solid #0057B8', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#0057B8'; e.currentTarget.style.color = '#ffffff' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#0057B8' }}>
            Iniciar sesión
          </Link>
          <Link to="/register" className="font-body font-bold text-sm px-5 py-2.5 rounded-full transition-all"
            style={{ background: '#0057B8', color: '#ffffff', boxShadow: '0 4px 14px rgba(0,87,184,.25)', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#00479A'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#0057B8'; e.currentTarget.style.transform = '' }}>
            Crear mi cuenta
          </Link>
        </div>

        <button className="lg:hidden p-2 flex flex-col gap-1.5" onClick={() => setOpen(o => !o)}>
          <span className="block w-6 h-0.5 rounded bg-[#0B1F44]" style={open ? { transform: 'rotate(45deg) translate(3px,3px)' } : {}} />
          <span className="block w-6 h-0.5 rounded bg-[#0B1F44]" style={open ? { opacity: 0 } : {}} />
          <span className="block w-6 h-0.5 rounded bg-[#0B1F44]" style={open ? { transform: 'rotate(-45deg) translate(3px,-3px)' } : {}} />
        </button>
      </div>

      {open && (
        <div className="lg:hidden mt-2 mx-4 rounded-xl p-4 space-y-1"
          style={{ background: 'rgba(255,255,255,.98)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0,87,184,.12)', boxShadow: '0 8px 32px rgba(0,87,184,0.15)' }}>
          {links.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}
              className="block py-3 px-4 rounded-lg text-sm font-body text-[#0B1F44]" style={{ textDecoration: 'none' }}>
              {label}
            </a>
          ))}
          <div className="pt-2 space-y-2">
            <Link to="/login" onClick={() => setOpen(false)}
              className="block text-center py-3 rounded-full text-sm font-body font-semibold text-[#0057B8]"
              style={{ background: '#ffffff', border: '1.5px solid #0057B8', textDecoration: 'none' }}>
              Iniciar sesión
            </Link>
            <Link to="/register" onClick={() => setOpen(false)}
              className="block text-center py-3 rounded-full text-sm font-body font-bold text-white"
              style={{ background: '#0057B8', textDecoration: 'none' }}>
              Crear mi cuenta
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}