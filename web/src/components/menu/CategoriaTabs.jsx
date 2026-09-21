export default function CategoriaTabs({
  categorias,
  categoriaActiva,
  onSelectCategoria,
  onNuevaCategoria
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4 mb-6">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelectCategoria('todas')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            categoriaActiva === 'todas'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todas
        </button>
        {categorias.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategoria(cat.id)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              categoriaActiva === cat.id
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      <button
        onClick={onNuevaCategoria}
        className="px-3 py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors flex items-center gap-1"
      >
        <span>+</span> Nueva Categoría
      </button>
    </div>
  )
}