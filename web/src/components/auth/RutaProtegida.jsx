import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function RutaProtegida({ rolesPermitidos }) {
  const { usuario, token } = useAuth()

  // 1. Si no hay token/usuario autenticado, redirige al Login
  if (!token || !usuario) {
    return <Navigate to="/login" replace />
  }

  // 2. Si el rol del usuario no está en la lista permitida, redirige a "Sin Permiso"
  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    return <Navigate to="/sin-permiso" replace />
  }

  // 3. Si todo está correcto, renderiza la ruta
  return <Outlet />
}