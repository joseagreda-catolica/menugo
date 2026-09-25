const configEstadoLinea = {
  pendiente: {
    label: 'Pendiente',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    siguienteEstado: 'en_preparacion',
    btnTexto: 'Preparar 🍳',
  },
  en_preparacion: {
    label: 'En Preparación',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    siguienteEstado: 'listo',
    btnTexto: 'Listo 🍏',
  },
  listo: {
    label: 'Listo',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    btnClass: 'bg-gray-700 hover:bg-gray-800 text-white',
    siguienteEstado: 'entregado',
    btnTexto: 'Entregar 🍽️',
  },
  entregado: {
    label: 'Entregado',
    badgeClass: 'bg-gray-100 text-gray-500 border-gray-200',
    btnClass: '',
    siguienteEstado: null,
    btnTexto: 'Entregado ✅',
  },
}

export default function PedidoCocinaCard({ pedido, onCambiarEstadoLinea }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between">
      <div>
        {/* Encabezado de la Mesa */}
        <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">
              Mesa {pedido?.sesionMesa?.mesa?.numero || 'S/N'}
            </h3>
            <p className="text-xs text-gray-500">
              Mesero: {pedido?.mesero?.nombreCompleto || 'Sin asignar'}
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
            Comanda #{pedido.id}
          </span>
        </div>

        {/* Lista de Platillos (PedidoLinea) */}
        <div className="divide-y divide-gray-100 my-2">
          {pedido?.lineas?.map((linea) => {
            const config = configEstadoLinea[linea.estado] || configEstadoLinea.pendiente

            return (
              <div key={linea.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-extrabold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">
                      {linea.cantidad}x
                    </span>
                    <span className="text-gray-800 font-medium">
                      {linea.platillo?.nombre || 'Platillo'}
                    </span>
                  </div>
                  {linea.notaPreparacion && (
                    <p className="text-amber-600 italic text-[11px] mt-0.5 ml-6">
                      "{linea.notaPreparacion}"
                    </p>
                  )}
                </div>

                {/* Acción según el estado del platillo */}
                {config.siguienteEstado ? (
                  <button
                    onClick={() => onCambiarEstadoLinea(linea.id, config.siguienteEstado)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${config.btnClass}`}
                  >
                    {config.btnTexto}
                  </button>
                ) : (
                  <span className={`px-2 py-1 rounded-lg text-[11px] font-bold border ${config.badgeClass}`}>
                    {config.label}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}