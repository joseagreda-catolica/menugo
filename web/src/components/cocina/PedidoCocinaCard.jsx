export default function PedidoCocinaCard({ pedido, onCambiarEstado }) {
  // Configuración visual según el estado del pedido
  const configEstado = {
    pendiente: {
      borde: 'border-amber-400 bg-amber-50/30',
      badge: 'bg-amber-100 text-amber-800',
      etiqueta: 'Pendiente',
      siguiente: 'en_preparacion',
      btnTexto: 'Empezar Preparación 🍳',
      btnColor: 'bg-amber-500 hover:bg-amber-600 text-white'
    },
    en_preparacion: {
      borde: 'border-blue-400 bg-blue-50/30',
      badge: 'bg-blue-100 text-blue-800',
      etiqueta: 'En Preparación',
      siguiente: 'listo',
      btnTexto: 'Marcar Listo 🛎️',
      btnColor: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    listo: {
      borde: 'border-emerald-400 bg-emerald-50/30 opacity-75',
      badge: 'bg-emerald-100 text-emerald-800',
      etiqueta: 'Listo para Servir',
      siguiente: null,
      btnTexto: 'Completado',
      btnColor: 'bg-gray-300 text-gray-600 cursor-not-allowed'
    }
  }[pedido.estado] || configEstado?.pendiente

  return (
    <div className={`rounded-2xl border-2 p-5 shadow-sm flex flex-col justify-between h-full bg-white transition-all ${configEstado.borde}`}>
      <div>
        {/* Cabecera de la Comanda */}
        <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {pedido.id}
            </span>
            <h3 className="text-xl font-black text-gray-800">{pedido.mesaNumero}</h3>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${configEstado.badge}`}>
            {configEstado.etiqueta}
          </span>
        </div>

        {/* Lista de Platillos */}
        <div className="space-y-3 my-2">
          {pedido.items.map((item, idx) => (
            <div key={idx} className="flex flex-col border-b border-gray-50 pb-2">
              <div className="flex justify-between items-center font-bold text-gray-800 text-sm">
                <span><strong className="text-orange-600 text-base">{item.cantidad}x</strong> {item.nombre}</span>
              </div>
              {item.nota && (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-md mt-1 self-start">
                  ⚠️ Nota: {item.nota}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Botón de Acción / Avance de Estado */}
      <div className="pt-4 border-t border-gray-100 mt-3">
        <button
          onClick={() => configEstado.siguiente && onCambiarEstado(pedido.id, configEstado.siguiente)}
          disabled={!configEstado.siguiente}
          className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors shadow-xs ${configEstado.btnColor}`}
        >
          {configEstado.btnTexto}
        </button>
      </div>
    </div>
  )
}