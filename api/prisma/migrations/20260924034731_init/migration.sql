-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('administrador', 'mesero', 'cocinero', 'cajero');

-- CreateEnum
CREATE TYPE "EstadoSesionMesa" AS ENUM ('ocupada', 'pedido_en_curso', 'pendiente_cobro', 'cerrada');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('abierto', 'cerrado', 'anulado');

-- CreateEnum
CREATE TYPE "EstadoPedidoLinea" AS ENUM ('pendiente', 'en_preparacion', 'listo', 'entregado', 'anulada');

-- CreateEnum
CREATE TYPE "FormaPago" AS ENUM ('efectivo', 'tarjeta', 'otro');

-- CreateTable
CREATE TABLE "usuario" (
    "id" SERIAL NOT NULL,
    "nombre_completo" VARCHAR(120) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoria" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(60) NOT NULL,
    "descripcion" TEXT,
    "orden" SMALLINT NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platillo" (
    "id" SERIAL NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "foto_url" VARCHAR(300),
    "tiempo_preparacion_min" SMALLINT NOT NULL DEFAULT 10,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "orden" SMALLINT NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "platillo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "precio_historico" (
    "id" SERIAL NOT NULL,
    "platillo_id" INTEGER NOT NULL,
    "precio" DECIMAL(8,2) NOT NULL,
    "vigente_desde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigente_hasta" TIMESTAMP(3),

    CONSTRAINT "precio_historico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesa" (
    "id" SERIAL NOT NULL,
    "numero" SMALLINT NOT NULL,
    "capacidad" SMALLINT NOT NULL,
    "ubicacion" VARCHAR(60),
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "mesa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesion_mesa" (
    "id" SERIAL NOT NULL,
    "mesa_id" INTEGER NOT NULL,
    "mesero_id" INTEGER NOT NULL,
    "estado" "EstadoSesionMesa" NOT NULL DEFAULT 'ocupada',
    "abierta_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerrada_en" TIMESTAMP(3),
    "num_comensales" SMALLINT,

    CONSTRAINT "sesion_mesa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedido" (
    "id" SERIAL NOT NULL,
    "sesion_mesa_id" INTEGER NOT NULL,
    "mesero_id" INTEGER NOT NULL,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'abierto',
    "abierto_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerrado_en" TIMESTAMP(3),
    "motivo_anulacion" TEXT,
    "anulado_por" INTEGER,

    CONSTRAINT "pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedido_linea" (
    "id" SERIAL NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "platillo_id" INTEGER NOT NULL,
    "cantidad" SMALLINT NOT NULL,
    "precio_unitario" DECIMAL(8,2) NOT NULL,
    "nota_preparacion" VARCHAR(200),
    "estado" "EstadoPedidoLinea" NOT NULL DEFAULT 'pendiente',
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizada_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedido_linea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuenta" (
    "id" SERIAL NOT NULL,
    "sesion_mesa_id" INTEGER NOT NULL,
    "total" DECIMAL(9,2) NOT NULL,
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerrada_en" TIMESTAMP(3),
    "cajero_id" INTEGER,

    CONSTRAINT "cuenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuenta_division" (
    "id" SERIAL NOT NULL,
    "cuenta_id" INTEGER NOT NULL,
    "etiqueta" VARCHAR(40) NOT NULL,
    "monto" DECIMAL(9,2) NOT NULL,

    CONSTRAINT "cuenta_division_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pago" (
    "id" SERIAL NOT NULL,
    "cuenta_division_id" INTEGER NOT NULL,
    "forma_pago" "FormaPago" NOT NULL,
    "monto" DECIMAL(9,2) NOT NULL,
    "pagado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "corte_caja_id" INTEGER,

    CONSTRAINT "pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corte_caja" (
    "id" SERIAL NOT NULL,
    "cajero_id" INTEGER NOT NULL,
    "turno_fecha" DATE NOT NULL,
    "abierto_en" TIMESTAMP(3) NOT NULL,
    "cerrado_en" TIMESTAMP(3),
    "total_efectivo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_tarjeta" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_otro" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_general" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "corte_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bitacora" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "accion" VARCHAR(40) NOT NULL,
    "entidad" VARCHAR(40) NOT NULL,
    "entidad_id" INTEGER NOT NULL,
    "detalle" JSONB,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bitacora_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_nombre_key" ON "categoria"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "mesa_numero_key" ON "mesa"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "cuenta_sesion_mesa_id_key" ON "cuenta"("sesion_mesa_id");

-- AddForeignKey
ALTER TABLE "platillo" ADD CONSTRAINT "platillo_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "precio_historico" ADD CONSTRAINT "precio_historico_platillo_id_fkey" FOREIGN KEY ("platillo_id") REFERENCES "platillo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesion_mesa" ADD CONSTRAINT "sesion_mesa_mesa_id_fkey" FOREIGN KEY ("mesa_id") REFERENCES "mesa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesion_mesa" ADD CONSTRAINT "sesion_mesa_mesero_id_fkey" FOREIGN KEY ("mesero_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_sesion_mesa_id_fkey" FOREIGN KEY ("sesion_mesa_id") REFERENCES "sesion_mesa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_mesero_id_fkey" FOREIGN KEY ("mesero_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_anulado_por_fkey" FOREIGN KEY ("anulado_por") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_linea" ADD CONSTRAINT "pedido_linea_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_linea" ADD CONSTRAINT "pedido_linea_platillo_id_fkey" FOREIGN KEY ("platillo_id") REFERENCES "platillo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuenta" ADD CONSTRAINT "cuenta_sesion_mesa_id_fkey" FOREIGN KEY ("sesion_mesa_id") REFERENCES "sesion_mesa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuenta" ADD CONSTRAINT "cuenta_cajero_id_fkey" FOREIGN KEY ("cajero_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuenta_division" ADD CONSTRAINT "cuenta_division_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_cuenta_division_id_fkey" FOREIGN KEY ("cuenta_division_id") REFERENCES "cuenta_division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_corte_caja_id_fkey" FOREIGN KEY ("corte_caja_id") REFERENCES "corte_caja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corte_caja" ADD CONSTRAINT "corte_caja_cajero_id_fkey" FOREIGN KEY ("cajero_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitacora" ADD CONSTRAINT "bitacora_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
