import { useState, useEffect } from 'react'
import sheetsApi from '../../services/sheetsApi.js'

export default function PropuestasTab() {
  const [propuestas, setPropuestas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadPropuestas() {
      try {
        setLoading(true)
        const data = await sheetsApi.propuestas.obtener()
        setPropuestas(data)
      } catch (err) {
        setError(err.message || 'Error al cargar las propuestas')
      } finally {
        setLoading(false)
      }
    }
    loadPropuestas()
  }, [])

  console.log("Render PropuestasTab", { propuestas, loading, error })

  return (
    <div>
      <div className="flex justify-between items-start gap-4 mb-6 w-full">
        <div>
          <h2 className="font-display text-2xl md:text-3xl tracking-wide"
            style={{ color: '#0a0f0a', letterSpacing: '0.02em' }}>
            PROPUESTAS
          </h2>
          <p className="text-sm font-body mt-1" style={{ color: '#4a6b50' }}>
            {propuestas.length === 0 
              ? 'No hay propuestas todavía' 
              : `${propuestas.length} ${propuestas.length === 1 ? 'propuesta recibida' : 'propuestas recibidas'}`
            }
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <span className="inline-block w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#86C873', borderTopColor: 'transparent' }} />
          <p className="font-body text-sm mt-4" style={{ color: '#4a6b50' }}>
            Cargando buzón...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-2xl p-6 mb-8 text-center" style={{ background: 'rgba(224,50,82,0.08)', border: '1px solid rgba(224,50,82,0.2)' }}>
          <p className="font-body font-bold text-sm text-[#e03252]">{error}</p>
        </div>
      ) : propuestas.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={{ background: '#fff', border: '1.5px dashed #e2eede', boxShadow: '0 1px 0 rgba(10,18,38,0.03)' }}>
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(134,200,115,0.08)', border: '1px solid rgba(134,200,115,0.2)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5A9E4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <p className="font-body font-semibold text-lg mb-2" style={{ color: '#0a0f0a' }}>Buzón vacío</p>
          <p className="font-body text-sm max-w-md mx-auto" style={{ color: '#4a6b50' }}>No se han recibido propuestas hasta el momento.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {propuestas.map(p => (
            <div key={p.id} className="bg-white rounded-xl p-5 hover:shadow-sm transition-shadow" style={{ border: '1px solid #e2eede' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5A9E4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span className="font-body font-bold text-sm" style={{ color: '#4a6b50' }}>
                    {p.area || 'Sin Área'}
                  </span>
                </div>
                <span className="font-body text-xs" style={{ color: '#9aa5b8' }}>
                  {new Date(p.created_at).toLocaleString('es-AR', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
              <p className="font-body text-base leading-relaxed pl-[28px]" style={{ color: '#111811' }}>
                {p.propuesta}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
