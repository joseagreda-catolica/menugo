import { ESTADOS_MESA } from '@/Services/mesasService'

export default function MesaCard({ mesa, onClick, onEditar }) {
  const configEstado = ESTADOS_MESA[mesa.estado] || ESTADOS_MESA.libre

  return (
    <div
      onClick={() => onClick(mesa)}
      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md relative group flex flex-col justify-between h-40 ${configEstado.color}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider opacity-75">
            {mesa.seccion}
          </span>
          <h3 className="text-xl font-black mt-0.5">{mesa.numero}</h3>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onEditar(mesa)
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white text-gray-700 text-xs px-2 py-1 rounded-md font-semibold shadow-xs"
        >
          Editar
        </button>
      </div>

      <div className="flex items-center justify-between border-t border-current/15 pt-3">
        <span className="text-xs font-medium flex items-center gap-1">
          👥 Cap: <strong className="font-bold">{mesa.capacidad} pers.</strong>
        </span>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/70 backdrop-blur-xs shadow-2xs">
          {configEstado.etiqueta}
        </span>
      </div>
    </div>
  )
}