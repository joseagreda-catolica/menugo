export default function Boton({ 
  children, 
  variant = 'primary', 
  type = 'button', 
  onClick, 
  className = '',
  ...props 
}) {
  const variants = {
    primary: 'bg-primary text-white hover:opacity-90',
    secondary: 'bg-secondary text-white hover:opacity-90',
    danger: 'bg-danger text-white hover:opacity-90',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-lg py-sm rounded-sm font-medium transition-colors ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}