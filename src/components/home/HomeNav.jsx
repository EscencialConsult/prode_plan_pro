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
      style={scrolled || open
        ? { background: 'rgba(10,15,10,.97)', backdropFilter: 'blur(20px)', boxShadow: '0 1px 0 rgba(134,200,115,.18),0 8px 28px rgba(0,0,0,.45)', padding: '.65rem 0' }
        : { background: 'transparent', padding: '1rem 0' }
      }>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <img
            src="./imgprode/one-prode-blanco.png"
            alt="ONE PRODE"
            style={{
              height: 'clamp(44px, 8vw, 62px)',
              width: 'auto',
              display: 'block',
              filter: 'drop-shadow(0 2px 12px rgba(134, 200, 115, 0.5))',
              transition: 'transform 0.3s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
          />
          <div style={{ width: 1, height: 26, background: 'rgba(134,200,115,.25)', flexShrink: 0 }} />
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize: 'clamp(0.9rem, 2.2vw, 1.15rem)', letterSpacing: '.07em', lineHeight: 1, userSelect: 'none' }}>
            <span style={{ color: '#7BA3C0' }}>MOYANO </span>
            <span style={{ color: '#fff' }}>C</span>
            <span style={{ color: '#ebc32b' }}>O</span>
            <span style={{ color: '#fff' }}>N</span>
            <span style={{ color: '#7BA3C0' }}>DUCCIÓN</span>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-6">
          {links.map(([href, label]) => (
            <a key={href} href={href} className="font-body font-medium text-sm transition-colors"
              style={{ color: 'rgba(255,255,255,.72)', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#86C873' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,.72)' }}>
              {label}
            </a>
          ))}

          {/* ★ Link campaña — diferenciado */}
          <Link to="/luisbarrionuevo"
            className="font-body font-bold text-xs uppercase tracking-widest px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5"
            style={{ color: '#86C873', border: '1px solid rgba(134,200,115,.38)', background: 'rgba(134,200,115,.07)', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(134,200,115,.16)'; e.currentTarget.style.borderColor = 'rgba(134,200,115,.65)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(134,200,115,.07)'; e.currentTarget.style.borderColor = 'rgba(134,200,115,.38)' }}>
            <span>★</span>
            Luis Barrionuevo
          </Link>
        </div>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center gap-3">
          <Link to="/login" className="font-body font-semibold text-sm px-5 py-2.5 rounded-full transition-all"
            style={{ color: 'rgba(255,255,255,.82)', border: '1.5px solid rgba(255,255,255,.22)', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#86C873'; e.currentTarget.style.color = '#86C873' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.22)'; e.currentTarget.style.color = 'rgba(255,255,255,.82)' }}>
            Iniciar sesión
          </Link>
          <Link to="/register" className="font-body font-bold text-sm px-5 py-2.5 rounded-full transition-all"
            style={{ background: 'linear-gradient(135deg,#86C873,#5A9E4A)', color: '#0a0f0a', boxShadow: '0 6px 20px rgba(134,200,115,.35)', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(134,200,115,.45)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 6px 20px rgba(134,200,115,.35)' }}>
            Registrarse
          </Link>
        </div>

        {/* Hamburger mobile */}
        <button className="lg:hidden p-2 flex flex-col gap-1.5 min-h-[44px] min-w-[44px] items-center justify-center" onClick={() => setOpen(o => !o)}>
          <span className="block w-6 h-0.5 rounded bg-white transition-all" style={open ? { transform: 'translateY(8px) rotate(45deg)' } : {}} />
          <span className="block w-6 h-0.5 rounded bg-white transition-all" style={open ? { opacity: 0 } : {}} />
          <span className="block w-6 h-0.5 rounded bg-white transition-all" style={open ? { transform: 'translateY(-8px) rotate(-45deg)' } : {}} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden mt-2 mx-4 rounded-2xl p-4 space-y-1"
          style={{ background: 'rgba(17,24,17,.98)', backdropFilter: 'blur(20px)', border: '1px solid rgba(134,200,115,.25)' }}>
          {links.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}
              className="block py-3 px-4 rounded-xl text-sm font-body font-medium text-white"
              style={{ textDecoration: 'none', transition: 'background .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(134,200,115,.08)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '' }}>
              {label}
            </a>
          ))}

          {/* Link campaña mobile */}
          <Link to="/luisbarrionuevo" onClick={() => setOpen(false)}
            className="flex items-center gap-2 py-3 px-4 rounded-xl text-sm font-body font-bold"
            style={{ textDecoration: 'none', background: 'rgba(134,200,115,.08)', border: '1px solid rgba(134,200,115,.22)', color: '#86C873' }}>
            ★ Luis Barrionuevo 2026
          </Link>

          <div className="pt-2 space-y-2">
            <Link to="/login" onClick={() => setOpen(false)}
              className="block text-center py-3 rounded-full text-sm font-body font-semibold text-white"
              style={{ border: '1.5px solid rgba(255,255,255,.2)', textDecoration: 'none' }}>
              Iniciar sesión
            </Link>
            <Link to="/register" onClick={() => setOpen(false)}
              className="block text-center py-3 rounded-full text-sm font-body font-bold"
              style={{ background: 'linear-gradient(135deg,#86C873,#5A9E4A)', color: '#0a0f0a', textDecoration: 'none' }}>
              Registrarse
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}