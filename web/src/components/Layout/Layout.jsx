import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  
  // Obtenemos los datos de sesión reales del AuthContext
  const { user, usuario, logout } = useAuth()
  const usuarioActivo = user || usuario

  // Normalizamos el rol a mayúsculas para que coincida con las llaves de menuPorRol
  const rolActual = (
    usuarioActivo?.rol ||
    usuarioActivo?.role ||
    ''
  ).toUpperCase()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuPorRol = {
    ADMINISTRADOR: [
      { path: '/categorias', label: 'Categorías', icon: '🏷️' },
      { path: '/platillos', label: 'Platillos', icon: '🍽️' },
      { path: '/mesas', label: 'Mesas', icon: '🪑' },
      { path: '/mapa-salon', label: 'Mapa de Salón', icon: '🗺️️' },
      { path: '/toma-pedido', label: 'Toma de Pedido', icon: '📝' },
      { path: '/cocina', label: 'Cocina', icon: '👨‍🍳' },
      { path: '/cobro', label: 'Cobro', icon: '💳' },
      { path: '/corte-caja', label: 'Corte de Caja', icon: '💰' },
      { path: '/reportes', label: 'Reportes', icon: '📊' },
    ],
    MESERO: [
      { path: '/mapa-salon', label: 'Mapa de Salón', icon: '🗺️' },
      { path: '/toma-pedido', label: 'Toma de Pedido', icon: '📝' },
    ],
    COCINERO: [
      { path: '/cocina', label: 'Cocina', icon: '👨‍🍳' },
    ],
    CAJERO: [
      { path: '/cobro', label: 'Cobro', icon: '💳' },
      { path: '/corte-caja', label: 'Corte de Caja', icon: '💰' },
    ],
  }

  const rutasVisibles = menuPorRol[rolActual] || []

  const nombreRol = {
    ADMINISTRADOR: 'Administrador',
    MESERO: 'Mesero',
    COCINERO: 'Cocinero',
    CAJERO: 'Cajero',
  }

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* ================= SIDEBAR ================= */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-72 flex-col bg-slate-950 text-white shadow-2xl">

        {/* Logo */}
        <div className="border-b border-white/10 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
              <span className="text-2xl">🍽️</span>
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Menú<span className="text-emerald-400">Go</span>
              </h1>

              <p className="mt-0.5 text-xs text-slate-400">
                Sistema de Restaurante
              </p>
            </div>
          </div>
        </div>

        {/* Perfil / Rol Real del Usuario */}
        <div className="px-4 pt-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-lg">
                👤
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {usuarioActivo?.nombre || usuarioActivo?.email || 'Usuario Activo'}
                </p>

                <span className="mt-1 inline-block rounded-md border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  {nombreRol[rolActual] || rolActual}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navegación según el rol */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
            Menú principal
          </p>

          <nav className="space-y-1.5">
            {rutasVisibles.map((item) => {
              const isActive = location.pathname === item.path

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-base transition ${
                      isActive
                        ? 'bg-white/15'
                        : 'bg-white/5 group-hover:bg-white/10'
                    }`}
                  >
                    {item.icon}
                  </span>

                  <span className="flex-1">
                    {item.label}
                  </span>

                  {isActive && (
                    <span className="text-xs text-white/70">
                      ●
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Parte inferior */}
        <div className="border-t border-white/10 p-4">
          <Link
            to="/carta-publica"
            className="mb-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
              🌐
            </span>

            <span>
              Carta Pública
            </span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10">
              🚪
            </span>

            <span>
              Cerrar Sesión
            </span>
          </button>

          <div className="mt-4 text-center">
            <p className="text-[10px] text-slate-600">
              MenúGo © 2026
            </p>
          </div>
        </div>

      </aside>

      {/* ================= CONTENIDO ================= */}
      <main className="ml-72 min-h-screen flex-1">

        {/* Barra superior */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-8 backdrop-blur">
          <div>
            <p className="text-xs font-medium text-slate-400">
              SISTEMA DE RESTAURANTE
            </p>

            <h2 className="text-sm font-semibold text-slate-800">
              {nombreRol[rolActual] || rolActual}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-slate-700">
                {usuarioActivo?.nombre || 'Sesión activa'}
              </p>

              <p className="text-[10px] text-emerald-600">
                ● En línea
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm">
              👤
            </div>
          </div>
        </header>

        {/* Página */}
        <div className="p-6 md:p-8">
          <Outlet />
        </div>

      </main>

    </div>
  )
}