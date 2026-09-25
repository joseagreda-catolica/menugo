import { useState, useEffect, useCallback } from 'react'
import { getPedidosCocina, cambiarEstadoLinea } from '@/Services/pedidosService'
import PedidoCocinaCard from '../components/cocina/PedidoCocinaCard' // Ajusta la ruta relativa según tu estructura

export default function Cocina() {
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargarPedidos = useCallback(async () => {
    try {
      const data = await getPedidosCocina()
      setPedidos(data || [])
      setError(null)
    } catch (err) {
      console.error('Error al cargar comandas de cocina:', err)
      setError('No se pudieron obtener las comandas de cocina.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const obtenerDatos = async () => {
      try {
        const data = await getPedidosCocina()
        if (isMounted) {
          setPedidos(data || [])
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error al cargar comandas de cocina:', err)
          setError('No se pudieron obtener las comandas de cocina.')
        }
      } finally {
        if (isMounted) setCargando(false)
      }
    }

    obtenerDatos()
    const interval = setInterval(obtenerDatos, 10000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  // Cambiar el estado de un platillo específico (PedidoLinea)
  const handleCambiarEstadoLinea = async (lineaId, nuevoEstado) => {
    try {
      await cambiarEstadoLinea(lineaId, nuevoEstado)
      cargarPedidos()
    } catch (err) {
      console.error('Error al actualizar platillo:', err)
      alert('No se pudo actualizar el estado del platillo.')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pantalla de Cocina 👨‍🍳</h1>
          <p className="text-sm text-gray-500">
            Controla la preparación y entrega de cada platillo individual.
          </p>
        </div>

        <button
          onClick={cargarPedidos}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
        >
          🔄 Actualizar ahora
        </button>
      </div>

      {/* Indicador de Carga */}
      {cargando && (
        <div className="py-20 text-center text-gray-400 font-medium animate-pulse">
          Cargando comandas de cocina...
        </div>
      )}

      {/* Mensaje de Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={cargarPedidos} className="underline font-bold text-xs hover:text-red-800">
            Reintentar
          </button>
        </div>
      )}

      {/* Grid de Comandas */}
      {!cargando && !error && (
        <>
          {pedidos.length === 0 ? (
            <div className="py-20 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <span className="text-4xl block mb-2">🍽️</span>
              <p className="text-gray-500 font-medium text-sm">No hay comandas activas en cocina.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pedidos.map((pedido) => (
                <PedidoCocinaCard
                  key={pedido.id}
                  pedido={pedido}
                  onCambiarEstadoLinea={handleCambiarEstadoLinea}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}