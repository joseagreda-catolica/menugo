import { useState } from 'react'
import {
  registrarPago,
  dividirCuenta,
  cancelarDivisionCuenta,
  registrarPagoParte,
} from '@/Services/cajaService'
import FormularioPago from './FormularioPago'
import DividirCuenta from './DividirCuenta'

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`
const NOMBRE_FORMA = { efectivo: 'efectivo', tarjeta: 'tarjeta', otro: 'otro medio' }

// Detalle de la cuenta seleccionada: consumo, cobro completo o, si se dividio (RF-22),
// cobro parte por parte. Al pagar lo ultimo la cuenta se cierra y la mesa se libera.
export default function PanelCobro({ cuenta, onActualizar, onCuentaCerrada }) {
  const [dividiendo, setDividiendo] = useState(false)
  const [parteActivaId, setParteActivaId] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const total = Number(cuenta.total || 0)
  const lineas = (cuenta.sesionMesa?.pedidos || []).flatMap((p) => p.lineas || [])
  const partes = cuenta.divisiones || []
  const estaDividida = partes.length > 0
  const partesPagadas = partes.filter((p) => (p.pagos || []).length > 0)
  const parteActiva = partes.find((p) => p.id === parteActivaId)

  const ejecutar = async (accion) => {
    setError('')
    setMensaje('')
    setProcesando(true)
    try {
      await accion()
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo completar la operación.')
      await onActualizar()
    } finally {
      setProcesando(false)
    }
  }

  const cobrarTodo = (forma) =>
    ejecutar(async () => {
      await registrarPago(cuenta.id, forma)
      alert('¡Pago procesado con éxito! La mesa ha sido liberada.')
      onCuentaCerrada()
    })

  const dividir = (datos) =>
    ejecutar(async () => {
      await dividirCuenta(cuenta.id, datos)
      setDividiendo(false)
      await onActualizar()
    })

  const cancelarDivision = () =>
    ejecutar(async () => {
      await cancelarDivisionCuenta(cuenta.id)
      setParteActivaId(null)
      await onActualizar()
    })

  const cobrarParte = (forma) =>
    ejecutar(async () => {
      const resultado = await registrarPagoParte(cuenta.id, parteActiva.id, forma)
      if (resultado.cuentaCerrada) {
        alert('¡Pago procesado con éxito! La mesa ha sido liberada.')
        onCuentaCerrada()
        return
      }
      setMensaje(
        `${parteActiva.etiqueta} pagó ${dinero(parteActiva.monto)} en ${NOMBRE_FORMA[forma]}. ` +
          `Faltan ${resultado.partesPendientes} ${resultado.partesPendientes === 1 ? 'parte' : 'partes'}.`
      )
      setParteActivaId(null)
      await onActualizar()
    })

  return (
    <div className="space-y-5">
      <div className="bg-gray-50 p-4 rounded-xl space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Mesa:</span>
          <span className="font-bold text-gray-800">Mesa #{cuenta.sesionMesa?.mesa?.numero ?? 'S/N'}</span>
        </div>
        <div className="flex justify-between text-base font-bold">
          <span className="text-gray-700">Total a Pagar:</span>
          <span className="text-emerald-600 text-xl">{dinero(total)}</span>
        </div>
      </div>

      {lineas.length > 0 && (
        <details className="rounded-xl border border-gray-100 bg-white p-3 text-sm">
          <summary className="cursor-pointer text-xs font-bold uppercase text-gray-600">
            Consumo ({lineas.length} {lineas.length === 1 ? 'platillo' : 'platillos'})
          </summary>
          <ul className="mt-2 space-y-1">
            {lineas.map((linea) => (
              <li key={linea.id} className="flex justify-between gap-2 text-xs text-gray-700">
                <span className="min-w-0">
                  {linea.cantidad}x {linea.platillo?.nombre}
                </span>
                <span className="shrink-0 font-bold">{dinero(linea.cantidad * Number(linea.precioUnitario))}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700" role="alert">
          {error}
        </p>
      )}
      {mensaje && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700" role="status">
          {mensaje}
        </p>
      )}

      {estaDividida ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-gray-600">
              Cuenta dividida · {partesPagadas.length} de {partes.length} pagadas
            </h3>
            {partesPagadas.length === 0 && (
              <button
                type="button"
                disabled={procesando}
                onClick={cancelarDivision}
                className="text-xs font-semibold text-red-500 hover:text-red-700 cursor-pointer disabled:text-gray-300"
              >
                Cancelar división
              </button>
            )}
          </div>

          <ul className="space-y-2">
            {partes.map((parte) => {
              const pago = (parte.pagos || [])[0]
              const esActiva = parte.id === parteActivaId
              return (
                <li
                  key={parte.id}
                  className={`flex items-center justify-between gap-2 rounded-xl border p-3 text-sm ${
                    pago ? 'border-emerald-200 bg-emerald-50/60' : esActiva ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800">{parte.etiqueta}</p>
                    <p className="text-xs text-gray-500">
                      {pago ? `Pagada en ${NOMBRE_FORMA[pago.formaPago] || pago.formaPago}` : 'Pendiente'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-extrabold text-emerald-600">{dinero(parte.monto)}</span>
                    {!pago && (
                      <button
                        type="button"
                        disabled={procesando}
                        onClick={() => {
                          setParteActivaId(esActiva ? null : parte.id)
                          setMensaje('')
                        }}
                        className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-gray-700 cursor-pointer disabled:bg-gray-300"
                      >
                        {esActiva ? 'Cerrar' : 'Cobrar'}
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>

          {parteActiva && (
            <div className="rounded-xl border border-blue-200 bg-white p-4">
              <p className="mb-3 text-sm font-bold text-gray-800">
                Cobrar a {parteActiva.etiqueta}: {dinero(parteActiva.monto)}
              </p>
              <FormularioPago
                key={parteActiva.id}
                monto={Number(parteActiva.monto)}
                procesando={procesando}
                textoBoton={`Cobrar parte de ${parteActiva.etiqueta} ✅`}
                onConfirmar={cobrarParte}
              />
            </div>
          )}
        </div>
      ) : dividiendo ? (
        <DividirCuenta
          cuenta={cuenta}
          lineas={lineas}
          procesando={procesando}
          onConfirmar={dividir}
          onCancelar={() => setDividiendo(false)}
        />
      ) : (
        <>
          <FormularioPago
            key={cuenta.id}
            monto={total}
            procesando={procesando}
            textoBoton="Confirmar y Cerrar Cuenta ✅"
            onConfirmar={cobrarTodo}
          />
          <button
            type="button"
            disabled={procesando || total <= 0}
            onClick={() => {
              setDividiendo(true)
              setError('')
              setMensaje('')
            }}
            className="w-full cursor-pointer rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ✂️ Dividir cuenta
          </button>
        </>
      )}
    </div>
  )
}
