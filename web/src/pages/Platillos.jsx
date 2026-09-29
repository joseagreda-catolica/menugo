import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  obtenerPlatillos,
  obtenerCategorias,
  crearPlatillo,
  actualizarPlatillo,
  actualizarDisponibilidad,
  subirImagenPlatillo,
} from "../Services/MenuService"

export function Platillos() {
  const navigate = useNavigate()

  // Estados principales
  const [platillos, setPlatillos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)

  // Estados del Formulario
  const [nombre, setNombre] = useState("")
  const [precio, setPrecio] = useState("")
  const [categoriaId, setCategoriaId] = useState("")
  const [archivoFoto, setArchivoFoto] = useState(null)
  const [vistaPrevia, setVistaPrevia] = useState("")
  const [editandoId, setEditandoId] = useState(null)
  const [guardando, setGuardando] = useState(false)

  // Carga inicial de datos desde la API/BD
  useEffect(() => {
    let isMounted = true

    async function fetchDatos() {
      try {
        setCargando(true)
        const [plats, cats] = await Promise.all([
          obtenerPlatillos(),
          obtenerCategorias(),
        ])

        if (isMounted) {
          // Extraer arreglo de platillos sin importar la estructura de la API
          const listaPlatillos = Array.isArray(plats)
            ? plats
            : plats?.data || plats?.platillos || []
          setPlatillos(listaPlatillos)

          // Extraer arreglo de categorías sin importar la estructura de la API
          const listaCategorias = Array.isArray(cats)
            ? cats
            : cats?.data || cats?.categorias || []
          setCategorias(listaCategorias)

          if (listaCategorias.length > 0) {
            setCategoriaId(listaCategorias[0].id)
          }
        }
      } catch (error) {
        console.error("Error al cargar datos desde la BD:", error)
      } finally {
        if (isMounted) setCargando(false)
      }
    }

    fetchDatos()

    return () => {
      isMounted = false
    }
  }, [])

  const recargarDatos = async () => {
    try {
      const [plats, cats] = await Promise.all([
        obtenerPlatillos(),
        obtenerCategorias(),
      ])

      const listaPlatillos = Array.isArray(plats)
        ? plats
        : plats?.data || plats?.platillos || []
      const listaCategorias = Array.isArray(cats)
        ? cats
        : cats?.data || cats?.categorias || []

      setPlatillos(listaPlatillos)
      setCategorias(listaCategorias)
    } catch (error) {
      console.error("Error al recargar datos:", error)
    }
  }

  const handleImagenChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setArchivoFoto(file)
      setVistaPrevia(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre || !precio) return

    setGuardando(true)

    const payload = {
      nombre,
      precio: Number(precio),
      categoriaId: categoriaId ? Number(categoriaId) : null,
    }

    try {
      let idPlatilloGuardado = editandoId

      if (editandoId) {
        await actualizarPlatillo(editandoId, payload)
      } else {
        const nuevoPlatillo = await crearPlatillo(payload)
        idPlatilloGuardado = nuevoPlatillo?.id || nuevoPlatillo?.data?.id
      }

      if (archivoFoto && idPlatilloGuardado) {
        await subirImagenPlatillo(idPlatilloGuardado, archivoFoto)
      }

      limpiarFormulario()
      await recargarDatos()
    } catch (error) {
      console.error("Error guardando el platillo en la BD:", error)
    } finally {
      setGuardando(false)
    }
  }

  const handleToggleDisponible = async (id) => {
    const platillo = platillos.find((p) => p.id === id)
    if (!platillo) return

    const nuevoEstado = !platillo.disponible

    setPlatillos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, disponible: nuevoEstado } : p))
    )

    try {
      await actualizarDisponibilidad(id, nuevoEstado)
    } catch (error) {
      console.error("Error al actualizar disponibilidad:", error)
      await recargarDatos()
    }
  }

  const handleEditar = (p) => {
    setEditandoId(p.id)
    setNombre(p.nombre)
    setPrecio(p.precio)
    setCategoriaId(p.categoriaId || (categorias[0] ? categorias[0].id : ""))
    setVistaPrevia(p.fotoUrl || "")
    setArchivoFoto(null)
  }

  const limpiarFormulario = () => {
    setEditandoId(null)
    setNombre("")
    setPrecio("")
    setArchivoFoto(null)
    setVistaPrevia("")
    if (categorias.length > 0) {
      setCategoriaId(categorias[0].id)
    } else {
      setCategoriaId("")
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* ENCABEZADO */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-500/20 blur-2xl" />
          <div className="absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/mapa-salon")}
                className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur transition hover:bg-white/20 active:scale-95 cursor-pointer"
                title="Regresar"
              >
                <svg
                  className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div>
                <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                  Administración de Platillos
                </h1>
                <p className="text-sm text-slate-300">
                  Gestiona el catálogo de alimentos y bebidas
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-center backdrop-blur self-start sm:self-auto">
              <span className="text-xs font-bold text-slate-300">
                {platillos.length} {platillos.length === 1 ? "Platillo" : "Platillos"}
              </span>
            </div>
          </div>
        </div>

        {/* FORMULARIO */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
              <span>{editandoId ? "✏️" : "➕"}</span>
              {editandoId ? "Editar Platillo Existente" : "Agregar Nuevo Platillo"}
            </h2>
            {editandoId && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                Modo Edición (ID: {editandoId})
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Nombre del Platillo
                </label>
                <input
                  type="text"
                  placeholder="Ej. Hamburguesa Doble"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Precio ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Categoría
                </label>
                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100 cursor-pointer"
                >
                  {categorias.length === 0 ? (
                    <option value="">General / Sin categoría</option>
                  ) : (
                    categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))
                  )}
                </select>
                {categorias.length === 0 && (
                  <p className="mt-1 text-[11px] text-amber-600 font-medium">
                    ⚠️ No hay categorías en la BD. Se guardará sin categoría asociada.
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Imagen Representativa
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImagenChange}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-xs file:font-bold file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />

                {vistaPrevia && (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    <img src={vistaPrevia} alt="Vista previa" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={guardando}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {guardando ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>{editandoId ? "Guardar Cambios" : "Crear Platillo"}</span>
                )}
              </button>

              {editandoId && (
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar Edición
                </button>
              )}
            </div>
          </form>
        </div>

        {/* TABLA DE PLATILLOS */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {cargando ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              <p className="mt-3 text-xs font-semibold text-slate-400">
                Cargando datos...
              </p>
            </div>
          ) : platillos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    <th className="p-4 pl-6">Foto</th>
                    <th className="p-4">Nombre</th>
                    <th className="p-4">Categoría</th>
                    <th className="p-4">Precio</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 pr-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {platillos.map((p) => {
                    const catNombre =
                      categorias.find((c) => String(c.id) === String(p.categoriaId))
                        ?.nombre || p.categoriaNombre || "Sin Categoría"
                    const precioNum = Number(p.precio) || 0

                    return (
                      <tr
                        key={p.id}
                        className={`transition-colors hover:bg-slate-50/80 ${
                          !p.disponible ? "bg-slate-50/50" : ""
                        }`}
                      >
                        <td className="p-4 pl-6">
                          {p.fotoUrl ? (
                            <img
                              src={p.fotoUrl}
                              alt={p.nombre}
                              className="h-12 w-12 rounded-2xl object-cover border border-slate-200 shadow-sm"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-400">
                              🍲
                            </div>
                          )}
                        </td>

                        <td className="p-4 font-bold text-slate-800">
                          {p.nombre}
                        </td>

                        <td className="p-4">
                          <span className="inline-block rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {catNombre}
                          </span>
                        </td>

                        <td className="p-4 font-black text-blue-600">
                          ${precioNum.toFixed(2)}
                        </td>

                        <td className="p-4">
                          <button
                            onClick={() => handleToggleDisponible(p.id)}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer active:scale-95 ${
                              p.disponible
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                            }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${
                                p.disponible ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                            />
                            {p.disponible ? "Disponible" : "Agotado"}
                          </button>
                        </td>

                        <td className="p-4 pr-6 text-right">
                          <button
                            onClick={() => handleEditar(p)}
                            className="rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-600 active:scale-95 cursor-pointer"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                🍽️
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-700">
                No hay platillos registrados
              </h3>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Platillos