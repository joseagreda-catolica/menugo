import { useState, useEffect } from 'react'
import {
  obtenerCategorias,
  obtenerPlatillos,
  actualizarDisponibilidad,
} from '../Services/MenuService'

export default function MenuAdmin() {
  const [categorias, setCategorias] = useState([])
  const [platillos, setPlatillos] = useState([])
  const [cargando, setCargando] = useState(true)

  // Carga inicial
  useEffect(() => {
    let montado = true

    const cargarDatosIniciales = async () => {
      try {
        const [cats, plats] = await Promise.all([
          obtenerCategorias(),
          obtenerPlatillos(),
        ])

        if (montado) {
          const listaCategorias = Array.isArray(cats) ? cats : cats?.data || []
          const listaPlatillos = Array.isArray(plats) ? plats : plats?.data || []

          // Normalización para garantizar que 'disponible' sea siempre booleano
          const platillosNormalizados = listaPlatillos.map((p) => ({
            ...p,
            id: p.id || p._id,
            disponible: typeof p.disponible === 'boolean' ? p.disponible : p.disponible ?? true,
          }))

          setCategorias(listaCategorias)
          setPlatillos(platillosNormalizados)
        }
      } catch (error) {
        if (montado) {
          console.error('Error al cargar datos del menú:', error)
        }
      } finally {
        if (montado) {
          setCargando(false)
        }
      }
    }

    cargarDatosIniciales()

    return () => {
      montado = false
    }
  }, [])

  // Cambiar disponibilidad con actualización instantánea (Optimistic UI)
  const handleToggleDisponibilidad = async (id, estadoActual) => {
    const nuevoEstado = !estadoActual

    // 1. Actualización inmediata en pantalla (sin esperar al servidor)
    setPlatillos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, disponible: nuevoEstado } : p))
    )

    try {
      // 2. Notificar al backend
      await actualizarDisponibilidad(id, nuevoEstado)
    } catch (err) {
      console.error('Error al actualizar disponibilidad en BD:', err)
      
      // 3. Revertir si hubo error en el servidor
      setPlatillos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, disponible: estadoActual } : p))
      )
      alert('No se pudo guardar el cambio de disponibilidad en el servidor.')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Administración del Menú
          </h1>
          <p className="text-sm text-gray-500">
            Gestiona la disponibilidad de platillos en tiempo real.
          </p>
        </div>
      </div>

      {cargando ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          Cargando catálogo desde la base de datos...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Categorías */}
          <section className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
            <h2 className="text-sm font-bold mb-3 text-gray-800">
              Categorías Activas ({categorias.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {categorias.map((cat) => (
                <span
                  key={cat.id}
                  className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-semibold text-gray-700 border border-gray-200"
                >
                  {cat.nombre}
                </span>
              ))}
              {categorias.length === 0 && (
                <p className="text-xs text-gray-400">
                  No hay categorías registradas.
                </p>
              )}
            </div>
          </section>

          {/* Platillos */}
          <section className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <h2 className="text-sm font-bold mb-4 text-gray-800">
              Disponibilidad de Platillos ({platillos.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {platillos.map((platillo) => (
                <div
                  key={platillo.id}
                  className="p-3 border border-gray-100 rounded-xl flex items-center justify-between gap-3 bg-gray-50/50 hover:bg-white hover:shadow-xs transition-all"
                >
                  {/* Imagen y Detalle */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {(platillo.fotoUrl || platillo.imagen) && (
                      <img
                        src={platillo.fotoUrl || platillo.imagen}
                        alt={platillo.nombre}
                        className="w-12 h-12 rounded-lg object-cover shrink-0 bg-gray-200"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-gray-900 truncate">
                        {platillo.nombre}
                      </p>
                      <p className="text-xs font-bold text-orange-600 mt-0.5">
                        $
                        {typeof platillo.precio === 'number'
                          ? platillo.precio.toFixed(2)
                          : platillo.precio}
                      </p>
                    </div>
                  </div>

                  {/* Switch/Botón de Estado */}
                  <button
                    onClick={() =>
                      handleToggleDisponibilidad(
                        platillo.id,
                        platillo.disponible
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border shrink-0 ${
                      platillo.disponible
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
                    }`}
                  >
                    {platillo.disponible ? 'Disponible' : 'Agotado'}
                  </button>
                </div>
              ))}

              {platillos.length === 0 && (
                <p className="text-xs text-gray-400 col-span-full text-center py-6">
                  No hay platillos registrados en la base de datos.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}