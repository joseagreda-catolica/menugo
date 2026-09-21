import { useState } from 'react'
import { MOCK_MESAS } from '@/Services/mesasService'
import { MOCK_PEDIDOS_INICIALES } from '@/Services/pedidosService'

export default function Cobro() {
  const [mesas, setMesas] = useState(MOCK_MESAS)
  const [pedidos, setPedidos] = useState(MOCK_PEDIDOS_INICIALES)
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null)
  
  // Opciones de Pago
  const [propinaPorcentaje, setPropinaPorcentaje] = useState(10)
  const [montoRecibido, setMontoRecibido] = useState('')

  // Buscar el pedido de la mesa seleccionada
  const pedidoActual = mesaSeleccionada
    ? pedidos.find(p => p.mesaId === mesaSeleccionada.id && p.estado !== 'pagado')
    : null

  const subtotal = pedidoActual ? pedidoActual.total : 0
  const propina = (subtotal * propinaPorcentaje) / 100
  const totalCobrar = subtotal + propina
  const cambio = parseFloat(montoRecibido || 0) - totalCobrar

  const handleProcesarPago = () => {
    if (!pedidoActual) return

    // 1. Marcar pedido como pagado
    setPedidos(prev =>
      prev.map(p => p.id === pedidoActual.id ? { ...p, estado: 'pagado' } : p)
    )

    // 2. Liberar la mesa
    setMesas(prev =>
      prev.map(m => m.id === mesaSeleccionada.id ? { ...m, estado: 'libre' } : m)
    )

    alert(`✅ Pago en efectivo procesado exitosamente para ${mesaSeleccionada.numero}. Mesa liberada.`)
    setMesaSeleccionada(null)
    setMontoRecibido('')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Columna Izquierda: Selección de Mesa */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Caja y Cobro</h1>
          <p className="text-gray-500 text-sm">Selecciona una mesa ocupada para liquidar la cuenta.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {mesas.map((mesa) => {
            const tienePedido = pedidos.some(p => p.mesaId === mesa.id && p.estado !== 'pagado')
            const isSelected = mesaSeleccionada?.id === mesa.id

            return (
              <button
                key={mesa.id}
                onClick={() => setMesaSeleccionada(mesa)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50/50 shadow-md scale-102'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black text-gray-800">{mesa.numero}</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${tienePedido ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                </div>
                <span className="text-xs text-gray-500 block">{mesa.seccion}</span>
                <span className="text-xs font-semibold text-orange-600 mt-2 block">
                  {tienePedido ? 'Cuenta Activa' : 'Sin Pedido'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Columna Derecha: Resumen de Ticket y Pago */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5 sticky top-6">
          <h2 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3">
            {mesaSeleccionada ? `Resumen - ${mesaSeleccionada.numero}` : 'Detalle de Cobro'}
          </h2>

          {!pedidoActual ? (
            <div className="py-12 text-center text-gray-400 text-sm italic">
              {mesaSeleccionada ? 'Esta mesa no tiene consumos pendientes.' : 'Selecciona una mesa para cobrar.'}
            </div>
          ) : (
            <>
              {/* Items consumidos */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {pedidoActual.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-gray-700"><strong>{item.cantidad}x</strong> {item.nombre}</span>
                    <span className="font-bold text-gray-800">${(item.precio * item.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Propina */}
              <div className="border-t border-gray-100 pt-3">
                <label className="block text-xs font-semibold text-gray-600 mb-2">Propina Sugerida</label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setPropinaPorcentaje(pct)}
                      className={`py-1 rounded-lg text-xs font-bold transition-colors ${
                        propinaPorcentaje === pct
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Campo Recibido en Efectivo */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Monto Recibido en Efectivo ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={montoRecibido}
                  onChange={(e) => setMontoRecibido(e.target.value)}
                  placeholder={totalCobrar.toFixed(2)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Desglose Totales */}
              <div className="border-t border-gray-100 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Propina ({propinaPorcentaje}%)</span>
                  <span>${propina.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-800 pt-1 border-t border-gray-100">
                  <span>Total a Pagar</span>
                  <span className="text-orange-600">${totalCobrar.toFixed(2)}</span>
                </div>

                {montoRecibido && (
                  <div className="flex justify-between text-sm font-bold text-emerald-600 pt-1">
                    <span>Cambio / Vuelto</span>
                    <span>${cambio >= 0 ? cambio.toFixed(2) : '0.00'}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleProcesarPago}
                disabled={!montoRecibido || cambio < 0}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold rounded-xl shadow-sm transition-colors text-sm cursor-pointer disabled:cursor-not-allowed"
              >
                Procesar Pago en Efectivo 💵
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}