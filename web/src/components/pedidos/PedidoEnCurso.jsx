import { useState, useEffect, useCallback } from 'react'
import {
  obtenerPedidos,
  modificarLinea,
  actualizarEstadoLinea,
  anularPedido,
} from '@/Services/pedidosService'

const ETIQUETAS = {
  pendiente: { texto: 'Pendiente', clase: 'bg-amber-100 text-amber-800' },
  en_preparacion: { texto: 'En preparación', clase: 'bg-blue-100 text-blue-800' },
  listo: { texto: 'Listo para servir', clase: 'bg-emerald-100 text-emerald-800' },
  entregado: { texto: 'Entregado', clase: 'bg-gray-200 text-gray-600' },
}

const dinero = (valor) => `$${Number(valor).toFixed(2)}`

// Pedido ya enviado de la mesa seleccionada: el mesero ve el estado de cada platillo,
// puede cambiar o quitar los que aun no empiezan a prepararse (RF-15), marcar como
// entregados los que estan listos y anular el pedido completo con motivo (RF-16).
export default function PedidoEnCurso({ mesa, refrescar }) {
  const [pedidos, setPedidos] = useState([])
  const [error, setError] = useState('')
  const [anulandoId, setAnulandoId] = useState(null)
  const [motivo, setMotivo] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const cargar = useCallback(() => {
    if (!mesa) return Promise.resolve()
    return obtenerPedidos()
      .then((todos) => setPedidos(todos.filter((p) => p.sesionMesa?.mesaId === mesa.id)))
      .catch(console.error)
  }, [mesa])

  useEffect(() => {
    cargar()
    const intervalo = setInterval(cargar, 4000)
    return () => clearInterval(intervalo)
  }, [cargar, refrescar])

  const ejecutar = async (accion) => {
    setError('')
    setOcupado(true)
    try {
      await accion()
      await cargar()
    } catch (err) {
      setError(err.message)
      await cargar()
    } finally {
      setOcupado(false)
    }
  }

  const cambiarCantidad = (linea, nueva) => ejecutar(() => modificarLinea(linea.id, { cantidad: nueva }))

  const quitar = (linea) => {
    if (!window.confirm(`¿Quitar ${linea.platillo?.nombre || 'este platillo'} del pedido?`)) return
    ejecutar(() => actualizarEstadoLinea(linea.id, 'anulada'))
  }

  const confirmarAnulacion = (pedido) => {
    if (!motivo.trim()) {
      setError('Escribe el motivo de la anulación.')
      return
    }
    ejecutar(async () => {
      await anularPedido(pedido.id, motivo.trim())
      setAnulandoId(null)
      setMotivo('')
    })
  }

  if (!mesa || pedidos.length === 0) return null

  return (
    <div className="space-y-4 rounded-2xl border border-orange-200 bg-orange-50/40 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-800">Pedido en curso · Mesa {mesa.numero}</h2>
        <span className="text-xs text-gray-500">Se actualiza solo</span>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>
      )}

      {pedidos.map((pedido) => {
        const lineas = (pedido.lineas || []).filter((l) => l.estado !== 'anulada')
        const total = lineas.reduce((suma, l) => suma + l.cantidad * Number(l.precioUnitario), 0)

        return (
          <div key={pedido.id} className="space-y-3 rounded-xl border border-gray-100 bg-white p-3">
            <ul className="space-y-2">
              {lineas.map((linea) => {
                const etiqueta = ETIQUETAS[linea.estado] || ETIQUETAS.pendiente
                return (
                  <li
                    key={linea.id}
                    className={`rounded-lg border p-2.5 ${
                      linea.estado === 'listo' ? 'border-emerald-300 bg-emerald-50' : 'border-gray-100 bg-gray-50'
                    } ${linea.estado === 'entregado' ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 text-sm font-semibold text-gray-800">
                        <span className="mr-1.5 rounded bg-gray-200 px-1.5 py-0.5 text-xs font-extrabold">
                          {linea.cantidad}x
                        </span>
                        {linea.platillo?.nombre}
                        {linea.notaPreparacion && (
                          <p className="mt-1 text-xs font-normal italic text-amber-700">"{linea.notaPreparacion}"</p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${etiqueta.clase}`}>
                          {etiqueta.texto}
                        </span>
                        <span className="text-xs font-bold text-orange-600">
                          {dinero(linea.cantidad * Number(linea.precioUnitario))}
                        </span>
                      </div>
                    </div>

                    {linea.estado === 'pendiente' && (
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1">
                          <button
                            type="button"
                            disabled={ocupado || linea.cantidad <= 1}
                            onClick={() => cambiarCantidad(linea, linea.cantidad - 1)}
                            aria-label="Disminuir cantidad"
                            className="cursor-pointer px-1 text-sm font-bold text-gray-600 hover:text-orange-600 disabled:cursor-not-allowed disabled:text-gray-300"
                          >
                            −
                          </button>
                          <span className="w-5 text-center text-xs font-bold">{linea.cantidad}</span>
                          <button
                            type="button"
                            disabled={ocupado || linea.cantidad >= 99}
                            onClick={() => cambiarCantidad(linea, linea.cantidad + 1)}
                            aria-label="Aumentar cantidad"
                            className="cursor-pointer px-1 text-sm font-bold text-gray-600 hover:text-orange-600 disabled:cursor-not-allowed disabled:text-gray-300"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          disabled={ocupado}
                          onClick={() => quitar(linea)}
                          className="cursor-pointer text-xs font-medium text-red-500 hover:text-red-700 disabled:text-gray-300"
                        >
                          Quitar
                        </button>
                      </div>
                    )}

                    {linea.estado === 'en_preparacion' && (
                      <p className="mt-2 text-[11px] text-gray-500">En cocina: ya no se puede modificar.</p>
                    )}

                    {linea.estado === 'listo' && (
                      <button
                        type="button"
                        disabled={ocupado}
                        onClick={() => ejecutar(() => actualizarEstadoLinea(linea.id, 'entregado'))}
                        className="mt-2 w-full cursor-pointer rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:bg-gray-300"
                      >
                        ¡Listo! Marcar entregado 🍽️
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>

            <div className="flex items-center justify-between border-t border-gray-100 pt-2">
              <span className="text-sm font-bold text-gray-800">Total del pedido</span>
              <span className="text-sm font-bold text-orange-600">{dinero(total)}</span>
            </div>

            {anulandoId === pedido.id ? (
              <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
                <label htmlFor={`motivo-${pedido.id}`} className="block text-xs font-semibold text-red-700">
                  Motivo de la anulación (obligatorio)
                </label>
                <input
                  id={`motivo-${pedido.id}`}
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej. el cliente se retiró"
                  className="w-full rounded-md border border-red-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-400"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={ocupado}
                    onClick={() => confirmarAnulacion(pedido)}
                    className="flex-1 cursor-pointer rounded-lg bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:bg-gray-300"
                  >
                    Confirmar anulación
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAnulandoId(null)
                      setMotivo('')
                      setError('')
                    }}
                    className="flex-1 cursor-pointer rounded-lg border border-gray-300 bg-white py-2 text-xs font-bold text-gray-600 hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAnulandoId(pedido.id)
                  setError('')
                }}
                className="w-full cursor-pointer rounded-lg border border-red-200 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
              >
                Anular pedido
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
