export default function CarritoPedido({
  mesaSeleccionada,
  items,
  onUpdateCantidad,
  onRemoveItem,
  onUpdateNota,
  onEnviarComanda,
  onLimpiar
}) {
  const total = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col h-full">
      <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
        <div>
          <h2 className="font-bold text-gray-800 text-lg">Comanda Actual</h2>
          <p className="text-xs text-gray-500">
            {mesaSeleccionada ? `Mesa: ${mesaSeleccionada.numero}` : 'Selecciona una mesa'}
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={onLimpiar}
            className="text-xs text-red-500 hover:text-red-700 font-medium"
          >
            Vaciar
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {items.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm italic">
            El carrito está vacío
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-sm text-gray-800">{item.nombre}</span>
                <span className="font-bold text-sm text-orange-600">${(item.precio * item.cantidad).toFixed(2)}</span>
              </div>

              <input
                type="text"
                placeholder="Nota (ej. sin cebolla, salsa aparte...)"
                value={item.nota || ''}
                onChange={(e) => onUpdateNota(item.id, e.target.value)}
                className="w-full text-xs px-2 py-1 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
              />

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-gray-200">
                  <button
                    onClick={() => onUpdateCantidad(item.id, -1)}
                    className="text-gray-600 hover:text-orange-600 font-bold px-1 text-sm"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold w-4 text-center">{item.cantidad}</span>
                  <button
                    onClick={() => onUpdateCantidad(item.id, 1)}
                    className="text-gray-600 hover:text-orange-600 font-bold px-1 text-sm"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Quitar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-gray-100 pt-4 mt-4 space-y-3">
        <div className="flex justify-between items-center text-lg font-bold text-gray-800">
          <span>Total</span>
          <span className="text-orange-600">${total.toFixed(2)}</span>
        </div>

        <button
          onClick={onEnviarComanda}
          disabled={!mesaSeleccionada || items.length === 0}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold rounded-xl shadow-sm transition-colors text-sm"
        >
          Enviar a Cocina 🚀
        </button>
      </div>
    </div>
  )
}