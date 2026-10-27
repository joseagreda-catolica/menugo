import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { obtenerMesas } from '@/Services/mesasService'

const CLAVE_URL_PUBLICA = 'menugo_url_publica'

function direccionInicial() {
  try {
    return localStorage.getItem(CLAVE_URL_PUBLICA) || window.location.origin
  } catch {
    return window.location.origin
  }
}

// RF-10: un codigo QR unico por mesa que abre la carta publica con ?mesa=N. Se genera en el
// navegador, se puede descargar como imagen y se imprime con lineas de corte.
export default function CodigosQR() {
  const [mesas, setMesas] = useState([])
  const [direccion, setDireccion] = useState(direccionInicial)
  const [codigos, setCodigos] = useState({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    obtenerMesas()
      .then((datos) => {
        const lista = Array.isArray(datos) ? datos : datos?.data || []
        setMesas(lista.filter((m) => m.activa !== false))
      })
      .catch((err) => {
        console.error(err)
        setError('No se pudieron cargar las mesas.')
      })
      .finally(() => setCargando(false))
  }, [])

  const base = direccion.trim().replace(/\/+$/, '')
  const direccionValida = /^https?:\/\/[^\s/]+/i.test(base)
  // Cada imagen se guarda con la direccion exacta que codifica: asi nunca se muestra ni se
  // imprime un codigo de una direccion anterior mientras se corrige la actual.
  const urlDeMesa = (numero) => `${base}/carta-publica?mesa=${numero}`
  const imagenDe = (numero) => (direccionValida ? codigos[urlDeMesa(numero)] : undefined)
  const todosListos = mesas.length > 0 && mesas.every((m) => imagenDe(m.numero))

  useEffect(() => {
    if (!direccionValida || mesas.length === 0) return undefined
    let vigente = true
    Promise.all(
      mesas.map((mesa) =>
        QRCode.toDataURL(`${base}/carta-publica?mesa=${mesa.numero}`, {
          width: 480,
          margin: 2,
          errorCorrectionLevel: 'M',
        }).then((imagen) => [`${base}/carta-publica?mesa=${mesa.numero}`, imagen])
      )
    )
      .then((pares) => {
        if (vigente) setCodigos(Object.fromEntries(pares))
      })
      .catch((err) => {
        console.error(err)
        if (vigente) setError('No se pudieron generar los códigos QR.')
      })
    return () => {
      vigente = false
    }
  }, [mesas, base, direccionValida])

  const cambiarDireccion = (valor) => {
    setDireccion(valor)
    try {
      localStorage.setItem(CLAVE_URL_PUBLICA, valor)
    } catch {
      // sin almacenamiento disponible: el valor solo dura mientras la pagina siga abierta
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="print:hidden space-y-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Códigos QR de las mesas 🔳</h1>
            <p className="text-sm text-gray-500">
              Cada código abre la carta digital en el celular del cliente y la identifica con su mesa.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!todosListos}
            className="cursor-pointer rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            🖨️ Imprimir todos
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <label htmlFor="direccion-publica" className="mb-1 block text-xs font-bold uppercase text-gray-600">
            Dirección pública del sistema
          </label>
          <input
            id="direccion-publica"
            type="text"
            value={direccion}
            onChange={(e) => cambiarDireccion(e.target.value)}
            placeholder="http://192.168.1.10:5173"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-2 text-xs text-gray-500">
            Es la dirección que abrirá el celular del cliente. Con <strong>localhost</strong> el código solo
            funciona en esta computadora: para usarlo desde un celular en la misma red escribe la IP de esta
            computadora (por ejemplo http://192.168.1.10:5173) o la dirección donde esté publicado el sistema.
          </p>
          {!direccionValida && (
            <p className="mt-2 text-xs font-semibold text-red-600" role="alert">
              Escribe una dirección que empiece con http:// o https://
            </p>
          )}
        </div>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        )}
      </div>

      {cargando ? (
        <p className="py-16 text-center text-sm font-medium text-gray-400 print:hidden">Cargando mesas...</p>
      ) : mesas.length === 0 ? (
        <p className="py-16 text-center text-sm font-medium text-gray-400 print:hidden">No hay mesas registradas.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 print:grid-cols-2 print:gap-0">
          {mesas.map((mesa) => (
            <div
              key={mesa.id}
              className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm print:break-inside-avoid print:rounded-none print:border-dashed print:border-gray-400 print:shadow-none"
            >
              <h2 className="text-2xl font-extrabold text-gray-800">Mesa {mesa.numero}</h2>
              <p className="mb-3 text-xs text-gray-500">{mesa.ubicacion || mesa.seccion}</p>

              {imagenDe(mesa.numero) ? (
                <img
                  src={imagenDe(mesa.numero)}
                  alt={`Código QR de la mesa ${mesa.numero}`}
                  className="h-48 w-48 print:h-64 print:w-64"
                />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center rounded-xl bg-gray-100 text-xs text-gray-400 print:h-64 print:w-64">
                  {direccionValida ? 'Generando...' : 'Sin dirección'}
                </div>
              )}

              <p className="mt-3 text-sm font-semibold text-gray-700">Escanea para ver la carta</p>
              <p className="mt-1 break-all text-[10px] text-gray-400 print:hidden">
                {direccionValida ? urlDeMesa(mesa.numero) : ''}
              </p>

              {imagenDe(mesa.numero) && (
                <a
                  href={imagenDe(mesa.numero)}
                  download={`mesa-${mesa.numero}-qr.png`}
                  className="mt-3 inline-block cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50 print:hidden"
                >
                  ⬇️ Descargar PNG
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
