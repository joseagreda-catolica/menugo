import { useState } from 'react'
import { MOCK_CATEGORIAS, MOCK_PLATILLOS } from '@/Services/MenuService'

export default function CartaPublica() {
  const [categoriaActiva, setCategoriaActiva] = useState('todas')
  const [busqueda, setBusqueda] = useState('')

  const platillosFiltrados = MOCK_PLATILLOS.filter(p => {
    const coincideCategoria = categoriaActiva === 'todas' || p.categoriaId === categoriaActiva
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                             (p.descripcion && p.descripcion.toLowerCase().includes(busqueda.toLowerCase()))
    return coincideCategoria && coincideBusqueda
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Encabezado / Banner Móvil */}
      <div className="bg-linear-to-r from-orange-500 to-amber-500 text-white p-6 rounded-b-3xl shadow-md text-center">
        <h1 className="text-3xl font-black tracking-tight mb-1">MenúGo 🍽️</h1>
        <p className="text-orange-100 text-xs font-medium">Escanea, Elige y Disfruta</p>
      </div>

      <div className="max-w-md mx-auto px-4 mt-4 space-y-4">
        {/* Buscador */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar platillos o bebidas..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-2xs"
          />
          <span className="absolute left-3.5 top-2.5 text-gray-400 text-sm">🔍</span>
        </div>

        {/* Categorías */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategoriaActiva('todas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              categoriaActiva === 'todas'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            Todas
          </button>
          {MOCK_CATEGORIAS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoriaActiva(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                categoriaActiva === cat.id
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>

        {/* Lista de Platillos */}
        <div className="space-y-3">
          {platillosFiltrados.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No encontramos platillos que coincidan 🥗
            </div>
          ) : (
            platillosFiltrados.map((platillo) => (
              <div
                key={platillo.id}
                className="bg-white rounded-2xl p-3 shadow-2xs border border-gray-100 flex gap-3 items-center"
              >
                <img
                  src={platillo.imagen}
                  alt={platillo.nombre}
                  className="w-20 h-20 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 text-sm truncate">{platillo.nombre}</h3>
                  <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">
                    {platillo.descripcion || 'Delicioso platillo preparado al momento.'}
                  </p>
                  <span className="text-sm font-black text-orange-600 mt-1 block">
                    ${platillo.precio.toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}