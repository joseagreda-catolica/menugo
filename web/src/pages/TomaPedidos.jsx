import { useState, useEffect } from "react";
import { obtenerCategorias, obtenerPlatillos } from "../Services/MenuService";
import CarritoPedido from "@/components/pedidos/CarritoPedido";

export default function TomaPedidos() {
  const [mesas, setMesas] = useState([]);
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [platillos, setPlatillos] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState("todas");
  const [carritoItems, setCarritoItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const API_URL = "http://localhost:3000/api";

  const obtenerMesaIdUrl = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("mesaId");
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let montado = true;

    const cargarDatosIniciales = async () => {
      try {
        setCargando(true);

        const resMesas = await fetch(`${API_URL}/mesas`).catch(() => null);
        const catsData = await obtenerCategorias().catch(() => []);
        const platsData = await obtenerPlatillos().catch(() => []);

        if (montado) {
          let listaMesas = [];
          if (resMesas && resMesas.ok) {
            const data = await resMesas.json();
            listaMesas = Array.isArray(data)
              ? data.filter((m) => m.activa !== false)
              : [];
          }
          setMesas(listaMesas);

          const mesaIdParam = obtenerMesaIdUrl();
          if (mesaIdParam) {
            const encontrada = listaMesas.find(
              (m) => String(m.id) === String(mesaIdParam)
            );
            if (encontrada) {
              setMesaSeleccionada(encontrada);
            } else if (listaMesas.length > 0) {
              setMesaSeleccionada(listaMesas[0]);
            }
          } else if (listaMesas.length > 0) {
            setMesaSeleccionada(listaMesas[0]);
          }

          const listaCats = Array.isArray(catsData)
            ? catsData
            : catsData?.data || [];
          setCategorias(listaCats);

          const listaPlats = Array.isArray(platsData)
            ? platsData
            : platsData?.data || [];
          setPlatillos(listaPlats.filter((p) => p.disponible !== false));
        }
      } catch (error) {
        console.error("Error al cargar datos en TomaPedidos:", error);
      } finally {
        if (montado) setCargando(false);
      }
    };

    cargarDatosIniciales();

    return () => {
      montado = false;
    };
  }, []);

  const platillosFiltrados =
    categoriaActiva === "todas"
      ? platillos
      : platillos.filter(
          (p) => String(p.categoriaId) === String(categoriaActiva)
        );

  const handleAgregarPlatillo = (platillo) => {
    if (!mesaSeleccionada) {
      alert("Por favor selecciona una mesa primero.");
      return;
    }

    setCarritoItems((prev) => {
      const existe = prev.find((item) => item.id === platillo.id);
      if (existe) {
        return prev.map((item) =>
          item.id === platillo.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prev, { ...platillo, cantidad: 1, nota: "" }];
    });
  };

  const handleUpdateCantidad = (id, delta) => {
    setCarritoItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, cantidad: item.cantidad + delta } : item
        )
        .filter((item) => item.cantidad > 0)
    );
  };

  const handleRemoveItem = (id) => {
    setCarritoItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateNota = (id, nota) => {
    setCarritoItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, nota } : item))
    );
  };

  // Enviar comanda e INSERTAR en pedido_linea de la BD
  const handleEnviarComanda = async () => {
    if (!mesaSeleccionada) {
      alert("Debes seleccionar una mesa.");
      return;
    }

    if (carritoItems.length === 0) {
      alert("El pedido está vacío.");
      return;
    }

    try {
      setEnviando(true);

      const payload = {
        mesaId: mesaSeleccionada.id,
        items: carritoItems.map((item) => ({
          id: item.id,
          cantidad: item.cantidad,
          precio: item.precio,
          nota: item.nota || "",
        })),
      };

      const res = await fetch(`${API_URL}/pedidos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const dataRespuesta = await res.json().catch(() => ({}));

      if (res.ok) {
        setMesas((prev) =>
          prev.map((m) =>
            m.id === mesaSeleccionada.id ? { ...m, estado: "ocupada" } : m
          )
        );

        alert(`🚀 Comanda guardada correctamente para la Mesa ${mesaSeleccionada.numero}`);
        setCarritoItems([]);
      } else {
        throw new Error(dataRespuesta.error || "No se pudo guardar la comanda.");
      }
    } catch (error) {
      console.error("Error al enviar la comanda:", error);
      alert(`Error al guardar en la base de datos: ${error.message}`);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Selector de Mesas */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <h2 className="text-sm font-bold text-gray-700 mb-3">
            1. Selecciona una Mesa
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {mesas.length > 0 ? (
              mesas.map((mesa) => (
                <button
                  key={mesa.id}
                  onClick={() => setMesaSeleccionada(mesa)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    mesaSeleccionada?.id === mesa.id
                      ? "bg-orange-500 text-white border-orange-500 shadow-sm scale-105"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      mesa.estado === "ocupada"
                        ? "bg-orange-400"
                        : "bg-emerald-400"
                    }`}
                  />
                  Mesa {mesa.numero} ({mesa.ubicacion || mesa.seccion || "Interior"})
                </button>
              ))
            ) : (
              <p className="text-xs text-gray-400">
                {cargando ? "Cargando mesas..." : "No hay mesas disponibles."}
              </p>
            )}
          </div>
        </div>

        {/* Categorías */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategoriaActiva("todas")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              categoriaActiva === "todas"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Todas
          </button>
          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoriaActiva(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                categoriaActiva === cat.id
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>

        {/* Listado de Platillos */}
        {cargando ? (
          <p className="text-xs text-gray-400 py-6 text-center">
            Cargando menú desde la base de datos...
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {platillosFiltrados.map((platillo) => (
              <div
                key={platillo.id}
                onClick={() => handleAgregarPlatillo(platillo)}
                className="bg-white rounded-xl border border-gray-100 p-3 shadow-2xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div className="relative h-28 w-full rounded-lg overflow-hidden mb-2 bg-gray-100 flex items-center justify-center">
                  {platillo.fotoUrl || platillo.imagen ? (
                    <img
                      src={platillo.fotoUrl || platillo.imagen}
                      alt={platillo.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <span className="text-2xl">🍽️</span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm line-clamp-1">
                    {platillo.nombre}
                  </h3>
                  <p className="text-xs text-orange-600 font-bold mt-1">
                    $
                    {typeof platillo.precio === "number"
                      ? platillo.precio.toFixed(2)
                      : platillo.precio}
                  </p>
                </div>
              </div>
            ))}
            {platillosFiltrados.length === 0 && (
              <p className="col-span-full text-center text-xs text-gray-400 py-6">
                No hay platillos disponibles en esta categoría.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Carrito de Comanda */}
      <div className="lg:col-span-1 h-[calc(100vh-6rem)] sticky top-6">
        <CarritoPedido
          mesaSeleccionada={mesaSeleccionada}
          items={carritoItems}
          enviando={enviando}
          onUpdateCantidad={handleUpdateCantidad}
          onRemoveItem={handleRemoveItem}
          onUpdateNota={handleUpdateNota}
          onEnviarComanda={handleEnviarComanda}
          onLimpiar={() => setCarritoItems([])}
        />
      </div>
    </div>
  );
}