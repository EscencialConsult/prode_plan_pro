import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

export default function CompletarPerfilPage() {
  const { user, completarPerfil } = useAuth()
  const navigate = useNavigate()

  const [form, setForm]       = useState({
    nombre:   user?.nombre || '',
    email:    '',          // siempre vacío al inicio para obligar al usuario a ingresarlo
    telefono: user?.telefono || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  function setField(field) {
    return e => setForm(p => ({ ...p, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Ingresá un email válido')
      return
    }
    if (!form.telefono.trim()) {
      setError('El teléfono es obligatorio')
      return
    }

    setLoading(true)
    try {
      await completarPerfil(form.nombre, form.email, form.telefono)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'No se pudo guardar el perfil. Intentá nuevamente.')
    } finally {
      setLoading(false)
    }
  }

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
        @keyframes cp-fade { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .cp-card { animation: cp-fade .5s ease both; }
        @keyframes cp-spin  { to{transform:rotate(360deg)} }
        .cp-spin { animation: cp-spin .75s linear infinite; }
        @keyframes cp-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .cp-pulse{ animation: cp-pulse 1.8s ease infinite; }
        @keyframes cp-badge { from{transform:scale(0) rotate(-15deg);opacity:0} to{transform:scale(1) rotate(0);opacity:1} }
        .cp-badge { animation: cp-badge .5s cubic-bezier(.175,.885,.32,1.275) .2s both; }
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

        {/* ── Logo ── */}
        <div className="relative z-10 flex flex-col items-center mb-6 cp-card">
          <img
            src="./imgprode/colegio-logo-blanco.png"
            alt="Prode"
            style={{ height: 60, width: 'auto', filter: 'drop-shadow(0 4px 16px rgba(0,0,0,.6))' }}
          />
        </div>

        {/* ── CARD ── */}
        <div
          className="cp-card relative z-10 w-full"
          style={{
            maxWidth: 440,
            background: 'linear-gradient(160deg, rgba(12,24,43,.92) 0%, rgba(5,9,15,.96) 100%)',
            border: '1px solid rgba(235,195,43,.3)',
            borderRadius: 20,
            boxShadow: '0 32px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(235,195,43,.08), inset 0 1px 0 rgba(255,255,255,.05)',
            backdropFilter: 'blur(24px)',
            animationDelay: '.1s',
          }}
        >
          {/* Gold accent */}
          <div className="rounded-t-[20px] h-0.5 w-full"
            style={{ background: 'linear-gradient(90deg, transparent, #ebc32b 30%, #ebc32b 70%, transparent)' }} />

          <div className="px-8 py-8">

            {/* Header con badge especial */}
            <div className="mb-7">
              <div className="flex items-center gap-3 mb-3">
                {/* Badge primer ingreso */}
                <div className="cp-badge flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(235,195,43,.3), rgba(235,195,43,.1))',
                    border: '1.5px solid rgba(235,195,43,.55)',
                    boxShadow: '0 0 16px rgba(235,195,43,.2)',
                  }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ebc32b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div>
                  <span className="font-body text-xs uppercase tracking-widest font-bold block"
                    style={{ color: 'rgba(235,195,43,.7)' }}>
                    Primer ingreso
                  </span>
                  <span className="font-body text-xs" style={{ color: 'rgba(255,255,255,.3)' }}>
                    DNI: {user?.dni || '—'}
                  </span>
                </div>
              </div>
              <h1 className="font-display leading-none"
                style={{ fontSize: '2.4rem', color: '#fff', letterSpacing: '.03em' }}>
                COMPLETÁ<br />TU PERFIL
              </h1>
              <p className="font-body text-sm mt-2" style={{ color: 'rgba(255,255,255,.45)', lineHeight: 1.5 }}>
                Bienvenido colega.

Indícanos dónde deseas recibir la aceptación y las comunicaciones del juego. Te solicitamos este dato por única vez para gestionar correctamente tu participación y mantenerte informado durante todo el desarrollo del concurso.
              </p>
            </div>

            {/* Divider */}
            <div className="h-px mb-6"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(235,195,43,.2) 50%, transparent)' }} />

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Nombre */}
              <div>
                <label htmlFor="cp-nombre"
                  className="block font-body font-bold text-xs uppercase tracking-widest mb-2"
                  style={{ color: 'rgba(235,195,43,.8)' }}>
                  Nombre completo
                </label>
                <input
                  id="cp-nombre"
                  type="text"
                  value={form.nombre}
                  onChange={setField('nombre')}
                  placeholder="Juan Pérez"
                  required
                  autoFocus
                  autoComplete="name"
                  className="w-full px-4 py-3.5 rounded-xl font-body text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="cp-email"
                  className="block font-body font-bold text-xs uppercase tracking-widest mb-2"
                  style={{ color: 'rgba(235,195,43,.8)' }}>
                  Email
                </label>
                <input
                  id="cp-email"
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
                <label htmlFor="cp-telefono"
                  className="block font-body font-bold text-xs uppercase tracking-widest mb-2"
                  style={{ color: 'rgba(235,195,43,.8)' }}>
                  Teléfono
                </label>
                <input
                  id="cp-telefono"
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
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full cp-spin" />
                    Guardando perfil...
                  </>
                ) : (
                  <>
                    Confirmar y continuar
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

          </div>
        </div>

        {/* ── Footer ── */}
        <div className="relative z-10 mt-6 cp-card" style={{ animationDelay: '.2s' }}>
          <p className="font-body text-xs text-center" style={{ color: 'rgba(255,255,255,.22)' }}>
            Condición de participación: podrán participar únicamente los profesionales matriculados en el Colegio de Graduados en Ciencias Económicas de Tucumán que posean Matrícula Profesional (MP) vigente y se encuentren al día con sus obligaciones institucionales.
          </p>
        </div>

      </div>
    </>
  )
}
