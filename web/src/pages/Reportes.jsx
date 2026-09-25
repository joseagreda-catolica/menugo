import { useState, useEffect } from 'react'
import { obtenerPlatillos } from '../Services/MenuService'

export default function Reportes() {
  const [platillos, setPlatillos] = useState([])
  const [cargando, setCargando] = useState(true)

  // Carga inicial al montar el componente
  useEffect(() => {
    let activo = true

    const cargarInicial = async () => {
      try {
        const data = await obtenerPlatillos()
        if (activo) setPlatillos(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error al cargar platillos en reportes:', error)
        if (activo) setPlatillos([])
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargarInicial()

    return () => {
      activo = false
    }
  }, [])

  // Función para recargar mediante el botón "Actualizar"
  const handleActualizar = async () => {
    setCargando(true)
    try {
      const data = await obtenerPlatillos()
      setPlatillos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error al cargar platillos en reportes:', error)
      setPlatillos([])
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            Reportes de Menú 📋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Resumen global de platillos disponibles y configuración del catálogo.
          </p>
        </div>
        <button
          onClick={handleActualizar}
          disabled={cargando}
          className="border-2 border-black font-semibold py-2 px-4 rounded-xl flex items-center gap-2 hover:bg-gray-100 transition-all text-sm"
        >
          🔄 {cargando ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Total Platillos
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{platillos.length}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Platillos Disponibles
          </p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">
            {platillos.filter((p) => p.disponible !== false).length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Precio Promedio
          </p>
          <p className="text-3xl font-bold text-blue-600 mt-1">
            $
            {platillos.length > 0
              ? (
                  platillos.reduce((acc, p) => acc + Number(p.precio || 0), 0) /
                  platillos.length
                ).toFixed(2)
              : '0.00'}
          </p>
        </div>
      </div>

      {/* Tabla Detallada */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-gray-700">Catálogo de Platillos</h2>
          <span className="text-xs text-gray-400">
            {platillos.length} {platillos.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {cargando ? (
          <div className="p-8 text-center text-gray-500 font-medium">
            Cargando reporte de platillos...
          </div>
        ) : platillos.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No se encontraron platillos registrados en el sistema.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold text-gray-500 border-b border-gray-100 uppercase tracking-wider">
                  <th className="p-4">Platillo</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Precio</th>
                  <th className="p-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {platillos.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-semibold text-gray-800">{item.nombre}</td>
                    <td className="p-4 text-gray-600">
                      {item.categoria?.nombre || item.categoria || 'Sin Categoría'}
                    </td>
                    <td className="p-4 font-bold text-gray-900">
                      ${Number(item.precio || 0).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          item.disponible !== false
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {item.disponible !== false ? 'Disponible' : 'Agotado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}