export default function PlatilloCard({ platillo, onEditar, onToggleEstado, onEliminar }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="relative h-44 w-full bg-gray-100">
        <img
          src={platillo.imagen}
          alt={platillo.nombre}
          className={`w-full h-full object-cover ${!platillo.disponible ? 'grayscale' : ''}`}
        />
        <span
          className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full ${
            platillo.disponible
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {platillo.disponible ? 'Disponible' : 'Agotado'}
        </span>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold text-gray-800 text-lg">{platillo.nombre}</h3>
            <span className="font-bold text-orange-600 text-lg">${platillo.precio.toFixed(2)}</span>
          </div>
          <p className="text-gray-500 text-sm line-clamp-2 mb-4">{platillo.descripcion}</p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 gap-1">
          <button
            onClick={() => onToggleEstado(platillo.id)}
            className="text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-md transition-colors"
          >
            {platillo.disponible ? 'Agotado' : 'Disponible'}
          </button>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEditar(platillo)}
              className="text-xs font-medium text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1.5 rounded-md transition-colors"
            >
              Editar
            </button>
            <button
              onClick={() => onEliminar(platillo.id)}
              className="text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-md transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}