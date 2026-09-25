import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import Layout from '@/components/Layout/Layout'
import RutaProtegida from '@/components/auth/RutaProtegida'

// Páginas Públicas y de Control
import Login from '@/pages/Login'
import CartaPublica from '@/pages/CartaPublica'
import SinPermiso from '@/pages/SinPermiso'

// Páginas Operativas y de Administración
import MenuAdmin from '@/pages/MenuAdmin'
import MesasAdmin from '@/pages/MesasAdmin'
import TomaPedidos from '@/pages/TomaPedidos'
import Cocina from '@/pages/Cocina'
import Cobro from '@/pages/Cobro'
import CorteCaja from '@/pages/CorteCaja'
import Reportes from '@/pages/Reportes'
import MapaSalon from '@/pages/MapaSalon'
import Categorias from '@/pages/Categorias'
import Platillos from '@/pages/Platillos'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 1. Rutas Públicas (Sin Sidebar/Layout) */}
          <Route path="/login" element={<Login />} />
          <Route path="/carta-publica" element={<CartaPublica />} />

          {/* 2. Rutas del Sistema (Con Sidebar/Layout) */}
          <Route element={<Layout />}>
            <Route path="/sin-permiso" element={<SinPermiso />} />
            <Route path="/" element={<Navigate to="/mapa-salon" replace />} />

            {/* Exclusivas de ADMINISTRADOR */}
            <Route element={<RutaProtegida rolesPermitidos={['ADMINISTRADOR']} />}>
              <Route path="/menu" element={<MenuAdmin />} />
              <Route path="/mesas" element={<MesasAdmin />} />
              <Route path="/categorias" element={<Categorias />} />
              <Route path="/platillos" element={<Platillos />} />
              <Route path="/reportes" element={<Reportes />} />
            </Route>

            {/* ADMINISTRADOR y MESERO */}
            <Route element={<RutaProtegida rolesPermitidos={['ADMINISTRADOR', 'MESERO']} />}>
              <Route path="/mapa-salon" element={<MapaSalon />} />
              <Route path="/pedidos" element={<TomaPedidos />} />
              <Route path="/toma-pedido" element={<TomaPedidos />} />
            </Route>

            {/* ADMINISTRADOR y COCINERO */}
            <Route element={<RutaProtegida rolesPermitidos={['ADMINISTRADOR', 'COCINERO']} />}>
              <Route path="/cocina" element={<Cocina />} />
            </Route>

            {/* ADMINISTRADOR y CAJERO */}
            <Route element={<RutaProtegida rolesPermitidos={['ADMINISTRADOR', 'CAJERO']} />}>
              <Route path="/cobro" element={<Cobro />} />
              <Route path="/corte-caja" element={<CorteCaja />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}