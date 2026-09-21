import { useState } from 'react'
import { MOCK_CATEGORIAS, MOCK_PLATILLOS } from '@/Services/MenuService'
import CategoriaTabs from '@/components/menu/CategoriaTabs'
import PlatilloCard from '@/components/menu/PlatilloCard'
import PlatilloModal from '@/components/menu/PlatilloModal'
import CategoriaModal from '@/components/menu/CategoriaModal'

export default function MenuAdmin() {
  const [categorias, setCategorias] = useState(MOCK_CATEGORIAS)
  const [platillos, setPlatillos] = useState(MOCK_PLATILLOS)
  const [categoriaActiva, setCategoriaActiva] = useState('todas')

  // Modales
  const [isPlatilloModalOpen, setIsPlatilloModalOpen] = useState(false)
  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false)
  const [platilloAEditar, setPlatilloAEditar] = useState(null)

  const platillosFiltrados = categoriaActiva === 'todas'
    ? platillos
    : platillos.filter(p => p.categoriaId === categoriaActiva)

  const handleToggleEstado = (id) => {
    setPlatillos(prev => prev.map(p => p.id === id ? { ...p, disponible: !p.disponible } : p))
  }

  const handleEliminarPlatillo = (id) => {
    if (confirm('¿Estás seguro de que deseas eliminar este platillo?')) {
      setPlatillos(prev => prev.filter(p => p.id !== id))
    }
  }

  const handleAbrirNuevoPlatillo = () => {
    setPlatilloAEditar(null)
    setIsPlatilloModalOpen(true)
  }

  const handleAbrirEditarPlatillo = (platillo) => {
    setPlatilloAEditar(platillo)
    setIsPlatilloModalOpen(true)
  }

  const handleGuardarPlatillo = (platilloData) => {
    if (platilloAEditar) {
      setPlatillos(prev => prev.map(p => p.id === platilloData.id ? platilloData : p))
    } else {
      setPlatillos(prev => [platilloData, ...prev])
    }
  }

  const handleGuardarCategoria = (nombreCategoria) => {
    const nuevaCat = {
      id: Date.now().toString(),
      nombre: nombreCategoria
    }
    setCategorias(prev => [...prev, nuevaCat])
    setCategoriaActiva(nuevaCat.id)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Administración del Menú</h1>
          <p className="text-gray-500 text-sm">Gestiona platillos, precios y disponibilidad en tiempo real.</p>
        </div>
        <button
          onClick={handleAbrirNuevoPlatillo}
          className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-sm transition-colors"
        >
          + Nuevo Platillo
        </button>
      </div>

      <CategoriaTabs
        categorias={categorias}
        categoriaActiva={categoriaActiva}
        onSelectCategoria={setCategoriaActiva}
        onNuevaCategoria={() => setIsCategoriaModalOpen(true)}
      />

      {platillosFiltrados.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-500 text-sm">No hay platillos registrados en esta categoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {platillosFiltrados.map((platillo) => (
            <PlatilloCard
              key={platillo.id}
              platillo={platillo}
              onEditar={handleAbrirEditarPlatillo}
              onToggleEstado={handleToggleEstado}
              onEliminar={handleEliminarPlatillo}
            />
          ))}
        </div>
      )}

      {/* Modales */}
      <PlatilloModal
        isOpen={isPlatilloModalOpen}
        onClose={() => setIsPlatilloModalOpen(false)}
        onSave={handleGuardarPlatillo}
        platillo={platilloAEditar}
        categorias={categorias}
      />

      <CategoriaModal
        isOpen={isCategoriaModalOpen}
        onClose={() => setIsCategoriaModalOpen(false)}
        onSave={handleGuardarCategoria}
      />
    </div>
  )
}