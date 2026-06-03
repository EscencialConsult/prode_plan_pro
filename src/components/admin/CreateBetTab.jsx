import CreateBetForm from './CreateBetForm.jsx'

export default function CreateBetTab({ createBet, loading, matches }) {
  return (
    <div className="animate-fade-in delay-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl md:text-3xl tracking-wide"
            style={{ color: '#0a0f0a', letterSpacing: '0.02em' }}>
            NUEVA APUESTA
          </h2>
          <p className="text-sm font-body mt-1.5" style={{ color: '#4a6b50' }}>
            Creá y configurá una nueva apuesta para el Prode
          </p>
        </div>
      </div>

      {/* Form - SIN max-width */}
      <div
        className="rounded-2xl p-4 sm:p-6"
        style={{
          background: '#fff',
          border: '1.5px solid #e2eede',
          boxShadow: '0 1px 0 rgba(10,18,38,0.03)',
        }}
      >
        <CreateBetForm onSubmit={createBet} loading={loading} matches={matches} />
      </div>
    </div>
  )
}