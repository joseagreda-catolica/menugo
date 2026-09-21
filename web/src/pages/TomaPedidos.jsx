import { useState } from 'react'
import { MOCK_MESAS } from '@/Services/mesasService'
import { MOCK_CATEGORIAS, MOCK_PLATILLOS } from '@/Services/MenuService'
import CarritoPedido from '@/components/pedidos/CarritoPedido'

export default function TomaPedidos() {
  const [mesas, setMesas] = useState(MOCK_MESAS)
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null)
  const [categoriaActiva, setCategoriaActiva] = useState('todas')
  const [carritoItems, setCarritoItems] = useState([])

  const platillosFiltrados = categoriaActiva === 'todas'
    ? MOCK_PLATILLOS
    : MOCK_PLATILLOS.filter(p => p.categoriaId === categoriaActiva)

  const handleAgregarPlatillo = (platillo) => {
    if (!mesaSeleccionada) {
      alert('Por favor selecciona una mesa primero.')
      return
    }

    setCarritoItems(prev => {
      const existe = prev.find(item => item.id === platillo.id)
      if (existe) {
        return prev.map(item =>
          item.id === platillo.id ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      }
      return [...prev, { ...platillo, cantidad: 1, nota: '' }]
    })
  }

  const handleUpdateCantidad = (id, delta) => {
    setCarritoItems(prev =>
      prev
        .map(item => item.id === id ? { ...item, cantidad: item.cantidad + delta } : item)
        .filter(item => item.cantidad > 0)
    )
  }

  const handleRemoveItem = (id) => {
    setCarritoItems(prev => prev.filter(item => item.id !== id))
  }

  const handleUpdateNota = (id, nota) => {
    setCarritoItems(prev =>
      prev.map(item => item.id === id ? { ...item, nota } : item)
    )
  }

  const handleEnviarComanda = () => {
    if (!mesaSeleccionada || carritoItems.length === 0) return

    setMesas(prev =>
      prev.map(m =>
        m.id === mesaSeleccionada.id ? { ...m, estado: 'ocupada' } : m
      )
    )

    alert(`🚀 Comanda enviada a cocina para la ${mesaSeleccionada.numero}`)
    setCarritoItems([])
  }

  return (
    <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <h2 className="text-sm font-bold text-gray-700 mb-3">1. Selecciona una Mesa</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {mesas.map((mesa) => (
              <button
                key={mesa.id}
                onClick={() => setMesaSeleccionada(mesa)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                  mesaSeleccionada?.id === mesa.id
                    ? 'bg-orange-500 text-white border-orange-500 shadow-sm scale-105'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {mesa.numero} ({mesa.seccion})
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategoriaActiva('todas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              categoriaActiva === 'todas'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todas
          </button>
          {MOCK_CATEGORIAS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoriaActiva(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                categoriaActiva === cat.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {platillosFiltrados.map((platillo) => (
            <div
              key={platillo.id}
              onClick={() => handleAgregarPlatillo(platillo)}
              className="bg-white rounded-xl border border-gray-100 p-3 shadow-2xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div className="relative h-28 w-full rounded-lg overflow-hidden mb-2 bg-gray-100">
                <img
                  src={platillo.imagen}
                  alt={platillo.nombre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{platillo.nombre}</h3>
                <p className="text-xs text-orange-600 font-bold mt-1">${platillo.precio.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-1 h-[calc(100vh-6rem)] sticky top-6">
        <CarritoPedido
          mesaSeleccionada={mesaSeleccionada}
          items={carritoItems}
          onUpdateCantidad={handleUpdateCantidad}
          onRemoveItem={handleRemoveItem}
          onUpdateNota={handleUpdateNota}
          onEnviarComanda={handleEnviarComanda}
          onLimpiar={() => setCarritoItems([])}
        />
      </div>
    </div>
  )
}