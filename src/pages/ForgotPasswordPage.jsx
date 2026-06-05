import { useState } from 'react'
import { Link } from 'react-router-dom'
import sheetsApi from '../services/sheetsApi.js'

export default function ForgotPasswordPage() {
  const [dni, setDni] = useState('')
  const [step, setStep] = useState('dni') // 'dni', 'verify', 'success'
  const [esFalso, setEsFalso] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  
  // Form fields for Step 2
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [nuevoEmail, setNuevoEmail] = useState('')
  const [emailRegistrado, setEmailRegistrado] = useState('')
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleCheckDni(e) {
    e.preventDefault()
    if (!dni.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await sheetsApi.auth.verificarDniRecuperacion(dni)
      setEsFalso(res.esFalso)
      setRegisteredEmail(res.email)
      setStep('verify')
    } catch (err) {
      setError(err.message || 'El DNI ingresado no corresponde a ningún usuario.')
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (nuevaPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const verificacion = esFalso ? nombreCompleto : emailRegistrado
      await sheetsApi.auth.recuperarAccesoPublico(
        dni,
        verificacion,
        esFalso ? nuevoEmail : null,
        nuevaPassword
      )
      setStep('success')
    } catch (err) {
      setError(err.message || 'No se pudieron actualizar tus datos de acceso.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes lp-fade { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .lp-card { animation: lp-fade .5s ease both; }
        @keyframes lp-spin { to{transform:rotate(360deg)} }
        .lp-spin { animation: lp-spin .75s linear infinite; }
        @keyframes lp-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .lp-pulse { animation: lp-pulse 1.8s ease infinite; }
      `}</style>

      {/* ── Full-screen background ── */}
      <div
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-8"
        style={{
          backgroundImage: [
            'linear-gradient(160deg, rgba(10,15,10,.82) 0%, rgba(17,24,17,.88) 45%, rgba(10,15,10,.95) 100%)',
            "var(--bg-banner)",
          ].join(','),
          backgroundSize: 'cover',
          backgroundPosition: 'center 25%',
        }}
      >
        {/* Green glow top-left */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{
          background: 'radial-gradient(ellipse 55% 45% at 20% 25%, rgba(134,200,115,.16), transparent 55%)'
        }} />
        {/* Deep glow bottom-right */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{
          background: 'radial-gradient(ellipse 50% 45% at 80% 75%, rgba(58,92,58,.28), transparent 55%)'
        }} />

        {/* ── TOP: logo ── */}
        <div className="relative z-10 flex flex-col items-center mb-6 lp-card">
          <img
            src="./imgprode/one-prode-gorro-blanco.png"
            alt="Prode"
            style={{ height: 52, width: 'auto', filter: 'drop-shadow(0 4px 16px rgba(0,0,0,.6))' }}
          />
        </div>

        {/* ── CARD ── */}
        <div
          className="lp-card relative z-10 w-full"
          style={{
            maxWidth: 440,
            background: 'linear-gradient(160deg, rgba(17,24,17,.92) 0%, rgba(10,15,10,.96) 100%)',
            border: '1px solid rgba(134,200,115,.25)',
            borderRadius: 20,
            boxShadow: '0 32px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(134,200,115,.08), inset 0 1px 0 rgba(255,255,255,.05)',
            backdropFilter: 'blur(24px)',
            animationDelay: '.1s',
          }}
        >
          {/* Top accent line */}
          <div className="rounded-t-[20px] h-0.5 w-full"
            style={{ background: 'linear-gradient(90deg, transparent, #86C873 30%, #86C873 70%, transparent)' }} />

          <div className="px-6 py-8 sm:px-8">

            {step === 'success' && (
              /* ── ESTADO: ÉXITO ─────────────────── */
              <div className="text-center py-2">
                <div
                  className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(134,200,115,.12)',
                    border: '2px solid rgba(134,200,115,.45)',
                  }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#86C873" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>

                <h2 className="font-display mb-3" style={{ fontSize: '2rem', color: '#fff', letterSpacing: '.03em' }}>
                  ¡PROCESO EXITOSO!
                </h2>
                <p className="font-body text-sm mb-6 max-w-xs mx-auto" style={{ color: 'rgba(255,255,255,.65)', lineHeight: 1.5 }}>
                  Tu contraseña fue actualizada correctamente. Ya podés iniciar sesión con tu DNI y tu nueva clave.
                </p>

                <Link
                  to="/login"
                  className="inline-block font-body font-bold text-sm px-6 py-3 rounded-full transition-all"
                  style={{ background: '#86C873', color: '#0a0f0a', textDecoration: 'none', boxShadow: '0 4px 16px rgba(134,200,115,0.2)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#A8E096' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#86C873' }}
                >
                  Volver al Login
                </Link>
              </div>
            )}

            {step === 'dni' && (
              /* ── PASO 1: VERIFICAR DNI ───────────── */
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 lp-pulse" />
                    <span className="font-body text-xs uppercase tracking-widest font-bold"
                      style={{ color: 'rgba(134,200,115,.7)' }}>
                      Recuperar acceso
                    </span>
                  </div>
                  <h1 className="font-display leading-none"
                    style={{ fontSize: '2.2rem', color: '#fff', letterSpacing: '.03em' }}>
                    ¿OLVIDASTE TU CONTRASEÑA?
                  </h1>
                  <p className="font-body text-sm mt-2.5" style={{ color: 'rgba(255,255,255,.45)' }}>
                    Ingresá tu DNI para verificar el estado de tu cuenta y restablecer tu clave.
                  </p>
                </div>

                <div className="h-px mb-6"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(134,200,115,.2) 50%, transparent)' }} />

                <form onSubmit={handleCheckDni} className="space-y-4">
                  <div>
                    <label htmlFor="dni"
                      className="block font-body font-bold text-xs uppercase tracking-widest mb-2"
                      style={{ color: 'rgba(134,200,115,.8)' }}>
                      Número de DNI
                    </label>
                    <input
                      id="dni"
                      type="text"
                      pattern="[0-9]+"
                      value={dni}
                      onChange={e => setDni(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ej: 30123456"
                      required
                      autoFocus
                      className="w-full px-4 py-3.5 rounded-xl font-body text-sm outline-none transition-all"
                      style={{
                        background: 'rgba(255,255,255,.06)',
                        border: '1px solid rgba(255,255,255,.1)',
                        color: '#fff',
                        caretColor: '#86C873',
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = 'rgba(134,200,115,.55)'
                        e.target.style.background = 'rgba(134,200,115,.06)'
                        e.target.style.boxShadow = '0 0 0 3px rgba(134,200,115,.1)'
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = 'rgba(255,255,255,.1)'
                        e.target.style.background = 'rgba(255,255,255,.06)'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl font-body text-sm"
                      style={{ background: 'rgba(184,69,46,.12)', border: '1px solid rgba(184,69,46,.35)', color: '#e07050' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-px">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !dni}
                    className="w-full font-body font-bold text-base py-4 rounded-full flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: '#86C873', color: '#0a0f0a', boxShadow: '0 8px 28px rgba(134,200,115,.3)' }}
                    onMouseEnter={e => { if (!loading && dni) { e.currentTarget.style.background = '#A8E096'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                    onMouseLeave={e => { if (!loading && dni) { e.currentTarget.style.background = '#86C873'; e.currentTarget.style.transform = ''; } }}
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full lp-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        Verificar DNI
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                        </svg>
                      </>
                    )}
                  </button>
                </form>

                <div className="flex items-center gap-3 my-5">
                  <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,.08)' }} />
                  <span className="font-body text-xs" style={{ color: 'rgba(255,255,255,.25)' }}>o</span>
                  <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,.08)' }} />
                </div>

                <Link
                  to="/login"
                  className="block w-full font-body font-semibold text-sm py-3.5 rounded-full text-center transition-all"
                  style={{ border: '1px solid rgba(255,255,255,.18)', color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(134,200,115,.5)'; e.currentTarget.style.color = '#86C873'; e.currentTarget.style.background = 'rgba(134,200,115,.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.18)'; e.currentTarget.style.color = 'rgba(255,255,255,.7)'; e.currentTarget.style.background = 'transparent' }}
                >
                  ← Volver al login
                </Link>
              </>
            )}

            {step === 'verify' && (
              /* ── PASO 2: VERIFICAR Y RESTABLECER ───────────── */
              <>
                <div className="mb-5">
                  <span className="font-body text-xs uppercase tracking-widest font-bold"
                    style={{ color: '#86C873' }}>
                    DNI verificado: {dni}
                  </span>
                  <h1 className="font-display leading-none mt-2"
                    style={{ fontSize: '2.0rem', color: '#fff', letterSpacing: '.03em' }}>
                    RESTABLECER CLAVE
                  </h1>
                  
                  {esFalso ? (
                    <div className="mt-3 p-3.5 rounded-xl font-body text-xs leading-relaxed"
                      style={{ background: 'rgba(244,180,42,0.08)', border: '1px solid rgba(244,180,42,0.25)', color: '#ffd166' }}>
                      <strong>⚠️ No tenés un email real actualizado.</strong> Antes de restablecer tu contraseña, ingresá un correo real y validá tu Nombre completo tal cual te registraste.
                    </div>
                  ) : (
                    <div className="mt-3 p-3.5 rounded-xl font-body text-xs leading-relaxed"
                      style={{ background: 'rgba(134,200,115,0.08)', border: '1px solid rgba(134,200,115,0.25)', color: '#a8e096' }}>
                      <strong>✉️ Tu cuenta posee un email real.</strong> Ingresá el correo electrónico asociado a tu DNI para confirmar tu identidad y cambiar tu contraseña.
                    </div>
                  )}
                </div>

                <form onSubmit={handleReset} className="space-y-4">
                  {esFalso ? (
                    <>
                      {/* Caso Fake Email: Pide Nombre Completo + Nuevo Email */}
                      <div>
                        <label className="block font-body font-bold text-xs uppercase tracking-widest mb-1.5"
                          style={{ color: 'rgba(255,255,255,.7)' }}>
                          Nombre Completo
                        </label>
                        <input
                          type="text"
                          value={nombreCompleto}
                          onChange={e => setNombreCompleto(e.target.value)}
                          placeholder="Tu nombre y apellido registrado"
                          required
                          className="w-full px-4 py-3 rounded-xl font-body text-sm outline-none transition-all"
                          style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#fff' }}
                        />
                      </div>
                      <div>
                        <label className="block font-body font-bold text-xs uppercase tracking-widest mb-1.5"
                          style={{ color: 'rgba(255,255,255,.7)' }}>
                          Tu nuevo Email real
                        </label>
                        <input
                          type="email"
                          value={nuevoEmail}
                          onChange={e => setNuevoEmail(e.target.value)}
                          placeholder="ejemplo@correo.com"
                          required
                          className="w-full px-4 py-3 rounded-xl font-body text-sm outline-none transition-all"
                          style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#fff' }}
                        />
                      </div>
                    </>
                  ) : (
                    /* Caso Real Email: Pide confirmar el Email Registrado */
                    <div>
                      <label className="block font-body font-bold text-xs uppercase tracking-widest mb-1.5"
                        style={{ color: 'rgba(255,255,255,.7)' }}>
                        Confirmar Email Registrado
                      </label>
                      <input
                        type="email"
                        value={emailRegistrado}
                        onChange={e => setEmailRegistrado(e.target.value)}
                        placeholder="Ingresá tu correo electrónico"
                        required
                        className="w-full px-4 py-3 rounded-xl font-body text-sm outline-none transition-all"
                        style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#fff' }}
                      />
                    </div>
                  )}

                  {/* Password fields */}
                  <div>
                    <label className="block font-body font-bold text-xs uppercase tracking-widest mb-1.5"
                      style={{ color: 'rgba(255,255,255,.7)' }}>
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={nuevaPassword}
                      onChange={e => setNuevaPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      className="w-full px-4 py-3 rounded-xl font-body text-sm outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#fff' }}
                    />
                  </div>

                  <div>
                    <label className="block font-body font-bold text-xs uppercase tracking-widest mb-1.5"
                      style={{ color: 'rgba(255,255,255,.7)' }}>
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={confirmarPassword}
                      onChange={e => setConfirmarPassword(e.target.value)}
                      placeholder="Repetir contraseña"
                      required
                      className="w-full px-4 py-3 rounded-xl font-body text-sm outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#fff' }}
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl font-body text-sm"
                      style={{ background: 'rgba(184,69,46,.12)', border: '1px solid rgba(184,69,46,.35)', color: '#e07050' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-px">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setStep('dni'); setError(null); }}
                      className="flex-1 font-body font-semibold text-sm py-3.5 rounded-full text-center transition-all"
                      style={{ border: '1px solid rgba(255,255,255,.15)', color: 'rgba(255,255,255,.7)' }}
                    >
                      Atrás
                    </button>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-[2] font-body font-bold text-sm py-3.5 rounded-full flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                      style={{ background: '#86C873', color: '#0a0f0a', boxShadow: '0 6px 20px rgba(134,200,115,.25)' }}
                    >
                      {loading ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full lp-spin" />
                          Guardando...
                        </>
                      ) : (
                        'Guardar y Entrar'
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="relative z-10 flex flex-col items-center gap-2 mt-6 lp-card" style={{ animationDelay: '.2s' }}>
          <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,.22)' }}>
            Prohibida la participación de menores de 18 años. Juega con responsabilidad.
          </p>
        </div>

      </div>
    </>
  )
}