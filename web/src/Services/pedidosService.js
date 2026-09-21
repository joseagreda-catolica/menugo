export const MOCK_PEDIDOS_INICIALES = [
  {
    id: 'PED-001',
    mesaId: '2',
    mesaNumero: 'Mesa 2',
    estado: 'en_preparacion', // 'pendiente' | 'en_preparacion' | 'servido' | 'pagado'
    items: [
      { id: '102', nombre: 'Hamburguesa MenúGo', cantidad: 2, precio: 8.99, nota: 'Sin cebolla' }
    ],
    total: 17.98,
    fecha: new Date().toISOString()
  }
]