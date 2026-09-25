import { useState, useEffect } from "react";
import {
  obtenerCategorias,
  crearCategoria,
  actualizarCategoria,
} from "../Services/MenuService";

export function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [nombre, setNombre] = useState("");
  const [editandoId, setEditandoId] = useState(null);

  // Función para ordenar las categorías de menor a mayor (de más antigua a más nueva)
  const ordenarCategorias = (lista) => {
    return [...lista].sort((a, b) => {
      if (a.orden && b.orden) return a.orden - b.orden;
      return a.id - b.id; // Si no hay campo 'orden', ordena por ID ascendente
    });
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchCategorias() {
      try {
        const data = await obtenerCategorias();
        if (isMounted) {
          const lista = Array.isArray(data) ? data : data?.categorias || data?.data || [];
          setCategorias(ordenarCategorias(lista));
        }
      } catch (error) {
        console.error("Error al cargar categorías:", error);
      }
    }

    fetchCategorias();

    return () => {
      isMounted = false;
    };
  }, []);

  const recargarCategorias = async () => {
    try {
      const data = await obtenerCategorias();
      const lista = Array.isArray(data) ? data : data?.categorias || data?.data || [];
      setCategorias(ordenarCategorias(lista));
    } catch (error) {
      console.error("Error al recargar categorías:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombre.trim()) return;

    try {
      if (editandoId) {
        await actualizarCategoria(editandoId, {
          nombre,
        });
      } else {
        // Obtenemos el valor de 'orden' más alto existente en la lista
        const maxOrden = categorias.reduce((max, cat) => {
          const num = cat.orden || 0;
          return num > max ? num : max;
        }, 0);

        // Si existe un orden previo se le suma 1, de lo contrario se usa el total + 1
        const nuevoOrden = maxOrden > 0 ? maxOrden + 1 : categorias.length + 1;

        await crearCategoria({
          nombre,
          orden: nuevoOrden,
          activa: true
        });
      }

      setEditandoId(null);
      setNombre("");

      await recargarCategorias();
    } catch (error) {
      console.error("Error al guardar categoría:", error);
    }
  };

  const handleEditar = (cat) => {
    setEditandoId(cat.id);
    setNombre(cat.nombre);
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setNombre("");
  };

  const handleToggleActiva = async (id) => {
    const cat = categorias.find((c) => c.id === id);

    if (!cat) return;

    try {
      await actualizarCategoria(id, {
        activa: !cat.activa,
      });

      await recargarCategorias();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  const mover = (index, direccion) => {
    const nuevas = [...categorias];
    const targetIndex = index + direccion;

    if (targetIndex < 0 || targetIndex >= nuevas.length) {
      return;
    }

    const temp = nuevas[index];
    nuevas[index] = nuevas[targetIndex];
    nuevas[targetIndex] = temp;

    setCategorias(nuevas);
  };

  const categoriasActivas = categorias.filter(
    (cat) => cat.activa
  ).length;

  const categoriasInactivas = categorias.filter(
    (cat) => !cat.activa
  ).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">

      {/* ================= HEADER ================= */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-2xl">🏷️</span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Administración
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Categorías
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Administra las categorías disponibles para tus platillos.
            </p>
          </div>
        </div>
      </div>

      {/* ================= ESTADÍSTICAS ================= */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total
              </p>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                {categorias.length}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Categorías registradas
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-xl">
              📋
            </div>
          </div>
        </div>

        {/* Activas */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                Activas
              </p>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                {categoriasActivas}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Disponibles en el sistema
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-xl">
              ✓
            </div>
          </div>
        </div>

        {/* Inactivas */}
        <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-red-500">
                Inactivas
              </p>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                {categoriasInactivas}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                No disponibles
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-xl">
              ⛔
            </div>
          </div>
        </div>
      </div>

      {/* ================= FORMULARIO ================= */}
      <div
        className={`mb-8 overflow-hidden rounded-2xl border bg-white shadow-sm ${
          editandoId ? "border-amber-200" : "border-slate-200"
        }`}
      >
        <div
          className={`border-b px-6 py-4 ${
            editandoId
              ? "border-amber-100 bg-amber-50"
              : "border-slate-100 bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                editandoId
                  ? "bg-amber-100 text-amber-600"
                  : "bg-emerald-100 text-emerald-600"
              }`}
            >
              {editandoId ? "✏️" : "+"}
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-800">
                {editandoId ? "Editar categoría" : "Nueva categoría"}
              </h2>
              <p className="text-xs text-slate-500">
                {editandoId
                  ? "Modifica la información de la categoría."
                  : "Agrega una nueva categoría al menú."}
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 p-6 md:flex-row md:items-end"
        >
          <div className="flex-1">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Nombre de categoría
            </label>
            <input
              type="text"
              placeholder="Ej. Hamburguesas, Bebidas, Postres..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className={`rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition ${
                editandoId
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-emerald-500 hover:bg-emerald-600"
              }`}
            >
              {editandoId ? "Actualizar" : "Agregar categoría"}
            </button>

            {editandoId && (
              <button
                type="button"
                onClick={cancelarEdicion}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ================= LISTADO ================= */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Categorías registradas
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Organiza y administra las categorías del menú.
            </p>
          </div>

          <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
            {categorias.length} categorías
          </span>
        </div>

        <div className="p-4 md:p-6">
          {categorias.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
                🏷️
              </div>
              <h3 className="text-base font-bold text-slate-700">
                No hay categorías
              </h3>
              <p className="mt-1 max-w-sm text-sm text-slate-400">
                Crea tu primera categoría utilizando el formulario superior.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {categorias.map((cat, index) => {
                // El número visible siempre será el índice ordenado + 1 (#1, #2, #3...)
                const numeroPosicion = index + 1;

                return (
                  <div
                    key={cat.id || index}
                    className={`group flex flex-col gap-4 rounded-2xl border p-4 transition-all duration-200 md:flex-row md:items-center md:justify-between ${
                      cat.activa
                        ? "border-slate-200 bg-white hover:border-emerald-200 hover:shadow-md"
                        : "border-slate-200 bg-slate-50 opacity-70"
                    }`}
                  >
                    {/* Información */}
                    <div className="flex items-center gap-4">
                      {/* Posición correlativa */}
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                          cat.activa
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-200 text-slate-400"
                        }`}
                      >
                        #{numeroPosicion}
                      </div>

                      {/* Nombre */}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className={`font-bold ${
                              cat.activa ? "text-slate-800" : "text-slate-500"
                            }`}
                          >
                            {cat.nombre}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                              cat.activa
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {cat.activa ? "Activa" : "Inactiva"}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-400">
                          Categoría #{numeroPosicion}
                        </p>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => mover(index, -1)}
                        disabled={index === 0}
                        title="Mover arriba"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        onClick={() => mover(index, 1)}
                        disabled={index === categorias.length - 1}
                        title="Mover abajo"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ↓
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEditar(cat)}
                        className="rounded-lg bg-amber-50 px-4 py-2 text-xs font-bold text-amber-600 transition hover:bg-amber-100"
                      >
                        ✏️ Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleActiva(cat.id)}
                        className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                          cat.activa
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        }`}
                      >
                        {cat.activa ? "⛔ Desactivar" : "✓ Activar"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Categorias;