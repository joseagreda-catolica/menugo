import { MOCK_PLATILLOS } from '@/Services/MenuService'
import { MOCK_PEDIDOS_INICIALES } from '@/Services/pedidosService'

export default function Reportes() {
  const totalVentas = MOCK_PEDIDOS_INICIALES.reduce((sum, p) => sum + p.total, 0)
  const totalOrdenes = MOCK_PEDIDOS_INICIALES.length
  const ticketPromedio = totalOrdenes > 0 ? totalVentas / totalOrdenes : 0

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Reportes y Analíticas</h1>
        <p className="text-gray-500 text-sm">Resumen del rendimiento comercial y productos más populares.</p>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
          <span className="text-xs text-gray-500 font-semibold block">Ventas Totales</span>
          <span className="text-2xl font-black text-gray-800 mt-1 block">${totalVentas.toFixed(2)}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
          <span className="text-xs text-gray-500 font-semibold block">Órdenes Procesadas</span>
          <span className="text-2xl font-black text-gray-800 mt-1 block">{totalOrdenes}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
          <span className="text-xs text-gray-500 font-semibold block">Ticket Promedio</span>
          <span className="text-2xl font-black text-orange-600 mt-1 block">${ticketPromedio.toFixed(2)}</span>
        </div>
      </div>

      {/* Tabla de Platillos Más Vendidos */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Rendimiento de Platillos</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase">
                <th className="py-3 px-2">Platillo</th>
                <th className="py-3 px-2">Precio</th>
                <th className="py-3 px-2 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {MOCK_PLATILLOS.map((platillo) => (
                <tr key={platillo.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-2 font-semibold text-gray-800 flex items-center gap-2">
                    <img src={platillo.imagen} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    {platillo.nombre}
                  </td>
                  <td className="py-3 px-2 font-bold">${platillo.precio.toFixed(2)}</td>
                  <td className="py-3 px-2 text-right">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                      Disponible
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}