export const MOCK_SECCIONES = ['Principal', 'Terraza', 'Bar', 'VIP']

export const MOCK_MESAS = [
  { id: '1', numero: 'Mesa 1', capacidad: 4, estado: 'libre', seccion: 'Principal' },
  { id: '2', numero: 'Mesa 2', capacidad: 2, estado: 'ocupada', seccion: 'Principal' },
  { id: '3', numero: 'Mesa 3', capacidad: 6, estado: 'cuenta', seccion: 'Principal' },
  { id: '4', numero: 'T-01', capacidad: 4, estado: 'reservada', seccion: 'Terraza' },
  { id: '5', numero: 'Barra 1', capacidad: 2, estado: 'libre', seccion: 'Bar' },
  { id: '6', numero: 'VIP 1', capacidad: 8, estado: 'ocupada', seccion: 'VIP' }
]

export const ESTADOS_MESA = {
  libre: { etiqueta: 'Libre', color: 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200' },
  ocupada: { etiqueta: 'Ocupada', color: 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200' },
  cuenta: { etiqueta: 'Pedida Cuenta', color: 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200' },
  reservada: { etiqueta: 'Reservada', color: 'bg-sky-100 text-sky-800 border-sky-300 hover:bg-sky-200' }
}