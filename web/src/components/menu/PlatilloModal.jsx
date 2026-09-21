import { useState, useEffect } from 'react'

export default function PlatilloModal({ isOpen, onClose, onSave, platillo, categorias }) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoriaId: '',
    imagen: '',
    disponible: true
  })

  useEffect(() => {
    if (platillo) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        nombre: platillo.nombre || '',
        descripcion: platillo.descripcion || '',
        precio: platillo.precio || '',
        categoriaId: platillo.categoriaId || (categorias[0]?.id || ''),
        imagen: platillo.imagen || '',
        disponible: platillo.disponible ?? true
      })
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        categoriaId: categorias[0]?.id || '',
        imagen: '',
        disponible: true
      })
    }
  }, [platillo, categorias, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.nombre || !formData.precio || !formData.categoriaId) return

    onSave({
      ...formData,
      precio: parseFloat(formData.precio),
      imagen: formData.imagen || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      id: platillo ? platillo.id : Date.now().toString()
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {platillo ? 'Editar Platillo' : 'Nuevo Platillo'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 font-bold text-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm"
              placeholder="Ej. Hamburguesa Doble"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Precio ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Categoría</label>
              <select
                value={formData.categoriaId}
                onChange={(e) => setFormData({ ...formData, categoriaId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm bg-white"
              >
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">URL de Imagen</label>
            <input
              type="url"
              value={formData.imagen}
              onChange={(e) => setFormData({ ...formData, imagen: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
            <textarea
              rows="3"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm resize-none"
              placeholder="Ingredientes o detalles..."
            ></textarea>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="disponible"
              checked={formData.disponible}
              onChange={(e) => setFormData({ ...formData, disponible: e.target.checked })}
              className="rounded text-orange-500 focus:ring-orange-500"
            />
            <label htmlFor="disponible" className="text-sm text-gray-700 font-medium">
              Disponible para venta
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
            >
              {platillo ? 'Guardar Cambios' : 'Crear Platillo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}