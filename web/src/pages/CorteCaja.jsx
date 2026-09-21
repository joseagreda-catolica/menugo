import { useState } from 'react'
import { MOCK_PEDIDOS_INICIALES } from '@/Services/pedidosService'

export default function CorteCaja() {
  const [montoInicial, setMontoInicial] = useState(100.0) // Fondo de caja inicial
  const [efectivoContado, setEfectivoContado] = useState('')
  const [cajaCerrada, setCajaCerrada] = useState(false)

  // Obtener ventas realizadas
  const pedidosPagados = MOCK_PEDIDOS_INICIALES.filter(p => p.estado === 'pagado')
  const totalVentasEfectivo = pedidosPagados.reduce((sum, p) => sum + p.total, 0)
  
  // Totales esperados
  const totalEsperadoEnCaja = parseFloat(montoInicial || 0) + totalVentasEfectivo
  const efectivoReal = parseFloat(efectivoContado || 0)
  const diferencia = efectivoReal - totalEsperadoEnCaja

  const handleCerrarCaja = (e) => {
    e.preventDefault()
    if (!efectivoContado) return

    setCajaCerrada(true)
    alert('🔒 Caja cerrada exitosamente. Arqueo registrado.')
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Corte y Arqueo de Caja</h1>
        <p className="text-gray-500 text-sm">Realiza el cierre del turno y concilia el dinero en efectivo del cajón.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Resumen del Turno */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-5">
          <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3">Resumen de Ventas del Turno</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-500 block font-medium">Fondo Inicial</span>
              <span className="text-xl font-bold text-gray-800">${parseFloat(montoInicial || 0).toFixed(2)}</span>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <span className="text-xs text-emerald-700 block font-medium">Ventas Efectivo</span>
              <span className="text-xl font-bold text-emerald-800">${totalVentasEfectivo.toFixed(2)}</span>
            </div>
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
              <span className="text-xs text-orange-700 block font-medium">Total Esperado</span>
              <span className="text-xl font-bold text-orange-800">${totalEsperadoEnCaja.toFixed(2)}</span>
            </div>
          </div>

          {/* Desglose de Pedidos Pagados */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-2">Comandas Liquidadas ({pedidosPagados.length})</h3>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 border border-gray-100 rounded-xl p-3">
              {pedidosPagados.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-4">No hay ventas registradas en este turno.</p>
              ) : (
                pedidosPagados.map((pedido) => (
                  <div key={pedido.id} className="flex justify-between items-center text-xs py-1.5 border-b border-gray-50 last:border-0">
                    <div>
                      <span className="font-bold text-gray-800">{pedido.mesaNumero}</span>
                      <span className="text-gray-400 ml-2">({pedido.id})</span>
                    </div>
                    <span className="font-bold text-emerald-600">${pedido.total.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Panel de Arqueo */}
        <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs h-fit space-y-4">
          <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3">Arqueo Manual</h2>

          <form onSubmit={handleCerrarCaja} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Fondo Inicial ($)</label>
              <input
                type="number"
                step="0.01"
                value={montoInicial}
                onChange={(e) => setMontoInicial(e.target.value)}
                disabled={cajaCerrada}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Efectivo Físico Contado ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={efectivoContado}
                onChange={(e) => setEfectivoContado(e.target.value)}
                placeholder="0.00"
                disabled={cajaCerrada}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
              />
            </div>

            {efectivoContado && (
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Diferencia:</span>
                  <span className={`font-bold ${
                    diferencia === 0 ? 'text-emerald-600' : diferencia > 0 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {diferencia === 0 ? '$0.00 (Cuadre Exacto)' : `${diferencia > 0 ? '+' : ''}$${diferencia.toFixed(2)}`}
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={cajaCerrada || !efectivoContado}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold rounded-xl shadow-sm transition-colors text-sm cursor-pointer disabled:cursor-not-allowed"
            >
              {cajaCerrada ? 'Caja Cerrada 🔒' : 'Realizar Cierre de Caja 💵'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}