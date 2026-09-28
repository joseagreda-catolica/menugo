const reporteRepository = require('../repositories/reporte.repository');

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

// Rango por defecto amplio (ultimo año) para que el reporte no salga vacio
// si no se especifican fechas -- util para la demostracion.
function resolverRango(desde, hasta) {
  const fin = hasta ? new Date(hasta) : new Date();
  const inicio = desde ? new Date(desde) : new Date(fin.getFullYear() - 1, fin.getMonth(), fin.getDate());
  return { desde: inicio, hasta: fin };
}

// RF-25: total facturado y numero de cuentas atendidas en el rango.
async function ventasPorRango(desdeInput, hastaInput) {
  const { desde, hasta } = resolverRango(desdeInput, hastaInput);
  const cuentas = await reporteRepository.cuentasCerradasEnRango(desde, hasta);
  const totalFacturado = cuentas.reduce((suma, c) => suma + Number(c.total), 0);
  return { desde, hasta, totalFacturado, numeroCuentas: cuentas.length };
}

// RF-26: ranking de platillos por cantidad vendida (descendente). El
// frontend puede tomar los primeros N como "mas vendidos" y los ultimos N
// como "menos vendidos" del mismo arreglo.
async function rankingPlatillos(desdeInput, hastaInput) {
  const { desde, hasta } = resolverRango(desdeInput, hastaInput);
  const lineas = await reporteRepository.lineasEnRango(desde, hasta);

  const porPlatillo = new Map();
  for (const linea of lineas) {
    const id = linea.platilloId;
    const actual = porPlatillo.get(id) || {
      platilloId: id,
      nombre: linea.platillo.nombre,
      cantidadVendida: 0,
      totalVendido: 0,
    };
    actual.cantidadVendida += linea.cantidad;
    actual.totalVendido += linea.cantidad * Number(linea.precioUnitario);
    porPlatillo.set(id, actual);
  }

  return [...porPlatillo.values()].sort((a, b) => b.cantidadVendida - a.cantidadVendida);
}

// RF-27: distribucion de ventas por franja horaria y por dia de la semana.
async function distribucionPorFranja(desdeInput, hastaInput) {
  const { desde, hasta } = resolverRango(desdeInput, hastaInput);
  const lineas = await reporteRepository.lineasEnRango(desde, hasta);

  const porHora = Array.from({ length: 24 }, (_, hora) => ({ hora, total: 0, cantidadLineas: 0 }));
  const porDiaSemana = DIAS_SEMANA.map((nombre, dia) => ({ dia, nombre, total: 0, cantidadLineas: 0 }));

  for (const linea of lineas) {
    const monto = linea.cantidad * Number(linea.precioUnitario);
    const hora = linea.creadaEn.getHours();
    const diaSemana = linea.creadaEn.getDay();

    porHora[hora].total += monto;
    porHora[hora].cantidadLineas += 1;
    porDiaSemana[diaSemana].total += monto;
    porDiaSemana[diaSemana].cantidadLineas += 1;
  }

  return { desde, hasta, porHora, porDiaSemana };
}

module.exports = { ventasPorRango, rankingPlatillos, distribucionPorFranja };
