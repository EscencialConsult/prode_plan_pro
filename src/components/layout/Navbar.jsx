import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'
import { BRAND } from '../../brand.js'
import Logo from '../ui/Logo.jsx'

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/apuestas',  label: 'Apuestas'  },
  { to: '/partidos',  label: 'Partidos'  },
]

const USER_LINKS  = [{ to: '/mis-predicciones', label: 'Mis Predicciones' }]
const ADMIN_LINKS = [{ to: '/admin', label: 'Admin' }, { to: '/ranking', label: 'Ranking' }]

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()

  // ✅ Filtrar "Apuestas" si es admin
  const filteredNavLinks = NAV_LINKS.filter(link => {
    // Si es admin y el link es "Apuestas", ocultarlo
    if (isAdmin && link.to === '/apuestas') return false
    return true
  })

  const linkClass = ({ isActive }) =>
    `px-3 py-1.5 rounded-lg text-sm font-body font-medium whitespace-nowrap transition-all ${
      isActive
        ? 'font-bold'
        : ''
    }`

  const linkStyle = isActive => isActive
    ? { background: BRAND.accentSoft, color: BRAND.accent, border: '1px solid rgba(227,6,19,.18)' }
    : { color: BRAND.textMuted, border: '1px solid transparent' }

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background: BRAND.primary,
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${BRAND.border}`,
        boxShadow: '0 1px 10px rgba(0,0,0,.04)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center gap-4">

        {/* ── Logo ── */}
        <Link to="/dashboard" className="flex items-center gap-3 flex-shrink-0 min-w-0">
          <div className="w-px h-5 hidden sm:block" style={{ background: BRAND.accentSoft }} />
          {BRAND.logoPath ? (
            <Logo size={42} alt={BRAND.logoAlt} />
          ) : (
            <span
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '1.15rem',
                color: BRAND.accent,
                letterSpacing: '.05em',
                whiteSpace: 'nowrap',
              }}
            >
              {BRAND.name}
            </span>
          )}
        </Link>

        {/* ── Links ── */}
        <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
          {filteredNavLinks.map(link => (
            <NavLink key={link.to} to={link.to}
              className={({ isActive }) => linkClass({ isActive })}
              style={({ isActive }) => linkStyle(isActive)}
            >
              {link.label}
            </NavLink>
          ))}

          {/* ✅ Mis Predicciones: solo usuarios normales */}
          {user && !isAdmin && USER_LINKS.map(link => (
            <NavLink key={link.to} to={link.to}
              className={({ isActive }) => linkClass({ isActive })}
              style={({ isActive }) => linkStyle(isActive)}
            >
              {link.label}
            </NavLink>
          ))}

          {/* ✅ Admin y Ranking: solo admins */}
          {isAdmin && ADMIN_LINKS.map(link => (
            <NavLink key={link.to} to={link.to}
              className={({ isActive }) => linkClass({ isActive })}
              style={({ isActive }) => isActive
                ? { background: BRAND.accentSoft, color: BRAND.accent, border: '1px solid rgba(227,6,19,.18)', fontWeight: 700 }
                : { color: BRAND.textMuted, border: '1px solid transparent' }
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* ── Usuario + Salir ── */}
        {user && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Avatar + nombre */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center font-display text-xs"
                style={{ background: BRAND.accent, color: '#fff', boxShadow: '0 2px 8px rgba(227,6,19,.22)' }}>
                {(user.nombre || '?')[0].toUpperCase()}
              </div>
              <span className="font-body text-sm" style={{ color: BRAND.textMuted }}>
                {user.nombre}
              </span>
            </div>

            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-lg text-sm font-body font-medium transition-all"
              style={{ color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ff4d6d'; e.currentTarget.style.borderColor = 'rgba(255,77,109,.3)' }}
              onMouseLeave={e => { e.currentTarget.style.color = BRAND.textMuted; e.currentTarget.style.borderColor = BRAND.border }}
            >
              Salir
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
