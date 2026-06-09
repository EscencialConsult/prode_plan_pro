import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useToast } from '../../hooks/useToast.jsx'
import Loading from '../../hooks/Loading.jsx'
import sheetsApi from '../../services/sheetsApi.js'

export default function ProtectedRoute({ requireAdmin = false }) {
  const { user, isAdmin, loading, logout, refreshUser } = useAuth()
  const { toast } = useToast()

  const [form, setForm] = useState(() => ({
    email: user ? (user.email.toLowerCase().includes('@prodetalento.com') ? '' : user.email) : '',
    celular: user ? (user.celular || '') : '',
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />

  const isPlaceholderEmail = user.email ? user.email.toLowerCase().includes('@prodetalento.com') : false
  const needsUpdate = !isAdmin && (!user.celular || user.celular.trim() === '' || isPlaceholderEmail)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (isPlaceholderEmail && (!form.email || !form.email.includes('@'))) {
        throw new Error('Por favor, ingresá un correo electrónico válido.')
      }
      if (!form.celular || form.celular.trim() === '') {
        throw new Error('Por favor, ingresá tu número de teléfono / WhatsApp.')
      }
      const emailToSave = isPlaceholderEmail ? form.email.trim() : user.email
      await sheetsApi.usuarios.actualizarMisDatos(form.celular.trim(), emailToSave)
      await refreshUser()
      toast.success('¡Datos actualizados correctamente!')
    } catch (err) {
      setError(err.message || 'No se pudieron actualizar los datos. Intentá nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    background: 'rgba(255,255,255,.05)',
    border: '1px solid rgba(255,255,255,.1)',
    color: '#fff',
    caretColor: '#86C873',
  }
  const onFocus = e => {
    e.target.style.borderColor = 'rgba(134,200,115,.55)'
    e.target.style.background  = 'rgba(134,200,115,.06)'
    e.target.style.boxShadow   = '0 0 0 3px rgba(134,200,115,.1)'
  }
  const onBlur = e => {
    e.target.style.borderColor = 'rgba(255,255,255,.1)'
    e.target.style.background  = 'rgba(255,255,255,.05)'
    e.target.style.boxShadow   = 'none'
  }

  return (
    <>
      <Outlet />

      {needsUpdate && (
        <>
          <style>{`
            @keyframes block-fade { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
            .block-card { animation: block-fade .5s ease both; }
            @keyframes block-spin { to{transform:rotate(360deg)} }
            .block-spin { animation: block-spin .75s linear infinite; }
            @keyframes block-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
            .block-pulse { animation: block-pulse 1.8s ease infinite; }
          `}</style>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(10, 15, 10, 0.75)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              padding: '1rem',
              overflowY: 'auto',
            }}
          >
            <div
              className="block-card relative w-full"
              style={{
                maxWidth: 460,
                background: 'linear-gradient(160deg, rgba(17,24,17,.96) 0%, rgba(10,15,10,.99) 100%)',
                border: '1px solid rgba(134,200,115,.32)',
                borderRadius: 20,
                boxShadow: '0 32px 80px rgba(0,0,0,.7), 0 0 0 1px rgba(134,200,115,.15), inset 0 1px 0 rgba(255,255,255,.05)',
                backdropFilter: 'blur(24px)',
                animationDelay: '.1s',
              }}
            >
              <div className="rounded-t-[20px] h-0.5 w-full"
                style={{ background: 'linear-gradient(90deg, transparent, #86C873 30%, #86C873 70%, transparent)' }} />

              <div className="px-5 py-6 sm:px-8 sm:py-8">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full block-pulse"
                      style={{ background: '#86C873', boxShadow: '0 0 8px #86C873' }} />
                    <span className="font-body text-xs uppercase tracking-widest font-bold"
                      style={{ color: '#86C873', textShadow: '0 0 10px rgba(134,200,115,0.2)' }}>
                      PASO OBLIGATORIO
                    </span>
                  </div>
                  <h1 className="font-display leading-none mb-3"
                    style={{ fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', color: '#fff', letterSpacing: '.03em' }}>
                    ACTUALIZAR DATOS
                  </h1>
                  <p className="font-body text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,.75)' }}>
                    Muchas gracias por participar, estamos a un paso de comenzar. Te recomendamos colocar tus datos para que, en caso de que ganes, nos contactemos de una manera más rápida con vos.
                  </p>
                </div>

                <div className="h-px mb-6"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(134,200,115,.2) 50%, transparent)' }} />

                <form onSubmit={handleSubmit} className="space-y-4">
                  {isPlaceholderEmail && (
                    <div>
                      <label htmlFor="block-email"
                        className="block font-body font-bold text-xs uppercase tracking-widest mb-2"
                        style={{ color: 'rgba(255,255,255,.7)' }}>
                        Correo Electrónico
                      </label>
                      <input
                        id="block-email"
                        type="email"
                        value={form.email}
                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="ejemplo@correo.com"
                        required
                        className="w-full px-4 py-3.5 rounded-xl font-body text-sm outline-none transition-all"
                        style={inputStyle}
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />
                      <p className="font-body text-xs mt-1.5 text-yellow-400/90 leading-normal">
                        ⚠️ Tenés asignado un correo temporal. Por favor, ingresá tu correo real para poder iniciar sesión en el futuro.
                      </p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="block-celular"
                      className="block font-body font-bold text-xs uppercase tracking-widest mb-2"
                      style={{ color: 'rgba(255,255,255,.7)' }}>
                      Celular / WhatsApp
                    </label>
                    <input
                      id="block-celular"
                      type="tel"
                      value={form.celular}
                      onChange={e => setForm(p => ({ ...p, celular: e.target.value }))}
                      placeholder="Ej: +5491122334455"
                      required
                      className="w-full px-4 py-3.5 rounded-xl font-body text-sm outline-none transition-all"
                      style={inputStyle}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl font-body text-sm"
                      style={{ background: 'rgba(184,69,46,.12)', border: '1px solid rgba(184,69,46,.35)', color: '#e07050' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full font-body font-bold text-base py-4 rounded-full flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg,#86C873,#5A9E4A)', color: '#0a0f0a', boxShadow: '0 8px 28px rgba(134,200,115,.3)' }}
                    onMouseEnter={e => { if (!saving) { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(134,200,115,.5)' } }}
                    onMouseLeave={e => { if (!saving) { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 28px rgba(134,200,115,.3)' } }}
                  >
                    {saving ? (
                      <>
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full block-spin" />
                        Guardando datos...
                      </>
                    ) : (
                      <>
                        Guardar y continuar
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                        </svg>
                      </>
                    )}
                  </button>
                </form>

                <div className="flex items-center justify-center mt-6">
                  <button
                    onClick={logout}
                    className="font-body text-sm flex items-center gap-1.5 transition-colors bg-transparent border-none cursor-pointer"
                    style={{ color: 'rgba(255,255,255,.4)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ff4d6d' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,.4)' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
