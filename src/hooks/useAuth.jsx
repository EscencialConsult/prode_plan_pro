/* ── ./hooks/useAuth.jsx */

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import sheetsApi from '../services/sheetsApi.js'

/* ── Contexto de Autenticación ──────────────────────────────
   Usa sheetsApi.auth para comunicarse con Supabase.
   La sesión (JWT) se persiste automáticamente en localStorage
   y se refresca cada hora.
   ─────────────────────────────────────────────────────────── */

const AuthContext = createContext(null)

// Clave para persistir el usuario en sessionStorage
const USER_KEY = 'prode_user'

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => {
    try {
      const stored = sessionStorage.getItem(USER_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  // Sincronizar el estado del user con la sesión real de Supabase.
  // - Al cargar: si hay sesión válida pero falta el perfil, lo cargamos.
  // - Si la sesión expira o se cierra en otra pestaña, deslogueamos acá también.
  useEffect(() => {
    let cancelado = false

    async function sincronizarSesion() {
      const supabase = sheetsApi._supabase
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (cancelado) return

        if (!session) {
          // No hay sesión: limpiar todo
          setUser(null)
          sessionStorage.removeItem(USER_KEY)
          return
        }

        // Hay sesión válida. Si no tenemos el perfil en memoria, traerlo.
        const stored = sessionStorage.getItem(USER_KEY)
        if (!stored) {
          try {
            const { data: perfil } = await supabase
              .from('usuarios').select('*').eq('id', session.user.id).single()
            if (perfil && !cancelado) {
              const userData = { ...perfil, user_id: perfil.id }
              setUser(userData)
              sessionStorage.setItem(USER_KEY, JSON.stringify(userData))
            }
          } catch (e) {
            // Si falla (ej: usuario eliminado), forzar logout
            await supabase.auth.signOut()
            if (!cancelado) {
              setUser(null)
              sessionStorage.removeItem(USER_KEY)
            }
          }
        }
      } finally {
        // Señalar que la validación de sesión terminó
        if (!cancelado) setLoading(false)
      }
    }

    sincronizarSesion()

    // Suscribirse a cambios de sesión (logout en otra pestaña, expiración, etc)
    const supabase = sheetsApi._supabase
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelado) return
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null)
        sessionStorage.removeItem(USER_KEY)
      }
    })

    return () => {
      cancelado = true
      subscription?.subscription?.unsubscribe?.()
    }
  }, [])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      // sheetsApi.auth.login guarda el session_token automáticamente
      const data = await sheetsApi.auth.login(email, password)
      setUser(data.user)
      sessionStorage.setItem(USER_KEY, JSON.stringify(data.user))
      return data.user
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setLoading(true)
    try {
      // sheetsApi.auth.logout limpia el token aunque el servidor falle
      await sheetsApi.auth.logout()
    } finally {
      setUser(null)
      setError(null)
      sessionStorage.removeItem(USER_KEY)
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (nombre, email, password) => {
    setLoading(true)
    setError(null)
    try {
      const data = await sheetsApi.auth.registro(nombre, email, password)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Cambio de contraseña de un usuario logueado (sin email).
  // Pass-through puro: NO toca el `loading` compartido para no
  // re-renderizar ProtectedRoute ni desmontar la pantalla actual.
  // La pantalla que lo llama maneja su propio estado de carga.
  const cambiarPassword = useCallback(async (currentPassword, newPassword) => {
    return await sheetsApi.auth.cambiarPassword(currentPassword, newPassword)
  }, [])

const isAdmin = !!(
    user?.rol === 'admin' ||
    user?.role === 'admin' ||
    user?.es_admin === true
  )

  // Plan de la empresa del usuario logueado.
  // Criterio idéntico al backend (función plan_basic()):
  //   empresa = 'plan_pro'              → Pro
  //   empresa = 'plan_basic', '' o null → Basic (por defecto restrictivo)
  const empresa = String(user?.empresa || '').trim().toLowerCase()
  const isPlanBasic = empresa !== 'plan_pro'
  const isPro = !isPlanBasic

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      logout,
      register,
      cambiarPassword,
      isAdmin,
      isPlanBasic,
      isPro,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
