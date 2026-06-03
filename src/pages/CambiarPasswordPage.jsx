/**
 * CambiarPasswordPage.jsx — Cambio de contraseña para usuario logueado
 * Ubicación: src/pages/CambiarPasswordPage.jsx
 *
 * - No depende de email (sin links de recuperación).
 * - Verifica la contraseña actual contra el hash bcrypt almacenado
 *   (vía sheetsApi.auth.cambiarPassword → Supabase/GoTrue).
 * - Mantiene la sesión activa tras el cambio.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../dashboard/AppShell.jsx'
import { useAuth } from '../hooks/useAuth.jsx'
import { useToast } from '../hooks/useToast.jsx'

const ESTADO_INICIAL = { actual: '', nueva: '', repetir: '' }

const LABEL_STYLE = {
  display: 'block',
  fontSize: '.72rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
  color: '#4a6b50',
  marginBottom: '.4rem',
}

const INPUT_STYLE = {
  width: '100%',
  padding: '.8rem .9rem',
  borderRadius: 10,
  border: '1px solid #c8d9c4',
  background: '#fff',
  fontSize: '.9rem',
  color: '#111811',
  outline: 'none',
  transition: 'border-color .15s, box-shadow .15s',
}

/**
 * Campo de contraseña reutilizable. Definido a NIVEL DE MÓDULO (no dentro
 * del componente de página) para que no se remonte en cada render y el
 * input no pierda el foco al tipear.
 */
function CampoPassword({ id, label, value, onChange, autoComplete, autoFocus, visible, disabled }) {
  return (
    <div>
      <label htmlFor={id} style={LABEL_STYLE}>{label}</label>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="••••••••"
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        disabled={disabled}
        style={INPUT_STYLE}
        onFocus={e => {
          e.target.style.borderColor = '#86C873'
          e.target.style.boxShadow = '0 0 0 3px rgba(134,200,115,.15)'
        }}
        onBlur={e => {
          e.target.style.borderColor = '#c8d9c4'
          e.target.style.boxShadow = 'none'
        }}
      />
    </div>
  )
}

export default function CambiarPasswordPage() {
  const { cambiarPassword } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [form, setForm]       = useState(ESTADO_INICIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [done, setDone]       = useState(false)
  const [verPass, setVerPass] = useState(false)

  function setCampo(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }))
    if (error) setError(null)
  }

  // Validaciones de cliente (defensa rápida; el servicio revalida igual).
  function validar() {
    if (!form.actual || !form.nueva || !form.repetir) {
      return 'Completá todos los campos.'
    }
    if (form.nueva.length < 6) {
      return 'La nueva contraseña debe tener al menos 6 caracteres.'
    }
    if (form.nueva !== form.repetir) {
      return 'La nueva contraseña y su confirmación no coinciden.'
    }
    if (form.nueva === form.actual) {
      return 'La nueva contraseña debe ser distinta de la actual.'
    }
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const errVal = validar()
    if (errVal) {
      setError(errVal)
      return
    }

    setLoading(true)
    try {
      const res = await cambiarPassword(form.actual, form.nueva)
      setDone(true)
      setForm(ESTADO_INICIAL)
      toast.success(res?.message || 'Tu contraseña se actualizó correctamente.')
    } catch (err) {
      const msg = err.message || 'No se pudo cambiar la contraseña.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 460, margin: '0 auto', padding: '2rem 1.25rem 3rem' }}>

        {/* Encabezado */}
        <div style={{ marginBottom: '1.4rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '.4rem',
            fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '.08em', color: '#5A9E4A', marginBottom: '.35rem',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Seguridad de la cuenta
          </div>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '2rem', color: '#111811', margin: 0, letterSpacing: '.02em',
          }}>
            Cambiar contraseña
          </h1>
          <p style={{ fontSize: '.85rem', color: '#4a6b50', margin: '.3rem 0 0' }}>
            Ingresá tu contraseña actual y elegí una nueva. No necesitás email.
          </p>
        </div>

        {/* Tarjeta */}
        <div style={{
          background: '#fff',
          border: '1px solid #d4e6d0',
          borderRadius: 16,
          boxShadow: '0 12px 32px rgba(17,24,17,.08)',
          padding: '1.5rem',
        }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '.5rem 0' }}>
              <div style={{
                width: 56, height: 56, margin: '0 auto 1rem', borderRadius: '50%',
                background: 'rgba(34,197,94,.12)', border: '2px solid rgba(34,197,94,.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', color: '#111811', margin: '0 0 .4rem' }}>
                ¡Contraseña actualizada!
              </h2>
              <p style={{ fontSize: '.85rem', color: '#4a6b50', margin: '0 0 1.3rem' }}>
                Tu nueva contraseña ya está activa. Seguís con la sesión iniciada.
              </p>
              <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'center' }}>
                <button
                  onClick={() => navigate('/dashboard')}
                  style={{
                    background: '#111811', color: '#fff', border: 'none', borderRadius: 999,
                    padding: '.65rem 1.4rem', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Volver al inicio
                </button>
                <button
                  onClick={() => setDone(false)}
                  style={{
                    background: 'transparent', color: '#4a6b50', border: '1px solid #c8d9c4',
                    borderRadius: 999, padding: '.65rem 1.4rem', fontSize: '.8rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Cambiar otra vez
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <CampoPassword
                id="pwd-actual"
                label="Contraseña actual"
                value={form.actual}
                onChange={v => setCampo('actual', v)}
                autoComplete="current-password"
                autoFocus
                visible={verPass}
                disabled={loading}
              />

              <div style={{ height: 1, background: '#e2eede' }} />

              <CampoPassword
                id="pwd-nueva"
                label="Nueva contraseña"
                value={form.nueva}
                onChange={v => setCampo('nueva', v)}
                autoComplete="new-password"
                visible={verPass}
                disabled={loading}
              />

              <CampoPassword
                id="pwd-repetir"
                label="Repetir nueva contraseña"
                value={form.repetir}
                onChange={v => setCampo('repetir', v)}
                autoComplete="new-password"
                visible={verPass}
                disabled={loading}
              />

              {/* Mostrar/ocultar + ayuda */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', fontSize: '.78rem', color: '#4a6b50', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={verPass}
                    onChange={e => setVerPass(e.target.checked)}
                    style={{ accentColor: '#86C873' }}
                  />
                  Mostrar contraseñas
                </label>
                <span style={{ fontSize: '.72rem', color: '#9aa3b5' }}>Mínimo 6 caracteres</span>
              </div>

              {/* Error inline */}
              {error && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '.5rem',
                  padding: '.7rem .85rem', borderRadius: 10,
                  background: 'rgba(184,69,46,.08)', border: '1px solid rgba(184,69,46,.3)',
                  color: '#b8452e', fontSize: '.82rem',
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '.2rem',
                  background: loading ? '#8ebf7a' : '#86C873',
                  color: '#0a0f0a', border: 'none', borderRadius: 999,
                  padding: '.85rem', fontSize: '.9rem', fontWeight: 700,
                  cursor: loading ? 'wait' : 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
                  boxShadow: '0 8px 24px rgba(134,200,115,.28)',
                  transition: 'background .15s',
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: 15, height: 15, border: '2px solid rgba(10,15,10,.35)',
                      borderTopColor: '#0a0f0a', borderRadius: '50%',
                      display: 'inline-block', animation: 'cpw-spin .7s linear infinite',
                    }} />
                    Guardando...
                  </>
                ) : 'Guardar nueva contraseña'}
              </button>

              <style>{`@keyframes cpw-spin { to { transform: rotate(360deg) } }`}</style>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  )
}
