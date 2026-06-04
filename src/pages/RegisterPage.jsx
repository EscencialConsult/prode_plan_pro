import { useState } from 'react'
import { Link } from 'react-router-dom'
import sheetsApi from '../services/sheetsApi.js'

// Dominios mal escritos frecuentes → sugerencia correcta
const TYPOS_EMAIL = {
  'gmai.com': 'gmail.com', 'gmial.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gnail.com': 'gmail.com',
  'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com', 'gmaill.com': 'gmail.com', 'gmail.cm': 'gmail.com',
  'hotmai.com': 'hotmail.com', 'hotmial.com': 'hotmail.com', 'hotmil.com': 'hotmail.com', 'hotnail.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com', 'hotmail.con': 'hotmail.com', 'hotmail.cm': 'hotmail.com',
  'outlok.com': 'outlook.com', 'outloo.com': 'outlook.com', 'outlook.co': 'outlook.com', 'outlook.con': 'outlook.com',
  'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com', 'yahoo.co': 'yahoo.com',
  'live.co': 'live.com', 'icloud.co': 'icloud.com',
}

// Devuelve un mensaje de error si el email es inválido, o null si está OK.
function validarEmail(raw) {
  const e = (raw || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) {
    return 'Ingresá un email válido (ej: nombre@gmail.com)'
  }
  const dominio = e.split('@')[1]
  if (TYPOS_EMAIL[dominio]) {
    return `Revisá el email: ¿quisiste decir @${TYPOS_EMAIL[dominio]}?`
  }
  return null
}

export default function RegisterPage() {
  const [form, setForm]       = useState({ dni: '', nombre: '', email: '', telefono: '', password: '' })
  const [done, setDone]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [autoActivado, setAutoActivado] = useState(false)
  const [showPass, setShowPass] = useState(false)

  function setField(field) {
    return e => setForm(p => ({ ...p, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    // Todos los campos son obligatorios — no se puede dejar nada vacío
    if (!form.dni.trim() || !form.nombre.trim() || !form.email.trim() ||
        !form.telefono.trim() || !form.password.trim()) {
      setError('Completá todos los campos para continuar')
      return
    }

    // ── Validación de TODOS los campos ──
    // DNI: 7-8 dígitos
    if (!/^\d{7,8}$/.test(form.dni.trim())) {
      setError('El DNI debe tener 7 u 8 dígitos numéricos')
      return
    }
    // Nombre completo: nombre + apellido, solo letras
    const nombre = form.nombre.trim()
    if (nombre.length < 3 || !/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'.-]+$/.test(nombre)) {
      setError('Ingresá tu nombre y apellido (solo letras)')
      return
    }
    if (nombre.split(/\s+/).filter(Boolean).length < 2) {
      setError('Ingresá nombre y apellido completos')
      return
    }
    // Email: formato + typos comunes
    const emailErr = validarEmail(form.email)
    if (emailErr) {
      setError(emailErr)
      return
    }
    // Teléfono: entre 8 y 15 dígitos (admite +, espacios y guiones)
    const telDigits = form.telefono.replace(/[\s()+-]/g, '')
    if (!/^\d{8,15}$/.test(telDigits)) {
      setError('Ingresá un teléfono válido (entre 8 y 15 números)')
      return
    }
    // Contraseña: mínimo 6 caracteres
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    try {
      // Validar el DNI contra el padrón (mensajes claros)
      const estadoDni = await sheetsApi.auth.validarDniRegistro(form.dni.trim())
      if (estadoDni === 'ya_registrado') {
        setError('Ese DNI ya está registrado. Iniciá sesión con tu DNI.')
        return
      }
      if (estadoDni === 'no_habilitado') {
        setError('Tu DNI no está habilitado para registrarte. Contactá al sindicato.')
        return
      }

      await sheetsApi.auth.registro(
        form.dni.trim(),
        form.nombre.trim(),
        form.email.trim(),
        form.telefono.trim(),
        form.password
      )
      setAutoActivado(estadoDni === 'habilitado')
      setDone(true)
    } catch (err) {
      setError(err.message || 'No se pudo completar el registro')
    } finally {
      setLoading(false)
    }
  }

  // ── Input field helper ───────────────────────────────────
  const inputStyle = {
    background: 'rgba(255,255,255,.06)',
    border: '1px solid rgba(255,255,255,.1)',
    color: '#fff',
    caretColor: '#ebc32b',
  }
  const onFocus = e => {
    e.target.style.borderColor = 'rgba(235,195,43,.55)'
    e.target.style.background  = 'rgba(235,195,43,.06)'
    e.target.style.boxShadow   = '0 0 0 3px rgba(235,195,43,.1)'
  }
  const onBlur = e => {
    e.target.style.borderColor = 'rgba(255,255,255,.1)'
    e.target.style.background  = 'rgba(255,255,255,.06)'
    e.target.style.boxShadow   = 'none'
  }

  return (
    <>
      <style>{`
        @keyframes rp-fade { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .rp-card { animation: rp-fade .5s ease both; }
        @keyframes rp-spin  { to{transform:rotate(360deg)} }
        .rp-spin { animation: rp-spin .75s linear infinite; }
        @keyframes rp-pop   { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }
        .rp-pop  { animation: rp-pop .5s cubic-bezier(.175,.885,.32,1.275) both; }
        @keyframes rp-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .rp-pulse{ animation: rp-pulse 1.8s ease infinite; }
      `}</style>

      {/* ── Full-screen background ── */}
      <div
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-8"
        style={{
          backgroundImage: [
            'linear-gradient(160deg, rgba(5,9,15,.82) 0%, rgba(12,24,43,.88) 45%, rgba(5,9,15,.95) 100%)',
            "url('./imgprode/fondo-banner.png')",
          ].join(','),
          backgroundSize: 'cover',
          backgroundPosition: 'center 25%',
        }}
      >
        {/* Gold glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 55% 45% at 20% 25%, rgba(235,195,43,.16), transparent 55%)'
        }} />
        {/* Blue glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 50% 45% at 80% 75%, rgba(66,91,139,.28), transparent 55%)'
        }} />

        {/* ── Logo / Brand ── */}
        <div className="relative z-10 flex flex-col items-center mb-6 rp-card">
          <img
            src="./imgprode/sta-logo.png"
            alt="Prode Talento"
            style={{ height: 66, width: 'auto', filter: 'drop-shadow(0 4px 16px rgba(0,0,0,.6))' }}
          />
        </div>

        {/* ── CARD ── */}
        <div
          className="rp-card relative z-10 w-full"
          style={{
            maxWidth: 440,
            background: 'linear-gradient(160deg, rgba(12,24,43,.92) 0%, rgba(5,9,15,.96) 100%)',
            border: '1px solid rgba(235,195,43,.25)',
            borderRadius: 20,
            boxShadow: '0 32px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(235,195,43,.08), inset 0 1px 0 rgba(255,255,255,.05)',
            backdropFilter: 'blur(24px)',
            animationDelay: '.1s',
          }}
        >
          {/* Gold top accent */}
          <div className="rounded-t-[20px] h-0.5 w-full"
            style={{ background: 'linear-gradient(90deg, transparent, #ebc32b 30%, #ebc32b 70%, transparent)' }} />

          <div className="px-8 py-8">

            {done ? (
              /* ══ ESTADO: REGISTRO EXITOSO ══════════════════════════ */
              <div className="text-center py-4">
                {/* Check ring */}
                <div className="rp-pop w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(235,195,43,.25), rgba(235,195,43,.1))', border: '2px solid rgba(235,195,43,.5)', boxShadow: '0 0 0 6px rgba(235,195,43,.08)' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ebc32b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>

                <h2 className="font-display leading-none mb-3" style={{ fontSize: '2.4rem', color: '#fff', letterSpacing: '.03em' }}>
                  {autoActivado ? '¡CUENTA CREADA!' : '¡REGISTRO ENVIADO!'}
                </h2>

                {autoActivado ? (
                  <p className="font-body text-sm leading-relaxed mb-8 max-w-xs mx-auto" style={{ color: 'rgba(255,255,255,.55)' }}>
                    Tu cuenta ya está <strong style={{ color: '#ebc32b' }}>activa</strong>. Ya podés iniciar sesión con tu DNI y contraseña.
                  </p>
                ) : (
                  <>
                    <p className="font-body text-sm leading-relaxed mb-2 max-w-xs mx-auto" style={{ color: 'rgba(255,255,255,.55)' }}>
                      Tu cuenta está <strong style={{ color: '#ebc32b' }}>pendiente de aprobación</strong> por el administrador.
                    </p>
                    <p className="font-body text-sm leading-relaxed mb-8 max-w-xs mx-auto" style={{ color: 'rgba(255,255,255,.4)' }}>
                      Te avisaremos cuando esté activa y ya puedas ingresar.
                    </p>
                  </>
                )}

                {/* Divider */}
                <div className="h-px mb-6 mx-auto w-3/4"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(235,195,43,.2), transparent)' }} />

                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 font-body font-bold text-sm px-6 py-3 rounded-full transition-all"
                  style={{ background: '#ebc32b', color: '#05090f', textDecoration: 'none', boxShadow: '0 6px 20px rgba(235,195,43,.28)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f5d75a'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#ebc32b'; e.currentTarget.style.transform = '' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                  </svg>
                  Ir al inicio de sesión
                </Link>
              </div>

            ) : (
              /* ══ ESTADO: FORMULARIO ════════════════════════════════ */
              <>
                {/* Card header */}
                <div className="mb-7">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 rp-pulse" />
                    <span className="font-body text-xs uppercase tracking-widest font-bold" style={{ color: 'rgba(235,195,43,.7)' }}>
                      Mundial 2026
                    </span>
                  </div>
                  <h1 className="font-display leading-none" style={{ fontSize: '2.6rem', color: '#fff', letterSpacing: '.03em' }}>
                    CREAR CUENTA
                  </h1>
                  <p className="font-body text-sm mt-1.5" style={{ color: 'rgba(255,255,255,.45)' }}>
                    Completá tus datos para unirte al torneo de tu empresa.
                  </p>
                </div>

                {/* Divider */}
                <div className="h-px mb-7" style={{ background: 'linear-gradient(90deg, transparent, rgba(235,195,43,.2) 50%, transparent)' }} />

                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* DNI */}
                  <div>
                    <label htmlFor="reg-dni"
                      className="block font-body font-bold text-xs uppercase tracking-widest mb-2"
                      style={{ color: 'rgba(235,195,43,.8)' }}>
                      DNI <span style={{ color: 'rgba(235,195,43,.5)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— identificador de acceso</span>
                    </label>
                    <input
                      id="reg-dni"
                      type="text"
                      inputMode="numeric"
                      value={form.dni}
                      onChange={e => setForm(p => ({ ...p, dni: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
                      placeholder="12345678"
                      required
                      autoFocus
                      autoComplete="username"
                      className="w-full px-4 py-3.5 rounded-xl font-body text-sm outline-none transition-all"
                      style={{ ...inputStyle, letterSpacing: '0.1em' }}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                    <p className="font-body text-xs mt-1.5" style={{ color: 'rgba(255,255,255,.28)' }}>
                      7 u 8 dígitos · Lo usarás para iniciar sesión
                    </p>
                  </div>

                  {/* Nombre */}
                  <div>
                    <label htmlFor="reg-nombre"
                      className="block font-body font-bold text-xs uppercase tracking-widest mb-2"
                      style={{ color: 'rgba(235,195,43,.8)' }}>
                      Nombre completo
                    </label>
                    <input
                      id="reg-nombre"
                      type="text"
                      value={form.nombre}
                      onChange={setField('nombre')}
                      placeholder="Juan Pérez"
                      required
                      autoComplete="name"
                      className="w-full px-4 py-3.5 rounded-xl font-body text-sm outline-none transition-all"
                      style={inputStyle}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="reg-email"
                      className="block font-body font-bold text-xs uppercase tracking-widest mb-2"
                      style={{ color: 'rgba(235,195,43,.8)' }}>
                      Email
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      value={form.email}
                      onChange={setField('email')}
                      placeholder="tu@empresa.com"
                      required
                      autoComplete="email"
                      className="w-full px-4 py-3.5 rounded-xl font-body text-sm outline-none transition-all"
                      style={inputStyle}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                    <p className="font-body text-xs mt-1.5" style={{ color: 'rgba(255,255,255,.28)' }}>
                      Para recuperación de contraseña y notificaciones
                    </p>
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label htmlFor="reg-telefono"
                      className="block font-body font-bold text-xs uppercase tracking-widest mb-2"
                      style={{ color: 'rgba(235,195,43,.8)' }}>
                      Teléfono
                    </label>
                    <input
                      id="reg-telefono"
                      type="tel"
                      value={form.telefono}
                      onChange={setField('telefono')}
                      placeholder="+54 9 11 1234-5678"
                      required
                      autoComplete="tel"
                      className="w-full px-4 py-3.5 rounded-xl font-body text-sm outline-none transition-all"
                      style={inputStyle}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>

                  {/* Contraseña */}
                  <div>
                    <label htmlFor="reg-password"
                      className="block font-body font-bold text-xs uppercase tracking-widest mb-2"
                      style={{ color: 'rgba(235,195,43,.8)' }}>
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="reg-password"
                        type={showPass ? 'text' : 'password'}
                        value={form.password}
                        onChange={setField('password')}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        autoComplete="new-password"
                        className="w-full pl-4 pr-12 py-3.5 rounded-xl font-body text-sm outline-none transition-all"
                        style={inputStyle}
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(s => !s)}
                        aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md"
                        style={{ color: 'rgba(255,255,255,.45)' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#ebc32b' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,.45)' }}
                      >
                        {showPass ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="font-body text-xs mt-1.5" style={{ color: 'rgba(255,255,255,.28)' }}>
                      Mínimo 6 caracteres
                    </p>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl font-body text-sm"
                      style={{ background: 'rgba(184,69,46,.12)', border: '1px solid rgba(184,69,46,.35)', color: '#e07050' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-px">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full font-body font-bold text-base py-4 rounded-full flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: '#ebc32b', color: '#05090f', boxShadow: '0 8px 28px rgba(235,195,43,.3)' }}
                    onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#f5d75a'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(235,195,43,.45)' } }}
                    onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = '#ebc32b'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 28px rgba(235,195,43,.3)' } }}
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full rp-spin" />
                        Creando cuenta...
                      </>
                    ) : (
                      <>
                        Crear mi cuenta
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                        </svg>
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-5">
                  <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,.08)' }} />
                  <span className="font-body text-xs" style={{ color: 'rgba(255,255,255,.25)' }}>o</span>
                  <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,.08)' }} />
                </div>

                {/* Link login */}
                <Link
                  to="/login"
                  className="block w-full font-body font-semibold text-sm py-3.5 rounded-full text-center transition-all"
                  style={{ border: '1px solid rgba(255,255,255,.18)', color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(235,195,43,.5)'; e.currentTarget.style.color = '#ebc32b'; e.currentTarget.style.background = 'rgba(235,195,43,.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.18)'; e.currentTarget.style.color = 'rgba(255,255,255,.7)'; e.currentTarget.style.background = 'transparent' }}
                >
                  Ya tengo cuenta — Iniciar sesión
                </Link>
              </>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        {!done && (
          <div className="relative z-10 flex flex-col items-center gap-2 mt-6 rp-card" style={{ animationDelay: '.2s' }}>
            <Link to="/"
              className="font-body text-sm flex items-center gap-1.5 transition-colors"
              style={{ color: 'rgba(255,255,255,.38)', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ebc32b' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,.38)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Volver al inicio
            </Link>
            <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,.22)' }}>
              Prohibida la participación de menores de 18 años. Juega con responsabilidad.
            </p>
          </div>
        )}

      </div>
    </>
  )
}