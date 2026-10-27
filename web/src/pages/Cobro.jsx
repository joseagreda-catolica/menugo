import { useState, useEffect, useCallback } from 'react'
import { obtenerCuentasPendientes } from '@/Services/cajaService'
import PanelCobro from '@/components/cobro/PanelCobro'

export default function Cobro() {
  const [cuentas, setCuentas] = useState([])
  const [seleccionadaId, setSeleccionadaId] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // Cargar cuentas pendientes gestionando las Promesas explícitamente para el Linter
  const cargarCuentas = useCallback(
    () =>
      obtenerCuentasPendientes()
        .then((data) => {
          setCuentas(data || [])
          setError(null)
        })
        .catch((err) => {
          console.error('Error al obtener cuentas pendientes:', err)
          setError('No se pudieron obtener las cuentas pendientes.')
        })
        .finally(() => setCargando(false)),
    []
  )

  // Refresco automático cada 10 segundos
  useEffect(() => {
    cargarCuentas()
    const interval = setInterval(cargarCuentas, 10000)
    return () => clearInterval(interval)
  }, [cargarCuentas])

  // La cuenta seleccionada se toma de la lista actual, así siempre refleja la división y los pagos.
  const cuentaSeleccionada = cuentas.find((c) => c.id === seleccionadaId) || null

  const seleccionar = (id) => {
    setSeleccionadaId(id)
    // En pantallas chicas el panel queda debajo de la lista: se lleva la vista hasta él.
    setTimeout(() => document.getElementById('panel-cobro')?.scrollIntoView({ behavior: 'smooth' }), 60)
  }

  const alCerrarCuenta = () => {
    setSeleccionadaId(null)
    cargarCuentas()
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Caja y Cobro 💵</h1>
          <p className="text-sm text-gray-500">Gestiona los pagos de las mesas pendientes de cobro.</p>
        </div>

        <button
          onClick={cargarCuentas}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
        >
          🔄 Actualizar cuentas
        </button>
      </div>

      {/* Estado de Carga */}
      {cargando && (
        <div className="py-20 text-center text-gray-400 font-medium animate-pulse">Cargando cuentas de la caja...</div>
      )}

      {/* Estado de Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={cargarCuentas} className="underline font-bold text-xs hover:text-red-800">
            Reintentar
          </button>
        </div>
      )}

      {/* Contenido principal */}
      {!cargando && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Listado de Mesas por Cobrar */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
              Cuentas Pendientes ({cuentas.length})
            </h2>

            {cuentas.length === 0 ? (
              <div className="py-16 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <span className="text-3xl block mb-2">✅</span>
                <p className="text-gray-500 text-sm font-medium">No hay cuentas pendientes por cobrar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cuentas.map((c) => {
                  const esSeleccionada = seleccionadaId === c.id
                  const partes = c.divisiones || []
                  const pagadas = partes.filter((p) => (p.pagos || []).length > 0).length
                  return (
                    <div
                      key={c.id}
                      onClick={() => seleccionar(c.id)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        esSeleccionada
                          ? 'bg-blue-50/50 border-blue-600 shadow-md ring-2 ring-blue-500/20'
                          : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-xs font-bold text-gray-400 uppercase">Mesa</span>
                          <h3 className="text-xl font-bold text-gray-800">#{c.sesionMesa?.mesa?.numero || 'S/N'}</h3>
                        </div>
                        <span className="text-lg font-extrabold text-emerald-600">${Number(c.total || 0).toFixed(2)}</span>
                      </div>

                      <div className="text-xs text-gray-500 space-y-0.5">
                        <p>Mesero: {c.sesionMesa?.mesero?.nombreCompleto || 'Sin asignar'}</p>
                        {c.sesionMesa?.numComensales ? <p>Comensales: {c.sesionMesa.numComensales}</p> : null}
                      </div>

                      {partes.length > 0 && (
                        <span className="mt-3 inline-block rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                          ✂️ Dividida · {pagadas} de {partes.length} pagadas
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Panel de Procesamiento de Pago */}
          <div id="panel-cobro" className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-fit space-y-6 scroll-mt-20">
            <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3">Detalle del Cobro</h2>

            {!cuentaSeleccionada ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                Selecciona una mesa de la lista para procesar el pago.
              </div>
            ) : (
              <PanelCobro
                key={cuentaSeleccionada.id}
                cuenta={cuentaSeleccionada}
                onActualizar={cargarCuentas}
                onCuentaCerrada={alCerrarCuenta}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
