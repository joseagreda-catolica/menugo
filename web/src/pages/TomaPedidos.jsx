import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { obtenerMesas } from "@/Services/mesasService";
import { obtenerCategorias, obtenerPlatillos } from "../Services/MenuService";
import { crearPedido } from "@/Services/pedidosService";

import CarritoPedido from "@/components/pedidos/CarritoPedido";

export default function TomaPedidos() {
  const [searchParams] = useSearchParams();
  const mesaIdParam = searchParams.get("mesaId");

  const [mesas, setMesas] = useState([]);
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);

  const [categorias, setCategorias] = useState([]);
  const [platillos, setPlatillos] = useState([]);

  const [categoriaActiva, setCategoriaActiva] = useState("todas");
  const [carritoItems, setCarritoItems] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // =========================================================
  // CARGAR MESAS, CATEGORÍAS Y PLATILLOS
  // =========================================================
  useEffect(() => {
    let montado = true;

    const cargarDatosIniciales = async () => {
      try {
        setCargando(true);

        const [mesasData, categoriasData, platillosData] =
          await Promise.all([
            obtenerMesas(),
            obtenerCategorias(),
            obtenerPlatillos(),
          ]);

        if (!montado) return;

        // -------------------------
        // MESAS
        // -------------------------
        const listaMesas = Array.isArray(mesasData)
          ? mesasData.filter((mesa) => mesa.activa !== false)
          : mesasData?.data
            ? mesasData.data.filter((mesa) => mesa.activa !== false)
            : [];

        setMesas(listaMesas);

        // Seleccionar mesa enviada desde MapaSalon
        if (mesaIdParam) {
          const encontrada = listaMesas.find(
            (mesa) => String(mesa.id) === String(mesaIdParam)
          );

          if (encontrada) {
            setMesaSeleccionada(encontrada);
          } else if (listaMesas.length > 0) {
            setMesaSeleccionada(listaMesas[0]);
          }
        } else if (listaMesas.length > 0) {
          setMesaSeleccionada(listaMesas[0]);
        }

        // -------------------------
        // CATEGORÍAS
        // -------------------------
        const listaCategorias = Array.isArray(categoriasData)
          ? categoriasData
          : categoriasData?.data || [];

        setCategorias(listaCategorias);

        // -------------------------
        // PLATILLOS
        // -------------------------
        const listaPlatillos = Array.isArray(platillosData)
          ? platillosData
          : platillosData?.data || [];

        setPlatillos(
          listaPlatillos.filter((platillo) => platillo.disponible !== false)
        );
      } catch (error) {
        console.error(
          "Error al cargar datos en TomaPedidos:",
          error
        );
      } finally {
        if (montado) {
          setCargando(false);
        }
      }
    };

    cargarDatosIniciales();

    return () => {
      montado = false;
    };
  }, [mesaIdParam]);

  // =========================================================
  // FILTRAR PLATILLOS POR CATEGORÍA
  // =========================================================
  const platillosFiltrados =
    categoriaActiva === "todas"
      ? platillos
      : platillos.filter(
          (platillo) =>
            String(platillo.categoriaId) === String(categoriaActiva)
        );

  // =========================================================
  // AGREGAR PLATILLO AL CARRITO
  // =========================================================
  const handleAgregarPlatillo = (platillo) => {
    if (!mesaSeleccionada) {
      alert("Por favor selecciona una mesa primero.");
      return;
    }

    setCarritoItems((prev) => {
      const existe = prev.find(
        (item) => item.id === platillo.id
      );

      if (existe) {
        return prev.map((item) =>
          item.id === platillo.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          ...platillo,
          cantidad: 1,
          nota: "",
        },
      ];
    });
  };

  // =========================================================
  // ACTUALIZAR CANTIDAD
  // =========================================================
  const handleUpdateCantidad = (id, delta) => {
    setCarritoItems((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? {
                ...item,
                cantidad: item.cantidad + delta,
              }
            : item
        )
        .filter((item) => item.cantidad > 0)
    );
  };

  // =========================================================
  // ELIMINAR ITEM
  // =========================================================
  const handleRemoveItem = (id) => {
    setCarritoItems((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };

  // =========================================================
  // ACTUALIZAR NOTA
  // =========================================================
  const handleUpdateNota = (id, nota) => {
    setCarritoItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              nota,
            }
          : item
      )
    );
  };

  // =========================================================
  // ENVIAR COMANDA
  // =========================================================
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

      // El backend espera solamente:
      // platilloId
      // cantidad
      // notaPreparacion
      const lineas = carritoItems.map((item) => ({
        platilloId: item.id,
        cantidad: item.cantidad,
        notaPreparacion: item.nota || "",
      }));

      // Crear pedido en PostgreSQL mediante el servicio
      await crearPedido(
        mesaSeleccionada.id,
        lineas
      );

      // Volver a cargar las mesas para obtener
      // el estado real actualizado desde el backend
      const mesasActualizadas = await obtenerMesas();

      const listaMesasActualizadas = Array.isArray(mesasActualizadas)
        ? mesasActualizadas.filter(
            (mesa) => mesa.activa !== false
          )
        : mesasActualizadas?.data
          ? mesasActualizadas.data.filter(
              (mesa) => mesa.activa !== false
            )
          : [];

      setMesas(listaMesasActualizadas);

      // Actualizar también la mesa seleccionada
      const mesaActualizada =
        listaMesasActualizadas.find(
          (mesa) =>
            String(mesa.id) ===
            String(mesaSeleccionada.id)
        );

      if (mesaActualizada) {
        setMesaSeleccionada(mesaActualizada);
      }

      alert(
        `Comanda enviada a cocina para la Mesa ${mesaSeleccionada.numero}`
      );

      // Limpiar carrito
      setCarritoItems([]);
    } catch (error) {
      console.error(
        "Error al enviar la comanda:",
        error
      );

      alert(
        `No se pudo enviar la comanda: ${
          error?.message || "Error desconocido"
        }`
      );
    } finally {
      setEnviando(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* =====================================================
          PARTE IZQUIERDA
      ====================================================== */}
      <div className="lg:col-span-2 space-y-6">

        {/* ===================================================
            SELECTOR DE MESAS
        ==================================================== */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">

          <h2 className="text-sm font-bold text-gray-700 mb-3">
            1. Selecciona una Mesa
          </h2>

          <div className="flex gap-2 overflow-x-auto pb-1">

            {mesas.length > 0 ? (
              mesas.map((mesa) => (

                <button
                  key={mesa.id}
                  onClick={() =>
                    setMesaSeleccionada(mesa)
                  }
                  className={`
                    px-4 py-2
                    rounded-xl
                    text-xs
                    font-bold
                    transition-all
                    border
                    shrink-0
                    cursor-pointer
                    flex
                    items-center
                    gap-1.5

                    ${
                      mesaSeleccionada?.id === mesa.id
                        ? "bg-orange-500 text-white border-orange-500 shadow-sm scale-105"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }
                  `}
                >

                  <span
                    className={`
                      h-2
                      w-2
                      rounded-full

                      ${
                        mesa.estado === "ocupada" ||
                        mesa.estado === "pedido_en_curso" ||
                        mesa.estado === "pendiente_cobro"
                          ? "bg-orange-400"
                          : "bg-emerald-400"
                      }
                    `}
                  />

                  Mesa {mesa.numero}

                  {" "}
                  (
                    {mesa.ubicacion ||
                      mesa.seccion ||
                      "Interior"}
                  )

                </button>

              ))
            ) : (
              <p className="text-xs text-gray-400">
                {cargando
                  ? "Cargando mesas..."
                  : "No hay mesas disponibles."}
              </p>
            )}

          </div>
        </div>

        {/* ===================================================
            CATEGORÍAS
        ==================================================== */}
        <div className="flex gap-2 overflow-x-auto pb-1">

          <button
            onClick={() =>
              setCategoriaActiva("todas")
            }
            className={`
              px-3
              py-1.5
              rounded-lg
              text-xs
              font-semibold
              transition-colors
              shrink-0
              cursor-pointer

              ${
                categoriaActiva === "todas"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }
            `}
          >
            Todas
          </button>

          {categorias.map((categoria) => (

            <button
              key={categoria.id}
              onClick={() =>
                setCategoriaActiva(categoria.id)
              }
              className={`
                px-3
                py-1.5
                rounded-lg
                text-xs
                font-semibold
                transition-colors
                shrink-0
                cursor-pointer

                ${
                  categoriaActiva === categoria.id
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }
              `}
            >
              {categoria.nombre}
            </button>

          ))}

        </div>

        {/* ===================================================
            LISTADO DE PLATILLOS
        ==================================================== */}
        {cargando ? (

          <p className="text-xs text-gray-400 py-6 text-center">
            Cargando menú desde la base de datos...
          </p>

        ) : (

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

            {platillosFiltrados.map((platillo) => (

              <div
                key={platillo.id}
                onClick={() =>
                  handleAgregarPlatillo(platillo)
                }
                className="
                  bg-white
                  rounded-xl
                  border
                  border-gray-100
                  p-3
                  shadow-sm
                  hover:shadow-md
                  cursor-pointer
                  transition-all
                  flex
                  flex-col
                  justify-between
                  group
                "
              >

                {/* IMAGEN */}
                <div
                  className="
                    relative
                    h-28
                    w-full
                    rounded-lg
                    overflow-hidden
                    mb-2
                    bg-gray-100
                    flex
                    items-center
                    justify-center
                  "
                >

                  {platillo.fotoUrl ? (

                    <img
                      src={platillo.fotoUrl}
                      alt={platillo.nombre}
                      className="
                        w-full
                        h-full
                        object-cover
                        group-hover:scale-105
                        transition-transform
                        duration-200
                      "
                    />

                  ) : (

                    <span className="text-2xl">
                      🍽️
                    </span>

                  )}

                </div>

                {/* INFORMACIÓN */}
                <div>

                  <h3
                    className="
                      font-bold
                      text-gray-800
                      text-sm
                      line-clamp-1
                    "
                  >
                    {platillo.nombre}
                  </h3>

                  <p
                    className="
                      text-xs
                      text-orange-600
                      font-bold
                      mt-1
                    "
                  >
                    $
                    {typeof platillo.precio === "number"
                      ? platillo.precio.toFixed(2)
                      : Number(platillo.precio || 0).toFixed(2)}
                  </p>

                </div>

              </div>

            ))}

            {platillosFiltrados.length === 0 && (

              <p
                className="
                  col-span-full
                  text-center
                  text-xs
                  text-gray-400
                  py-6
                "
              >
                No hay platillos disponibles
                en esta categoría.
              </p>

            )}

          </div>

        )}

      </div>

      {/* =====================================================
          CARRITO
      ====================================================== */}
      <div className="lg:col-span-1 h-[calc(100vh-6rem)] sticky top-6">

        <CarritoPedido
          mesaSeleccionada={mesaSeleccionada}
          items={carritoItems}
          enviando={enviando}
          onUpdateCantidad={handleUpdateCantidad}
          onRemoveItem={handleRemoveItem}
          onUpdateNota={handleUpdateNota}
          onEnviarComanda={handleEnviarComanda}
          onLimpiar={() =>
            setCarritoItems([])
          }
        />

      </div>

    </div>
  );
}