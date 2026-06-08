import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import AlianzaMark from '../brand/AlianzaMark.jsx'
import AlianzaWordmark from '../brand/AlianzaWordmark.jsx'

export default function HomeNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const links = [
    { href: '#como-funciona', label: '¿Cómo funciona?' },
    { href: '#funcionalidades', label: 'Funcionalidades' },
    { href: '#faq', label: 'Ayuda' },
  ]

  // Helper to handle smooth scroll to hash links if on the homepage
  const handleLinkClick = (e, href) => {
    if (location.pathname === '/') {
      e.preventDefault()
      setOpen(false)
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // Update URL hash
        window.history.pushState(null, '', href)
      }
    }
  }

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-[#05090f]/90 backdrop-blur-md border-b border-accent/20 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.4)]' 
          : 'bg-transparent py-5'
      }`}
      aria-label="Navegación principal"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand/Logo (Clickable link back to home) */}
        <Link 
          to="/" 
          onClick={() => { setOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          className="flex items-center gap-2.5 filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg p-1 transition-all"
          title="Ir al inicio"
        >
          <AlianzaMark size={36} />
          <div className="flex flex-col justify-center leading-none">
            <AlianzaWordmark size={18} color="#fff" />
            <span className="font-sans text-[7.5px] font-bold tracking-[0.08em] uppercase text-slate-400 mt-0.5">
              Grupo Asegurador
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-8">
          {links.map(({ href, label }) => (
            <a 
              key={href} 
              href={href}
              onClick={(e) => handleLinkClick(e, href)}
              className="relative py-2 font-body font-medium text-sm text-slate-300 hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:text-white focus-visible:ring-2 focus-visible:ring-accent/50 rounded px-1
                         after:absolute after:bottom-0 after:left-1/2 after:w-0 after:h-[2px] after:bg-accent after:transition-all after:duration-300 after:-translate-x-1/2 hover:after:w-full focus-visible:after:w-full"
            >
              {label}
            </a>
          ))}
        </div>

        {/* Desktop Buttons */}
        <div className="hidden lg:flex items-center gap-4">
          <Link 
            to="/login" 
            className="font-body font-semibold text-sm px-5 py-2.5 rounded-full border border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 hover:bg-white/5 active:scale-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent"
          >
            Iniciar sesión
          </Link>
          <Link 
            to="/register" 
            className="font-body font-bold text-sm px-5 py-2.5 rounded-full bg-accent text-[#040D1D] hover:bg-[#bde04b] hover:text-[#040D1D] hover:shadow-[0_0_20px_rgba(166,201,52,0.35)] active:scale-95 hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent"
          >
            Crear mi cuenta
          </Link>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button 
          className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        >
          {open ? <X className="w-6 h-6 animate-fade-in" /> : <Menu className="w-6 h-6 animate-fade-in" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <div 
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          open ? 'max-h-[380px] opacity-100 mt-3 mx-4' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="rounded-2xl p-5 space-y-4 bg-[#081730]/95 backdrop-blur-xl border border-accent/30 shadow-2xl">
          {/* Navigation Links */}
          <div className="flex flex-col space-y-1">
            {links.map(({ href, label }) => (
              <a 
                key={href} 
                href={href} 
                onClick={(e) => handleLinkClick(e, href)}
                className="block py-3 px-4 rounded-xl text-sm font-body font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {label}
              </a>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-3">
            <Link 
              to="/login" 
              onClick={() => setOpen(false)}
              className="block text-center py-3 rounded-full text-sm font-body font-semibold text-slate-200 border border-slate-700 hover:text-white hover:bg-white/5 active:scale-98 transition-all"
            >
              Iniciar sesión
            </Link>
            <Link 
              to="/register" 
              onClick={() => setOpen(false)}
              className="block text-center py-3 rounded-full text-sm font-body font-bold bg-accent text-[#040D1D] hover:bg-[#bde04b] hover:text-[#040D1D] active:scale-98 transition-all"
            >
              Crear mi cuenta
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}