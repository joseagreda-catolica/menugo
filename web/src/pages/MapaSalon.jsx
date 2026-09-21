import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MOCK_MESAS } from '@/Services/mesasService'

export default function MapaSalon() {
  const navigate = useNavigate()

  // Si no se han cargado datos aún, usa este fallback por defecto
  const [mesas] = useState(MOCK_MESAS || [
    { id: '1', numero: 'Mesa 1', capacidad: 4, estado: 'libre', seccion: 'Salón Principal' },
    { id: '2', numero: 'Mesa 2', capacidad: 2, estado: 'ocupada', seccion: 'Salón Principal' },
    { id: '3', numero: 'Mesa 3', capacidad: 6, estado: 'cuenta_pedida', seccion: 'Salón Principal' },
    { id: '4', numero: 'Mesa 4', capacidad: 4, estado: 'reservada', seccion: 'Salón Principal' },
    { id: '5', numero: 'Mesa 5', capacidad: 2, estado: 'libre', seccion: 'Terraza' },
    { id: '6', numero: 'Mesa 6', capacidad: 4, estado: 'ocupada', seccion: 'Terraza' },
    { id: '7', numero: 'Mesa 7', capacidad: 2, estado: 'libre', seccion: 'Bar' },
    { id: '8', numero: 'Mesa 8', capacidad: 2, estado: 'libre', seccion: 'Bar' },
  ])

  const [seccionFiltro, setSeccionFiltro] = useState('todas')

  // Configuración de colores y etiquetas por estado
  const configEstado = {
    libre: {
      bg: 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-300',
      badge: 'bg-emerald-100 text-emerald-800',
      indicador: 'bg-emerald-500',
      etiqueta: 'Libre',
      accion: 'Abrir Mesa'
    },
    ocupada: {
      bg: 'bg-orange-50 hover:bg-orange-100/80 border-orange-300',
      badge: 'bg-orange-100 text-orange-800',
      indicador: 'bg-orange-500',
      etiqueta: 'Ocupada',
      accion: 'Ver Pedido'
    },
    cuenta_pedida: {
      bg: 'bg-amber-50 hover:bg-amber-100/80 border-amber-300',
      badge: 'bg-amber-100 text-amber-800',
      indicador: 'bg-amber-500',
      etiqueta: 'Cuenta Pedida',
      accion: 'Ir a Cobro'
    },
    reservada: {
      bg: 'bg-blue-50 hover:bg-blue-100/80 border-blue-300',
      badge: 'bg-blue-100 text-blue-800',
      indicador: 'bg-blue-500',
      etiqueta: 'Reservada',
      accion: 'Ver Reserva'
    }
  }

  // Secciones únicas para filtros
  const secciones = ['todas', ...Array.from(new Set(mesas.map(m => m.seccion)))]

  // Filtrado según la sección seleccionada
  const mesasFiltradas = seccionFiltro === 'todas'
    ? mesas
    : mesas.filter(m => m.seccion === seccionFiltro)

  // Contadores
  const totalLibres = mesas.filter(m => m.estado === 'libre').length
  const totalOcupadas = mesas.filter(m => m.estado === 'ocupada' || m.estado === 'cuenta_pedida').length
  const totalReservadas = mesas.filter(m => m.estado === 'reservada').length

  const handleMesaClick = (mesa) => {
    if (mesa.estado === 'cuenta_pedida') {
      navigate('/cobro')
    } else {
      navigate(`/pedidos?mesaId=${mesa.id}`)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado y Resumen */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mapa del Salón</h1>
          <p className="text-gray-500 text-sm">Distribución de mesas y estado de ocupación en tiempo real.</p>
        </div>

        {/* Tarjetas de Métricas */}
        <div className="flex gap-3">
          <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-2xs text-center">
            <span className="text-xs text-gray-400 font-semibold block">Libres</span>
            <span className="text-lg font-bold text-emerald-600">{totalLibres}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-2xs text-center">
            <span className="text-xs text-gray-400 font-semibold block">Ocupadas</span>
            <span className="text-lg font-bold text-orange-600">{totalOcupadas}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-2xs text-center">
            <span className="text-xs text-gray-400 font-semibold block">Reservadas</span>
            <span className="text-lg font-bold text-blue-600">{totalReservadas}</span>
          </div>
        </div>
      </div>

      {/* Filtros por Sección */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {secciones.map((seccion) => (
          <button
            key={seccion}
            onClick={() => setSeccionFiltro(seccion)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-colors ${
              seccionFiltro === seccion
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {seccion === 'todas' ? 'Todas las Secciones' : seccion}
          </button>
        ))}
      </div>

      {/* Leyenda de Estados */}
      <div className="flex flex-wrap gap-4 text-xs font-medium text-gray-600 bg-white p-3 rounded-xl border border-gray-100">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Libre</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Ocupada</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Cuenta Pedida</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Reservada</span>
      </div>

      {/* Cuadrícula de Mesas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {mesasFiltradas.map((mesa) => {
          const cfg = configEstado[mesa.estado] || configEstado.libre
          return (
            <div
              key={mesa.id}
              onClick={() => handleMesaClick(mesa)}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between h-40 shadow-2xs hover:shadow-md hover:-translate-y-0.5 ${cfg.bg}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-gray-800 text-lg">{mesa.numero}</h3>
                  <span className="text-xs text-gray-500 font-medium block">{mesa.seccion}</span>
                </div>
                <span className={`w-3 h-3 rounded-full ${cfg.indicador}`} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Capacidad:</span>
                  <span className="font-bold text-gray-700">👥 {mesa.capacidad} pers.</span>
                </div>

                <div className="pt-2 border-t border-gray-200/50 flex justify-between items-center">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                    {cfg.etiqueta}
                  </span>
                  <span className="text-xs font-bold text-orange-600 hover:underline">
                    {cfg.accion} &rarr;
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}