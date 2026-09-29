import { useState, useEffect, useCallback } from 'react'
import { obtenerVentas, obtenerRankingPlatillos, obtenerDistribucionHoraria } from '../Services/reporteService'

const NOMBRES_DIA = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']

export default function Reportes() {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [ventas, setVentas] = useState(null)
  const [ranking, setRanking] = useState([])
  const [distribucion, setDistribucion] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargarReportes = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const rango = { desde: desde || undefined, hasta: hasta || undefined }
      const [datosVentas, datosRanking, datosDistribucion] = await Promise.all([
        obtenerVentas(rango),
        obtenerRankingPlatillos(rango),
        obtenerDistribucionHoraria(rango),
      ])
      setVentas(datosVentas)
      setRanking(datosRanking)
      setDistribucion(datosDistribucion)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [desde, hasta])

  useEffect(() => {
    cargarReportes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const masVendidos = ranking.slice(0, 5)
  const menosVendidos = [...ranking].reverse().slice(0, 5)
  const horasConVentas = distribucion ? distribucion.porHora.filter((h) => h.cantidadLineas > 0) : []
  const diasConVentas = distribucion ? distribucion.porDiaSemana.filter((d) => d.cantidadLineas > 0) : []

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Reportes de ventas</h1>
        <p className="text-gray-500 text-sm mt-1">
          Ventas por período, platillos más y menos vendidos, y distribución por hora y día de la semana.
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Desde</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={cargarReportes}
          disabled={cargando}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded-lg text-sm"
        >
          {cargando ? 'Cargando...' : 'Aplicar filtro'}
        </button>
        <span className="text-xs text-gray-400">Sin fechas, muestra el último año.</span>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg text-sm">{error}</div>
      )}

      {/* RF-25: ventas por rango */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total facturado</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">
            ${ventas ? Number(ventas.totalFacturado).toFixed(2) : '0.00'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cuentas atendidas</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{ventas ? ventas.numeroCuentas : 0}</p>
        </div>
      </div>

      {/* RF-26: ranking de platillos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-700">Platillos más vendidos</h2>
          </div>
          {masVendidos.length === 0 ? (
            <p className="p-4 text-sm text-gray-400">Sin ventas en el período seleccionado.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {masVendidos.map((p) => (
                  <tr key={p.platilloId}>
                    <td className="p-3 font-semibold text-gray-800">{p.nombre}</td>
                    <td className="p-3 text-right text-gray-600">{p.cantidadVendida} unid.</td>
                    <td className="p-3 text-right font-bold text-emerald-600">${p.totalVendido.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-700">Platillos menos vendidos</h2>
          </div>
          {menosVendidos.length === 0 ? (
            <p className="p-4 text-sm text-gray-400">Sin ventas en el período seleccionado.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {menosVendidos.map((p) => (
                  <tr key={p.platilloId}>
                    <td className="p-3 font-semibold text-gray-800">{p.nombre}</td>
                    <td className="p-3 text-right text-gray-600">{p.cantidadVendida} unid.</td>
                    <td className="p-3 text-right font-bold text-gray-700">${p.totalVendido.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* RF-27: distribucion por hora y dia */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-700">Ventas por hora del día</h2>
          </div>
          {horasConVentas.length === 0 ? (
            <p className="p-4 text-sm text-gray-400">Sin datos en el período seleccionado.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {horasConVentas.map((h) => (
                  <tr key={h.hora}>
                    <td className="p-3 font-semibold text-gray-800">{String(h.hora).padStart(2, '0')}:00</td>
                    <td className="p-3 text-right text-gray-600">{h.cantidadLineas} platillos</td>
                    <td className="p-3 text-right font-bold text-emerald-600">${h.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-700">Ventas por día de la semana</h2>
          </div>
          {diasConVentas.length === 0 ? (
            <p className="p-4 text-sm text-gray-400">Sin datos en el período seleccionado.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {diasConVentas.map((d) => (
                  <tr key={d.dia}>
                    <td className="p-3 font-semibold text-gray-800">{d.nombre || NOMBRES_DIA[d.dia]}</td>
                    <td className="p-3 text-right text-gray-600">{d.cantidadLineas} platillos</td>
                    <td className="p-3 text-right font-bold text-emerald-600">${d.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
