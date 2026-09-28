import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

// Los roles llegan del backend en minusculas (administrador, mesero, cocinero,
// cajero - ver api/prisma/schema.prisma). rolesPermitidos se compara igual,
// sin importar como se escriba aqui, para no repetir el desajuste de mayusculas
// que causaba que todo usuario real fuera rechazado.
export default function RutaProtegida({ rolesPermitidos }) {
  // Quitamos "token" porque el AuthContext actual solo tiene "usuario"
  const { usuario } = useAuth()

  // 1. Si no hay usuario autenticado, redirige al Login
  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (rolesPermitidos) {
    const permitidos = rolesPermitidos.map((r) => r.toLowerCase())
    if (!permitidos.includes(usuario.rol?.toLowerCase())) {
      return <Navigate to="/sin-permiso" replace />
    }
  }

  return <Outlet />
}
