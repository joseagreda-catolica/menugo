import { useState, useEffect, useMemo, useCallback } from 'react'
import { obtenerPedidos, actualizarEstadoLinea } from '@/Services/pedidosService'
import { obtenerConfiguracion, guardarUmbralEspera } from '@/Services/configuracionService'
import { useAuth } from '@/context/AuthContext'
import ComandaMesaCard from '@/components/cocina/ComandaMesaCard'

const FILTROS = ['todos', 'pendiente', 'en_preparacion', 'listo']
const EN_COCINA = ['pendiente', 'en_preparacion']

export default function Cocina() {
  const { usuario } = useAuth()
  const esAdmin = usuario?.rol === 'administrador'

  const [pedidos, setPedidos] = useState([])
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [ahora, setAhora] = useState(() => Date.now())
  const [umbral, setUmbral] = useState(15)
  const [umbralEditado, setUmbralEditado] = useState(null)
  const [guardandoUmbral, setGuardandoUmbral] = useState(false)
  const [mensajeUmbral, setMensajeUmbral] = useState('')

  const cargarPedidos = useCallback(() => {
    obtenerPedidos()
      .then((datos) => {
        setPedidos(datos)
        setAhora(Date.now())
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    cargarPedidos()
    // RNF-05: la comanda debe verse en cocina en menos de 5 segundos.
    // Polling cada 3s (sección 7.5 del documento).
    const intervalo = setInterval(cargarPedidos, 3000)
    return () => clearInterval(intervalo)
  }, [cargarPedidos])

  // El umbral lo cambia el administrador; el resto de roles lo relee cada 15 s.
  useEffect(() => {
    const cargarUmbral = () =>
      obtenerConfiguracion()
        .then((config) => {
          setUmbral(config.umbralEsperaMin)
          setUmbralEditado((actual) => (actual === null ? String(config.umbralEsperaMin) : actual))
        })
        .catch(console.error)
    cargarUmbral()
    const intervalo = setInterval(cargarUmbral, 15000)
    return () => clearInterval(intervalo)
  }, [])

  const handleCambiarEstado = (lineaId, nuevoEstado) => {
    actualizarEstadoLinea(lineaId, nuevoEstado)
      .then(cargarPedidos)
      .catch((err) => {
        console.error(err)
        alert(err.message)
      })
  }

  const handleGuardarUmbral = (e) => {
    e.preventDefault()
    setGuardandoUmbral(true)
    setMensajeUmbral('')
    guardarUmbralEspera(Number(umbralEditado))
      .then((config) => {
        setUmbral(config.umbralEsperaMin)
        setUmbralEditado(String(config.umbralEsperaMin))
        setMensajeUmbral('Guardado')
      })
      .catch((err) => setMensajeUmbral(err.message))
      .finally(() => setGuardandoUmbral(false))
  }

  // RF-17: una comanda por mesa, la mas antigua primero. Los filtros actuan sobre los
  // platillos; las mesas que se quedan sin platillos a la vista desaparecen.
  const comandas = useMemo(() => {
    const grupos = new Map()
    for (const pedido of pedidos) {
      if (pedido.estado !== 'abierto') continue
      for (const linea of pedido.lineas || []) {
        if (linea.estado === 'anulada' || linea.estado === 'entregado') continue
        if (filtroEstado !== 'todos' && linea.estado !== filtroEstado) continue

        if (!grupos.has(pedido.sesionMesaId)) {
          grupos.set(pedido.sesionMesaId, {
            clave: pedido.sesionMesaId,
            mesaNumero: pedido.sesionMesa?.mesa?.numero ?? '',
            lineas: [],
            desde: Infinity,
            desdeEnCocina: Infinity,
          })
        }
        const grupo = grupos.get(pedido.sesionMesaId)
        const creada = new Date(linea.creadaEn).getTime()
        grupo.lineas.push({
          id: linea.id,
          cantidad: linea.cantidad,
          nombre: linea.platillo?.nombre,
          nota: linea.notaPreparacion,
          estado: linea.estado,
        })
        grupo.desde = Math.min(grupo.desde, creada)
        if (EN_COCINA.includes(linea.estado)) grupo.desdeEnCocina = Math.min(grupo.desdeEnCocina, creada)
      }
    }
    return [...grupos.values()].sort((a, b) => a.desde - b.desde)
  }, [pedidos, filtroEstado])

  const atrasadas = comandas.filter(
    (c) => Number.isFinite(c.desdeEnCocina) && (ahora - c.desdeEnCocina) / 60000 >= umbral
  ).length

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pantalla de Cocina 👨‍🍳</h1>
          <p className="text-sm text-gray-500">
            Comandas por mesa, de la más antigua a la más reciente. Se destacan las que llevan más de{' '}
            <strong>{umbral} min</strong> esperando.
          </p>
        </div>

        {/* Filtros de estado */}
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((est) => (
            <button
              key={est}
              onClick={() => setFiltroEstado(est)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                filtroEstado === est ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {est.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {atrasadas > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          ⚠ {atrasadas} {atrasadas === 1 ? 'comanda atrasada' : 'comandas atrasadas'}
        </div>
      )}

      {/* RF-20: el administrador define el umbral de espera */}
      {esAdmin && (
        <form
          onSubmit={handleGuardarUmbral}
          className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <div>
            <label htmlFor="umbral" className="mb-1 block text-xs font-semibold text-gray-600">
              Tiempo de espera máximo (minutos)
            </label>
            <input
              id="umbral"
              type="number"
              min="1"
              max="240"
              step="1"
              value={umbralEditado ?? ''}
              onChange={(e) => setUmbralEditado(e.target.value)}
              className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={guardandoUmbral}
            className="cursor-pointer rounded-lg bg-gray-800 px-4 py-2 text-sm font-bold text-white hover:bg-gray-900 disabled:bg-gray-300"
          >
            {guardandoUmbral ? 'Guardando...' : 'Guardar'}
          </button>
          {mensajeUmbral && <span className="text-xs font-semibold text-gray-500">{mensajeUmbral}</span>}
        </form>
      )}

      {comandas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-20 text-center">
          <span className="mb-2 block text-4xl">🍽️</span>
          <p className="text-sm font-medium text-gray-500">No hay comandas activas en cocina.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {comandas.map((comanda) => (
            <ComandaMesaCard
              key={comanda.clave}
              comanda={comanda}
              ahora={ahora}
              umbralMin={umbral}
              onCambiarEstado={handleCambiarEstado}
            />
          ))}
        </div>
      )}
    </div>
  )
}
