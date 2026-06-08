import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'
import AlianzaMark from '../brand/AlianzaMark.jsx'
import AlianzaWordmark from '../brand/AlianzaWordmark.jsx'

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
    ? { background: 'rgba(166, 201, 52,.15)', color: '#A6C934', border: '1px solid rgba(166, 201, 52,.3)' }
    : { color: 'rgba(255,255,255,.55)', border: '1px solid transparent' }

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background: 'rgba(5,9,15,.94)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(166, 201, 52,.12)',
        boxShadow: '0 4px 24px rgba(0,0,0,.4)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center gap-4">

        {/* ── Logo ── */}
        <Link to="/dashboard" className="flex items-center gap-2 flex-shrink-0 min-w-0" style={{ textDecoration: 'none', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,.4))' }}>
          <AlianzaMark size={32} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <AlianzaWordmark size={16} color="#fff" />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: '7px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
              Grupo Asegurador
            </span>
          </div>
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
                ? { background: 'rgba(166, 201, 52,.2)', color: '#A6C934', border: '1px solid rgba(166, 201, 52,.4)', fontWeight: 700 }
                : { color: 'rgba(166, 201, 52,.6)', border: '1px solid transparent' }
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
                style={{ background: 'linear-gradient(135deg,#A6C934,#0E5DA8)', color: '#040D1D', boxShadow: '0 2px 8px rgba(166, 201, 52,.3)' }}>
                {(user.nombre || '?')[0].toUpperCase()}
              </div>
              <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,.55)' }}>
                {user.nombre}
              </span>
            </div>

            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-lg text-sm font-body font-medium transition-all"
              style={{ color: 'rgba(255,255,255,.45)', border: '1px solid rgba(255,255,255,.1)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ff4d6d'; e.currentTarget.style.borderColor = 'rgba(255,77,109,.3)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,.45)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)' }}
            >
              Salir
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}