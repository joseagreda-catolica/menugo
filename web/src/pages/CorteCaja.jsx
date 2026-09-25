import { useState, useEffect, useCallback } from 'react'
import { getCorteCajaActual, realizarCorteCaja } from '@/Services/pedidosService'

export default function CorteCaja() {
  const [resumen, setResumen] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState(null)

  // Cargar el resumen de ventas del turno actual
  const cargarResumenTurno = useCallback(async () => {
    try {
      const data = await getCorteCajaActual()
      setResumen(data || null)
      setError(null)
    } catch (err) {
      console.error('Error al obtener el resumen de caja:', err)
      setError('No se pudo cargar el resumen del turno actual.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const obtenerDatos = async () => {
      try {
        const data = await getCorteCajaActual()
        if (isMounted) {
          setResumen(data || null)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error al obtener el resumen de caja:', err)
          setError('No se pudo cargar el resumen del turno actual.')
        }
      } finally {
        if (isMounted) setCargando(false)
      }
    }

    obtenerDatos()
  }, [])

  // Confirmar y realizar el cierre del turno
  const handleCerrarTurno = async () => {
    const confirmar = window.confirm(
      '¿Estás seguro de que deseas realizar el cierre de caja? Esta acción finalizará el turno actual.'
    )

    if (!confirmar) return

    try {
      setProcesando(true)
      await realizarCorteCaja()
      alert('¡Corte de caja realizado con éxito!')
      cargarResumenTurno()
    } catch (err) {
      console.error('Error al cerrar caja:', err)
      alert('No se pudo completar el cierre de caja. Revisa la consola o la conexión.')
    } finally {
      setProcesando(false)
    }
  }

  // Totales con valores por defecto
  const totalEfectivo = Number(resumen?.totalEfectivo || 0)
  const totalTarjeta = Number(resumen?.totalTarjeta || 0)
  const totalOtro = Number(resumen?.totalOtro || 0)
  const totalGeneral = Number(resumen?.totalGeneral || totalEfectivo + totalTarjeta + totalOtro)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Corte de Caja 📊</h1>
          <p className="text-sm text-gray-500">
            Resumen de ingresos del turno e historial de pagos procesados.
          </p>
        </div>

        <button
          onClick={cargarResumenTurno}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
        >
          🔄 Actualizar datos
        </button>
      </div>

      {/* Indicador de Carga */}
      {cargando && (
        <div className="py-20 text-center text-gray-400 font-medium animate-pulse">
          Calculando totales del turno...
        </div>
      )}

      {/* Mensaje de Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={cargarResumenTurno} className="underline font-bold text-xs hover:text-red-800">
            Reintentar
          </button>
        </div>
      )}

      {!cargando && !error && (
        <div className="space-y-6">
          {/* Tarjetas de Métodos de Pago */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase">💵 Efectivo</span>
              <p className="text-2xl font-extrabold text-gray-800">${totalEfectivo.toFixed(2)}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase">📱 Otros Métodos</span>
              <p className="text-2xl font-extrabold text-purple-600">${totalOtro.toFixed(2)}</p>
            </div>
          </div>

          {/* Banner de Total General */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-md">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Total Acumulado en Turno</span>
              <h2 className="text-3xl font-extrabold">${totalGeneral.toFixed(2)}</h2>
            </div>

            <button
              onClick={handleCerrarTurno}
              disabled={procesando || totalGeneral === 0}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-full md:w-auto"
            >
              {procesando ? 'Procesando Cierre...' : '🔒 Realizar Cierre de Turno'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}