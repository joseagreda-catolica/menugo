import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function MapaSalon() {
  const navigate = useNavigate()

  const [mesas, setMesas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [seccionFiltro, setSeccionFiltro] = useState('todas')
  const [busqueda, setBusqueda] = useState('')

  // Estado para controlar el modal de cambio de estado / acciones de mesa
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null)
  const [guardandoEstado, setGuardandoEstado] = useState(false)

  const API_URL = 'http://localhost:3000/api'

  // Cargar mesas desde el backend
  useEffect(() => {
    let montado = true

    const cargarMesasBD = async () => {
      try {
        setCargando(true)
        const res = await fetch(`${API_URL}/mesas`)

        if (res.ok && montado) {
          const data = await res.json()
          if (Array.isArray(data)) {
            const mesasNormalizadas = data
              .filter((m) => m.activa !== false)
              .map((m) => ({
                ...m,
                id: m.id,
                numero: String(m.numero),
                seccion: m.seccion || m.ubicacion || 'Interior',
                capacidad: m.capacidad || 4,
                estado: m.estado || 'libre',
              }))
            setMesas(mesasNormalizadas)
          }
        }
      } catch (error) {
        console.error('Error al cargar mesas desde la API:', error)
      } finally {
        if (montado) setCargando(false)
      }
    }

    cargarMesasBD()

    return () => {
      montado = false
    }
  }, [])

  // Cambiar el estado de una mesa en la BD y en la interfaz
  const handleCambiarEstado = async (nuevoEstado) => {
    if (!mesaSeleccionada) return

    const mesaId = mesaSeleccionada.id

    // Actualización optimista en interfaz
    setMesas((prev) =>
      prev.map((m) => (m.id === mesaId ? { ...m, estado: nuevoEstado } : m))
    )
    setMesaSeleccionada((prev) => (prev ? { ...prev, estado: nuevoEstado } : null))

    try {
      setGuardandoEstado(true)
      await fetch(`${API_URL}/mesas/${mesaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: nuevoEstado,
          activa: nuevoEstado !== 'inactiva',
        }),
      })
    } catch (error) {
      console.error('Error al actualizar el estado de la mesa:', error)
      alert('No se pudo actualizar el estado en el servidor.')
    } finally {
      setGuardandoEstado(false)
    }
  }

  const configEstado = {
    libre: {
      bg: 'bg-white',
      border: 'border-emerald-200',
      hover: 'hover:border-emerald-400 hover:shadow-emerald-100',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      badge: 'bg-emerald-100 text-emerald-700',
      indicador: 'bg-emerald-500',
      etiqueta: 'Libre',
      accion: 'Opciones',
      textoAccion: 'text-emerald-600',
    },

    ocupada: {
      bg: 'bg-white',
      border: 'border-orange-200',
      hover: 'hover:border-orange-400 hover:shadow-orange-100',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      badge: 'bg-orange-100 text-orange-700',
      indicador: 'bg-orange-500',
      etiqueta: 'Ocupada',
      accion: 'Opciones',
      textoAccion: 'text-orange-600',
    },

    cuenta_pedida: {
      bg: 'bg-white',
      border: 'border-amber-300',
      hover: 'hover:border-amber-500 hover:shadow-amber-100',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      badge: 'bg-amber-100 text-amber-800',
      indicador: 'bg-amber-500',
      etiqueta: 'Cuenta pedida',
      accion: 'Opciones',
      textoAccion: 'text-amber-700',
    },

    reservada: {
      bg: 'bg-white',
      border: 'border-sky-200',
      hover: 'hover:border-sky-400 hover:shadow-sky-100',
      iconBg: 'bg-sky-100',
      iconColor: 'text-sky-600',
      badge: 'bg-sky-100 text-sky-700',
      indicador: 'bg-sky-500',
      etiqueta: 'Reservada',
      accion: 'Opciones',
      textoAccion: 'text-sky-600',
    },
  }

  const secciones = [
    'todas',
    ...Array.from(new Set(mesas.map((m) => m.seccion))),
  ]

  const mesasFiltradas = mesas.filter((mesa) => {
    const coincideSeccion =
      seccionFiltro === 'todas' || mesa.seccion === seccionFiltro

    const coincideBusqueda = String(mesa.numero)
      .toLowerCase()
      .includes(busqueda.toLowerCase())

    return coincideSeccion && coincideBusqueda
  })

  const totalLibres = mesas.filter((mesa) => mesa.estado === 'libre').length
  const totalOcupadas = mesas.filter(
    (mesa) => mesa.estado === 'ocupada' || mesa.estado === 'cuenta_pedida'
  ).length
  const totalReservadas = mesas.filter(
    (mesa) => mesa.estado === 'reservada'
  ).length

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ENCABEZADO */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/20 blur-2xl" />
          <div className="absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-sky-500/10 blur-2xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl backdrop-blur">
                  🗺️
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                    Mapa del Salón
                  </h1>
                  <p className="text-sm text-slate-300">
                    Control de mesas y gestión de estados
                  </p>
                </div>
              </div>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
                Selecciona cualquier mesa para cambiar su estado (Libre, Ocupada, Reservada) o para abrir la toma de pedidos.
              </p>
            </div>

            {/* MÉTRICAS */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center backdrop-blur">
                <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20">
                  <span className="text-emerald-400">●</span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Libres
                </p>
                <p className="text-2xl font-black text-emerald-400">
                  {totalLibres}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center backdrop-blur">
                <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/20">
                  <span className="text-orange-400">●</span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Ocupadas
                </p>
                <p className="text-2xl font-black text-orange-400">
                  {totalOcupadas}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center backdrop-blur">
                <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/20">
                  <span className="text-sky-400">●</span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Reservadas
                </p>
                <p className="text-2xl font-black text-sky-400">
                  {totalReservadas}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FILTROS Y BUSCADOR */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm">📍</span>
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Secciones
                </span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {secciones.map((seccion) => {
                  const activa = seccionFiltro === seccion

                  return (
                    <button
                      key={seccion}
                      onClick={() => setSeccionFiltro(seccion)}
                      className={`
                        group flex shrink-0 items-center gap-2 rounded-xl
                        px-4 py-2.5 text-xs font-bold capitalize
                        transition-all duration-200 cursor-pointer
                        ${
                          activa
                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                            : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                        }
                      `}
                    >
                      <span
                        className={`
                          h-2 w-2 rounded-full transition-all
                          ${
                            activa
                              ? 'bg-emerald-400'
                              : 'bg-slate-300 group-hover:bg-slate-400'
                          }
                        `}
                      />
                      {seccion === 'todas' ? 'Todas' : seccion}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="relative w-full lg:max-w-xs">
              <svg
                className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m21 21-4.35-4.35m2.1-5.4a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
                />
              </svg>

              <input
                type="text"
                placeholder="Buscar número de mesa..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
              />
            </div>
          </div>
        </div>

        {/* LEYENDA */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-5">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Estado
            </span>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
              Libre
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_0_4px_rgba(249,115,22,0.12)]" />
              Ocupada
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
              </span>
              Cuenta pedida
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500 shadow-[0_0_0_4px_rgba(14,165,233,0.12)]" />
              Reservada
            </div>
          </div>

          <span className="text-xs font-semibold text-slate-400">
            {mesasFiltradas.length} mesa{mesasFiltradas.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* GRID DE MESAS */}
        {cargando ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-sm font-bold text-slate-500 animate-pulse">
              Cargando mapa del salón desde la base de datos...
            </p>
          </div>
        ) : mesasFiltradas.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {mesasFiltradas.map((mesa) => {
              const cfg = configEstado[mesa.estado] || configEstado.libre

              return (
                <button
                  key={mesa.id}
                  onClick={() => setMesaSeleccionada(mesa)}
                  className={`
                    group relative h-52 overflow-hidden rounded-3xl
                    border-2 ${cfg.border}
                    ${cfg.bg}
                    ${cfg.hover}
                    p-5 text-left
                    shadow-sm
                    transition-all duration-300
                    hover:-translate-y-1 hover:shadow-xl
                    focus:outline-none focus:ring-4 focus:ring-slate-200
                    cursor-pointer
                  `}
                >
                  <div
                    className={`
                      absolute -right-8 -top-8 h-24 w-24
                      rounded-full ${cfg.iconBg}
                      opacity-50 transition-transform
                      duration-300 group-hover:scale-150
                    `}
                  />

                  {/* HEADER MESA */}
                  <div className="relative flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Mesa
                      </span>
                      <h3 className="mt-0.5 text-3xl font-black tracking-tight text-slate-900">
                        {mesa.numero}
                      </h3>
                    </div>

                    <div
                      className={`
                        flex h-10 w-10 items-center justify-center
                        rounded-xl ${cfg.iconBg}
                        ${cfg.iconColor}
                        transition-transform duration-300
                        group-hover:scale-110
                      `}
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                          d="M4 10h16M6 10V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3M5 10v7m14-7v7M3 17h18"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* SECCIÓN */}
                  <div className="relative mt-2 flex items-center gap-1.5">
                    <svg
                      className="h-3.5 w-3.5 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657 13.414 21l-4.243-4.343a8 8 0 1 1 8.486 0Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>

                    <span className="text-xs font-semibold text-slate-500">
                      {mesa.seccion}
                    </span>
                  </div>

                  {/* CAPACIDAD */}
                  <div className="absolute bottom-16 left-5 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                      <svg
                        className="h-4 w-4 text-slate-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                          d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 1 0 7.75"
                        />
                      </svg>
                    </div>

                    <span className="text-xs font-semibold text-slate-600">
                      {mesa.capacidad} personas
                    </span>
                  </div>

                  {/* FOOTER */}
                  <div className="absolute bottom-0 left-0 right-0 border-t border-slate-100 bg-slate-50/80 px-5 py-3 backdrop-blur">
                    <div className="flex items-center justify-between">
                      <span
                        className={`
                          rounded-lg px-2.5 py-1
                          text-[10px] font-black uppercase
                          tracking-wider ${cfg.badge}
                        `}
                      >
                        {cfg.etiqueta}
                      </span>

                      <span
                        className={`
                          flex items-center gap-1
                          text-xs font-bold ${cfg.textoAccion}
                          transition-transform duration-200
                          group-hover:translate-x-1
                        `}
                      >
                        Gestionar
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="m9 18 6-6-6-6"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
              🔎
            </div>
            <h3 className="mt-4 text-base font-black text-slate-700">
              No encontramos mesas
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
              Modifica los filtros de búsqueda para volver a consultar.
            </p>
          </div>
        )}
      </div>

      {/* MODAL DE CAMBIO DE ESTADO Y ACCIONES */}
      {mesaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Gestión de Mesa
                </span>
                <h3 className="text-2xl font-black text-slate-900">
                  Mesa {mesaSeleccionada.numero}
                </h3>
                <p className="text-xs text-slate-500">
                  {mesaSeleccionada.seccion} • Capacidad: {mesaSeleccionada.capacidad} personas
                </p>
              </div>

              <button
                onClick={() => setMesaSeleccionada(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* SELECCIÓN DE ESTADO */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Cambiar Estado
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={guardandoEstado}
                  onClick={() => handleCambiarEstado('libre')}
                  className={`flex items-center justify-between rounded-2xl p-3 border text-xs font-bold transition cursor-pointer ${
                    mesaSeleccionada.estado === 'libre'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>🟢 Libre</span>
                  {mesaSeleccionada.estado === 'libre' && <span>✓</span>}
                </button>

                <button
                  disabled={guardandoEstado}
                  onClick={() => handleCambiarEstado('ocupada')}
                  className={`flex items-center justify-between rounded-2xl p-3 border text-xs font-bold transition cursor-pointer ${
                    mesaSeleccionada.estado === 'ocupada'
                      ? 'border-orange-500 bg-orange-50 text-orange-800 ring-2 ring-orange-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>🟠 Ocupada</span>
                  {mesaSeleccionada.estado === 'ocupada' && <span>✓</span>}
                </button>

                <button
                  disabled={guardandoEstado}
                  onClick={() => handleCambiarEstado('cuenta_pedida')}
                  className={`flex items-center justify-between rounded-2xl p-3 border text-xs font-bold transition cursor-pointer ${
                    mesaSeleccionada.estado === 'cuenta_pedida'
                      ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>🟡 Cuenta Pedida</span>
                  {mesaSeleccionada.estado === 'cuenta_pedida' && <span>✓</span>}
                </button>

                <button
                  disabled={guardandoEstado}
                  onClick={() => handleCambiarEstado('reservada')}
                  className={`flex items-center justify-between rounded-2xl p-3 border text-xs font-bold transition cursor-pointer ${
                    mesaSeleccionada.estado === 'reservada'
                      ? 'border-sky-500 bg-sky-50 text-sky-800 ring-2 ring-sky-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>🔵 Reservada</span>
                  {mesaSeleccionada.estado === 'reservada' && <span>✓</span>}
                </button>
              </div>
            </div>

            {/* ACCIONES DE NAVEGACIÓN */}
            <div className="pt-2 space-y-2 border-t border-slate-100">
              <button
                onClick={() => {
                  const id = mesaSeleccionada.id
                  setMesaSeleccionada(null)
                  navigate(`/pedidos?mesaId=${id}`)
                }}
                className="w-full rounded-2xl bg-orange-500 py-3 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition cursor-pointer"
              >
                📝 Ir a Tomar Pedido
              </button>

              {mesaSeleccionada.estado === 'cuenta_pedida' && (
                <button
                  onClick={() => {
                    setMesaSeleccionada(null)
                    navigate('/cobro')
                  }}
                  className="w-full rounded-2xl bg-amber-500 py-3 text-xs font-bold text-white shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition cursor-pointer"
                >
                  💳 Procesar Cobro
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}