import { useState, useEffect, useCallback } from 'react'
import { getCuentasPendientes, registrarPagoCuenta } from '@/Services/pedidosService'

export default function Cobro() {
  const [cuentas, setCuentas] = useState([])
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null)
  const [formaPago, setFormaPago] = useState('efectivo')
  const [montoEntregado, setMontoEntregado] = useState('')
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState(null)

  // Función para recargar cuentas desde el Backend
  const cargarCuentas = useCallback(async () => {
    try {
      const data = await getCuentasPendientes()
      setCuentas(data || [])
      setError(null)
    } catch (err) {
      console.error('Error al obtener cuentas pendientes:', err)
      setError('No se pudieron obtener las cuentas pendientes.')
    } finally {
      setCargando(false)
    }
  }, [])

  // Carga inicial y refresco automático seguro
  useEffect(() => {
    let isMounted = true

    const obtenerDatos = async () => {
      try {
        const data = await getCuentasPendientes()
        if (isMounted) {
          setCuentas(data || [])
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error al obtener cuentas pendientes:', err)
          setError('No se pudieron obtener las cuentas pendientes.')
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

  // Cálculos financieros
  const totalCuenta = Number(cuentaSeleccionada?.total || 0)
  const efectivoRecibido = Number(montoEntregado || 0)
  const cambio = formaPago === 'efectivo' ? Math.max(0, efectivoRecibido - totalCuenta) : 0

  // Procesar cobro en el backend
  const handleProcesarPago = async (e) => {
    e.preventDefault()
    if (!cuentaSeleccionada) return

    if (formaPago === 'efectivo' && efectivoRecibido < totalCuenta) {
      alert('El monto ingresado es inferior al total de la cuenta.')
      return
    }

    try {
      setProcesando(true)
      await registrarPagoCuenta({
        cuentaId: cuentaSeleccionada.id,
        formaPago,
        monto: totalCuenta,
      })

      alert('¡Pago procesado con éxito!')
      setCuentaSeleccionada(null)
      setMontoEntregado('')
      cargarCuentas()
    } catch (err) {
      console.error('Error al procesar pago:', err)
      alert('No se pudo registrar el pago. Revisa la consola o la conexión.')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Caja y Cobro 💵</h1>
          <p className="text-sm text-gray-500">
            Gestiona los pagos de las mesas pendientes de cobro.
          </p>
        </div>

        <button
          onClick={cargarCuentas}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
        >
          🔄 Actualizar cuentas
        </button>
      </div>

      {/* Carga y Errores */}
      {cargando && (
        <div className="py-20 text-center text-gray-400 font-medium animate-pulse">
          Cargando cuentas de la caja...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={cargarCuentas} className="underline font-bold text-xs hover:text-red-800">
            Reintentar
          </button>
        </div>
      )}

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
                  const esSeleccionada = cuentaSeleccionada?.id === c.id
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setCuentaSeleccionada(c)
                        setMontoEntregado('')
                      }}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        esSeleccionada
                          ? 'bg-blue-50/50 border-blue-600 shadow-md ring-2 ring-blue-500/20'
                          : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-xs font-bold text-gray-400 uppercase">Mesa</span>
                          <h3 className="text-xl font-bold text-gray-800">
                            #{c.sesionMesa?.mesa?.numero || 'S/N'}
                          </h3>
                        </div>
                        <span className="text-lg font-extrabold text-emerald-600">
                          ${Number(c.total || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="text-xs text-gray-500 space-y-0.5">
                        <p>Mesero: {c.sesionMesa?.mesero?.nombreCompleto || 'Sin asignar'}</p>
                        <p>Comensales: {c.sesionMesa?.numComensales || 1}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Panel de Procesamiento de Pago */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-fit space-y-6">
            <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3">
              Detalle del Cobro
            </h2>

            {!cuentaSeleccionada ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                Selecciona una mesa de la lista para procesar el pago.
              </div>
            ) : (
              <form onSubmit={handleProcesarPago} className="space-y-5">
                {/* Info de la cuenta */}
                <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Mesa:</span>
                    <span className="font-bold text-gray-800">
                      Mesa #{cuentaSeleccionada.sesionMesa?.mesa?.numero}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold">
                    <span className="text-gray-700">Total a Pagar:</span>
                    <span className="text-emerald-600 text-xl">${totalCuenta.toFixed(2)}</span>
                  </div>
                </div>

                {/* Forma de Pago (Ajustado a 2 opciones y 2 columnas) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 uppercase">Forma de Pago</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'efectivo', label: '💵 Efectivo' },
                      { id: 'otro', label: '📱 Otro' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setFormaPago(m.id)}
                        className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          formaPago === m.id
                            ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ingreso de Efectivo / Cambio */}
                {formaPago === 'efectivo' && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                        Efectivo Recibido ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min={totalCuenta}
                        placeholder={totalCuenta.toFixed(2)}
                        value={montoEntregado}
                        onChange={(e) => setMontoEntregado(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800 text-lg"
                        required
                      />
                    </div>

                    <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl text-emerald-800 text-sm font-bold">
                      <span>Cambio:</span>
                      <span className="text-lg">${cambio.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Botón de Confirmación */}
                <button
                  type="submit"
                  disabled={procesando}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {procesando ? 'Procesando Pago...' : 'Confirmar y Cerrar Cuenta ✅'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}