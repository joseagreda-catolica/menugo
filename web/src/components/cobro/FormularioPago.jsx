import { useState } from 'react'

const FORMAS = [
  { id: 'efectivo', icono: '💵', label: 'Efectivo' },
  { id: 'tarjeta', icono: '💳', label: 'Tarjeta' },
  { id: 'otro', icono: '📱', label: 'Otro' },
]

const aCentavos = (valor) => Math.round(Number(valor) * 100)

// Forma de pago, efectivo recibido y vuelto para cobrar un monto (la cuenta completa o una
// de sus partes). El monto lo vuelve a calcular el servidor: aqui solo sirve para el vuelto.
export default function FormularioPago({ monto, textoBoton, procesando, onConfirmar }) {
  const [forma, setForma] = useState('efectivo')
  const [recibido, setRecibido] = useState('')

  const recibidoNum = Number(recibido || 0)
  const cambio = forma === 'efectivo' ? Math.max(0, recibidoNum - monto) : 0

  const enviar = (e) => {
    e.preventDefault()
    if (forma === 'efectivo' && aCentavos(recibidoNum) < aCentavos(monto)) {
      alert('El monto ingresado es inferior al total de la cuenta.')
      return
    }
    onConfirmar(forma)
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-600 uppercase">Forma de Pago</label>
        <div className="grid grid-cols-3 gap-2">
          {FORMAS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setForma(m.id)}
              aria-pressed={forma === m.id}
              className={`flex flex-col items-center gap-0.5 py-2 px-1 text-[11px] font-bold rounded-xl border transition-all cursor-pointer ${
                forma === m.id
                  ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className="text-base leading-none" aria-hidden="true">
                {m.icono}
              </span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {forma === 'efectivo' && (
        <div className="space-y-3 pt-1">
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Efectivo Recibido ($)</label>
            <input
              type="number"
              step="0.01"
              min={monto}
              placeholder={monto.toFixed(2)}
              value={recibido}
              onChange={(e) => setRecibido(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800 text-lg"
              required
            />
          </div>

          <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl text-emerald-800 text-sm font-bold">
            <span>Cambio / Vueltas:</span>
            <span className="text-lg">${cambio.toFixed(2)}</span>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={procesando}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 cursor-pointer"
      >
        {procesando ? 'Procesando Pago...' : textoBoton}
      </button>
    </form>
  )
}
