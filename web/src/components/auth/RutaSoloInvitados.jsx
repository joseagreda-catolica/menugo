import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { rutaInicialPorRol } from './rutaInicialPorRol'

// Mientras haya una sesion activa no se puede volver al login, ni siquiera con
// el boton "atras" del navegador: la unica salida es "Cerrar Sesion".
export default function RutaSoloInvitados() {
  const { usuario, token } = useAuth()

  if (usuario && token) {
    return <Navigate to={rutaInicialPorRol(usuario.rol)} replace />
  }

  return <Outlet />
}
