const API_URL = 'http://localhost:3000/api' // Ajusta el puerto o base de tu backend si varía

// ==========================================
// SERVICIOS PARA COCINA (KDS)
// ==========================================

// Obtener comandas activas para la pantalla de cocina
export async function getPedidosCocina() {
  const response = await fetch(`${API_URL}/pedidos`)
  if (!response.ok) {
    throw new Error('Error al consultar las comandas de cocina')
  }
  return await response.json()
}

// Actualizar el estado de un platillo individual (PedidoLinea)
export async function cambiarEstadoLinea(lineaId, nuevoEstado) {
  const response = await fetch(`${API_URL}/pedidos/lineas/${lineaId}/estado`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado: nuevoEstado }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Error al actualizar el estado del platillo')
  }

  return await response.json()
}

// Actualizar el estado de la comanda general (Pedido)
export async function cambiarEstadoPedido(pedidoId, nuevoEstado) {
  const response = await fetch(`${API_URL}/pedidos/${pedidoId}/estado`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado: nuevoEstado }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Error al actualizar el estado del pedido')
  }

  return await response.json()
}

// ==========================================
// SERVICIOS PARA CAJA / COBRO (POS)
// ==========================================

// Obtener las cuentas que están pendientes de cobro
export async function getCuentasPendientes() {
  const response = await fetch(`${API_URL}/cuentas?estado=pendiente`)
  if (!response.ok) {
    throw new Error('Error al consultar las cuentas pendientes')
  }
  return await response.json()
}

// Registrar un pago y cerrar la cuenta
export async function registrarPagoCuenta({ cuentaId, formaPago, monto }) {
  const response = await fetch(`${API_URL}/cuentas/${cuentaId}/pagos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ formaPago, monto }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Error al procesar el pago')
  }

  return await response.json()
}

// ==========================================
// SERVICIOS PARA CORTE DE CAJA
// ==========================================

// Obtener el acumulado del turno actual para el corte
export async function getCorteCajaActual() {
  const response = await fetch(`${API_URL}/corte-caja/actual`)
  if (!response.ok) {
    throw new Error('Error al obtener el resumen de caja')
  }
  return await response.json()
}

// Ejecutar el cierre de caja del turno
export async function realizarCorteCaja() {
  const response = await fetch(`${API_URL}/corte-caja/cerrar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Error al procesar el cierre de caja')
  }

  return await response.json()
}