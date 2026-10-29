import { formatearCronometro } from '@/utils/formatearCronometro'

const configEstado = {
  pendiente: {
    badge: 'bg-amber-100 text-amber-800',
    etiqueta: 'Pendiente',
    siguiente: 'en_preparacion',
    btnTexto: 'Empezar Preparación 🍳',
    btnColor: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  en_preparacion: {
    badge: 'bg-blue-100 text-blue-800',
    etiqueta: 'En Preparación',
    siguiente: 'listo',
    btnTexto: 'Marcar Listo 🍏',
    btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  listo: {
    badge: 'bg-emerald-100 text-emerald-800',
    etiqueta: 'Listo para Servir',
    siguiente: 'entregado',
    btnTexto: 'Marcar Entregado 🍽️',
    btnColor: 'bg-slate-700 hover:bg-slate-800 text-white',
  },
}

// Una tarjeta por mesa (RF-17): reune todos sus platillos pendientes. Si algun platillo
// lleva esperando mas del umbral configurado por el administrador, la tarjeta se
// destaca en rojo (RF-20).
export default function ComandaMesaCard({ comanda, ahora, umbralMin, onCambiarEstado }) {
  const enCocina = Number.isFinite(comanda.desdeEnCocina)
  const referencia = enCocina ? comanda.desdeEnCocina : comanda.desde
  const esperaMs = Math.max(0, ahora - referencia)
  const atrasada = enCocina && esperaMs >= umbralMin * 60000

  return (
    <div
      className={`flex flex-col rounded-2xl border-2 p-4 shadow-sm transition-all ${
        atrasada ? 'border-red-400 bg-red-50/60' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
        <span className="text-xl font-extrabold text-slate-800">Mesa {comanda.mesaNumero}</span>
        <div className="flex items-center gap-2">
          {atrasada && (
            <span className="rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
              Atrasada
            </span>
          )}
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${
              atrasada ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
            }`}
            title="Tiempo desde que se pidió (min:seg)"
          >
            ⏱ {formatearCronometro(esperaMs)}
          </span>
        </div>
      </div>

      <ul className="space-y-3">
        {comanda.lineas.map((linea) => {
          const config = configEstado[linea.estado] || configEstado.pendiente
          return (
            <li key={linea.id} className="rounded-xl border border-slate-200/80 bg-white/80 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2 text-sm font-semibold text-slate-800">
                  <span className="shrink-0 rounded bg-slate-200/80 px-2 py-0.5 text-xs font-extrabold text-slate-900">
                    {linea.cantidad}x
                  </span>
                  <span className="break-words">{linea.nombre || 'Platillo'}</span>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${config.badge}`}>
                  {config.etiqueta}
                </span>
              </div>

              {linea.nota && (
                <p className="mt-2 rounded-lg border border-amber-200/60 bg-amber-50/80 p-2 text-xs italic text-amber-700">
                  "{linea.nota}"
                </p>
              )}

              <button
                onClick={() => onCambiarEstado(linea.id, config.siguiente)}
                className={`mt-3 w-full cursor-pointer rounded-xl px-4 py-2 text-xs font-bold shadow-sm transition-colors ${config.btnColor}`}
              >
                {config.btnTexto}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
