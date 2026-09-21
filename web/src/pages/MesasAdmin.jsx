import { useState } from 'react'
import { MOCK_MESAS, MOCK_SECCIONES } from "@/Services/mesasService";import MesaCard from '@/components/mesas/MesaCard'
import MesaModal from '@/components/mesas/MesaModal'

export default function MesasAdmin() {
  const [mesas, setMesas] = useState(MOCK_MESAS)
  const [seccionActiva, setSeccionActiva] = useState('todas')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mesaAEditar, setMesaAEditar] = useState(null)

  const mesasFiltradas = seccionActiva === 'todas'
    ? mesas
    : mesas.filter(m => m.seccion === seccionActiva)

  // Resumen de estadísticas
  const stats = {
    total: mesas.length,
    libres: mesas.filter(m => m.estado === 'libre').length,
    ocupadas: mesas.filter(m => m.estado === 'ocupada').length,
    cuenta: mesas.filter(m => m.estado === 'cuenta').length,
    reservadas: mesas.filter(m => m.estado === 'reservada').length
  }

  const handleCambiarEstadoRapido = (mesa) => {
    // Rotar estado: libre -> ocupada -> cuenta -> reservada -> libre
    const orden = ['libre', 'ocupada', 'cuenta', 'reservada']
    const siguienteIdx = (orden.indexOf(mesa.estado) + 1) % orden.length
    const nuevoEstado = orden[siguienteIdx]

    setMesas(prev => prev.map(m => m.id === mesa.id ? { ...m, estado: nuevoEstado } : m))
  }

  const handleAbrirNuevaMesa = () => {
    setMesaAEditar(null)
    setIsModalOpen(true)
  }

  const handleAbrirEditarMesa = (mesa) => {
    setMesaAEditar(mesa)
    setIsModalOpen(true)
  }

  const handleGuardarMesa = (mesaData) => {
    if (mesaAEditar) {
      setMesas(prev => prev.map(m => m.id === mesaData.id ? mesaData : m))
    } else {
      setMesas(prev => [...prev, mesaData])
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mapa del Salón y Mesas</h1>
          <p className="text-gray-500 text-sm">Controla la ocupación y distribución del restaurante en tiempo real.</p>
        </div>
        <button
          onClick={handleAbrirNuevaMesa}
          className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-xs transition-colors"
        >
          + Nueva Mesa
        </button>
      </div>

      {/* Tarjetas de Estadísticas rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
          <span className="text-xs text-gray-500 block">Total Mesas</span>
          <span className="text-xl font-bold text-gray-800">{stats.total}</span>
        </div>
        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
          <span className="text-xs text-emerald-700 block font-medium">Libres</span>
          <span className="text-xl font-bold text-emerald-800">{stats.libres}</span>
        </div>
        <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
          <span className="text-xs text-rose-700 block font-medium">Ocupadas</span>
          <span className="text-xl font-bold text-rose-800">{stats.ocupadas}</span>
        </div>
        <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
          <span className="text-xs text-amber-700 block font-medium">Pidiendo Cuenta</span>
          <span className="text-xl font-bold text-amber-800">{stats.cuenta}</span>
        </div>
        <div className="bg-sky-50 p-3 rounded-xl border border-sky-100">
          <span className="text-xs text-sky-700 block font-medium">Reservadas</span>
          <span className="text-xl font-bold text-sky-800">{stats.reservadas}</span>
        </div>
      </div>

      {/* Filtro por Sección */}
      <div className="flex gap-2 border-b border-gray-200 pb-4 mb-6 overflow-x-auto">
        <button
          onClick={() => setSeccionActiva('todas')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            seccionActiva === 'todas'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todas las Secciones
        </button>
        {MOCK_SECCIONES.map((sec) => (
          <button
            key={sec}
            onClick={() => setSeccionActiva(sec)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              seccionActiva === sec
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {sec}
          </button>
        ))}
      </div>

      {/* Cuadrícula de Mesas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {mesasFiltradas.map((mesa) => (
          <MesaCard
            key={mesa.id}
            mesa={mesa}
            onClick={handleCambiarEstadoRapido}
            onEditar={handleAbrirEditarMesa}
          />
        ))}
      </div>

      {/* Modal */}
      <MesaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleGuardarMesa}
        mesa={mesaAEditar}
      />
    </div>
  )
}