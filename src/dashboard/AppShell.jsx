import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg> },
  { to: '/apuestas', label: 'Apuestas', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg> },
  { to: '/partidos', label: 'Fixture', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
  { to: '/mis-predicciones', label: 'Mis Prodes', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg> },
  { to: '/ranking', label: 'Ranking', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg> },
  { to: '/manual', label: 'Manual', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg> },
]

const ADMIN_ICON = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
const MANUAL_ICON = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
const KEY_ICON = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>

// ❌ ELIMINAR ESTAS LÍNEAS (26-31):
// const filteredNavItems = NAV_ITEMS.filter(item => {
//   if (esAdmin && (item.to === '/apuestas' || item.to === '/mis-predicciones' || item.to === '/manual')) {
//     return false
//   }
//   return true
// })

function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() || '')
    .join('')
}

// ... resto del código sin cambios

function NavLink({ to, label, icon, location }) {
  const a = location.pathname === to

  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '.38rem',
          padding: '.4rem .78rem',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: '.75rem',
          letterSpacing: '.05em',
          textTransform: 'uppercase',
          color: a ? '#86C873' : 'rgba(255,255,255,.45)',
          background: a ? 'rgba(134,200,115,.12)' : 'transparent',
          border: a ? '1px solid rgba(134,200,115,.28)' : '1px solid transparent',
          transition: 'all .16s',
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          if (!a) {
            e.currentTarget.style.color = 'rgba(255,255,255,.82)'
            e.currentTarget.style.background = 'rgba(255,255,255,.05)'
          }
        }}
        onMouseLeave={e => {
          if (!a) {
            e.currentTarget.style.color = 'rgba(255,255,255,.45)'
            e.currentTarget.style.background = 'transparent'
          }
        }}
      >
        <span style={{ color: a ? '#86C873' : 'inherit', display: 'flex', opacity: a ? 1 : .65 }}>
          {icon}
        </span>
        {label}
      </span>
    </Link>
  )
}

function NavLinkMob({ to, label, icon, location, onClick }) {
  const a = location.pathname === to

  return (
    <Link to={to} onClick={onClick} style={{ textDecoration: 'none' }}>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '.5rem',
          padding: '.62rem .88rem',
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '.85rem',
          color: a ? '#86C873' : 'rgba(255,255,255,.6)',
          background: a ? 'rgba(134,200,115,.1)' : 'transparent',
        }}
      >
        <span style={{ color: a ? '#86C873' : 'inherit', display: 'flex' }}>{icon}</span>
        {label}
      </span>
    </Link>
  )
}

export default function AppShell({ children }) {
  const { user, logout, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mob, setMob] = useState(false)
  const [logoutState, setLogoutState] = useState('idle')
  const [userMenu, setUserMenu] = useState(false)

  const esAdmin = isAdmin || user?.rol === 'admin' || user?.es_admin === true || user?.tipo_usuario === 'admin'

// ✅ FILTRAR NAV_ITEMS: ocultar "Apuestas", "Mis Prodes" y "Manual" para admins
  const filteredNavItems = NAV_ITEMS.filter(item => {
    if (esAdmin && (item.to === '/apuestas' || item.to === '/mis-predicciones' || item.to === '/manual')) {
      return false
    }
    return true
  })

  function pedirConfirmacion() {
    setLogoutState('confirm')
  }

  function cancelarLogout() {
    setLogoutState('idle')
  }

  async function confirmarLogout() {
    setLogoutState('logging')

    try {
      await logout()
    } catch (e) {
      console.warn('Logout falló pero seguimos:', e.message)
    }

    setLogoutState('redirect')

    setTimeout(() => {
      navigate('/')
    }, 700)
  }

  return (
    <>
      <style>{`
        @keyframes shell-in {
          from { opacity: 0; transform: translateY(7px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .shell-in {
          animation: shell-in .38s ease both;
        }

        @keyframes ldot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .38; transform: scale(.68); }
        }

        .ldot {
          animation: ldot 1.6s ease infinite;
        }

        @keyframes spin-out {
          to { transform: rotate(360deg); }
        }

        .spin-out {
          animation: spin-out .9s linear infinite;
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .fade-in {
          animation: fade-in .25s ease both;
        }

        @keyframes pop-in {
          from { opacity: 0; transform: scale(.92) translateY(-4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .pop-in {
          animation: pop-in .2s ease both;
        }

        @media(max-width:860px) {
          .dnav { display: none !important; }
          .mhb { display: flex !important; }
          .hide-mob { display: none !important; }
        }

        @media(max-width:640px) {
          .shell-foot {
            padding: 1.25rem 1rem !important;
          }
          .foot-container {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 0.9rem !important;
          }
          .foot-left, .foot-right {
            justify-content: center !important;
            flex-wrap: wrap !important;
            gap: 0.5rem !important;
          }
        }
      `}</style>

<div
        style={{
          background: '#f0f5ee',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'DM Sans',sans-serif",
          minHeight: '100dvh',
          overflow: 'hidden',
        }}
      >
        <nav
          style={{
            background: '#111811',
            flexShrink: 0,
            zIndex: 50,
            borderBottom: '1px solid rgba(134,200,115,.14)',
          }}
        >
<div
  style={{
    maxWidth: 1200,  // ← cambiar de 896 a 1200
    margin: '0 auto',
    padding: '0 1.5rem',
    height: 62,
    display: 'flex',
    alignItems: 'center',
  }}

          >
            <Link to="/dashboard" style={{ textDecoration: 'none', flexShrink: 0, marginRight: '1.8rem', display: 'flex', alignItems: 'center' }}>
              <img
                src="/imgprode/one-prode-gorro-blanco.png"
                alt="PRODE"
                style={{
                  height: 50,
                  width: 'auto',
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,.5))',
                  display: 'block',
                  transform: 'translateY(4px)',
                }}
              />
            </Link>

<div className="dnav" style={{ display: 'flex', alignItems: 'center', gap: '.15rem', flex: 1 }}>
  {filteredNavItems.map(({ to, label, icon }) => (
    <NavLink key={to} to={to} label={label} icon={icon} location={location} />
  ))}

  {esAdmin && (
    <NavLink to="/admin" label="Configuración" icon={ADMIN_ICON} location={location} />
  )}
</div>

{esAdmin && (
  <Link
    to="/manual-admin"
    className="hide-mob"
    style={{ textDecoration: 'none', marginRight: '.75rem' }}
  >
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '.4rem',
        padding: '.4rem .85rem',
        borderRadius: 8,
        fontWeight: 700,
        fontSize: '.72rem',
        letterSpacing: '.06em',
        textTransform: 'uppercase',
        color: location.pathname === '/manual-admin' ? '#111811' : '#86C873',
        background: location.pathname === '/manual-admin' ? '#86C873' : 'transparent',
        border: '1.5px solid #86C873',
        transition: 'all .16s',
        cursor: 'pointer',
        boxShadow: location.pathname === '/manual-admin'
          ? '0 0 0 3px rgba(134,200,115,.18)'
          : 'none',
      }}
      onMouseEnter={e => {
        if (location.pathname !== '/manual-admin') {
          e.currentTarget.style.background = 'rgba(134,200,115,.14)'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(134,200,115,.1)'
        }
      }}
      onMouseLeave={e => {
        if (location.pathname !== '/manual-admin') {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      <span style={{ display: 'flex' }}>{MANUAL_ICON}</span>
      Manual
    </span>
  </Link>
)}

            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginLeft: 'auto' }}>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '.32rem',
                  fontSize: '.65rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '.1em',
                  color: '#22c55e',
                }}
              >
                <span
                  className="ldot"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#22c55e',
                    display: 'inline-block',
                  }}
                />
                En vivo
              </span>

              <div className="hide-mob" style={{ position: 'relative' }}>
                <button
                  type="button"
                  title="Opciones de cuenta"
                  aria-haspopup="menu"
                  aria-expanded={userMenu}
                  onClick={() => setUserMenu(v => !v)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '.42rem',
                    padding: '.28rem .55rem .28rem .28rem',
                    borderRadius: 99,
                    background: (userMenu || location.pathname === '/cambiar-password')
                      ? 'rgba(134,200,115,.14)' : 'rgba(255,255,255,.07)',
                    border: `1px solid ${(userMenu || location.pathname === '/cambiar-password')
                      ? 'rgba(134,200,115,.4)' : 'rgba(255,255,255,.1)'}`,
                    cursor: 'pointer',
                    transition: 'all .16s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(134,200,115,.4)' }}
                  onMouseLeave={e => {
                    if (!userMenu && location.pathname !== '/cambiar-password') {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)'
                    }
                  }}
                >
                  <div
                    style={{
                      width: 27,
                      height: 27,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg,#86C873,#5A9E4A)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: '.88rem',
                      color: '#0a0f0a',
                    }}
                  >
                    {initials(user?.nombre || user?.name || 'U')}
                  </div>

                  <span
                    style={{
                      fontSize: '.78rem',
                      fontWeight: 600,
                      color: 'rgba(255,255,255,.72)',
                      maxWidth: 84,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user?.nombre || user?.name || 'Usuario'}
                  </span>

                  {/* Flechita indicadora de menú desplegable */}
                  <svg
                    width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke="rgba(255,255,255,.5)" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{
                      flexShrink: 0,
                      transition: 'transform .18s',
                      transform: userMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {userMenu && (
                  <>
                    {/* Backdrop para cerrar al hacer click afuera */}
                    <div
                      onClick={() => setUserMenu(false)}
                      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'transparent' }}
                    />

                    <div
                      role="menu"
                      className="pop-in"
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        zIndex: 61,
                        minWidth: 200,
                        background: '#fff',
                        borderRadius: 12,
                        boxShadow: '0 12px 32px rgba(17,24,17,.22), 0 0 0 1px rgba(17,24,17,.06)',
                        padding: '.35rem',
                        border: '1px solid #c8dbcc',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute', top: -6, right: 22, width: 12, height: 12,
                          background: '#fff', transform: 'rotate(45deg)',
                          borderTop: '1px solid #c8dbcc', borderLeft: '1px solid #c8dbcc',
                        }}
                      />

                      <Link
                        to="/cambiar-password"
                        role="menuitem"
                        onClick={() => setUserMenu(false)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '.55rem',
                          padding: '.6rem .7rem', borderRadius: 8,
                          fontSize: '.82rem', fontWeight: 600, color: '#111811',
                          textDecoration: 'none', transition: 'background .14s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f6f1e3' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                      >
                        <span style={{ color: '#5A9E4A', display: 'flex' }}>{KEY_ICON}</span>
                        Cambiar contraseña
                      </Link>
                    </div>
                  </>
                )}
              </div>

              <div className="hide-mob" style={{ position: 'relative' }}>
                <button
                  onClick={logoutState === 'idle' ? pedirConfirmacion : undefined}
                  disabled={logoutState === 'logging' || logoutState === 'redirect'}
                  style={{
                    background: logoutState === 'logging' ? 'rgba(255,77,109,.12)' : 'transparent',
                    border: `1px solid ${logoutState === 'logging' ? 'rgba(255,77,109,.4)' : 'rgba(255,255,255,.1)'}`,
                    borderRadius: 7,
                    padding: '.3rem .68rem',
                    fontSize: '.74rem',
                    fontWeight: 600,
                    color: logoutState === 'logging' ? '#ff4d6d' : 'rgba(255,255,255,.35)',
                    cursor: logoutState === 'logging' || logoutState === 'redirect' ? 'wait' : 'pointer',
                    transition: 'all .16s',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '.4rem',
                    minWidth: 64,
                    justifyContent: 'center',
                  }}
                  onMouseEnter={e => {
                    if (logoutState === 'idle') {
                      e.currentTarget.style.borderColor = 'rgba(255,77,109,.45)'
                      e.currentTarget.style.color = '#ff4d6d'
                    }
                  }}
                  onMouseLeave={e => {
                    if (logoutState === 'idle') {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)'
                      e.currentTarget.style.color = 'rgba(255,255,255,.35)'
                    }
                  }}
                >
                  {logoutState === 'logging' ? (
                    <>
                      <svg className="spin-out" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Saliendo...
                    </>
                  ) : (
                    'Salir'
                  )}
                </button>

                {logoutState === 'confirm' && (
                  <>
                    <div
                      onClick={cancelarLogout}
                      style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 60,
                        background: 'transparent',
                      }}
                    />

                    <div
                      className="pop-in"
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        zIndex: 61,
                        minWidth: 240,
                        background: '#fff',
                        borderRadius: 12,
                        boxShadow: '0 12px 32px rgba(17,24,17,.22), 0 0 0 1px rgba(17,24,17,.06)',
                        padding: '.85rem .95rem',
                        border: '1px solid #c8dbcc',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: 22,
                          width: 12,
                          height: 12,
                          background: '#fff',
                          transform: 'rotate(45deg)',
                          borderTop: '1px solid #c8dbcc',
                          borderLeft: '1px solid #c8dbcc',
                        }}
                      />

                      <p
                        style={{
                          fontFamily: "'Bebas Neue',sans-serif",
                          fontSize: '1rem',
                          color: '#111811',
                          margin: '0 0 .15rem',
                          letterSpacing: '.02em',
                        }}
                      >
                        ¿Cerrar sesión?
                      </p>

                      <p
                        style={{
                          fontSize: '.76rem',
                          color: '#4a6b50',
                          margin: '0 0 .85rem',
                          lineHeight: 1.4,
                        }}
                      >
                        Vas a volver a la pantalla de inicio.
                      </p>

                      <div style={{ display: 'flex', gap: '.45rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={cancelarLogout}
                          style={{
                            background: 'transparent',
                            border: '1px solid #c8dbcc',
                            borderRadius: 7,
                            padding: '.4rem .8rem',
                            fontSize: '.74rem',
                            fontWeight: 600,
                            color: '#4a6b50',
                            cursor: 'pointer',
                            transition: 'all .14s',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = '#111811'
                            e.currentTarget.style.color = '#111811'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = '#c8dbcc'
                            e.currentTarget.style.color = '#4a6b50'
                          }}
                        >
                          Cancelar
                        </button>

                        <button
                          onClick={confirmarLogout}
                          style={{
                            background: '#ff4d6d',
                            border: '1px solid #ff4d6d',
                            borderRadius: 7,
                            padding: '.4rem .9rem',
                            fontSize: '.74rem',
                            fontWeight: 700,
                            color: '#fff',
                            cursor: 'pointer',
                            transition: 'all .14s',
                            letterSpacing: '.02em',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = '#e0354f'
                            e.currentTarget.style.borderColor = '#e0354f'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = '#ff4d6d'
                            e.currentTarget.style.borderColor = '#ff4d6d'
                          }}
                        >
                          Sí, salir
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                className="mhb"
                onClick={() => setMob(v => !v)}
                style={{
                  display: 'none',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,.14)',
                  borderRadius: 7,
                  padding: '.36rem',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,.6)',
                  alignItems: 'center',
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  {mob ? (
                    <>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </>
                  ) : (
                    <>
                      <line x1="3" y1="7" x2="21" y2="7" />
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="17" x2="21" y2="17" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          {mob && (
            <div
              style={{
                borderTop: '1px solid rgba(134,200,115,.1)',
                padding: '1.2rem 1.2rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '.5rem',
                background: '#111811',
              }}
            >
              {/* User Profile Header in mobile menu */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '.65rem',
                  padding: '.2rem .5rem 1rem',
                  borderBottom: '1px solid rgba(134,200,115,.12)',
                  marginBottom: '.4rem',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg,#86C873,#5A9E4A)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Bebas Neue',sans-serif",
                    fontSize: '1.15rem',
                    color: '#0a0f0a',
                  }}
                >
                  {initials(user?.nombre || user?.name || 'U')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: '.9rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.nombre || user?.name || 'Usuario'}
                  </span>
                  <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.email}
                  </span>
                </div>
              </div>

              {filteredNavItems.map(({ to, label, icon }) => (
                <NavLinkMob key={to} to={to} label={label} icon={icon} location={location} onClick={() => setMob(false)} />
              ))}

              {esAdmin && (
                <NavLinkMob to="/admin" label="Configuración" icon={ADMIN_ICON} location={location} onClick={() => setMob(false)} />
              )}

              {/* Manual for admin */}
              {esAdmin && (
                <NavLinkMob to="/manual-admin" label="Manual Admin" icon={MANUAL_ICON} location={location} onClick={() => setMob(false)} />
              )}

              <NavLinkMob to="/cambiar-password" label="Cambiar contraseña" icon={KEY_ICON} location={location} onClick={() => setMob(false)} />

              {/* Salir / Logout button */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: '1rem', marginTop: '.5rem' }}>
                <button
                  onClick={() => {
                    setMob(false)
                    pedirConfirmacion()
                  }}
                  style={{
                    width: '100%',
                    background: 'rgba(255,77,109,.08)',
                    border: '1px solid rgba(255,77,109,.3)',
                    borderRadius: 10,
                    padding: '.7rem',
                    fontSize: '.85rem',
                    fontWeight: 700,
                    color: '#ff4d6d',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '.4rem',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </nav>


        <main
          className="shell-in"
          style={{
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            background: '#f0f5ee',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ flex: '1 0 auto' }}>
            {children}
          </div>

          <footer
            className="shell-foot"
            style={{
              background: '#0a0f0a',
              borderTop: '1px solid rgba(134,200,115,.22)',
              padding: '1.25rem 2rem',
              flexShrink: 0,
              marginTop: '2rem',
            }}
          >
            <div
              className="foot-container"
              style={{
                maxWidth: 1280,
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '.75rem',
              }}
            >
              <div className="foot-left" style={{ display: 'flex', alignItems: 'center', gap: '.65rem', flexWrap: 'wrap' }}>
                <img src="/imgprode/one-prode-blanco.png" alt="ONE Prode" style={{ height: 26, width: 'auto', display: 'block', opacity: .9 }} />
                <span
                  style={{
                    fontFamily: "'DM Sans',sans-serif",
                    fontSize: '.72rem',
                    color: 'rgba(255,255,255,.45)',
                    fontWeight: 400,
                  }}
                >
                  | Todos los derechos reservados. © {new Date().getFullYear()}
                </span>
              </div>

              <div className="foot-right" style={{ display: 'flex', alignItems: 'center', gap: '.65rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <span
                    style={{
                      fontFamily: "'DM Sans',sans-serif",
                      fontSize: '.72rem',
                      color: 'rgba(255,255,255,.45)',
                      fontWeight: 400,
                    }}
                  >
                    Desarrollado por
                  </span>
                  <img src="/imgprode/one-prode-blanco.png" alt="ONE Prode" style={{ height: 20, width: 'auto', display: 'block', opacity: .8 }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <span
                    style={{
                      fontFamily: "'DM Sans',sans-serif",
                      fontSize: '.72rem',
                      color: 'rgba(255,255,255,.45)',
                      fontWeight: 400,
                    }}
                  >
                    by
                  </span>
                  <img
                    src="/img/escencial-logoblanco.png"
                    alt="Escencial"
                    style={{
                      height: 28,
                      width: 'auto',
                      display: 'block',
                      cursor: 'pointer',
                      opacity: .6,
                      transition: 'opacity .18s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '.6' }}
                    onClick={() => window.open('https://escencialconsultora.com.ar/', '_blank')}
                  />
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {logoutState === 'redirect' && (
        <div
          className="fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(17,24,17,.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(134,200,115,.15)',
                border: '1px solid rgba(134,200,115,.4)',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#86C873" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <p
              style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: '1.6rem',
                margin: '0 0 .25rem',
                letterSpacing: '.04em',
              }}
            >
              Sesión cerrada
            </p>

            <p
              style={{
                fontSize: '.82rem',
                color: 'rgba(255,255,255,.55)',
                margin: 0,
              }}
            >
              Te llevamos al inicio...
            </p>
          </div>
        </div>
      )}
    </>
  )
}