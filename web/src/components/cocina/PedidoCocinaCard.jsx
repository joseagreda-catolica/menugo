const configEstado = {
  pendiente: {
    borde: 'border-amber-300 bg-amber-50/30',
    badge: 'bg-amber-100 text-amber-800',
    etiqueta: 'Pendiente',
    siguiente: 'en_preparacion',
    btnTexto: 'Empezar Preparación 🍳',
    btnColor: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  en_preparacion: {
    borde: 'border-blue-300 bg-blue-50/30',
    badge: 'bg-blue-100 text-blue-800',
    etiqueta: 'En Preparación',
    siguiente: 'listo',
    btnTexto: 'Marcar Listo 🍏',
    btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  listo: {
    borde: 'border-emerald-400 bg-emerald-50/30',
    badge: 'bg-emerald-100 text-emerald-800',
    etiqueta: 'Listo para Servir',
    siguiente: 'entregado',
    btnTexto: 'Marcar Entregado 🍽️',
    btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  entregado: {
    borde: 'border-gray-300 bg-gray-50 opacity-60',
    badge: 'bg-gray-200 text-gray-600',
    etiqueta: 'Entregado',
    siguiente: null,
    btnTexto: 'Completado',
    btnColor: 'bg-gray-300 text-gray-600 cursor-not-allowed',
  },
}

export default function PedidoCocinaCard({ pedido, onCambiarEstado }) {
  const config = configEstado[pedido.estado] || configEstado.pendiente
  const item = pedido.items?.[0] || {}

  return (
    <div className={`rounded-2xl border p-5 flex flex-col justify-between shadow-sm transition-all ${config.borde}`}>
      <div>
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200/60">
          <span className="font-bold text-gray-800 text-lg">{pedido.mesaNumero}</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${config.badge}`}>
            {config.etiqueta}
          </span>
        </div>

        {/* Detalle del platillo */}
        <div className="py-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span className="bg-gray-200/80 px-2 py-0.5 rounded text-xs text-gray-900 font-extrabold">
              {item.cantidad}x
            </span>
            <span>{item.nombre || 'Platillo'}</span>
          </div>

          {item.nota && (
            <p className="text-amber-700 italic text-xs mt-2 ml-7 bg-amber-50/80 p-2 rounded-lg border border-amber-200/60">
              "{item.nota}"
            </p>
          )}
        </div>
      </div>

      {/* Botón de acción */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        {config.siguiente ? (
          <button
            onClick={() => onCambiarEstado(pedido.id, config.siguiente)}
            className={`w-full py-2 px-4 rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer ${config.btnColor}`}
          >
            {config.btnTexto}
          </button>
        ) : (
          <button
            disabled
            className={`w-full py-2 px-4 rounded-xl font-bold text-xs ${config.btnColor}`}
          >
            {config.btnTexto}
          </button>
        )}
      </div>
    </div>
  )
}