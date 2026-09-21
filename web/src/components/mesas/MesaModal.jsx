import { useState, useEffect } from 'react'
import { MOCK_SECCIONES, ESTADOS_MESA } from '@/services/mesasService'

export default function MesaModal({ isOpen, onClose, onSave, mesa }) {
  const [formData, setFormData] = useState({
    numero: '',
    capacidad: 4,
    seccion: MOCK_SECCIONES[0],
    estado: 'libre'
  })

  useEffect(() => {
    if (mesa) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        numero: mesa.numero || '',
        capacidad: mesa.capacidad || 4,
        seccion: mesa.seccion || MOCK_SECCIONES[0],
        estado: mesa.estado || 'libre'
      })
    } else {
      setFormData({
        numero: '',
        capacidad: 4,
        seccion: MOCK_SECCIONES[0],
        estado: 'libre'
      })
    }
  }, [mesa, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.numero) return

    onSave({
      ...formData,
      capacidad: parseInt(formData.capacidad, 10),
      id: mesa ? mesa.id : Date.now().toString()
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {mesa ? 'Editar Mesa' : 'Nueva Mesa'}
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
            <label className="block text-xs font-semibold text-gray-600 mb-1">Identificador / Nombre</label>
            <input
              type="text"
              required
              value={formData.numero}
              onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm"
              placeholder="Ej. Mesa 5, Barra 2, T-03..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Capacidad (personas)</label>
              <input
                type="number"
                min="1"
                required
                value={formData.capacidad}
                onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Sección</label>
              <select
                value={formData.seccion}
                onChange={(e) => setFormData({ ...formData, seccion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm bg-white"
              >
                {MOCK_SECCIONES.map((sec) => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Estado Actual</label>
            <select
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm bg-white"
            >
              {Object.entries(ESTADOS_MESA).map(([key, config]) => (
                <option key={key} value={key}>{config.etiqueta}</option>
              ))}
            </select>
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
              {mesa ? 'Guardar Cambios' : 'Crear Mesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}