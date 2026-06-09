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

  // Sobre el hero oscuro (arriba) → texto claro. Al scrollear (barra blanca) → texto oscuro.
  const linkColor   = scrolled ? '#3a3a40' : 'rgba(255,255,255,.9)'
  const loginColor  = scrolled ? '#232327' : '#ffffff'
  const loginBorder = scrolled ? '#d4d4d8' : 'rgba(255,255,255,.45)'
  const barColor    = scrolled ? '#232327' : '#ffffff'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={scrolled
        ? { background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(16px)', boxShadow: '0 1px 0 rgba(0,0,0,.06),0 6px 20px rgba(0,0,0,.06)', padding: '.7rem 0' }
        : { background: 'transparent', padding: '1rem 0' }
      }>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src="./imgprode/one-prode-talento-new3.png" alt="Bercovich"
          style={{ height: 72, width: 'auto', marginTop: -14, marginLeft: -8, filter: scrolled ? 'none' : 'drop-shadow(0 2px 8px rgba(0,0,0,.45))' }} />

        <div className="hidden lg:flex items-center gap-8">
          {links.map(([href, label]) => (
            <a key={href} href={href} className="font-body font-medium text-sm transition-colors"
              style={{ color: linkColor, textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#c02727' }}
              onMouseLeave={e => { e.currentTarget.style.color = linkColor }}>
              {label}
            </a>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <Link to="/login" className="font-body font-semibold text-sm px-5 py-2.5 rounded-full transition-all"
            style={{ color: loginColor, border: `1.5px solid ${loginBorder}`, textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#c02727'; e.currentTarget.style.color = scrolled ? '#c02727' : '#ffffff'; e.currentTarget.style.background = scrolled ? 'transparent' : 'rgba(192,39,39,.85)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = loginBorder; e.currentTarget.style.color = loginColor; e.currentTarget.style.background = 'transparent' }}>
            Iniciar sesión
          </Link>
          <Link to="/register" className="font-body font-bold text-sm px-5 py-2.5 rounded-full transition-all"
            style={{ background: '#c02727', color: '#fff', boxShadow: '0 6px 18px rgba(192,39,39,.3)', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#a81f1f'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#c02727'; e.currentTarget.style.transform = '' }}>
            Crear mi cuenta
          </Link>
        </div>

        <button className="lg:hidden p-2 flex flex-col gap-1.5" onClick={() => setOpen(o => !o)}>
          <span className="block w-6 h-0.5 rounded" style={{ background: barColor, ...(open ? { transform: 'rotate(45deg) translate(3px,3px)' } : {}) }} />
          <span className="block w-6 h-0.5 rounded" style={{ background: barColor, ...(open ? { opacity: 0 } : {}) }} />
          <span className="block w-6 h-0.5 rounded" style={{ background: barColor, ...(open ? { transform: 'rotate(-45deg) translate(3px,-3px)' } : {}) }} />
        </button>
      </div>

      {open && (
        <div className="lg:hidden mt-2 mx-4 rounded-xl p-4 space-y-1"
          style={{ background: '#ffffff', backdropFilter: 'blur(16px)', border: '1px solid #e4e4e7', boxShadow: '0 12px 32px rgba(0,0,0,.1)' }}>
          {links.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}
              className="block py-3 px-4 rounded-lg text-sm font-body" style={{ color: '#232327', textDecoration: 'none' }}>
              {label}
            </a>
          ))}
          <div className="pt-2 space-y-2">
            <Link to="/login" onClick={() => setOpen(false)}
              className="block text-center py-3 rounded-full text-sm font-body font-semibold"
              style={{ color: '#232327', border: '1.5px solid #d4d4d8', textDecoration: 'none' }}>
              Iniciar sesión
            </Link>
            <Link to="/register" onClick={() => setOpen(false)}
              className="block text-center py-3 rounded-full text-sm font-body font-bold"
              style={{ background: '#c02727', color: '#fff', textDecoration: 'none' }}>
              Crear mi cuenta
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
