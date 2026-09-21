import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import Layout from '@/components/Layout/Layout'

// Páginas Públicas y de Control
import Login from '@/pages/Login'
import CartaPublica from '@/pages/CartaPublica'
import SinPermiso from '@/pages/SinPermiso'

// Páginas del Sistema
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
          {/* Vistas sin Menú Lateral */}
          <Route path="/login" element={<Login />} />
          <Route path="/carta-publica" element={<CartaPublica />} />

          {/* Todas las Vistas Libres dentro del Layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/mapa-salon" replace />} />
            <Route path="/mapa-salon" element={<MapaSalon />} />
            <Route path="/menu" element={<MenuAdmin />} />
            <Route path="/mesas" element={<MesasAdmin />} />
            <Route path="/pedidos" element={<TomaPedidos />} />
            <Route path="/cocina" element={<Cocina />} />
            <Route path="/cobro" element={<Cobro />} />
            <Route path="/corte-caja" element={<CorteCaja />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/categorias" element={<Categorias />} />
            <Route path="/platillos" element={<Platillos />} />
            <Route path="/sin-permiso" element={<SinPermiso />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}