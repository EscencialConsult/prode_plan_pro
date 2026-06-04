import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import HomeCampaignGoals from '../components/home/HomeCampaignGoals'
import sheetsApi from '../services/sheetsApi'
import { useAuth } from '../hooks/useAuth'

/* ── Contador animado ─────────────────────────────── */
function CountUp({ end, suffix = '', duration = 1800 }) {
  const [val, setVal] = useState(0)
  const ref = useRef()
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      observer.disconnect()
      const start = performance.now()
      const isNum = !isNaN(end)
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1)
        const ease = 1 - Math.pow(1 - p, 3)
        setVal(isNum ? Math.round(end * ease) : end)
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: .3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration])
  return <span ref={ref}>{isNaN(end) ? end : val}{suffix}</span>
}

/* ── Marquee ticker ───────────────────────────────── */
const TICKER = [
  'Secretario General', 'Camioneros Tucumán', 'Defensa Salarial', 'Obra Social',
  'Siempre con el trabajador', 'Moyano Conducción', 'Seguridad en Ruta', 'NOA',
  'Paritarias Actualizadas', 'Elecciones 2026', 'Más Unión',
]

function BuzonPropuestas() {
  const { isAdmin } = useAuth()
  const [area, setArea] = useState('')
  const [propuesta, setPropuesta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  // Admin panel state
  const [showPanel, setShowPanel] = useState(false)
  const [listaPropuestas, setListaPropuestas] = useState([])
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!area || !propuesta.trim()) return
    setEnviando(true)
    setError('')
    try {
      await sheetsApi.propuestas.enviar(area, propuesta.trim())
      setEnviado(true)
      setArea('')
      setPropuesta('')
    } catch (err) {
      console.error('Error enviando propuesta:', err)
      setError('Hubo un error al enviar. Intentá de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  const cargarPropuestas = async () => {
    setCargando(true)
    try {
      const data = await sheetsApi.propuestas.obtener()
      setListaPropuestas(data)
    } catch (err) {
      console.error('Error cargando propuestas:', err)
    } finally {
      setCargando(false)
    }
  }

  const togglePanel = () => {
    if (!showPanel) cargarPropuestas()
    setShowPanel(p => !p)
  }

  return (
    <section id="buzon-propuestas" style={{
      padding: '5rem 1.5rem',
      background: 'linear-gradient(180deg, #0c140c 0%, #050905 100%)',
      borderTop: '1px solid rgba(134, 200, 115, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      zIndex: 10
    }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem', maxWidth: 600 }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.68rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '.25em',
          color: '#86C873',
          margin: 0
        }}>
          Tu opinión suma
        </p>
        <h2 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
          color: '#fff',
          letterSpacing: '0.04em',
          margin: '0.35rem 0 0'
        }}>
          BUZÓN DE PROPUESTAS ANÓNIMO
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.9rem',
          color: 'rgba(255, 255, 255, 0.6)',
          lineHeight: 1.6,
          marginTop: '0.75rem'
        }}>
          Queremos escuchar tus ideas para seguir mejorando. Contanos tu propuesta para la Lista Verde de forma 100% anónima y segura.
        </p>
        <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #86C873 50%, transparent)', borderRadius: 99, width: 140, margin: '0.75rem auto 0' }} />
      </div>

      <div style={{
        width: '100%',
        maxWidth: 620,
        background: 'rgba(10, 15, 10, 0.65)',
        backdropFilter: 'blur(12px)',
        border: '1.5px solid rgba(134, 200, 115, 0.2)',
        borderRadius: '24px',
        padding: '2rem',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
      }}>
        {enviado ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(134, 200, 115, 0.1)',
              border: '2px solid #86C873',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              color: '#86C873'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem', color: '#fff', margin: '0 0 0.5rem', letterSpacing: '0.02em' }}>
              ¡PROPUESTA ENVIADA!
            </h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
              Muchas gracias por colaborar. Tu propuesta ha sido recopilada de forma totalmente anónima para ser analizada por nuestro equipo de trabajo.
            </p>
            <button
              onClick={() => setEnviado(false)}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '.15em',
                background: 'transparent',
                border: '1.5px solid #86C873',
                color: '#86C873',
                padding: '0.75rem 1.75rem',
                borderRadius: '99px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#86C873'; e.currentTarget.style.color = '#050905' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#86C873' }}
            >
              Enviar otra propuesta
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'rgba(255, 255, 255, 0.7)',
                letterSpacing: '0.05em'
              }}>
                Área de la mejora / Propuesta
              </label>
              <select
                required
                value={area}
                onChange={e => setArea(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1.5px solid rgba(134, 200, 115, 0.3)',
                  borderRadius: '12px',
                  color: '#fff',
                  padding: '0.85rem 1rem',
                  fontSize: '0.9rem',
                  fontFamily: "'DM Sans', sans-serif",
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#86C873'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(134, 200, 115, 0.3)'}
              >
                <option value="" disabled style={{ background: '#0c140c' }}>Seleccioná un área...</option>
                <option value="Salud y Obra Social" style={{ background: '#0c140c' }}>Salud y Obra Social</option>
                <option value="Paritarias y Salarios" style={{ background: '#0c140c' }}>Paritarias y Salarios</option>
                <option value="Rutas y Condiciones Gremiales" style={{ background: '#0c140c' }}>Rutas y Condiciones Gremiales</option>
                <option value="Capacitación y Cursos" style={{ background: '#0c140c' }}>Capacitación y Cursos</option>
                <option value="Deportes y Recreación" style={{ background: '#0c140c' }}>Deportes y Recreación</option>
                <option value="Otro" style={{ background: '#0c140c' }}>Otro / Propuesta General</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'rgba(255, 255, 255, 0.7)',
                letterSpacing: '0.05em'
              }}>
                Detalle de tu propuesta
              </label>
              <textarea
                required
                rows="5"
                placeholder="Escribí acá tu sugerencia o propuesta de mejora..."
                value={propuesta}
                onChange={e => setPropuesta(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1.5px solid rgba(134, 200, 115, 0.3)',
                  borderRadius: '12px',
                  color: '#fff',
                  padding: '0.85rem 1rem',
                  fontSize: '0.9rem',
                  fontFamily: "'DM Sans', sans-serif",
                  outline: 'none',
                  resize: 'none',
                  lineHeight: 1.6,
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#86C873'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(134, 200, 115, 0.3)'}
              />
            </div>

            {error && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: '#e74c3c', margin: 0, textAlign: 'center' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando || !area || !propuesta.trim()}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '.15em',
                background: '#86C873',
                border: 'none',
                color: '#050905',
                padding: '1rem',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: (!area || !propuesta.trim()) ? 0.6 : 1
              }}
              onMouseEnter={e => { if (area && propuesta.trim()) e.currentTarget.style.background = '#A8E096' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#86C873' }}
            >
              {enviando ? (
                <>
                  <span style={{
                    width: 16,
                    height: 16,
                    border: '2.5px solid #050905',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'lb-spin 1s linear infinite'
                  }} />
                  Enviando...
                </>
              ) : (
                <>
                  Enviar Propuesta
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* ── Panel Admin: Ver Propuestas ── */}
      {isAdmin && (
        <div style={{ width: '100%', maxWidth: 620, marginTop: '2rem' }}>
          <button
            onClick={togglePanel}
            style={{
              width: '100%',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '.12em',
              background: showPanel ? 'rgba(134, 200, 115, 0.12)' : 'rgba(255,255,255,0.04)',
              border: '1.5px solid rgba(134, 200, 115, 0.25)',
              color: '#86C873',
              padding: '0.9rem 1.25rem',
              borderRadius: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(134, 200, 115, 0.15)'; e.currentTarget.style.borderColor = '#86C873' }}
            onMouseLeave={e => { e.currentTarget.style.background = showPanel ? 'rgba(134, 200, 115, 0.12)' : 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(134, 200, 115, 0.25)' }}
          >
            📋 {showPanel ? 'Ocultar Propuestas' : 'Ver Propuestas Recibidas'}
            <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>({listaPropuestas.length})</span>
          </button>

          {showPanel && (
            <div style={{
              marginTop: '1rem',
              background: 'rgba(10, 15, 10, 0.8)',
              backdropFilter: 'blur(12px)',
              border: '1.5px solid rgba(134, 200, 115, 0.2)',
              borderRadius: '20px',
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                padding: '1rem 1.5rem',
                background: 'rgba(134, 200, 115, 0.06)',
                borderBottom: '1px solid rgba(134, 200, 115, 0.15)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', fontWeight: 700, color: '#86C873', textTransform: 'uppercase', letterSpacing: '.12em' }}>
                  Propuestas recibidas
                </span>
                <button
                  onClick={cargarPropuestas}
                  style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.65rem', fontWeight: 600,
                    background: 'rgba(134, 200, 115, 0.1)', border: '1px solid rgba(134, 200, 115, 0.2)',
                    color: '#86C873', padding: '5px 12px', borderRadius: 99, cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(134, 200, 115, 0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(134, 200, 115, 0.1)'}
                >
                  ↻ Actualizar
                </button>
              </div>

              {/* Content */}
              <div style={{ maxHeight: 450, overflowY: 'auto', padding: '0.75rem' }}>
                {cargando ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem' }}>
                    Cargando propuestas...
                  </div>
                ) : listaPropuestas.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem' }}>
                    No hay propuestas aún.
                  </div>
                ) : (
                  listaPropuestas.map((p, i) => (
                    <div key={p.id || i} style={{
                      padding: '1rem 1.25rem',
                      marginBottom: '0.5rem',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(134, 200, 115, 0.1)',
                      borderRadius: '14px',
                      transition: 'all 0.2s',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{
                          fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', fontWeight: 700,
                          color: '#86C873', textTransform: 'uppercase', letterSpacing: '.08em',
                          background: 'rgba(134, 200, 115, 0.08)', padding: '3px 10px', borderRadius: 99,
                          border: '1px solid rgba(134, 200, 115, 0.15)'
                        }}>
                          {p.area}
                        </span>
                        <span style={{
                          fontFamily: "'DM Sans', sans-serif", fontSize: '0.62rem',
                          color: 'rgba(255,255,255,0.3)'
                        }}>
                          {new Date(p.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.84rem',
                        color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0
                      }}>
                        {p.propuesta}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default function LuisBarrionuevoPage() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div className="overflow-x-hidden" style={{ background: '#050905', fontFamily:"'DM Sans',sans-serif" }}>

      {/* ══════════ ESTILOS GLOBALES ══════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&display=swap');

        @keyframes lb-up   { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:none} }
        @keyframes lb-left { from{opacity:0;transform:translateX(-28px)} to{opacity:1;transform:none} }
        @keyframes lb-photo{ from{opacity:0;transform:scale(.97) translateY(20px)} to{opacity:1;transform:none} }
        @keyframes lb-glow { 0%,100%{opacity:.55} 50%{opacity:1} }
        @keyframes lb-dot  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(.65)} }
        @keyframes lb-tick { to{transform:translateX(-50%)} }
        @keyframes lb-spin { to{transform:rotate(360deg)} }
        @keyframes lb-float{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes lb-line  { from{transform:scaleX(0)} to{transform:scaleX(1)} }

        .lb-u1{animation:lb-up   .75s .10s both}
        .lb-u2{animation:lb-up   .75s .25s both}
        .lb-u3{animation:lb-up   .75s .38s both}
        .lb-u4{animation:lb-up   .75s .52s both}
        .lb-u5{animation:lb-up   .75s .66s both}
        .lb-u6{animation:lb-up   .75s .80s both}
        .lb-l1{animation:lb-left .75s .15s both}
        .lb-photo-anim{animation:lb-photo .9s .2s both}
        .lb-float-anim{animation:lb-float 4s ease-in-out infinite}
        .lb-glow-anim{animation:lb-glow 3s ease-in-out infinite}

        .lb-eje {
          display:flex; align-items:flex-start; gap:12px;
          padding:14px 16px; border-radius:14px;
          background:rgba(255,255,255,.04);
          border:1px solid rgba(134,200,115,.12);
          cursor:default; transition:all .22s;
        }
        .lb-eje:hover {
          background:rgba(134,200,115,.09);
          border-color:rgba(134,200,115,.38);
          transform:translateX(5px);
          box-shadow:0 8px 24px rgba(0,0,0,.25);
        }
        .lb-stat {
          flex:1; min-width:70px; text-align:center; padding:14px 10px;
          border-radius:14px; background:rgba(134,200,115,.06);
          border:1px solid rgba(134,200,115,.16);
          transition:all .22s;
        }
        .lb-stat:hover{
          background:rgba(134,200,115,.13);
          border-color:rgba(134,200,115,.45);
          transform:translateY(-4px);
          box-shadow:0 14px 32px rgba(134,200,115,.18);
        }
        .lb-btn-main {
          display:inline-flex; align-items:center; gap:.5rem;
          font-family:'DM Sans',sans-serif; font-weight:800; font-size:.9rem;
          color:#050905; background:linear-gradient(135deg,#86C873,#5A9E4A);
          padding:15px 32px; border-radius:99px; text-decoration:none;
          box-shadow:0 8px 28px rgba(134,200,115,.32);
          transition:all .22s;
        }
        .lb-btn-main:hover{
          box-shadow:0 16px 44px rgba(134,200,115,.52);
          transform:translateY(-2px) scale(1.02);
        }
        .lb-btn-out {
          display:inline-flex; align-items:center; gap:.5rem;
          font-family:'DM Sans',sans-serif; font-weight:600; font-size:.9rem;
          color:rgba(255,255,255,.75); padding:14px 28px; border-radius:99px;
          border:1.5px solid rgba(255,255,255,.18); text-decoration:none;
          transition:all .22s;
        }
        .lb-btn-out:hover { border-color:#86C873; color:#86C873; }

        .ticker-wrap {
          overflow:hidden;
          -webkit-mask:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);
          mask:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);
        }
        .ticker-track {
          display:flex; gap:3rem; width:max-content; align-items:center;
          animation:lb-tick 40s linear infinite;
        }

        /* ── photo frame glow ── */
        .photo-glow {
          position:absolute; bottom:0; left:50%; transform:translateX(-50%);
          width:80%; height:45%; pointer-events:none;
          background:radial-gradient(ellipse, rgba(134,200,115,.35), transparent 65%);
          filter:blur(35px);
          animation:lb-glow 3.5s ease-in-out infinite;
        }

        .slogan-line {
          height: 2px;
          width: 40px;
          border-radius: 99px;
          flex-shrink: 0;
        }

        /* Mobile */
        @media(max-width:1023px){
          .hero-grid{grid-template-columns:1fr !important}
          .photo-col{order:-1}
          .lb-photo-img{max-height:55vw !important; max-width:82% !important; margin:0 auto;}
          .lb-ejes-grid{grid-template-columns:1fr !important}
          .right-card{display:none !important}
        }
        @media(max-width:640px){
          .lb-stats-row{flex-wrap:wrap; gap:.5rem}
          .lb-stat{min-width:calc(50% - .5rem)}
          .slogan-line { display: none !important; }
          .lb-slogan-wrap { justify-content: center !important; }
        }
      `}</style>

      {/* ══════════ NAV ══════════ */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:50,
        transition:'all .3s',
        background: scrolled ? 'rgba(5,9,5,.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(134,200,115,.18)' : '1px solid transparent',
        padding:'.75rem 0',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img
              src="./imgprode/one-prode-blanco.png"
              alt="ONE PRODE"
              style={{
                height: 'clamp(56px, 7.5vw, 96px)',
                width: 'auto',
                display: 'block',
                filter: 'drop-shadow(0 2px 12px rgba(134, 200, 115, 0.5))',
                transition: 'transform 0.3s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
            />
            <div style={{ width: 1, height: 'clamp(28px, 4vw, 40px)', background: 'rgba(134,200,115,.25)', flexShrink: 0 }} />
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize: 'clamp(1.05rem, 2.5vw, 1.35rem)', letterSpacing: '.18em', lineHeight: 1, userSelect: 'none' }}>
              <span style={{ color: '#7BA3C0' }}>MOYANO </span>
              <span style={{ color: '#fff' }}>C</span>
              <span style={{ color: '#ebc32b' }}>O</span>
              <span style={{ color: '#fff' }}>N</span>
              <span style={{ color: '#7BA3C0' }}>DUCCIÓN</span>
            </div>
          </div>

          <div style={{display:'flex', alignItems:'center', gap:'.75rem'}}>
            <Link to="/" style={{fontFamily:"'DM Sans',sans-serif", fontSize:'.8rem', fontWeight:600, color:'rgba(255,255,255,.55)', textDecoration:'none', display:'flex', alignItems:'center', gap:'.35rem', transition:'color .2s'}}
              onMouseEnter={e=>e.currentTarget.style.color='#86C873'}
              onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,.55)'}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              Prode
            </Link>
            <Link to="/register" className="lb-btn-main" style={{padding:'8px 18px', fontSize:'.8rem'}}>
              Registrarse
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section style={{
        position:'relative', minHeight:'100vh', overflow:'hidden',
        display:'flex', flexDirection:'column', justifyContent:'center',
        paddingTop:'clamp(80px,11vh,120px)',
        paddingBottom:'90px',
        background:'linear-gradient(155deg,#050905 0%,#0a150a 45%,#0d1a0a 70%,#050905 100%)',
      }}>

        {/* — Fondos / decoraciones — */}

        {/* Grid de puntos */}
        <div style={{position:'absolute', inset:0, pointerEvents:'none',
          backgroundImage:'radial-gradient(rgba(134,200,115,.18) 1px, transparent 1px)',
          backgroundSize:'36px 36px', opacity:.4}} />

        {/* Watermark MOYANO gigante */}
        <div style={{
          position:'absolute', top:'50%', left:'50%',
          transform:'translate(-50%,-50%)',
          fontFamily:"'Bebas Neue',sans-serif",
          fontSize:'clamp(5rem,18vw,15rem)',
          letterSpacing:'.06em', lineHeight:1,
          color:'transparent',
          WebkitTextStroke:'1px rgba(134,200,115,.06)',
          textStroke:'1px rgba(134,200,115,.06)',
          userSelect:'none', pointerEvents:'none', whiteSpace:'nowrap',
          zIndex:0,
        }}>BARRIONUEVO</div>

        {/* Glow izquierda */}
        <div style={{position:'absolute', top:'-5%', left:'-5%', width:'55%', height:'75%',
          background:'radial-gradient(ellipse, rgba(58,125,68,.2) 0%, transparent 65%)',
          pointerEvents:'none', zIndex:0}} />

        {/* Línea diagonal decorativa dorada */}
        <div style={{
          position:'absolute', top:0, right:'38%', width:2, height:'100%',
          background:'linear-gradient(to bottom, transparent, rgba(245,197,24,.15) 30%, rgba(245,197,24,.08) 70%, transparent)',
          transform:'rotate(8deg) translateX(120px)',
          pointerEvents:'none', zIndex:0,
        }} />
        <div style={{
          position:'absolute', top:0, right:'40%', width:1, height:'100%',
          background:'linear-gradient(to bottom, transparent, rgba(134,200,115,.1) 40%, rgba(134,200,115,.05) 70%, transparent)',
          transform:'rotate(8deg) translateX(80px)',
          pointerEvents:'none', zIndex:0,
        }} />

        {/* Círculo decorativo */}
        <div style={{
          position:'absolute', top:'8%', right:'5%', width:220, height:220,
          border:'1px solid rgba(245,197,24,.1)', borderRadius:'50%',
          pointerEvents:'none', zIndex:0,
        }} />
        <div style={{
          position:'absolute', top:'12%', right:'9%', width:150, height:150,
          border:'1px solid rgba(134,200,115,.08)', borderRadius:'50%',
          pointerEvents:'none', zIndex:0,
        }} />

        {/* ── CONTENIDO ── */}
        <div style={{maxWidth:1200, margin:'0 auto', padding:'0 1.5rem', width:'100%', position:'relative', zIndex:10}}>

          {/* Logo grande centrado — arriba */}
          <div className="lb-l1" style={{marginBottom:'2.5rem', display:'flex', flexDirection:'column', alignItems:'flex-start', gap:'.2rem'}}>
            <div style={{display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap'}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif", fontSize:'clamp(2.4rem,6vw,4.2rem)', letterSpacing:'.08em', lineHeight:.9, userSelect:'none'}}>
                <span style={{color:'#7BA3C0'}}>MOYANO </span>
                <span style={{color:'#fff'}}>C</span>
                <span style={{color:'#F5C518', textShadow:'0 0 30px rgba(245,197,24,.5)'}}>O</span>
                <span style={{color:'#fff'}}>N</span>
                <span style={{color:'#7BA3C0'}}>DUCCIÓN</span>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:'.5rem', padding:'5px 14px', borderRadius:99, background:'rgba(245,197,24,.08)', border:'1px solid rgba(245,197,24,.25)'}}>
                <span style={{width:6, height:6, borderRadius:'50%', background:'#F5C518', display:'inline-block', animation:'lb-dot 1.8s ease infinite'}} />
                <span style={{fontFamily:"'DM Sans',sans-serif", fontSize:'.62rem', fontWeight:700, color:'#F5C518', textTransform:'uppercase', letterSpacing:'.2em'}}>Elecciones 2026</span>
              </div>
            </div>
            <div style={{height:3, background:'linear-gradient(90deg,#7BA3C0,#F5C518 40%,#86C873 75%,transparent)', borderRadius:99, width:'clamp(280px,55vw,600px)', transformOrigin:'left', animation:'lb-line .8s .4s both'}} />
            <p style={{fontFamily:"'DM Sans',sans-serif", fontSize:'.65rem', fontWeight:700, letterSpacing:'.22em', textTransform:'uppercase', color:'rgba(255,255,255,.32)', margin:'.2rem 0 0'}}>
              Lista Verde · Tucumán · Argentina
            </p>
          </div>

          {/* Grid 2 cols */}
          <div className="hero-grid" style={{display:'grid', gridTemplateColumns:'1fr 400px', gap:'3rem', alignItems:'center'}}>

            {/* ── IZQUIERDA ── */}
            <div>

              {/* Badge */}
              <div className="lb-u1" style={{display:'flex', alignItems:'center', gap:'.75rem', flexWrap:'wrap', marginBottom:'1.5rem'}}>
                <span style={{display:'inline-flex', alignItems:'center', gap:'.5rem',
                  fontFamily:"'DM Sans',sans-serif", fontSize:'.62rem', fontWeight:700,
                  textTransform:'uppercase', letterSpacing:'.22em',
                  color:'#86C873', background:'rgba(134,200,115,.08)',
                  border:'1px solid rgba(134,200,115,.3)', padding:'6px 16px', borderRadius:99}}>
                  <span style={{width:7, height:7, borderRadius:'50%', background:'#86C873', animation:'lb-dot 1.8s ease infinite'}} />
                  Candidato a Secretario General
                </span>
                <span style={{fontFamily:"'DM Sans',sans-serif", fontSize:'.62rem', fontWeight:600, color:'rgba(255,255,255,.35)', textTransform:'uppercase', letterSpacing:'.18em'}}>
                  Moyano Conducción
                </span>
              </div>

              {/* Nombre */}
              <div className="lb-u2" style={{marginBottom:'1.1rem', lineHeight:.88}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif", fontSize:'clamp(3.8rem,9.5vw,7.5rem)', color:'rgba(255,255,255,.95)', letterSpacing:'.02em', margin:0}}>
                  LUIS
                </div>
                <div style={{
                  fontFamily:"'Bebas Neue',sans-serif",
                  fontSize:'clamp(4.2rem,11vw,8.8rem)',
                  letterSpacing:'.02em', margin:0,
                  background:'linear-gradient(135deg,#A8E096 0%,#86C873 45%,#5FC98A 75%,#5A9E4A 100%)',
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
                  filter:'drop-shadow(0 0 24px rgba(134,200,115,.3))',
                }}>
                  BARRIONUEVO
                </div>
              </div>

              {/* Eslogan con líneas */}
              <div className="lb-u3 lb-slogan-wrap" style={{display:'flex', alignItems:'center', gap:'.75rem', marginBottom:'1.4rem'}}>
                <div className="slogan-line" style={{background:'linear-gradient(90deg,transparent,#F5C518)'}} />
                <p style={{fontFamily:"'DM Sans',sans-serif", fontSize:'clamp(.95rem,2vw,1.2rem)', fontStyle:'italic', fontWeight:500, color:'#A8E096', margin:0, textAlign: 'center'}}>
                  "Siempre con el trabajador"
                </p>
                <div className="slogan-line" style={{background:'linear-gradient(90deg,#F5C518,transparent)'}} />
              </div>

              {/* Texto */}
              <p className="lb-u3" style={{fontSize:'.9rem', lineHeight:1.75, color:'rgba(255,255,255,.58)', margin:'0 0 1.75rem', maxWidth:'32rem'}}>
                Un dirigente forjado en la cultura del trabajo y el esfuerzo, con profundo conocimiento de la realidad que viven los choferes tucumanos. Su liderazgo se basa en la <strong style={{color:'rgba(255,255,255,.85)', fontWeight:700}}>presencia constante, la escucha activa</strong> y la defensa intransigente de los derechos laborales.
              </p>

              {/* Ejes 2x2 */}
              <div className="lb-u4 lb-ejes-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.65rem', marginBottom:'1.75rem'}}>
                {[
                  { color:'#86C873', icon:'💰', title:'Defensa Salarial', desc:'Paritarias y viáticos que acompañen la realidad' },
                  { color:'#7BA3C0', icon:'🏥', title:'Salud y Familia',  desc:'Obra social mejorada en toda la provincia' },
                  { color:'#F5C518', icon:'🛡️', title:'Seguridad en Ruta',desc:'Paradores seguros en rutas estratégicas' },
                  { color:'#86C873', icon:'🤝', title:'Participación',    desc:'Lista Verde transparente y de puertas abiertas' },
                ].map(({ color, icon, title, desc }) => (
                  <div key={title} className="lb-eje">
                    <div style={{width:36, height:36, borderRadius:10, background:`${color}18`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0}}>
                      {icon}
                    </div>
                    <div>
                      <p style={{fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:'.78rem', color:'#fff', margin:0, lineHeight:1.2}}>{title}</p>
                      <p style={{fontFamily:"'DM Sans',sans-serif", fontSize:'.66rem', color:'rgba(255,255,255,.42)', margin:'3px 0 0', lineHeight:1.35}}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="lb-u5 lb-stats-row" style={{display:'flex', gap:'.7rem', marginBottom:'2rem'}}>
                {[
                  { n: 4, s:'', lbl:'Ejes de\ngestión' },
                  { n:'NOA', s:'', lbl:'Alcance\nregional' },
                  { n:24, s:'/7', lbl:'Asesoría\nlegal' },
                  { n:100, s:'%', lbl:'Com-\npromiso' },
                ].map(({ n, s, lbl }) => (
                  <div key={lbl} className="lb-stat">
                    <div style={{fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.85rem', color:'#86C873', lineHeight:1}}>
                      <CountUp end={n} suffix={s} />
                    </div>
                    <p style={{fontFamily:"'DM Sans',sans-serif", fontSize:'.58rem', color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'.1em', margin:'4px 0 0', whiteSpace:'pre-line', lineHeight:1.3}}>
                      {lbl}
                    </p>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="lb-u6" style={{display:'flex', gap:'.75rem', flexWrap:'wrap'}}>
                <a href="#objetivos" className="lb-btn-main">
                  Ver propuesta completa
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </a>
                <Link to="/register" className="lb-btn-out">
                  Unirme al prode →
                </Link>
              </div>
            </div>

            {/* ── DERECHA — FOTO EN CARD/MARCO ── */}
            <div className="photo-col" style={{position:'relative', display:'flex', justifyContent:'center', alignItems:'center'}}>
              <div className="lb-photo-anim" style={{
                background: 'linear-gradient(135deg, rgba(10, 15, 10, 0.95) 0%, rgba(20, 38, 20, 0.98) 100%)',
                border: '1.5px solid rgba(134, 200, 115, 0.3)',
                borderRadius: '24px',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75), 0 0 40px rgba(134, 200, 115, 0.12)',
                overflow: 'hidden',
                width: '100%',
                maxWidth: 380,
              }}>
                {/* Cabecera de la card */}
                <div style={{
                  background: 'rgba(134, 200, 115, 0.08)',
                  padding: '0.7rem 1.25rem',
                  borderBottom: '1px solid rgba(134, 200, 115, 0.15)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#86C873' }}>
                    Candidato a Secretario General
                  </span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.58rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.4)' }}>
                    Elecciones 2026
                  </span>
                </div>

                {/* Foto */}
                <div style={{
                  background: 'radial-gradient(circle at center, rgba(134, 200, 115, 0.18) 0%, rgba(10, 15, 10, 0.95) 100%), #111811',
                  display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
                  position: 'relative', overflow: 'hidden', minHeight: 320,
                }}>
                  <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '60%', background: 'linear-gradient(180deg, transparent, rgba(134, 200, 115, 0.25))', pointerEvents: 'none' }} />
                  <img
                    src="./imgprode/luisbarrionuevo.png"
                    alt="Luis Barrionuevo Candidato Secretario General Camioneros Tucumán 2026"
                    style={{
                      width: '85%', height: 'auto', maxHeight: '100%',
                      objectFit: 'contain', position: 'relative', zIndex: 2,
                      filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.65))',
                    }}
                  />
                </div>

                {/* Info del candidato */}
                <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(134, 200, 115, 0.15)', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {[
                    { label: 'Agrupación', val: 'Moyano Conducción', isMoyano: true },
                    { label: 'Lucha Gremial', val: 'Siempre con el trabajador' },
                    { label: 'Seccional', val: 'Tucumán' }
                  ].map(({ label, val, isMoyano }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
                        {label}
                      </span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', fontWeight: 600, color: isMoyano ? '#86C873' : '#fff' }}>
                        {isMoyano ? (
                          <>
                            <span style={{ color: '#7BA3C0' }}>MOYANO </span>
                            <span style={{ color: '#fff' }}>C</span>
                            <span style={{ color: '#ebc32b' }}>O</span>
                            <span style={{ color: '#fff' }}>N</span>
                            <span style={{ color: '#7BA3C0' }}>DUCCIÓN</span>
                          </>
                        ) : val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Ticker band */}
        <div className="lb-u6" style={{marginTop:'3rem', position:'relative', zIndex:10}}>
          <div style={{background:'rgba(134,200,115,.06)', borderTop:'1px solid rgba(134,200,115,.15)', borderBottom:'1px solid rgba(134,200,115,.15)', padding:'.75rem 0'}}>
            <div className="ticker-wrap">
              <div className="ticker-track" style={{fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:'.7rem', textTransform:'uppercase', letterSpacing:'.2em', color:'rgba(255,255,255,.5)'}}>
                {[...TICKER, ...TICKER].map((item, i) => (
                  <span key={i} style={{display:'flex', alignItems:'center', gap:'1rem', whiteSpace:'nowrap'}}>
                    <span style={{width:5, height:5, borderRadius:'50%', background:'#86C873', flexShrink:0}} />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Wave */}
        <svg style={{position:'absolute', bottom:0, left:0, width:'100%', display:'block', height:90, marginBottom:-2}}
          viewBox="0 0 1440 90" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,45 C240,90 540,5 840,35 C1080,58 1280,90 1440,45 L1440,90 L0,90 Z" fill="#f0f5ee" />
        </svg>
      </section>

      {/* ══════════ OBJETIVOS ══════════ */}
      <HomeCampaignGoals />

      {/* ══════════ BUZÓN DE PROPUESTAS ANÓNIMO ══════════ */}
      <BuzonPropuestas />

      {/* ══════════ FOOTER ══════════ */}
      <footer style={{ background: '#050905', padding: '2.5rem 1.5rem 2rem', borderTop: '1px solid rgba(134,200,115,.1)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Logos */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <img src="/imgprode/one-prode-blanco.png" alt="ONE Prode" style={{ height: 26, width: 'auto', opacity: .8 }} />
            <div style={{ width: 1, height: 24, background: 'rgba(134,200,115,.15)', flexShrink: 0 }} />
            <img src="/imgprode/one-prode-blanco.png" alt="ONE" style={{ height: 20, width: 'auto', opacity: .6 }} />
            <div style={{ width: 1, height: 24, background: 'rgba(134,200,115,.15)', flexShrink: 0 }} />
            <a href="https://escencialconsultora.com.ar" target="_blank" rel="noopener noreferrer">
              <img src="/img/escencial-logoblanco.png" alt="Escencial Consultora" style={{ height: 28, width: 'auto', opacity: .6, transition: 'opacity .2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = .6} />
            </a>
          </div>

          <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(134,200,115,.15) 20%,rgba(134,200,115,.15) 80%,transparent)', marginBottom: '1.25rem' }} />

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize: '1.3rem', letterSpacing: '.08em', marginBottom: '.4rem' }}>
              <span style={{ color: '#7BA3C0' }}>MOYANO </span>
              <span style={{ color: '#fff' }}>C</span>
              <span style={{ color: '#F5C518' }}>O</span>
              <span style={{ color: '#fff' }}>N</span>
              <span style={{ color: '#7BA3C0' }}>DUCCIÓN</span>
            </div>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize: '.72rem', color: 'rgba(255,255,255,.25)', margin: '0 0 .9rem' }}>
              © 2026 Lista Verde Tucumán · Moyano Conducción · "Siempre con el trabajador"
            </p>
            <Link to="/" style={{ fontFamily:"'DM Sans',sans-serif", fontSize: '.78rem', fontWeight: 600, color: '#86C873', textDecoration: 'none' }}>
              ← Volver al Prode de la Lista Verde
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
