export const MOCK_CATEGORIAS = [
  { id: '1', nombre: 'Entradas' },
  { id: '2', nombre: 'Platos Fuertes' },
  { id: '3', nombre: 'Bebidas' },
  { id: '4', nombre: 'Postres' }
]

export const MOCK_PLATILLOS = [
  {
    id: '101',
    categoriaId: '1',
    nombre: 'Nachos Supremos',
    descripcion: 'Totopos crujientes con queso fundido, frijoles y guacamole.',
    precio: 6.50,
    disponible: true,
    imagen: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400'
  },
  {
    id: '102',
    categoriaId: '2',
    nombre: 'Hamburguesa MenúGo',
    descripcion: 'Carne 100% de res, queso cheddar, tocino y papas a la francesa.',
    precio: 8.99,
    disponible: true,
    imagen: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'
  },
  {
    id: '103',
    categoriaId: '3',
    nombre: 'Limonada Mineral',
    descripcion: 'Limonada natural preparada con agua mineral de manantial.',
    precio: 2.50,
    disponible: true,
    imagen: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400'
  }
]