import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import Layout from '@/components/Layout/Layout'
import RutaProtegida from '@/components/auth/RutaProtegida'

import Login from '@/pages/Login'
import SinPermiso from '@/pages/SinPermiso'
import Categorias from '@/pages/Categorias'
import Platillos from '@/pages/Platillos'
import Mesas from '@/pages/Mesas'
import CartaPublica from '@/pages/CartaPublica'
import MapaSalon from '@/pages/MapaSalon'
import TomaPedido from '@/pages/TomaPedido'
import Cocina from '@/pages/Cocina'
import Cobro from '@/pages/Cobro'
import CorteCaja from '@/pages/CorteCaja'
import Reportes from '@/pages/Reportes'
import MenuAdmin from '@/pages/MenuAdmin'
import MesasAdmin from '@/pages/MesasAdmin'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/carta-publica" element={<CartaPublica />} />

          {/* Rutas Autenticadas con Layout */}
          <Route element={<Layout />}>
            <Route path="/sin-permiso" element={<SinPermiso />} />
            <Route path="/" element={<Navigate to="/mapa-salon" replace />} />
            <Route path="/menu" element={<MenuAdmin />} />
            <Route path="/mesas" element={<MesasAdmin />} />
            {/* Exclusivas de ADMINISTRADOR */}
            <Route element={<RutaProtegida rolesPermitidos={['ADMINISTRADOR']} />}>
              <Route path="/categorias" element={<Categorias />} />
              <Route path="/platillos" element={<Platillos />} />
              <Route path="/mesas" element={<Mesas />} />
              <Route path="/reportes" element={<Reportes />} />
            </Route>

            {/* ADMINISTRADOR y MESERO */}
            <Route element={<RutaProtegida rolesPermitidos={['ADMINISTRADOR', 'MESERO']} />}>
              <Route path="/mapa-salon" element={<MapaSalon />} />
              <Route path="/toma-pedido" element={<TomaPedido />} />
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