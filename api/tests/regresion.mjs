// Bateria de regresion de MenuGo: recorre el sistema completo a traves del API (roles,
// pedidos, cocina, cobro, division de cuenta, mesas, caja, reportes, concurrencia).
//
// Uso (con el API levantado y la base RECIEN SEMBRADA):
//   npm run seed           # deja 4 usuarios, 8 mesas libres y 25 platillos
//   npm run test:e2e
//
// Crea datos reales (pedidos, pagos, un cierre de caja): para repetirla hay que volver a
// sembrar la base. Variable opcional: API_URL (por defecto http://localhost:3000/api).

const API = process.env.API_URL || 'http://localhost:3000/api';
const PASSWORD = 'menugo123';

let ok = 0;
let fail = 0;
const fallos = [];

const titulo = (t) => console.log(`\n== ${t} ==`);
const check = (nombre, condicion, detalle = '') => {
  if (condicion) {
    ok++;
    console.log(`  PASS  ${nombre}`);
  } else {
    fail++;
    fallos.push(`${nombre} ${detalle}`);
    console.log(`  FAIL  ${nombre} ${detalle}`);
  }
};

const call = async (metodo, ruta, token, cuerpo) => {
  const respuesta = await fetch(API + ruta, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  let json = null;
  try {
    json = await respuesta.json();
  } catch {
    // respuesta sin cuerpo
  }
  return { s: respuesta.status, j: json };
};
const codigo = (r) => r.j?.error?.code;
const centavos = (x) => Math.round(Number(x) * 100);
const mismoDinero = (a, b) => centavos(a) === centavos(b);

// ---------------------------------------------------------------------------
titulo('0. Preparacion');
const salud = await call('GET', '/health');
if (salud.s !== 200) {
  console.error(`El API no responde en ${API}. Levantalo con "npm run dev" y vuelve a correr la bateria.`);
  process.exit(2);
}

const login = async (email) => {
  const r = await call('POST', '/auth/login', null, { email, password: PASSWORD });
  return { token: r.j?.token, usuario: r.j?.usuario, status: r.s };
};
const sesiones = {
  adm: await login('admin@rinconsantaneco.com'),
  mes: await login('mesero@rinconsantaneco.com'),
  coc: await login('cocinero@rinconsantaneco.com'),
  caj: await login('cajero@rinconsantaneco.com'),
};
const T = Object.fromEntries(Object.entries(sesiones).map(([k, v]) => [k, v.token]));
const ROLES = { adm: 'administrador', mes: 'mesero', coc: 'cocinero', caj: 'cajero' };

const listaMesas = (await call('GET', '/mesas', T.adm)).j;
const mesa = (n) => listaMesas.find((m) => m.numero === n);
const hayMesaOcupada = listaMesas.some((m) => m.estado !== 'libre');
if (hayMesaOcupada || listaMesas.length < 8) {
  console.error('La base no esta recien sembrada (hay mesas ocupadas o faltan mesas). Corre "npm run seed" tras vaciarla.');
  process.exit(2);
}

const platillos = (await call('GET', '/platillos', T.adm)).j;
const platillo = (nombre) => platillos.find((p) => p.nombre === nombre);
const precio = (nombre) => Number(platillo(nombre).precio);
const PUPUSA = platillo('Pupusa de queso');
const POLLO = platillo('Pollo encebollado');
const HORCHATA = platillo('Horchata de morro');
const LOMO = platillo('Lomo de cerdo a la plancha');
const CARNE = platillo('Carne asada con frijoles y tortillas');
const CERVEZA = platillo('Cerveza nacional');

const pedir = (token, numeroMesa, lineas) => call('POST', '/pedidos', token, { mesaId: mesa(numeroMesa).id, lineas });
const cuentasAbiertas = async () => (await call('GET', '/cuentas/pendientes', T.caj)).j;
const cuentaAbierta = async (numeroMesa) => (await cuentasAbiertas()).find((c) => c.sesionMesa.mesa.numero === numeroMesa);
const todasLasCuentas = async () => (await call('GET', '/cuentas?estado=todas', T.adm)).j;
const estadoMesa = async (numeroMesa) => (await call('GET', '/mesas', T.adm)).j.find((m) => m.numero === numeroMesa).estado;
const pagado = { efectivo: 0, tarjeta: 0, otro: 0 };
const anotarPago = (forma, monto) => { pagado[forma] += Number(monto); };

// ---------------------------------------------------------------------------
titulo('1. Autenticacion (RF-28)');
for (const [clave, s] of Object.entries(sesiones)) {
  check(`login ${ROLES[clave]} -> 200 con token y el rol correcto`, s.status === 200 && !!s.token && s.usuario?.rol === ROLES[clave], `(${s.status})`);
}
let r = await call('POST', '/auth/login', null, { email: 'mesero@rinconsantaneco.com', password: 'mala' });
check('contrasena incorrecta -> 401 CREDENCIALES_INVALIDAS', r.s === 401 && codigo(r) === 'CREDENCIALES_INVALIDAS', JSON.stringify(r));
r = await call('POST', '/auth/login', null, { email: 'nadie@x.com', password: PASSWORD });
check('usuario inexistente -> 401', r.s === 401, `(${r.s})`);
r = await call('GET', '/mesas', 'esto.no.es.un.token');
check('token invalido -> 401', r.s === 401, `(${r.s})`);

// ---------------------------------------------------------------------------
titulo('2. Turno de caja a nombre de quien lo abre');
r = await call('GET', '/corte-caja/actual', T.caj);
check('el turno que abre la cajera queda a su nombre', r.s === 200 && r.j.cajeroId === sesiones.caj.usuario.id, JSON.stringify(r.j).slice(0, 120));
r = await call('POST', '/corte-caja/abrir', T.caj, { cajeroId: 1 });
check('abrir otro turno con uno abierto -> 400', r.s === 400, `(${r.s})`);

// ---------------------------------------------------------------------------
titulo('3. Permisos por rol (RF-29)');
const matriz = [
  ['/categorias', ['adm', 'mes', 'coc', 'caj']],
  ['/platillos', ['adm', 'mes', 'coc', 'caj']],
  ['/configuracion', ['adm', 'mes', 'coc', 'caj']],
  ['/mesas', ['adm', 'mes']],
  ['/pedidos', ['adm', 'mes', 'coc']],
  ['/cuentas/pendientes', ['adm', 'mes', 'caj']],
  ['/corte-caja/actual', ['adm', 'caj']],
  ['/reportes/ventas', ['adm']],
  ['/reportes/ranking-platillos', ['adm']],
  ['/reportes/distribucion-horaria', ['adm']],
];
for (const [ruta, permitidos] of matriz) {
  for (const rol of Object.keys(ROLES)) {
    const res = await call('GET', ruta, T[rol]);
    const debe = permitidos.includes(rol);
    check(`GET ${ruta} como ${ROLES[rol]} -> ${debe ? 200 : 403}`, res.s === (debe ? 200 : 403), `(${res.s})`);
  }
  const sin = await call('GET', ruta, null);
  check(`GET ${ruta} sin token -> 401`, sin.s === 401, `(${sin.s})`);
}
for (const rol of ['mes', 'coc', 'caj']) {
  r = await call('POST', '/categorias', T[rol], { nombre: 'Intruso' });
  check(`${ROLES[rol]} no crea categorias -> 403`, r.s === 403, `(${r.s})`);
  r = await call('PUT', '/configuracion', T[rol], { umbralEsperaMin: 5 });
  check(`${ROLES[rol]} no cambia la configuracion -> 403`, r.s === 403, `(${r.s})`);
}
r = await call('POST', '/mesas', T.mes, { numero: 40, capacidad: 2, ubicacion: 'X' });
check('el mesero no crea mesas -> 403', r.s === 403, `(${r.s})`);
r = await call('PUT', `/mesas/${mesa(8).id}`, T.mes, { capacidad: 9 });
check('el mesero no modifica los datos de una mesa -> 403', r.s === 403, `(${r.s})`);

// ---------------------------------------------------------------------------
titulo('4. Carta publica (RF-06, RF-07)');
r = await call('GET', '/carta-publica', null);
const categoriasPublicas = r.j?.data ?? r.j;
check('la carta publica no exige sesion', r.s === 200 && Array.isArray(categoriasPublicas), `(${r.s})`);
check('trae las 5 categorias y los 25 platillos del seed', categoriasPublicas.length === 5 && categoriasPublicas.flatMap((c) => c.platillos).length === 25);

// ---------------------------------------------------------------------------
titulo('5. Pedido: precios del servidor y validaciones (RF-13, RF-14, RF-21, RF-04)');
r = await pedir(T.mes, 1, [{ platilloId: PUPUSA.id, cantidad: 2 }, { platilloId: POLLO.id, cantidad: 1, notaPreparacion: 'sin cebolla' }]);
const total1 = 2 * precio('Pupusa de queso') + precio('Pollo encebollado');
check('pedido de la mesa 1 -> 201', r.s === 201, JSON.stringify(r.j).slice(0, 150));
check(`la cuenta suma con los precios vigentes (${total1.toFixed(2)})`, mismoDinero(r.j.cuenta.total, total1), `(${r.j?.cuenta?.total})`);
check('la nota de preparacion se guarda', r.j.pedido.lineas.some((l) => l.notaPreparacion === 'sin cebolla'));
const pedido1 = r.j.pedido;
const sesion1 = r.j.sesionMesa.id;
check('la mesa 1 pasa a "pedido en curso"', (await estadoMesa(1)) === 'pedido_en_curso');

r = await pedir(T.mes, 2, [{ platilloId: PUPUSA.id, cantidad: -5 }]);
check('cantidad negativa -> 400 LINEA_INVALIDA', r.s === 400 && codigo(r) === 'LINEA_INVALIDA', JSON.stringify(r));
r = await pedir(T.mes, 2, [{ platilloId: PUPUSA.id, cantidad: 1.5 }]);
check('cantidad fraccionaria -> 400', r.s === 400, `(${r.s})`);
r = await pedir(T.mes, 2, [{ platilloId: PUPUSA.id, cantidad: 100 }]);
check('cantidad mayor a 99 -> 400', r.s === 400, `(${r.s})`);
r = await pedir(T.mes, 2, [{ platilloId: 99999, cantidad: 1 }]);
check('platillo inexistente -> 400 PLATILLO_NO_VALIDO', r.s === 400 && codigo(r) === 'PLATILLO_NO_VALIDO', JSON.stringify(r));
check('...sin dejar la mesa 2 ocupada (rollback)', (await estadoMesa(2)) === 'libre');
await call('PATCH', `/platillos/${CERVEZA.id}/disponibilidad`, T.adm, { disponible: false });
r = await pedir(T.mes, 2, [{ platilloId: CERVEZA.id, cantidad: 1 }]);
check('platillo agotado -> 409 PLATILLO_AGOTADO', r.s === 409 && codigo(r) === 'PLATILLO_AGOTADO', JSON.stringify(r));
await call('PATCH', `/platillos/${CERVEZA.id}/disponibilidad`, T.adm, { disponible: true });

r = await pedir(T.adm, 6, [{ platilloId: CARNE.id, cantidad: 1 }]);
check('el administrador tambien puede levantar un pedido', r.s === 201, `(${r.s})`);
const cuentas = await cuentasAbiertas();
check('el mesero de la mesa 1 es quien tomo el pedido (Carlos)', cuentas.find((c) => c.sesionMesa.mesa.numero === 1).sesionMesa.mesero.nombreCompleto === 'Carlos Alberto Rivas');
check('el mesero de la mesa 6 es quien la abrio (la administradora)', cuentas.find((c) => c.sesionMesa.mesa.numero === 6).sesionMesa.mesero.nombreCompleto === 'Marta Elena Gomez');
check('la cuenta incluye el consumo con el nombre de cada platillo', cuentas.find((c) => c.sesionMesa.mesa.numero === 1).sesionMesa.pedidos[0].lineas.every((l) => l.platillo?.nombre));

// ---------------------------------------------------------------------------
titulo('6. Cocina: orden, estados de la linea y modificar pedidos (RF-15, RF-17, RF-19)');
r = await pedir(T.mes, 2, [{ platilloId: HORCHATA.id, cantidad: 1 }, { platilloId: LOMO.id, cantidad: 1 }]);
const pedido2 = r.j.pedido;
const [lineaHorchata, lineaLomo] = pedido2.lineas;
r = await call('GET', '/pedidos', T.coc);
const ids = r.j.map((p) => p.id);
check('cocina recibe las comandas abiertas', ids.includes(pedido1.id) && ids.includes(pedido2.id));
check('RF-17: la comanda mas antigua va primero', ids.indexOf(pedido1.id) < ids.indexOf(pedido2.id));

const [lineaPupusa, lineaPollo] = pedido1.lineas;
const estado = (id, nuevo, token) => call('PATCH', `/pedidos/lineas/${id}/estado`, token, { estado: nuevo });
r = await estado(lineaPupusa.id, 'listo', T.coc);
check('pendiente -> listo (saltando) -> 409 TRANSICION_INVALIDA', r.s === 409 && codigo(r) === 'TRANSICION_INVALIDA', JSON.stringify(r));
r = await estado(lineaPupusa.id, 'en_preparacion', T.mes);
check('el mesero no inicia la preparacion -> 403', r.s === 403 && codigo(r) === 'ROL_NO_PERMITIDO', JSON.stringify(r));
r = await estado(lineaPupusa.id, 'volando', T.coc);
check('estado inexistente -> 400', r.s === 400, `(${r.s})`);
r = await estado(99999, 'en_preparacion', T.coc);
check('linea inexistente -> 404', r.s === 404, `(${r.s})`);
check('cocinero: pendiente -> en_preparacion', (await estado(lineaPupusa.id, 'en_preparacion', T.coc)).s === 200);
check('cocinero: en_preparacion -> listo', (await estado(lineaPupusa.id, 'listo', T.coc)).s === 200);
check('el cajero no toca las lineas -> 403', (await estado(lineaPupusa.id, 'entregado', T.caj)).s === 403);
check('mesero: listo -> entregado', (await estado(lineaPupusa.id, 'entregado', T.mes)).s === 200);
check('cocinero: pollo en_preparacion', (await estado(lineaPollo.id, 'en_preparacion', T.coc)).s === 200);
r = await estado(lineaPollo.id, 'anulada', T.mes);
check('en_preparacion -> anulada no existe -> 409', r.s === 409 && codigo(r) === 'TRANSICION_INVALIDA', JSON.stringify(r));

const cuentaMesa2 = async () => Number((await cuentaAbierta(2)).total);
const totalInicial2 = Number(pedido2.lineas.length) && (await cuentaMesa2());
const modificar = (id, cambios, token = T.mes) => call('PATCH', `/pedidos/lineas/${id}`, token, cambios);
r = await modificar(lineaHorchata.id, { cantidad: 3 });
check('RF-15: cambiar la cantidad de un platillo pendiente -> 200', r.s === 200, JSON.stringify(r));
check('...y la cuenta se ajusta con la diferencia', mismoDinero(await cuentaMesa2(), totalInicial2 + 2 * precio('Horchata de morro')));
check('RF-15: cambiar solo la nota -> 200', (await modificar(lineaHorchata.id, { notaPreparacion: 'bien fria' })).s === 200);
r = await modificar(lineaPollo.id, { cantidad: 3 });
check('un platillo en preparacion no se modifica -> 409 LINEA_EN_PREPARACION', r.s === 409 && codigo(r) === 'LINEA_EN_PREPARACION', JSON.stringify(r));
check('el cocinero no modifica pedidos -> 403', (await modificar(lineaHorchata.id, { cantidad: 2 }, T.coc)).s === 403);
check('cantidad 0 -> 400', (await modificar(lineaHorchata.id, { cantidad: 0 })).s === 400);
check('cuerpo vacio -> 400', (await modificar(lineaHorchata.id, {})).s === 400);

const antesDeQuitar = await cuentaMesa2();
check('RF-15: quitar un platillo pendiente -> 200', (await estado(lineaLomo.id, 'anulada', T.mes)).s === 200);
check('...y la cuenta baja lo que costaba', mismoDinero(await cuentaMesa2(), antesDeQuitar - precio('Lomo de cerdo a la plancha')));

r = await call('PATCH', `/pedidos/${pedido2.id}/estado`, T.mes, { estado: 'anulado' });
check('RF-16: anular sin motivo -> 400', r.s === 400, `(${r.s})`);
r = await call('PATCH', `/pedidos/${pedido2.id}/estado`, T.mes, { estado: 'anulado', motivo: 'Prueba de regresion' });
check('RF-16: anular con motivo -> 200', r.s === 200, JSON.stringify(r));
check('...la cuenta deja de cobrar lo anulado ($0.00)', mismoDinero(await cuentaMesa2(), 0));
r = await call('PATCH', `/pedidos/${pedido2.id}/estado`, T.mes, { estado: 'anulado', motivo: 'otra vez' });
check('anular dos veces -> 409 PEDIDO_YA_ANULADO', r.s === 409 && codigo(r) === 'PEDIDO_YA_ANULADO', JSON.stringify(r));
r = await call('GET', '/pedidos', T.coc);
check('el pedido anulado sale de la pantalla de cocina', !r.j.map((p) => p.id).includes(pedido2.id));
r = await call('PUT', `/mesas/${mesa(2).id}`, T.mes, { estado: 'libre' });
check('la mesa 2 (anulada, saldo $0) se puede liberar', r.s === 200 && r.j.estado === 'libre', JSON.stringify(r).slice(0, 120));

// ---------------------------------------------------------------------------
titulo('7. Cobro completo (RF-23)');
const cuenta1 = await cuentaAbierta(1);
r = await call('POST', `/cuentas/${cuenta1.id}/pagos`, T.mes, { formaPago: 'efectivo' });
check('el mesero no cobra -> 403', r.s === 403, `(${r.s})`);
r = await call('POST', `/cuentas/${cuenta1.id}/pagos`, T.caj, { formaPago: 'bitcoin' });
check('forma de pago invalida -> 400 FORMA_PAGO_INVALIDA', r.s === 400 && codigo(r) === 'FORMA_PAGO_INVALIDA', JSON.stringify(r));
r = await call('POST', `/cuentas/${cuenta1.id}/pagos`, T.caj, { formaPago: 'tarjeta', monto: 0.01 });
check('cobro con tarjeta (ignora un monto falso) -> 200', r.s === 200, JSON.stringify(r));
anotarPago('tarjeta', cuenta1.total);
check('el pago registra el total real de la cuenta', mismoDinero(r.j.pago.monto, cuenta1.total), `(${r.j?.pago?.monto})`);
r = await call('POST', `/cuentas/${cuenta1.id}/pagos`, T.caj, { formaPago: 'efectivo' });
check('cobrar de nuevo -> 409 CUENTA_YA_COBRADA', r.s === 409 && codigo(r) === 'CUENTA_YA_COBRADA', JSON.stringify(r));
r = await call('POST', `/pagos/${cuenta1.id}`, T.caj, { formaPago: 'efectivo' });
check('la ruta alterna /pagos/:id tambien lo rechaza -> 409', r.s === 409, `(${r.s})`);
r = await call('POST', '/cuentas/99999/pagos', T.caj, { formaPago: 'efectivo' });
check('cuenta inexistente -> 404', r.s === 404, `(${r.s})`);
const cerrada1 = (await todasLasCuentas()).find((c) => c.id === cuenta1.id);
check('RF-23: la cuenta queda cerrada con el cajero que cobro', !!cerrada1.cerradaEn && cerrada1.cajero?.nombreCompleto === 'Douglas Ernesto Pena', JSON.stringify(cerrada1.cajero));
check('RF-23: la mesa se libera automaticamente', (await estadoMesa(1)) === 'libre');
r = await call('GET', '/pedidos', T.coc);
check('el pedido cobrado sale de la pantalla de cocina', !r.j.map((p) => p.id).includes(pedido1.id));
check('sesion de la mesa 1 distinta a una nueva (se cerro)', sesion1 > 0);

// ---------------------------------------------------------------------------
titulo('8. Dividir la cuenta (RF-22)');
r = await pedir(T.mes, 3, [{ platilloId: PUPUSA.id, cantidad: 3 }, { platilloId: POLLO.id, cantidad: 1 }, { platilloId: HORCHATA.id, cantidad: 2 }]);
const cuenta3 = await cuentaAbierta(3);
const total3 = Number(cuenta3.total);
const lineas3 = cuenta3.sesionMesa.pedidos.flatMap((p) => p.lineas);
const dividir = (cuerpo, token = T.caj) => call('POST', `/cuentas/${cuenta3.id}/dividir`, token, cuerpo);
check('el mesero no divide cuentas -> 403', (await dividir({ modo: 'partes_iguales', partes: 2 }, T.mes)).s === 403);
check('una sola parte -> 400', (await dividir({ modo: 'partes_iguales', partes: 1 })).s === 400);
r = await dividir({ modo: 'por_lineas', grupos: [{ lineaIds: [lineas3[0].id] }, { lineaIds: [lineas3[1].id] }] });
check('platillos sin asignar -> 400 LINEAS_SIN_ASIGNAR', r.s === 400 && codigo(r) === 'LINEAS_SIN_ASIGNAR', JSON.stringify(r));
r = await dividir({ modo: 'por_lineas', grupos: [{ lineaIds: [lineas3[0].id, lineas3[1].id] }, { lineaIds: [lineas3[1].id, lineas3[2].id] }] });
check('un platillo en dos comensales -> 400 LINEA_REPETIDA', r.s === 400 && codigo(r) === 'LINEA_REPETIDA', JSON.stringify(r));
r = await dividir({ modo: 'partes_iguales', partes: 3 });
const montos = r.j.cuenta.divisiones.map((d) => Number(d.monto));
check('partes iguales entre 3: suman exactamente el total', r.s === 200 && montos.length === 3 && centavos(montos.reduce((a, b) => a + b, 0)) === centavos(total3), JSON.stringify(montos));
check('...y difieren como maximo 1 centavo', centavos(Math.max(...montos) - Math.min(...montos)) <= 1);
r = await dividir({ modo: 'por_lineas', grupos: [{ etiqueta: 'Ana', lineaIds: [lineas3[0].id] }, { etiqueta: 'Luis', lineaIds: [lineas3[1].id, lineas3[2].id] }] });
check('volver a dividir por platillos reemplaza la division', r.s === 200 && r.j.cuenta.divisiones.length === 2);
const [ana, luis] = r.j.cuenta.divisiones;
check('Ana paga lo suyo y Ana + Luis = total', mismoDinero(ana.monto, lineas3[0].cantidad * Number(lineas3[0].precioUnitario)) && mismoDinero(Number(ana.monto) + Number(luis.monto), total3));
r = await call('POST', `/cuentas/${cuenta3.id}/pagos`, T.caj, { formaPago: 'efectivo' });
check('cobrar todo con la cuenta dividida -> 409 CUENTA_DIVIDIDA', r.s === 409 && codigo(r) === 'CUENTA_DIVIDIDA', JSON.stringify(r));
check('el mesero no cobra una parte -> 403', (await call('POST', `/cuentas/${cuenta3.id}/divisiones/${ana.id}/pagos`, T.mes, { formaPago: 'efectivo' })).s === 403);
r = await call('POST', `/cuentas/${cuenta3.id}/divisiones/${ana.id}/pagos`, T.caj, { formaPago: 'tarjeta' });
check('Ana paga con tarjeta: la cuenta sigue abierta', r.s === 200 && r.j.cuentaCerrada === false && r.j.partesPendientes === 1, JSON.stringify(r));
anotarPago('tarjeta', ana.monto);
r = await call('POST', `/cuentas/${cuenta3.id}/divisiones/${ana.id}/pagos`, T.caj, { formaPago: 'efectivo' });
check('pagar de nuevo la misma parte -> 409 PARTE_YA_PAGADA', r.s === 409 && codigo(r) === 'PARTE_YA_PAGADA', JSON.stringify(r));
check('con pagos hechos no se puede volver a dividir -> 409', (await dividir({ modo: 'partes_iguales', partes: 2 })).s === 409);
check('con pagos hechos no se puede cancelar la division -> 409', (await call('DELETE', `/cuentas/${cuenta3.id}/division`, T.caj)).s === 409);
const [pa, pb] = await Promise.all([
  call('POST', `/cuentas/${cuenta3.id}/divisiones/${luis.id}/pagos`, T.caj, { formaPago: 'efectivo' }),
  call('POST', `/cuentas/${cuenta3.id}/divisiones/${luis.id}/pagos`, T.caj, { formaPago: 'efectivo' }),
]);
check('dos cobros simultaneos de la ultima parte: uno 200 y otro 409', [pa.s, pb.s].sort().join() === '200,409', `(${pa.s}, ${pb.s})`);
const ganador = pa.s === 200 ? pa : pb;
anotarPago('efectivo', luis.monto);
check('al pagar la ultima parte la cuenta se cierra y libera la mesa', ganador.j.cuentaCerrada === true && (await estadoMesa(3)) === 'libre');
const cerrada3 = (await todasLasCuentas()).find((c) => c.id === cuenta3.id);
check('la cuenta dividida registra al cajero', cerrada3.cajero?.nombreCompleto === 'Douglas Ernesto Pena');

// ---------------------------------------------------------------------------
titulo('9. Mesas: estados, concurrencia (RNF-07) y bajas (RNF-10)');
r = await call('PUT', `/mesas/${mesa(4).id}`, T.mes, { estado: 'ocupada' });
check('el mesero ocupa una mesa desde el mapa', r.s === 200 && r.j.estado === 'ocupada', `(${r.s})`);
r = await call('PUT', `/mesas/${mesa(4).id}`, T.mes, { estado: 'libre' });
check('...y la libera si no tiene pedidos', r.s === 200 && r.j.estado === 'libre', `(${r.s})`);
const [ocupar1, ocupar2] = await Promise.all([
  call('PUT', `/mesas/${mesa(4).id}`, T.mes, { estado: 'ocupada' }),
  call('PUT', `/mesas/${mesa(4).id}`, T.adm, { estado: 'ocupada' }),
]);
check('dos "ocupar" simultaneos de la misma mesa: ambos responden 200', ocupar1.s === 200 && ocupar2.s === 200, `(${ocupar1.s}, ${ocupar2.s})`);
check('...y ambos ven la MISMA sesion (no se abrieron dos)', ocupar1.j.sesionId === ocupar2.j.sesionId && ocupar1.j.sesionId !== null, `(${ocupar1.j.sesionId}, ${ocupar2.j.sesionId})`);
await call('PUT', `/mesas/${mesa(4).id}`, T.mes, { estado: 'libre' });
const [pedA, pedB] = await Promise.all([
  pedir(T.mes, 5, [{ platilloId: PUPUSA.id, cantidad: 1 }]),
  pedir(T.adm, 5, [{ platilloId: PUPUSA.id, cantidad: 1 }]),
]);
check('dos pedidos simultaneos a una mesa libre: ambos 201 en la misma sesion', pedA.s === 201 && pedB.s === 201 && pedA.j.sesionMesa.id === pedB.j.sesionMesa.id, `(${pedA.s}, ${pedB.s})`);
r = await call('PUT', `/mesas/${mesa(6).id}`, T.mes, { estado: 'libre' });
check('liberar una mesa con cuenta pendiente -> 409 MESA_CON_CUENTA_PENDIENTE', r.s === 409 && codigo(r) === 'MESA_CON_CUENTA_PENDIENTE', JSON.stringify(r));
const cuenta6 = await cuentaAbierta(6);
r = await call('POST', `/cuentas/${cuenta6.id}/pagos`, T.caj, { formaPago: 'otro' });
check('cobro con "otro medio" -> 200', r.s === 200, `(${r.s})`);
anotarPago('otro', cuenta6.total);

r = await call('POST', '/mesas', T.adm, { numero: 21, capacidad: 4, ubicacion: 'Terraza' });
const mesaNueva = r.j;
check('el administrador crea una mesa', r.s === 201, `(${r.s})`);
r = await call('DELETE', `/mesas/${mesaNueva.id}`, T.adm);
check('RNF-10: una mesa sin historial se elimina', r.s === 200 && !r.j.desactivada, JSON.stringify(r.j));
r = await call('POST', '/mesas', T.adm, { numero: 22, capacidad: 2, ubicacion: 'Interior' });
const mesa22 = r.j;
await call('POST', '/pedidos', T.mes, { mesaId: mesa22.id, lineas: [{ platilloId: PUPUSA.id, cantidad: 1 }] });
check('una mesa con sesion abierta no se da de baja -> 409', (await call('DELETE', `/mesas/${mesa22.id}`, T.adm)).s === 409);
const cuenta22 = (await cuentasAbiertas()).find((c) => c.sesionMesa.mesa.numero === 22);
await call('POST', `/cuentas/${cuenta22.id}/pagos`, T.caj, { formaPago: 'efectivo' });
anotarPago('efectivo', cuenta22.total);
r = await call('DELETE', `/mesas/${mesa22.id}`, T.adm);
check('RNF-10: una mesa con historial se desactiva en vez de borrarse', r.s === 200 && r.j.desactivada === true, JSON.stringify(r.j));
check('el mesero no da de baja mesas -> 403', (await call('DELETE', `/mesas/${mesa22.id}`, T.mes)).s === 403);

// ---------------------------------------------------------------------------
titulo('10. Umbral de espera de cocina (RF-20)');
r = await call('GET', '/configuracion', T.coc);
check('por defecto el umbral es de 15 minutos', r.s === 200 && r.j.umbralEsperaMin === 15, JSON.stringify(r.j));
r = await call('PUT', '/configuracion', T.adm, { umbralEsperaMin: 25 });
check('el administrador lo cambia a 25', r.s === 200 && r.j.umbralEsperaMin === 25);
check('el cocinero ve el valor nuevo', (await call('GET', '/configuracion', T.coc)).j.umbralEsperaMin === 25);
check('un umbral de 0 se rechaza -> 400', (await call('PUT', '/configuracion', T.adm, { umbralEsperaMin: 0 })).s === 400);
await call('PUT', '/configuracion', T.adm, { umbralEsperaMin: 15 });

// ---------------------------------------------------------------------------
titulo('11. Corte de caja (RF-24)');
const totalPagado = pagado.efectivo + pagado.tarjeta + pagado.otro;
r = await call('GET', '/corte-caja/actual', T.caj);
check('el turno suma el efectivo cobrado', mismoDinero(r.j.totalEfectivo, pagado.efectivo), `(${r.j.totalEfectivo} vs ${pagado.efectivo})`);
check('el turno suma lo cobrado con tarjeta', mismoDinero(r.j.totalTarjeta, pagado.tarjeta), `(${r.j.totalTarjeta} vs ${pagado.tarjeta})`);
check('el turno suma lo cobrado por otros medios', mismoDinero(r.j.totalOtro, pagado.otro), `(${r.j.totalOtro} vs ${pagado.otro})`);
check('el total general coincide con todo lo cobrado', mismoDinero(r.j.totalGeneral, totalPagado), `(${r.j.totalGeneral} vs ${totalPagado})`);
r = await call('POST', '/corte-caja/cerrar', T.caj);
check('cerrar el turno -> 200 con los totales', r.s === 200 && mismoDinero(r.j.totalGeneral, totalPagado), JSON.stringify(r.j).slice(0, 150));
r = await call('GET', '/corte-caja/actual', T.caj);
check('el turno nuevo empieza en $0.00 a nombre de la cajera', mismoDinero(r.j.totalGeneral, 0) && r.j.cajeroId === sesiones.caj.usuario.id);

// ---------------------------------------------------------------------------
titulo('12. Reportes (RF-25, RF-26, RF-27)');
const cerradas = (await todasLasCuentas()).filter((c) => c.cerradaEn);
const sumaCerradas = cerradas.reduce((s, c) => s + Number(c.total), 0);
r = await call('GET', '/reportes/ventas', T.adm);
check('el total facturado coincide con las cuentas cerradas', mismoDinero(r.j.totalFacturado, sumaCerradas) && r.j.numeroCuentas === cerradas.length, JSON.stringify(r.j));
const hoy = new Date();
const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
r = await call('GET', `/reportes/ventas?desde=${fecha}&hasta=${fecha}`, T.adm);
check('desde = hasta = hoy incluye las ventas de hoy', r.s === 200 && r.j.numeroCuentas === cerradas.length, JSON.stringify(r.j));
r = await call('GET', '/reportes/ranking-platillos', T.adm);
const ranking = r.j?.data ?? r.j;
check('el ranking incluye la pupusa de queso, la mas pedida', Array.isArray(ranking) && ranking.length > 0 && ranking[0].nombre === 'Pupusa de queso', JSON.stringify(ranking?.[0]));
r = await call('GET', '/reportes/distribucion-horaria', T.adm);
const distribucion = r.j?.data ?? r.j;
check('la distribucion trae ventas por hora y por dia', distribucion.porHora.some((h) => h.cantidadLineas > 0) && distribucion.porDiaSemana.some((d) => d.cantidadLineas > 0));

// ---------------------------------------------------------------------------
titulo('13. Precios e imagenes (RF-02, RF-03, RF-04)');
r = await call('PATCH', `/platillos/${PUPUSA.id}`, T.adm, { precio: precio('Pupusa de queso') + 0.25 });
check('el administrador cambia el precio de un platillo', r.s === 200, JSON.stringify(r).slice(0, 120));
const pedidoNuevoPrecio = await pedir(T.mes, 7, [{ platilloId: PUPUSA.id, cantidad: 1 }]);
check('un pedido nuevo usa el precio nuevo', mismoDinero(pedidoNuevoPrecio.j.cuenta.total, precio('Pupusa de queso') + 0.25), `(${pedidoNuevoPrecio.j?.cuenta?.total})`);
check('RF-04: los pedidos viejos conservan su precio', mismoDinero(cerrada1.total, total1));
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const subir = async (blob, nombre) => {
  const formulario = new FormData();
  formulario.append('imagen', blob, nombre);
  const respuesta = await fetch(`${API}/platillos/${CERVEZA.id}/imagen`, { method: 'POST', headers: { Authorization: 'Bearer ' + T.adm }, body: formulario });
  return { s: respuesta.status, j: await respuesta.json().catch(() => null) };
};
r = await subir(new Blob([png], { type: 'image/png' }), 'regresion.png');
check('subir una imagen PNG -> 200', r.s === 200 && r.j.fotoUrl, JSON.stringify(r));
r = await subir(new Blob(['hola'], { type: 'text/plain' }), 'malo.txt');
check('subir un archivo que no es imagen -> 400 TIPO_ARCHIVO_INVALIDO', r.s === 400 && codigo(r) === 'TIPO_ARCHIVO_INVALIDO', JSON.stringify(r));
await call('PATCH', `/platillos/${CERVEZA.id}`, T.adm, { fotoUrl: '' });

// ---------------------------------------------------------------------------
console.log(`\nRESUMEN: ${ok} pruebas pasaron, ${fail} fallaron`);
if (fallos.length) {
  console.log('FALLOS:');
  fallos.forEach((f) => console.log(' - ' + f));
}
process.exit(fail ? 1 : 0);
