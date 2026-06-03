import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

export default function LoginPage() {
  const { login, loading, error } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (_) {}
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
          background: 'radial-gradient(ellipse 55% 45% at 20% 25%, rgba(134,200,115,.18), transparent 55%)'
        }} />
        {/* Deep glow bottom-right */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{
          background: 'radial-gradient(ellipse 50% 45% at 80% 75%, rgba(58,125,68,.22), transparent 55%)'
        }} />

        {/* ── TOP: logo empresa + marca ── */}
        <div className="relative z-10 flex flex-col items-center mb-6 lp-card">
          <img
            src="./imgprode/one-prode-blanco.png"
            alt="ONE PRODE"
            style={{
              height: 'clamp(70px, 20vw, 110px)',
              width: 'auto',
              display: 'block',
              filter: 'drop-shadow(0 4px 25px rgba(134,200,115,0.65)) drop-shadow(0 0 4px rgba(255,255,255,0.95))',
            }}
          />
        </div>

        {/* ── CARD ── */}
        <div
          className="lp-card relative z-10 w-full"
          style={{
            maxWidth: 420,
            background: 'linear-gradient(160deg, rgba(17,24,17,.94) 0%, rgba(10,15,10,.98) 100%)',
            border: '1px solid rgba(134,200,115,.28)',
            borderRadius: 20,
            boxShadow: '0 32px 80px rgba(0,0,0,.65), 0 0 0 1px rgba(134,200,115,.08), inset 0 1px 0 rgba(255,255,255,.05)',
            backdropFilter: 'blur(24px)',
            animationDelay: '.1s',
          }}
        >
          {/* Green top accent line */}
          <div className="rounded-t-[20px] h-0.5 w-full"
            style={{ background: 'linear-gradient(90deg, transparent, #86C873 30%, #86C873 70%, transparent)' }} />

          <div className="px-5 py-6 sm:px-8 sm:py-8">

            {/* Card header */}
            <div className="mb-7">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 lp-pulse" style={{ background: '#86C873', boxShadow: '0 0 8px #86C873' }} />
                <span className="font-body text-xs uppercase tracking-widest font-bold"
                  style={{ color: '#86C873', textShadow: '0 0 10px rgba(134,200,115,0.2)' }}>
                  PRODE LUIS BARRIONUEVO
                </span>
              </div>
              <h1 className="font-display leading-none"
                style={{ fontSize: 'clamp(1.8rem, 6vw, 2.6rem)', color: '#fff', letterSpacing: '.03em' }}>
                BIENVENIDO
              </h1>
              <p className="font-body text-sm mt-1.5" style={{ color: 'rgba(255,255,255,.45)' }}>
                Ingresá para empezar a pronosticar con tu equipo.
              </p>
            </div>

            {/* Divider */}
            <div className="h-px mb-7"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(134,200,115,.2) 50%, transparent)' }} />

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email */}
              <div>
                <label htmlFor="email"
                  className="block font-body font-bold text-xs uppercase tracking-widest mb-2"
                  style={{ color: 'rgba(255,255,255,.7)' }}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="tu@empresa.com"
                  required
                  autoFocus
                  autoComplete="email"
                  className="w-full px-4 py-3.5 rounded-xl font-body text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,.05)',
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
                    e.target.style.background = 'rgba(255,255,255,.05)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Contraseña */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password"
                    className="block font-body font-bold text-xs uppercase tracking-widest"
                    style={{ color: 'rgba(255,255,255,.7)' }}>
                    Contraseña
                  </label>
                  <Link
                    to="/forgot-password"
                    className="font-body text-xs transition-colors"
                    style={{ color: 'rgba(255,255,255,.45)', textDecoration: 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#86C873' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,.45)' }}
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3.5 rounded-xl font-body text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,.05)',
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
                    e.target.style.background = 'rgba(255,255,255,.05)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl font-body text-sm"
                  style={{ background: 'rgba(184,69,46,.12)', border: '1px solid rgba(184,69,46,.35)', color: '#e07050' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full font-body font-bold text-base py-4 rounded-full flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#86C873,#5A9E4A)', color: '#0a0f0a', boxShadow: '0 8px 28px rgba(134,200,115,.3)' }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(134,200,115,.5)' } }}
                onMouseLeave={e => { if (!loading) { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 28px rgba(134,200,115,.3)' } }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full lp-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    Entrar al torneo
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Divider o */}
            <div className="flex items-center gap-3 my-5">
              <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,.08)' }} />
              <span className="font-body text-xs" style={{ color: 'rgba(255,255,255,.25)' }}>o</span>
              <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,.08)' }} />
            </div>

            {/* Registrarse */}
            <Link
              to="/register"
              className="block w-full font-body font-semibold text-sm py-3.5 rounded-full text-center transition-all"
              style={{ border: '1px solid rgba(255,255,255,.18)', color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(134,200,115,.5)'; e.currentTarget.style.color = '#86C873'; e.currentTarget.style.background = 'rgba(134,200,115,.06)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.18)'; e.currentTarget.style.color = 'rgba(255,255,255,.7)'; e.currentTarget.style.background = 'transparent' }}
            >
              No tengo cuenta — Registrarme
            </Link>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="relative z-10 flex flex-col items-center gap-2 mt-6 lp-card" style={{ animationDelay: '.2s' }}>
          <Link to="/"
            className="font-body text-sm flex items-center gap-1.5 transition-colors"
            style={{ color: 'rgba(255,255,255,.38)', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#86C873' }}
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

      </div>
    </>
  )
}