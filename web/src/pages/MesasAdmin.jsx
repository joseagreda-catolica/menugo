import { useState, useEffect } from 'react';

export default function MesasAdmin() {
  const [mesas, setMesas] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Disparador de recarga limpia
  const [recargar, setRecargar] = useState(0);

  // Formulario
  const [numero, setNumero] = useState('');
  const [capacidad, setCapacidad] = useState(4);
  const [ubicacion, setUbicacion] = useState('Interior');
  const [mesaEditando, setMesaEditando] = useState(null);

  const API_URL = 'http://localhost:3000/api';

  useEffect(() => {
    let montado = true;

    const obtenerDatos = async () => {
      setCargando(true);
      try {
        const [resMesas, resSecs] = await Promise.all([
          fetch(`${API_URL}/mesas`),
          fetch(`${API_URL}/secciones`),
        ]);

        if (resMesas.ok && montado) {
          const dataMesas = await resMesas.json();
          setMesas(Array.isArray(dataMesas) ? dataMesas : []);
        }

        if (resSecs.ok && montado) {
          const dataSecs = await resSecs.json();
          setSecciones(Array.isArray(dataSecs) ? dataSecs : []);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        if (montado) setCargando(false);
      }
    };

    obtenerDatos();

    return () => {
      montado = false;
    };
  }, [recargar]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!String(numero).trim()) {
      alert('Ingresa el número de mesa');
      return;
    }

    try {
      setGuardando(true);

      const payload = {
        numero, // El backend lo convertirá automáticamente a Int
        capacidad: Number(capacidad),
        ubicacion: String(ubicacion),
        activa: true,
      };

      const url = mesaEditando
        ? `${API_URL}/mesas/${mesaEditando.id}`
        : `${API_URL}/mesas`;

      const method = mesaEditando ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const dataRespuesta = await res.json().catch(() => ({}));

      if (!res.ok) {
        let textoError = 'Error al comunicarse con el servidor.';
        if (typeof dataRespuesta.error === 'string') {
          textoError = dataRespuesta.error;
        } else if (typeof dataRespuesta.message === 'string') {
          textoError = dataRespuesta.message;
        } else if (dataRespuesta.error && typeof dataRespuesta.error.message === 'string') {
          textoError = dataRespuesta.error.message;
        }
        throw new Error(textoError);
      }

      // Limpiar formulario y forzar recarga
      setNumero('');
      setCapacidad(4);
      setUbicacion('Interior');
      setMesaEditando(null);
      setRecargar((prev) => prev + 1);
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      alert(`No se pudo guardar la mesa: ${error.message}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (mesa) => {
    setMesaEditando(mesa);
    setNumero(mesa.numero);
    setCapacidad(mesa.capacidad || 4);
    setUbicacion(mesa.ubicacion || mesa.seccion || 'Interior');
  };

  const handleToggleEstado = async (mesa) => {
    try {
      const res = await fetch(`${API_URL}/mesas/${mesa.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activa: !mesa.activa }),
      });

      if (res.ok) {
        setRecargar((prev) => prev + 1);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Error al cambiar estado: ${errData.error || 'Error en servidor'}`);
      }
    } catch (error) {
      console.error('Error al cambiar el estado:', error);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Deseas eliminar esta mesa?')) return;

    try {
      const res = await fetch(`${API_URL}/mesas/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setRecargar((prev) => prev + 1);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`No se pudo eliminar: ${errData.error || 'Error en el servidor'}`);
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Administración de Mesas
          </h1>
          <p className="text-xs text-gray-500">
            Gestiona la asignación y estado de las mesas en tu restaurante.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 h-fit"
        >
          <h2 className="text-sm font-bold text-gray-800">
            {mesaEditando ? 'Editar Mesa' : 'Agregar Nueva Mesa'}
          </h2>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">
              Número de Mesa
            </label>
            <input
              type="number"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="Ej. 1, 2, 9"
              min="1"
              className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">
              Capacidad (Personas)
            </label>
            <input
              type="number"
              value={capacidad}
              onChange={(e) => setCapacidad(e.target.value)}
              min="1"
              className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">
              Ubicación / Sección
            </label>
            <select
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {secciones.length > 0 ? (
                secciones.map((sec) => (
                  <option key={sec.id} value={sec.nombre}>
                    {sec.nombre}
                  </option>
                ))
              ) : (
                <>
                  <option value="Interior">Interior</option>
                  <option value="Terraza">Terraza</option>
                  <option value="VIP">VIP</option>
                  <option value="Barra">Barra</option>
                </>
              )}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 bg-orange-500 text-white font-bold py-2 rounded-xl text-xs hover:bg-orange-600 transition cursor-pointer disabled:opacity-50"
            >
              {guardando
                ? 'Guardando...'
                : mesaEditando
                ? 'Actualizar'
                : 'Crear Mesa'}
            </button>
            {mesaEditando && (
              <button
                type="button"
                onClick={() => {
                  setMesaEditando(null);
                  setNumero('');
                  setCapacidad(4);
                  setUbicacion('Interior');
                }}
                className="px-3 py-2 border rounded-xl text-xs text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        {/* Listado */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <h2 className="text-sm font-bold text-gray-800 mb-4">
            Listado de Mesas ({mesas.length})
          </h2>

          {cargando ? (
            <p className="text-xs text-gray-400 py-6 text-center">
              Cargando mesas desde la base de datos...
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mesas.map((m) => (
                <div
                  key={m.id}
                  className="p-3 border rounded-xl flex items-center justify-between bg-gray-50/50 hover:bg-white transition-all"
                >
                  <div>
                    <p className="font-bold text-sm text-gray-900">
                      Mesa {m.numero}
                    </p>
                    <p className="text-xs text-gray-500">
                      {m.ubicacion || 'Interior'} • {m.capacidad} pers.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleEstado(m)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        m.activa
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                      }`}
                    >
                      {m.activa ? 'Activa' : 'Inactiva'}
                    </button>
                    <button
                      onClick={() => handleEditar(m)}
                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-300 cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(m.id)}
                      className="px-2 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              {mesas.length === 0 && (
                <p className="col-span-full text-xs text-gray-400 text-center py-6">
                  No hay mesas registradas en la base de datos.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}