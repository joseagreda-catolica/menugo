import { useState, useEffect } from 'react'
import { obtenerPedidos, actualizarEstadoLinea } from '@/Services/pedidosService'
import PedidoCocinaCard from '../components/cocina/PedidoCocinaCard'

export default function Cocina() {
  const [pedidos, setPedidos] = useState([])
  const [filtroEstado, setFiltroEstado] = useState('todos')

  const cargarPedidos = () => {
    obtenerPedidos().then(setPedidos).catch(console.error)
  }

  useEffect(() => {
    cargarPedidos()
    // RNF-05: la comanda debe verse en cocina en menos de 5 segundos.
    // Polling cada 3s (sección 7.5 del documento).
    const intervalo = setInterval(cargarPedidos, 3000)
    return () => clearInterval(intervalo)
  }, [])

  // Aplanar: una tarjeta por LÍNEA, no por pedido completo
  const tarjetas = pedidos
    .filter((p) => p.estado === 'abierto')
    .flatMap((p) =>
      (p.lineas || [])
        .filter((l) => l.estado !== 'anulada' && l.estado !== 'entregado')
        .map((l) => ({
          id: l.id,
          mesaNumero: `Mesa ${p.sesionMesa?.mesa?.numero ?? ''}`,
          estado: l.estado,
          items: [{ cantidad: l.cantidad, nombre: l.platillo?.nombre, nota: l.notaPreparacion }],
        }))
    )

  const handleCambiarEstado = (lineaId, nuevoEstado) => {
    actualizarEstadoLinea(lineaId, nuevoEstado).then(cargarPedidos).catch(console.error)
  }

  const pedidosFiltrados = filtroEstado === 'todos'
    ? tarjetas
    : tarjetas.filter((t) => t.estado === filtroEstado)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pantalla de Cocina 👨‍🍳</h1>
          <p className="text-sm text-gray-500">
            Controla la preparación y entrega de cada platillo individual.
          </p>
        </div>

        {/* Filtros de estado */}
        <div className="flex gap-2">
          {['todos', 'pendiente', 'en_preparacion', 'listo'].map((est) => (
            <button
              key={est}
              onClick={() => setFiltroEstado(est)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filtroEstado === est
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              {est.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de tarjetas por línea de pedido */}
      {pedidosFiltrados.length === 0 ? (
        <div className="py-20 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <span className="text-4xl block mb-2">🍽️</span>
          <p className="text-gray-500 font-medium text-sm">No hay comandas activas en cocina.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pedidosFiltrados.map((item) => (
            <PedidoCocinaCard
              key={item.id}
              pedido={item}
              onCambiarEstado={handleCambiarEstado}
            />
          ))}
        </div>
      )}
    </div>
  )
}