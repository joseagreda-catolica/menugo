import { Link } from 'react-router-dom'
import Tarjeta from '@/components/ui/Tarjeta'
import Boton from '@/components/ui/Boton'

export default function SinPermiso() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-lg">
      <Tarjeta className="max-w-md w-full text-center">
        <div className="text-4xl mb-sm">🚫</div>
        <h2 className="text-xl font-bold text-gray-800 mb-xs">Acceso Denegado</h2>
        <p className="text-sm text-gray-600 mb-lg">
          No tienes permisos para acceder a esta pantalla con tu rol actual.
        </p>
        <Link to="/">
          <Boton variant="primary">Volver al Inicio</Boton>
        </Link>
      </Tarjeta>
    </div>
  )
}