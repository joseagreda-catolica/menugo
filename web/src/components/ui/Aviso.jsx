export default function Aviso({ tipo = 'info', mensaje }) {
  const tipos = {
    success: 'bg-green-50 text-success border-success',
    warning: 'bg-yellow-50 text-amber-700 border-warning',
    danger: 'bg-red-50 text-danger border-danger',
    info: 'bg-blue-50 text-blue-700 border-blue-400'
  }

  return (
    <div className={`p-md rounded-sm border-l-4 font-medium text-sm my-xs ${tipos[tipo]}`}>
      {mensaje}
    </div>
  )
}