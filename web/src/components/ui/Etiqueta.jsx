export default function Etiqueta({ children, estado = 'success' }) {
  const estados = {
    success: 'bg-green-100 text-success border-green-200',
    warning: 'bg-yellow-100 text-amber-700 border-yellow-200',
    danger: 'bg-red-100 text-danger border-red-200',
    secondary: 'bg-gray-100 text-secondary border-gray-200'
  }

  return (
    <span className={`px-sm py-1 border text-xs font-semibold rounded-full inline-block ${estados[estado]}`}>
      {children}
    </span>
  )
}