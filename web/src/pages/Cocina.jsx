import { useState } from 'react'
import { MOCK_PEDIDOS_INICIALES } from '@/Services/pedidosService'
import PedidoCocinaCard from '@/components/cocina/PedidoCocinaCard'

export default function Cocina() {
  const [pedidos, setPedidos] = useState(MOCK_PEDIDOS_INICIALES)
  const [filtroEstado, setFiltroEstado] = useState('todos')

  const handleCambiarEstado = (pedidoId, nuevoEstado) => {
    setPedidos(prev =>
      prev.map(p => p.id === pedidoId ? { ...p, estado: nuevoEstado } : p)
    )
  }

  const pedidosFiltrados = filtroEstado === 'todos'
    ? pedidos
    : pedidos.filter(p => p.estado === filtroEstado)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pantalla de Cocina (KDS)</h1>
          <p className="text-gray-500 text-sm">Gestión de comandas y estados de preparación en tiempo real.</p>
        </div>

        {/* Filtro por estado */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setFiltroEstado('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filtroEstado === 'todos' ? 'bg-white text-gray-800 shadow-xs' : 'text-gray-600'
            }`}
          >
            Todos ({pedidos.length})
          </button>
          <button
            onClick={() => setFiltroEstado('pendiente')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filtroEstado === 'pendiente' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-600'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFiltroEstado('en_preparacion')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filtroEstado === 'en_preparacion' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600'
            }`}
          >
            En Preparación
          </button>
          <button
            onClick={() => setFiltroEstado('listo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filtroEstado === 'listo' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600'
            }`}
          >
            Listos
          </button>
        </div>
      </div>

      {/* Cuadrícula de Comandas */}
      {pedidosFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-400 font-medium text-sm">No hay comandas activas en esta sección 👨‍🍳</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {pedidosFiltrados.map((pedido) => (
            <PedidoCocinaCard
              key={pedido.id}
              pedido={pedido}
              onCambiarEstado={handleCambiarEstado}
            />
          ))}
        </div>
      )}
    </div>
  )
}