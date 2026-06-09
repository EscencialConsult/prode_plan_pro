import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BRAND } from '../../brand.js'
import Logo from '../ui/Logo.jsx'

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
        ? { background: BRAND.surface, backdropFilter: 'blur(16px)', boxShadow: '0 1px 10px rgba(0,0,0,.06)', borderBottom: `1px solid ${BRAND.border}`, padding: '.7rem 0' }
        : { background: 'transparent', padding: '1rem 0' }
      }>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo size={46} alt={BRAND.logoAlt} tone={scrolled ? undefined : 'white'} style={scrolled ? undefined : { filter: 'drop-shadow(0 4px 12px rgba(0,0,0,.5))' }} />

        <div className="hidden lg:flex items-center gap-8">
          {links.map(([href, label]) => (
            <a key={href} href={href} className="font-body font-medium text-sm transition-colors"
              style={{ color: scrolled ? BRAND.text : 'rgba(255,255,255,.82)', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#E30613' }}
              onMouseLeave={e => { e.currentTarget.style.color = scrolled ? BRAND.text : 'rgba(255,255,255,.82)' }}>
              {label}
            </a>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <Link to="/login" className="font-body font-semibold text-sm px-5 py-2.5 rounded-full transition-all"
            style={{ color: scrolled ? BRAND.text : 'rgba(255,255,255,.88)', border: `1.5px solid ${scrolled ? BRAND.text : 'rgba(255,255,255,.32)'}`, textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#E30613'; e.currentTarget.style.color = '#E30613' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = scrolled ? BRAND.text : 'rgba(255,255,255,.32)'; e.currentTarget.style.color = scrolled ? BRAND.text : 'rgba(255,255,255,.88)' }}>
            Iniciar sesión
          </Link>
          <Link to="/register" className="font-body font-bold text-sm px-5 py-2.5 rounded-full transition-all"
            style={{ background: BRAND.accent, color: '#fff', boxShadow: '0 4px 14px rgba(227,6,19,.3)', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#C7050F'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#E30613'; e.currentTarget.style.transform = '' }}>
            Crear mi cuenta
          </Link>
        </div>

        <button className="lg:hidden p-2 flex flex-col gap-1.5" onClick={() => setOpen(o => !o)}>
          <span className="block w-6 h-0.5 rounded" style={{ background: scrolled ? BRAND.text : '#fff', ...(open ? { transform: 'rotate(45deg) translate(3px,3px)' } : {}) }} />
          <span className="block w-6 h-0.5 rounded" style={{ background: scrolled ? BRAND.text : '#fff', ...(open ? { opacity: 0 } : {}) }} />
          <span className="block w-6 h-0.5 rounded" style={{ background: scrolled ? BRAND.text : '#fff', ...(open ? { transform: 'rotate(-45deg) translate(3px,-3px)' } : {}) }} />
        </button>
      </div>

      {open && (
        <div className="lg:hidden mt-2 mx-4 rounded-xl p-4 space-y-1"
          style={{ background: '#fff', backdropFilter: 'blur(16px)', border: `1px solid ${BRAND.border}`, boxShadow: '0 8px 32px rgba(0,0,0,.12)' }}>
          {links.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}
              className="block py-3 px-4 rounded-lg text-sm font-body" style={{ textDecoration: 'none', color: BRAND.text }}>
              {label}
            </a>
          ))}
          <div className="pt-2 space-y-2">
            <Link to="/login" onClick={() => setOpen(false)}
              className="block text-center py-3 rounded-full text-sm font-body font-semibold"
              style={{ border: `1.5px solid ${BRAND.text}`, color: BRAND.text, textDecoration: 'none' }}>
              Iniciar sesión
            </Link>
            <Link to="/register" onClick={() => setOpen(false)}
              className="block text-center py-3 rounded-full text-sm font-body font-bold"
              style={{ background: BRAND.accent, color: '#fff', textDecoration: 'none' }}>
              Crear mi cuenta
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
