import { Link } from 'react-router-dom'

export default function HomeFooter() {
  return (
    <footer style={{ background: '#0a0f0a', position: 'relative', overflow: 'hidden' }}>

      {/* Glow verde ambiental */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 400, height: 250, background: 'radial-gradient(ellipse at 0% 100%,rgba(58,125,68,.14),transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 200, background: 'radial-gradient(ellipse at 100% 0%,rgba(134,200,115,.06),transparent 65%)', pointerEvents: 'none' }} />

      {/* ── Cuerpo principal ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '3.5rem 1.5rem 2.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '2.5rem' }}>

          {/* Col 1: Brand sindical */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <img src="/imgprode/one-prode-blanco.png" alt="ONE Prode" style={{ height: 52, width: 'auto', display: 'block', opacity: .9 }} />
              <div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1rem', letterSpacing: '.08em', lineHeight: 1.1 }}>
                  <span style={{ color: '#7BA3C0' }}>MOYANO </span>
                  <span style={{ color: '#fff' }}>C</span>
                  <span style={{ color: '#ebc32b' }}>O</span>
                  <span style={{ color: '#fff' }}>N</span>
                  <span style={{ color: '#7BA3C0' }}>DUCCIÓN</span>
                </div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '.6rem', color: 'rgba(134,200,115,.6)', letterSpacing: '.12em', fontWeight: 600 }}>
                  LUIS BARRIONUEVO 2026
                </div>
              </div>
            </div>

            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '.82rem', lineHeight: 1.7, color: 'rgba(255,255,255,.38)', maxWidth: '22rem', margin: '0 0 1.2rem' }}>
              Sindicato de Camioneros de Tucumán — Plataforma de prode deportivo para afiliados y sus familias.
            </p>

            {/* Badge eslogan */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '.5rem',
              fontFamily: "'DM Sans',sans-serif", fontSize: '.72rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '.12em',
              color: '#86C873', background: 'rgba(134,200,115,.08)',
              border: '1px solid rgba(134,200,115,.2)',
              padding: '6px 12px', borderRadius: 99,
              whiteSpace: 'nowrap'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#86C873', flexShrink: 0 }} />
              "Siempre con el trabajador"
            </span>
          </div>

          {/* Col 2: Propuestas */}
          <div>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.2em', color: 'rgba(134,200,115,.65)', margin: '0 0 1.1rem' }}>
              Propuestas
            </p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
              {[
                'Defensa salarial y laboral',
                'Salud y familia',
                'Infraestructura y seguridad',
                'Participación y transparencia',
              ].map(label => (
                <li key={label}>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '.84rem', color: 'rgba(255,255,255,.42)', display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(134,200,115,.3)', flexShrink: 0 }} />
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Plataforma */}
          <div>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.2em', color: 'rgba(134,200,115,.65)', margin: '0 0 1.1rem' }}>
              Plataforma Prode
            </p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
              {[
                { href: '/register', label: 'Crear cuenta' },
                { href: '/login', label: 'Iniciar sesión' },
              ].map(({ href, label }) => (
                <li key={label}>
                  <Link to={href}
                    style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '.84rem', color: 'rgba(255,255,255,.45)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '.4rem', transition: 'color .18s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#86C873' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,.45)' }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(134,200,115,.3)', flexShrink: 0 }} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Desarrollado por */}
          <div>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.2em', color: 'rgba(134,200,115,.65)', margin: '0 0 1.1rem' }}>
              Desarrollado por
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.8rem' }}>
              <img src="/imgprode/one-prode-blanco.png" alt="ONE Prode" style={{ height: 38, width: 'auto', opacity: .8 }} />
              <div style={{ width: 1, height: 30, background: 'rgba(134,200,115,.15)', flexShrink: 0 }} />
              <a href="https://escencialconsultora.com.ar" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                <img src="./img/escencial-logoblanco.png" alt="Escencial Consultora"
                  style={{ height: 46, width: 'auto', opacity: .6, transition: 'opacity .18s' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = 1 }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = .6 }} />
              </a>
            </div>

          </div>

        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(134,200,115,.18) 20%,rgba(134,200,115,.18) 80%,transparent)' }} />
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '.75rem' }}>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '.72rem', color: 'rgba(255,255,255,.22)' }}>
            © 2026 ONE · Escencial · Sindicato de Camioneros Tucumán. Todos los derechos reservados.
          </span>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '.72rem', color: 'rgba(134,200,115,.3)', fontWeight: 600 }}>
            V1.2.0
          </span>
        </div>
      </div>

    </footer>
  )
}