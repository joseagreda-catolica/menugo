import { useState } from 'react'

const aCentavos = (valor) => Math.round(Number(valor) * 100)
const dinero = (centavos) => `$${(centavos / 100).toFixed(2)}`

// Misma regla que el servidor: los centavos que sobran van a las primeras partes.
function repartirIgual(totalCentavos, partes) {
  const base = Math.floor(totalCentavos / partes)
  const sobrante = totalCentavos - base * partes
  return Array.from({ length: partes }, (_, i) => base + (i < sobrante ? 1 : 0))
}

// RF-22: divide la cuenta entre varios comensales, por partes iguales o asignando
// platillos concretos a cada comensal.
export default function DividirCuenta({ cuenta, lineas, procesando, onConfirmar, onCancelar }) {
  const [modo, setModo] = useState('partes_iguales')
  const [partes, setPartes] = useState('2')
  const [comensales, setComensales] = useState('2')
  const [asignacion, setAsignacion] = useState({}) // id de linea -> numero de comensal

  const totalCentavos = aCentavos(cuenta.total)
  const numPartes = Math.min(20, Math.max(0, Math.floor(Number(partes) || 0)))
  const numComensales = Math.min(10, Math.max(2, Math.floor(Number(comensales) || 2)))

  // Vista previa de lo que pagaria cada uno.
  let resumen = []
  let sinAsignar = 0
  if (modo === 'partes_iguales') {
    if (numPartes >= 2) {
      resumen = repartirIgual(totalCentavos, numPartes).map((c, i) => ({ nombre: `Comensal ${i + 1}`, centavos: c }))
    }
  } else {
    const porComensal = new Map()
    for (const linea of lineas) {
      const comensal = Number(asignacion[linea.id])
      if (!comensal || comensal > numComensales) {
        sinAsignar += 1
        continue
      }
      porComensal.set(comensal, (porComensal.get(comensal) || 0) + linea.cantidad * aCentavos(linea.precioUnitario))
    }
    resumen = [...porComensal.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([n, centavos]) => ({ nombre: `Comensal ${n}`, centavos, numero: n }))
  }

  const puedeDividir =
    modo === 'partes_iguales' ? numPartes >= 2 : sinAsignar === 0 && resumen.length >= 2

  const confirmar = () => {
    if (modo === 'partes_iguales') {
      onConfirmar({ modo: 'partes_iguales', partes: numPartes })
      return
    }
    const grupos = resumen.map((r) => ({
      etiqueta: r.nombre,
      lineaIds: lineas.filter((l) => Number(asignacion[l.id]) === r.numero).map((l) => l.id),
    }))
    onConfirmar({ modo: 'por_lineas', grupos })
  }

  return (
    <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">Dividir la cuenta</h3>
        <button type="button" onClick={onCancelar} className="text-xs font-semibold text-gray-500 hover:text-gray-700 cursor-pointer">
          Cancelar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { id: 'partes_iguales', label: 'Partes iguales' },
          { id: 'por_lineas', label: 'Por platillos' },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setModo(m.id)}
            className={`rounded-xl border py-2 text-xs font-bold transition-all cursor-pointer ${
              modo === m.id ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {modo === 'partes_iguales' ? (
        <div>
          <label htmlFor="num-partes" className="mb-1 block text-xs font-bold uppercase text-gray-600">
            ¿Entre cuántos comensales?
          </label>
          <input
            id="num-partes"
            type="number"
            min="2"
            max="20"
            value={partes}
            onChange={(e) => setPartes(e.target.value)}
            className="w-24 rounded-xl border border-gray-300 px-3 py-2 text-sm font-bold"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label htmlFor="num-comensales" className="mb-1 block text-xs font-bold uppercase text-gray-600">
              Número de comensales
            </label>
            <input
              id="num-comensales"
              type="number"
              min="2"
              max="10"
              value={comensales}
              onChange={(e) => setComensales(e.target.value)}
              className="w-24 rounded-xl border border-gray-300 px-3 py-2 text-sm font-bold"
            />
          </div>

          <ul className="space-y-2">
            {lineas.map((linea) => (
              <li key={linea.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 bg-white p-2.5">
                <div className="min-w-0 text-xs font-semibold text-gray-800">
                  <span className="mr-1 rounded bg-gray-200 px-1.5 py-0.5 font-extrabold">{linea.cantidad}x</span>
                  {linea.platillo?.nombre}
                  <span className="ml-1 font-bold text-emerald-600">{dinero(linea.cantidad * aCentavos(linea.precioUnitario))}</span>
                </div>
                <select
                  aria-label={`Asignar ${linea.platillo?.nombre}`}
                  value={asignacion[linea.id] || ''}
                  onChange={(e) => setAsignacion((previa) => ({ ...previa, [linea.id]: e.target.value }))}
                  className="shrink-0 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs"
                >
                  <option value="">Asignar a…</option>
                  {Array.from({ length: numComensales }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Comensal {i + 1}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
          {sinAsignar > 0 && (
            <p className="text-xs font-semibold text-amber-700">
              Faltan {sinAsignar} {sinAsignar === 1 ? 'platillo' : 'platillos'} por asignar.
            </p>
          )}
        </div>
      )}

      {resumen.length > 0 && (
        <ul className="space-y-1 rounded-xl bg-white p-3 text-sm">
          {resumen.map((r) => (
            <li key={r.nombre} className="flex justify-between">
              <span className="text-gray-600">{r.nombre}</span>
              <span className="font-bold text-gray-800">{dinero(r.centavos)}</span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        disabled={!puedeDividir || procesando}
        onClick={confirmar}
        className="w-full cursor-pointer rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {procesando ? 'Dividiendo...' : 'Dividir cuenta'}
      </button>
    </div>
  )
}
