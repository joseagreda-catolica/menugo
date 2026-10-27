-- CreateTable
CREATE TABLE "configuracion" (
    "clave" VARCHAR(60) NOT NULL,
    "valor" VARCHAR(200) NOT NULL,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_pkey" PRIMARY KEY ("clave")
);
