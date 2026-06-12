/**
 * RankingWrapper.jsx - CORREGIDO
 * Detecta correctamente si el usuario es admin
 * y renderiza el componente correcto
 */

import RankingPageAdmin from './RankingPageAdmin.jsx'
import RankingPageUser from './RankingPageUser.jsx'
import { useAuth } from '../hooks/useAuth.jsx'

export default function RankingWrapper() {
  const { loading, isAdmin } = useAuth()

  if (loading) {
    return <div>Cargando...</div>
  }

  // ✅ RENDERIZAR COMPONENTE CORRECTO
  return isAdmin ? <RankingPageAdmin /> : <RankingPageUser />
}