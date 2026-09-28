// Datos de prueba: un restaurante ficticio de Santa Ana ("Rincon Santaneco"),
// usado en toda la demostracion del proyecto. Cuatro usuarios (uno por rol),
// ocho mesas, cinco categorias y veinticinco platillos con precios creibles
// en dolares (moneda de El Salvador).
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PASSWORD_DEMO = 'menugo123';

async function seedUsuarios() {
  const hash = await bcrypt.hash(PASSWORD_DEMO, 10);

  const usuarios = [
    { nombreCompleto: 'Marta Elena Gomez', email: 'admin@rinconsantaneco.com', rol: 'administrador' },
    { nombreCompleto: 'Carlos Alberto Rivas', email: 'mesero@rinconsantaneco.com', rol: 'mesero' },
    { nombreCompleto: 'Ana Lucia Menjivar', email: 'cocinero@rinconsantaneco.com', rol: 'cocinero' },
    { nombreCompleto: 'Douglas Ernesto Pena', email: 'cajero@rinconsantaneco.com', rol: 'cajero' },
  ];

  for (const u of usuarios) {
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash: hash },
    });
  }
}

async function seedMesas() {
  const mesas = [
    { numero: 1, capacidad: 2, ubicacion: 'Salon principal' },
    { numero: 2, capacidad: 2, ubicacion: 'Salon principal' },
    { numero: 3, capacidad: 4, ubicacion: 'Salon principal' },
    { numero: 4, capacidad: 4, ubicacion: 'Salon principal' },
    { numero: 5, capacidad: 6, ubicacion: 'Salon principal' },
    { numero: 6, capacidad: 4, ubicacion: 'Terraza' },
    { numero: 7, capacidad: 4, ubicacion: 'Terraza' },
    { numero: 8, capacidad: 2, ubicacion: 'Terraza' },
  ];

  for (const m of mesas) {
    await prisma.mesa.upsert({ where: { numero: m.numero }, update: {}, create: m });
  }
}

async function seedCartaConPrecios() {
  const categorias = [
    {
      nombre: 'Entradas',
      orden: 1,
      platillos: [
        { nombre: 'Yuca frita con curtido', precio: 4.5, tiempo: 12 },
        { nombre: 'Panes con pollo (media orden)', precio: 5.0, tiempo: 10 },
        { nombre: 'Chicharron con curtido', precio: 5.5, tiempo: 10 },
        { nombre: 'Empanadas de frijol (3 unidades)', precio: 3.75, tiempo: 8 },
        { nombre: 'Queso frito con platano', precio: 4.25, tiempo: 10 },
      ],
    },
    {
      nombre: 'Antojitos y pupusas',
      orden: 2,
      platillos: [
        { nombre: 'Pupusa de queso', precio: 1.0, tiempo: 6 },
        { nombre: 'Pupusa revuelta', precio: 1.25, tiempo: 6 },
        { nombre: 'Pupusa de frijol con queso', precio: 1.15, tiempo: 6 },
        { nombre: 'Pupusa de ayote con queso', precio: 1.25, tiempo: 6 },
        { nombre: 'Platanos fritos con crema y frijol', precio: 3.5, tiempo: 8 },
      ],
    },
    {
      nombre: 'Platos fuertes',
      orden: 3,
      platillos: [
        { nombre: 'Gallina india en pinol', precio: 8.5, tiempo: 25 },
        { nombre: 'Carne asada con frijoles y tortillas', precio: 9.0, tiempo: 20 },
        { nombre: 'Pollo encebollado', precio: 7.75, tiempo: 20 },
        { nombre: 'Lomo de cerdo a la plancha', precio: 8.75, tiempo: 22 },
        { nombre: 'Pescado frito entero con ensalada', precio: 10.5, tiempo: 25 },
        { nombre: 'Bistec a la valenciana', precio: 8.0, tiempo: 20 },
        { nombre: 'Camarones al ajillo', precio: 11.0, tiempo: 22 },
      ],
    },
    {
      nombre: 'Bebidas',
      orden: 4,
      platillos: [
        { nombre: 'Horchata de morro', precio: 1.75, tiempo: 3 },
        { nombre: 'Fresco de ensalada', precio: 1.5, tiempo: 3 },
        { nombre: 'Cafe de olla', precio: 1.25, tiempo: 5 },
        { nombre: 'Gaseosa 12 oz', precio: 1.5, tiempo: 2 },
        { nombre: 'Cerveza nacional', precio: 2.5, tiempo: 2 },
      ],
    },
    {
      nombre: 'Postres',
      orden: 5,
      platillos: [
        { nombre: 'Semita de piña', precio: 1.5, tiempo: 3 },
        { nombre: 'Torrejas', precio: 2.5, tiempo: 8 },
        { nombre: 'Arroz en leche', precio: 2.0, tiempo: 5 },
      ],
    },
  ];

  for (const cat of categorias) {
    const categoria = await prisma.categoria.upsert({
      where: { nombre: cat.nombre },
      update: {},
      create: { nombre: cat.nombre, orden: cat.orden },
    });

    let orden = 1;
    for (const p of cat.platillos) {
      // No hay un unique natural en (categoriaId, nombre) todavia, asi que se
      // busca antes de crear para que el script se pueda volver a correr sin
      // duplicar platillos.
      let platillo = await prisma.platillo.findFirst({
        where: { categoriaId: categoria.id, nombre: p.nombre },
      });
      if (!platillo) {
        platillo = await prisma.platillo.create({
          data: {
            categoriaId: categoria.id,
            nombre: p.nombre,
            tiempoPreparacionMin: p.tiempo,
            orden,
          },
        });
      }
      orden++;

      const precioVigente = await prisma.precioHistorico.findFirst({
        where: { platilloId: platillo.id, vigenteHasta: null },
      });
      if (!precioVigente) {
        await prisma.precioHistorico.create({
          data: { platilloId: platillo.id, precio: p.precio },
        });
      }
    }
  }
}

async function main() {
  await seedUsuarios();
  await seedMesas();
  await seedCartaConPrecios();

  const totalPlatillos = await prisma.platillo.count();
  const totalMesas = await prisma.mesa.count();
  const totalUsuarios = await prisma.usuario.count();

  console.log(`Listo: ${totalUsuarios} usuarios, ${totalMesas} mesas, ${totalPlatillos} platillos.`);
  console.log(`Contrasena de todos los usuarios de prueba: ${PASSWORD_DEMO}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
