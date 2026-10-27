import { useEffect, useRef, useState } from 'react'
import { obtenerPedidos } from '@/Services/pedidosService'

// Aviso al mesero cuando cocina marca un platillo como listo (RF-19): aparece una
// notificacion en cualquier pantalla, sin tener que abrir el pedido.
export default function AvisosCocina() {
  const [avisos, setAvisos] = useState([])
  const listosPrevios = useRef(null)
  const temporizadores = useRef([])

  useEffect(() => {
    let activo = true

    const revisar = () =>
      obtenerPedidos()
        .then((pedidos) => {
          if (!activo) return
          const listos = new Map()
          for (const pedido of pedidos) {
            for (const linea of pedido.lineas || []) {
              if (linea.estado === 'listo') {
                listos.set(
                  linea.id,
                  `Mesa ${pedido.sesionMesa?.mesa?.numero}: ${linea.cantidad}x ${linea.platillo?.nombre} está listo para servir`
                )
              }
            }
          }

          // La primera lectura solo toma nota de lo que ya estaba listo.
          if (listosPrevios.current) {
            const nuevos = [...listos]
              .filter(([id]) => !listosPrevios.current.has(id))
              .map(([id, texto]) => ({ id, texto }))
            if (nuevos.length > 0) {
              setAvisos((actuales) => [...actuales, ...nuevos])
              nuevos.forEach((nuevo) => {
                temporizadores.current.push(
                  setTimeout(() => setAvisos((actuales) => actuales.filter((a) => a.id !== nuevo.id)), 12000)
                )
              })
            }
          }
          listosPrevios.current = new Set(listos.keys())
        })
        .catch(() => {})

    revisar()
    const intervalo = setInterval(revisar, 4000)
    const pendientes = temporizadores.current
    return () => {
      activo = false
      clearInterval(intervalo)
      pendientes.forEach(clearTimeout)
    }
  }, [])

  if (avisos.length === 0) return null

  return (
    <div className="fixed right-3 top-20 z-[60] flex w-72 max-w-[calc(100vw-1.5rem)] flex-col gap-2" role="status" aria-live="polite">
      {avisos.map((aviso) => (
        <div
          key={aviso.id}
          className="flex items-start gap-2 rounded-xl bg-emerald-600 p-3 text-sm font-semibold text-white shadow-xl"
        >
          <span aria-hidden="true">🍽️</span>
          <span className="flex-1">{aviso.texto}</span>
          <button
            type="button"
            onClick={() => setAvisos((actuales) => actuales.filter((a) => a.id !== aviso.id))}
            aria-label="Cerrar aviso"
            className="cursor-pointer text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
