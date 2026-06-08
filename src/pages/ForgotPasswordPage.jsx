import { useState } from 'react'
import { Link } from 'react-router-dom'
import sheetsApi from '../services/sheetsApi.js'

export default function ForgotPasswordPage() {
  const [form, setForm]       = useState({ dni: '', legajo: '', email: '', password: '' })
  const [step, setStep]       = useState(1)        // 1 = verificar identidad · 2 = nueva contraseña
  const [foundNombre, setFoundNombre] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState(null)

  const setField = field => e => setForm(p => ({ ...p, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    // ── PASO 1: verificar identidad ──
    if (step === 1) {
      if (!/^\d{7,8}$/.test(form.dni.trim())) { setError('El DNI debe tener 7 u 8 dígitos numéricos'); return }
      if (!form.legajo.trim()) { setError('Ingresá tu número de legajo'); return }
      if (!form.email.trim()) { setError('Ingresá tu email'); return }

      setLoading(true)
      try {
        const r = await sheetsApi.auth.verificarRecuperacion(form.dni.trim(), form.legajo.trim(), form.email.trim())
        if (!r.ok) {
          setError('No encontramos una cuenta con esos datos. Revisá DNI, legajo y email.')
          return
        }
        setFoundNombre(r.nombre || '')
        setStep(2)
      } catch (err) {
        setError(err.message || 'No se pudo verificar')
      } finally {
        setLoading(false)
      }
      return
    }

    // ── PASO 2: cambiar la contraseña ──
    if (form.password.length < 6) { setError('La nueva contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true)
    try {
      await sheetsApi.auth.recuperarPassword(form.dni.trim(), form.legajo.trim(), form.email.trim(), form.password)
      setDone(true)
    } catch (err) {
      setError(err.message || 'No se pudo cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  function volverAlPaso1() {
    setStep(1); setError(null); setForm(p => ({ ...p, password: '' }))
  }

  const inputStyle = {
    background: 'rgba(255,255,255,.06)',
    border: '1px solid rgba(255,255,255,.1)',
    color: '#fff',
    caretColor: '#ebc32b',
  }
  const onFocus = e => {
    e.target.style.borderColor = 'rgba(235,195,43,.55)'
    e.target.style.background = 'rgba(235,195,43,.06)'
    e.target.style.boxShadow = '0 0 0 3px rgba(235,195,43,.1)'
  }
  const onBlur = e => {
    e.target.style.borderColor = 'rgba(255,255,255,.1)'
    e.target.style.background = 'rgba(255,255,255,.06)'
    e.target.style.boxShadow = 'none'
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
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{
          background: 'radial-gradient(ellipse 55% 45% at 20% 25%, rgba(235,195,43,.16), transparent 55%)'
        }} />
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{
          background: 'radial-gradient(ellipse 50% 45% at 80% 75%, rgba(66,91,139,.28), transparent 55%)'
        }} />

        <div className="relative z-10 flex flex-col items-center mb-6 lp-card">
          <img
            src="./imgprode/sta-logo.png"
            alt="Prode STA"
            style={{ height: 52, width: 'auto', filter: 'drop-shadow(0 4px 16px rgba(0,0,0,.6))' }}
          />
        </div>

        <div
          className="lp-card relative z-10 w-full"
          style={{
            maxWidth: 420,
            background: 'linear-gradient(160deg, rgba(12,24,43,.92) 0%, rgba(5,9,15,.96) 100%)',
            border: '1px solid rgba(235,195,43,.25)',
            borderRadius: 20,
            boxShadow: '0 32px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(235,195,43,.08), inset 0 1px 0 rgba(255,255,255,.05)',
            backdropFilter: 'blur(24px)',
            animationDelay: '.1s',
          }}
        >
          <div className="rounded-t-[20px] h-0.5 w-full"
            style={{ background: 'linear-gradient(90deg, transparent, #ebc32b 30%, #ebc32b 70%, transparent)' }} />

          <div className="px-8 py-8">

            {done ? (
              /* ── Estado: contraseña cambiada ─────────────────── */
              <div className="text-center py-2">
                <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(235,195,43,.12)', border: '2px solid rgba(235,195,43,.45)' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ebc32b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="font-display mb-3" style={{ fontSize: '2rem', color: '#fff', letterSpacing: '.03em' }}>
                  ¡CONTRASEÑA CAMBIADA!
                </h2>
                <p className="font-body text-sm mb-6 max-w-xs mx-auto" style={{ color: 'rgba(255,255,255,.55)', lineHeight: 1.5 }}>
                  Tu contraseña se actualizó correctamente. Ya podés iniciar sesión con tu DNI y la nueva contraseña.
                </p>
                <Link to="/login"
                  className="inline-flex items-center gap-2 font-body font-bold text-sm px-6 py-3 rounded-full transition-all"
                  style={{ background: '#ebc32b', color: '#05090f', textDecoration: 'none', boxShadow: '0 6px 20px rgba(235,195,43,.28)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f5d75a' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#ebc32b' }}>
                  Ir al inicio de sesión
                </Link>
              </div>
            ) : (
              /* ── Estado: formulario (2 pasos) ───────────── */
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 lp-pulse" />
                    <span className="font-body text-xs uppercase tracking-widest font-bold" style={{ color: 'rgba(235,195,43,.7)' }}>
                      {step === 1 ? 'Paso 1 de 2 · Verificar' : 'Paso 2 de 2 · Nueva contraseña'}
                    </span>
                  </div>
                  <h1 className="font-display leading-none" style={{ fontSize: '2.2rem', color: '#fff', letterSpacing: '.03em' }}>
                    RECUPERAR<br />CONTRASEÑA
                  </h1>
                  <p className="font-body text-sm mt-2" style={{ color: 'rgba(255,255,255,.45)' }}>
                    {step === 1
                      ? 'Verificá tu identidad con tu DNI, legajo y email.'
                      : 'Identidad verificada. Elegí tu nueva contraseña.'}
                  </p>
                </div>

                <div className="h-px mb-6" style={{ background: 'linear-gradient(90deg, transparent, rgba(235,195,43,.2) 50%, transparent)' }} />

                <form onSubmit={handleSubmit} className="space-y-4">

                  {step === 1 ? (
                    <>
                      {/* DNI */}
                      <div>
                        <label className="block font-body font-bold text-xs uppercase tracking-widest mb-2" style={{ color: 'rgba(235,195,43,.8)' }}>DNI</label>
                        <input type="text" inputMode="numeric" value={form.dni}
                          onChange={e => setForm(p => ({ ...p, dni: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
                          placeholder="12345678" required autoFocus
                          className="w-full px-4 py-3.5 rounded-xl font-body text-sm outline-none transition-all"
                          style={{ ...inputStyle, letterSpacing: '0.1em' }} onFocus={onFocus} onBlur={onBlur} />
                      </div>
                      {/* Legajo */}
                      <div>
                        <label className="block font-body font-bold text-xs uppercase tracking-widest mb-2" style={{ color: 'rgba(235,195,43,.8)' }}>Legajo</label>
                        <input type="text" value={form.legajo}
                          onChange={e => setForm(p => ({ ...p, legajo: e.target.value.slice(0, 30) }))}
                          placeholder="Ej: A-1045" required
                          className="w-full px-4 py-3.5 rounded-xl font-body text-sm outline-none transition-all"
                          style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                      </div>
                      {/* Email */}
                      <div>
                        <label className="block font-body font-bold text-xs uppercase tracking-widest mb-2" style={{ color: 'rgba(235,195,43,.8)' }}>Email</label>
                        <input type="email" value={form.email} onChange={setField('email')}
                          placeholder="tu@email.com" required
                          className="w-full px-4 py-3.5 rounded-xl font-body text-sm outline-none transition-all"
                          style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Cuenta encontrada */}
                      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl font-body text-sm"
                        style={{ background: 'rgba(60,160,90,.12)', border: '1px solid rgba(60,160,90,.35)', color: '#7fd49b' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Cuenta encontrada{foundNombre ? `: ${foundNombre}` : ''}</span>
                      </div>
                      {/* Nueva contraseña */}
                      <div>
                        <label className="block font-body font-bold text-xs uppercase tracking-widest mb-2" style={{ color: 'rgba(235,195,43,.8)' }}>Nueva contraseña</label>
                        <div className="relative">
                          <input type={showPass ? 'text' : 'password'} value={form.password} onChange={setField('password')}
                            placeholder="••••••••" required minLength={6} autoFocus autoComplete="new-password"
                            className="w-full pl-4 pr-12 py-3.5 rounded-xl font-body text-sm outline-none transition-all"
                            style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                          <button type="button" onClick={() => setShowPass(s => !s)}
                            aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md"
                            style={{ color: 'rgba(255,255,255,.45)' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#ebc32b' }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,.45)' }}>
                            {showPass ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                              </svg>
                            )}
                          </button>
                        </div>
                        <p className="font-body text-xs mt-1.5" style={{ color: 'rgba(255,255,255,.28)' }}>Mínimo 6 caracteres</p>
                      </div>
                    </>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl font-body text-sm"
                      style={{ background: 'rgba(184,69,46,.12)', border: '1px solid rgba(184,69,46,.35)', color: '#e07050' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-px">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button type="submit" disabled={loading}
                    className="w-full font-body font-bold text-base py-4 rounded-full flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: '#ebc32b', color: '#05090f', boxShadow: '0 8px 28px rgba(235,195,43,.3)' }}
                    onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#f5d75a'; e.currentTarget.style.transform = 'translateY(-2px)' } }}
                    onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = '#ebc32b'; e.currentTarget.style.transform = '' } }}>
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full lp-spin" />
                        {step === 1 ? 'Buscando...' : 'Cambiando...'}
                      </>
                    ) : (step === 1 ? 'Buscar mi cuenta' : 'Cambiar contraseña')}
                  </button>

                  {step === 2 && (
                    <button type="button" onClick={volverAlPaso1}
                      className="w-full font-body text-xs py-2 transition-colors"
                      style={{ color: 'rgba(255,255,255,.4)', background: 'transparent', border: 'none' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#ebc32b' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,.4)' }}>
                      ← Usar otros datos
                    </button>
                  )}
                </form>

                <div className="flex items-center gap-3 my-5">
                  <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,.08)' }} />
                  <span className="font-body text-xs" style={{ color: 'rgba(255,255,255,.25)' }}>o</span>
                  <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,.08)' }} />
                </div>

                <Link to="/login"
                  className="block w-full font-body font-semibold text-sm py-3.5 rounded-full text-center transition-all"
                  style={{ border: '1px solid rgba(255,255,255,.18)', color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(235,195,43,.5)'; e.currentTarget.style.color = '#ebc32b'; e.currentTarget.style.background = 'rgba(235,195,43,.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.18)'; e.currentTarget.style.color = 'rgba(255,255,255,.7)'; e.currentTarget.style.background = 'transparent' }}>
                  ← Volver al login
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-2 mt-6 lp-card" style={{ animationDelay: '.2s' }}>
          <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,.22)' }}>
            Prohibida la participación de menores de 18 años. Juega con responsabilidad.
          </p>
        </div>

      </div>
    </>
  )
}
