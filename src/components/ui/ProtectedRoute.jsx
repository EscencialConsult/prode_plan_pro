import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'
import Loading from '../../hooks/Loading.jsx'

export default function ProtectedRoute({ requireAdmin = false }) {
  const { user, isAdmin, loading, perfilCompleto } = useAuth()

  // Esperar a que Supabase termine de validar la sesión
  if (loading) return <Loading />

  if (!user) return <Navigate to="/login" replace />

  // Si el perfil no está completo, redirigir antes de acceder a cualquier ruta
  if (!perfilCompleto) return <Navigate to="/completar-perfil" replace />

  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />

  return <Outlet />
}
