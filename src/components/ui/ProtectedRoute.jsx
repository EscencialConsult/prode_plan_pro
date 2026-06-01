import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'
import Loading from '../../hooks/Loading.jsx'

export default function ProtectedRoute({ requireAdmin = false }) {
  const { user, isAdmin, loading } = useAuth()

  // Esperar a que Supabase termine de validar la sesión
  if (loading) return <Loading />

  if (!user) return <Navigate to="/login" replace />
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />

  return <Outlet />
}
