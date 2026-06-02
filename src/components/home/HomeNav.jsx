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
        ? { background: 'rgba(12,24,43,.96)', backdropFilter: 'blur(16px)', boxShadow: '0 1px 0 rgba(255,125,0,.18),0 8px 24px rgba(70,0,155,.22)', padding: '.7rem 0' }
        : { background: 'transparent', padding: '1rem 0' }
      }>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src="./imgprode/bancosol-blanco.png" alt="Prode Talento"
          style={{ height: 50, width: 'auto', filter: 'drop-shadow(0 4px 14px rgba(70,0,155,.25))' }} />

        <div className="hidden lg:flex items-center gap-8">
          {links.map(([href, label]) => (
            <a key={href} href={href} className="font-body font-medium text-sm transition-colors"
              style={{ color: 'rgba(255,255,255,.85)', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#FF7D00' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,.85)' }}>
              {label}
            </a>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <Link to="/login" className="font-body font-semibold text-sm px-5 py-2.5 rounded-full transition-all"
            style={{ color: 'rgba(255,255,255,.88)', border: '1.5px solid rgba(255,255,255,.28)', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF7D00'; e.currentTarget.style.color = '#FF7D00' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.28)'; e.currentTarget.style.color = 'rgba(255,255,255,.88)' }}>
            Iniciar sesión
          </Link>
          <Link to="/register" className="font-body font-bold text-sm px-5 py-2.5 rounded-full transition-all"
            style={{ background: '#FF7D00', color: '#05090f', boxShadow: '0 6px 20px rgba(255,125,0,.25)', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#ff9a33'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#FF7D00'; e.currentTarget.style.transform = '' }}>
            Crear mi cuenta
          </Link>
        </div>

        <button className="lg:hidden p-2 flex flex-col gap-1.5" onClick={() => setOpen(o => !o)}>
          <span className="block w-6 h-0.5 rounded bg-white" style={open ? { transform: 'rotate(45deg) translate(3px,3px)' } : {}} />
          <span className="block w-6 h-0.5 rounded bg-white" style={open ? { opacity: 0 } : {}} />
          <span className="block w-6 h-0.5 rounded bg-white" style={open ? { transform: 'rotate(-45deg) translate(3px,-3px)' } : {}} />
        </button>
      </div>

      {open && (
        <div className="lg:hidden mt-2 mx-4 rounded-xl p-4 space-y-1"
          style={{ background: 'rgba(12,24,43,.97)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,125,0,.35)' }}>
          {links.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}
              className="block py-3 px-4 rounded-lg text-sm font-body text-white transition-colors"
              style={{ textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#FF7D00' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#ffffff' }}>
              {label}
            </a>
          ))}
          <div className="pt-2 space-y-2">
            <Link to="/login" onClick={() => setOpen(false)}
              className="block text-center py-3 rounded-full text-sm font-body font-semibold text-white"
              style={{ border: '1.5px solid rgba(255,255,255,.3)', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF7D00'; e.currentTarget.style.color = '#FF7D00' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.3)'; e.currentTarget.style.color = '#ffffff' }}>
              Iniciar sesión
            </Link>
            <Link to="/register" onClick={() => setOpen(false)}
              className="block text-center py-3 rounded-full text-sm font-body font-bold"
              style={{ background: '#FF7D00', color: '#05090f', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#ff9a33' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FF7D00' }}>
              Crear mi cuenta
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}