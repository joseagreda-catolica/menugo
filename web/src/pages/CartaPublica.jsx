import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { obtenerCartaPublica } from "../Services/MenuService"

export function CartaPublica() {
  const navigate = useNavigate()

  const [menuAgrupado, setMenuAgrupado] = useState([])
  const [busqueda, setBusqueda] = useState("")
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarCarta = async () => {
      try {
        setCargando(true)
        const datos = await obtenerCartaPublica({
          categoria: categoriaSeleccionada,
          buscar: busqueda,
        })
        setMenuAgrupado(Array.isArray(datos) ? datos : [])
      } catch (err) {
        console.error("Error al cargar la carta pública:", err)
      } finally {
        setCargando(false)
      }
    }

    cargarCarta()
  }, [busqueda, categoriaSeleccionada])

  // Extraer las categorías únicas de los datos devueltos para la barra de navegación
  const categoriasFiltro = menuAgrupado.map((cat) => ({
    id: cat.id,
    nombre: cat.nombre,
  }))

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* ENCABEZADO estilo MapaSalon */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
          {/* Luces decorativas de fondo */}
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-500/20 blur-2xl" />
          <div className="absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {/* Botón de regreso a MapaSalón */}
              <button
                onClick={() => navigate("/mapa-salon")}
                className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur transition hover:bg-white/20 active:scale-95"
                title="Regresar a MapaSalón"
              >
                <svg
                  className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <div>
                <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                  Menú del Día
                </h1>
                <p className="text-sm text-slate-300">
                  Selecciona tus platillos preferidos
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-center backdrop-blur self-start sm:self-auto">
              <span className="text-xs font-bold text-slate-300">
                Carta Pública
              </span>
            </div>
          </div>
        </div>

        {/* CONTROLES: CATEGORÍAS Y BUSCADOR */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            
            {/* Filtros por Categoría */}
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm">🍽️</span>
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Categorías
                </span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setCategoriaSeleccionada(null)}
                  className={`
                    group flex shrink-0 items-center gap-2 rounded-xl
                    px-4 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer
                    ${
                      categoriaSeleccionada === null
                        ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                        : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                    }
                  `}
                >
                  <span
                    className={`h-2 w-2 rounded-full transition-all ${
                      categoriaSeleccionada === null
                        ? "bg-blue-400"
                        : "bg-slate-300 group-hover:bg-slate-400"
                    }`}
                  />
                  Todas
                </button>

                {categoriasFiltro.map((cat) => {
                  const activa = categoriaSeleccionada === cat.id
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setCategoriaSeleccionada(cat.id)}
                      className={`
                        group flex shrink-0 items-center gap-2 rounded-xl
                        px-4 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer
                        ${
                          activa
                            ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                            : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                        }
                      `}
                    >
                      <span
                        className={`h-2 w-2 rounded-full transition-all ${
                          activa
                            ? "bg-blue-400"
                            : "bg-slate-300 group-hover:bg-slate-400"
                        }`}
                      />
                      {cat.nombre}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Buscador */}
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
                placeholder="Buscar platillo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
              />
            </div>

          </div>
        </div>

        {/* PLATILLOS AGRUPADOS POR CATEGORÍA */}
        {cargando ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
            <p className="mt-3 text-xs font-semibold text-slate-400">
              Cargando carta pública...
            </p>
          </div>
        ) : menuAgrupado.length > 0 ? (
          <div className="space-y-8">
            {menuAgrupado.map((cat) => (
              <div key={cat.id} className="space-y-4">
                {/* Título de la categoría */}
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-black uppercase tracking-wider text-slate-800">
                    {cat.nombre}
                  </h2>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                {/* Grid de Platillos */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {cat.platillos?.map((platillo) => (
                    <div
                      key={platillo.id}
                      className={`
                        group relative flex flex-col overflow-hidden rounded-3xl border-2 transition-all duration-300
                        ${
                          !platillo.disponible
                            ? "border-slate-200 bg-slate-100/70 opacity-75"
                            : "border-slate-200 bg-white hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5"
                        }
                      `}
                    >
                      {/* Imagen / Placeholder */}
                      <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                        {platillo.fotoUrl ? (
                          <img
                            src={platillo.fotoUrl}
                            alt={platillo.nombre}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-3xl text-slate-300">
                            🍲
                          </div>
                        )}

                        {/* Badge de estado en la foto */}
                        {!platillo.disponible && (
                          <div className="absolute top-3 right-3 rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                            Agotado
                          </div>
                        )}
                      </div>

                      {/* Cuerpo de la card */}
                      <div className="flex flex-1 flex-col p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-extrabold text-slate-900 line-clamp-1">
                            {platillo.nombre}
                          </h3>
                          <span className="text-base font-black text-blue-600">
                            ${typeof platillo.precio === "number" ? platillo.precio.toFixed(2) : platillo.precio}
                          </span>
                        </div>

                        {platillo.descripcion && (
                          <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                            {platillo.descripcion}
                          </p>
                        )}

                        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {platillo.tiempoPreparacionMin || 15} min
                          </div>

                          <button
                            disabled={!platillo.disponible}
                            className={`
                              flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200
                              ${
                                platillo.disponible
                                  ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-200 cursor-pointer"
                                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
                              }
                            `}
                          >
                            <span>{platillo.disponible ? "Agregar" : "Agotado"}</span>
                            {platillo.disponible && (
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Estado vacío estilo MapaSalon */
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
              🔎
            </div>

            <h3 className="mt-4 text-base font-black text-slate-700">
              No encontramos platillos
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
              Intenta cambiando la categoría seleccionada o el término introducido en el buscador.
            </p>

            <button
              onClick={() => {
                setBusqueda("")
                setCategoriaSeleccionada(null)
              }}
              className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 cursor-pointer"
            >
              Limpiar filtros
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export default CartaPublica