import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function Layout() {
  const [rolActual, setRolActual] = useState('ADMINISTRADOR')
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Definición de menú dinámico por rol
  const menuPorRol = {
    ADMINISTRADOR: [
      { path: '/categorias', label: 'Categorías' },
      { path: '/platillos', label: 'Platillos' },
      { path: '/mesas', label: 'Mesas' },
      { path: '/mapa-salon', label: 'Mapa de Salón' },
      { path: '/toma-pedido', label: 'Toma de Pedido' },
      { path: '/cocina', label: 'Cocina' },
      { path: '/cobro', label: 'Cobro' },
      { path: '/corte-caja', label: 'Corte de Caja' },
      { path: '/reportes', label: 'Reportes' },
    ],
    MESERO: [
      { path: '/mapa-salon', label: 'Mapa de Salón' },
      { path: '/toma-pedido', label: 'Toma de Pedido' },
    ],
    COCINERO: [
      { path: '/cocina', label: 'Cocina' },
    ],
    CAJERO: [
      { path: '/cobro', label: 'Cobro' },
      { path: '/corte-caja', label: 'Corte de Caja' },
    ]
  }

  const rutasVisibles = menuPorRol[rolActual] || []

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar / Menú Lateral */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between p-lg">
        <div>
          <div className="mb-xl">
            <h1 className="text-xl font-bold text-primary">MenúGo</h1>
            <p className="text-xs text-secondary">Sistema de Restaurante</p>
          </div>

          {/* Selector de Simulación de Rol */}
          <div className="mb-lg p-sm bg-gray-50 border border-gray-200 rounded-sm">
            <label className="text-xs font-semibold text-gray-500 block mb-xs">Simular Rol:</label>
            <select
              value={rolActual}
              onChange={(e) => setRolActual(e.target.value)}
              className="w-full text-xs p-xs border border-gray-300 rounded outline-none bg-white font-medium"
            >
              <option value="ADMINISTRADOR">Administrador</option>
              <option value="MESERO">Mesero</option>
              <option value="COCINERO">Cocinero</option>
              <option value="CAJERO">Cajero</option>
            </select>
          </div>

          {/* Enlaces de Navegación */}
          <nav className="space-y-xs">
            {rutasVisibles.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-md py-sm rounded-sm font-medium text-sm transition-colors ${
                    isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="pt-md border-t border-gray-100">
          <Link to="/carta-publica" className="block text-xs text-primary hover:underline mb-xs">
            🌐 Ver Carta Pública
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="block w-full text-left text-xs text-danger hover:underline"
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 p-xl">
        <Outlet />
      </main>
    </div>
  )
}