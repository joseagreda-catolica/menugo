# Diccionario de datos — MenúGo

Tipos expresados en sintaxis genérica SQL; el mapeo exacto a Prisma se hace en la Semana 2 al escribir `schema.prisma`. Todas las claves primarias son autoincrementales (`SERIAL`/`id` entero) salvo que se indique lo contrario.

## usuario

| Campo | Tipo | Nulo | Default | Descripción / regla de negocio |
|---|---|---|---|---|
| id | INTEGER PK | No | auto | Identificador interno. |
| nombre_completo | VARCHAR(120) | No | — | Nombre para mostrar en bitácora y asignaciones. |
| email | VARCHAR(150) | No | — | Único. Se usa como identificador de acceso. |
| password_hash | VARCHAR(255) | No | — | Hash con sal (RNF-06). Nunca se almacena en texto plano. |
| rol | ENUM(administrador, mesero, cocinero, cajero) | No | — | Define permisos (RF-29). Un usuario tiene un único rol. |
| activo | BOOLEAN | No | true | Baja lógica: un usuario inactivo no puede autenticarse. |
| creado_en | TIMESTAMP | No | now() | — |

## categoria

| Campo | Tipo | Nulo | Default | Descripción / regla de negocio |
|---|---|---|---|---|
| id | INTEGER PK | No | auto | |
| nombre | VARCHAR(60) | No | — | Único. |
| descripcion | TEXT | Sí | — | |
| orden | SMALLINT | No | 0 | Orden de presentación en la carta (RF-05). |
| activa | BOOLEAN | No | true | Desactivar oculta la categoría de la carta pública sin borrarla (RF-01). |

## platillo

| Campo | Tipo | Nulo | Default | Descripción / regla de negocio |
|---|---|---|---|---|
| id | INTEGER PK | No | auto | |
| categoria_id | INTEGER FK → categoria | No | — | |
| nombre | VARCHAR(100) | No | — | |
| descripcion | TEXT | Sí | — | |
| foto_url | VARCHAR(300) | Sí | — | URL en Cloudinary o ruta local (alternativa prevista en la propuesta). |
| tiempo_preparacion_min | SMALLINT | No | 10 | Informativo, usado para estimar tiempos en cocina. |
| disponible | BOOLEAN | No | true | Bandera de agotado; se refleja de inmediato en la carta pública (RF-03). |
| orden | SMALLINT | No | 0 | Orden dentro de su categoría (RF-05). |
| activo | BOOLEAN | No | true | Baja lógica. |

Regla: el precio vigente de un platillo es el registro de `precio_historico` con `vigente_hasta IS NULL`.

## precio_historico

| Campo | Tipo | Nulo | Default | Descripción / regla de negocio |
|---|---|---|---|---|
| id | INTEGER PK | No | auto | |
| platillo_id | INTEGER FK → platillo | No | — | |
| precio | NUMERIC(8,2) | No | — | CHECK precio > 0. |
| vigente_desde | TIMESTAMP | No | now() | |
| vigente_hasta | TIMESTAMP | Sí | NULL | NULL indica que es el precio actual. |

Regla (RF-04): al registrar un precio nuevo, se cierra el registro vigente anterior poniendo `vigente_hasta = now()` dentro de la misma transacción. Nunca hay dos filas de un mismo platillo con `vigente_hasta IS NULL`.

## mesa

| Campo | Tipo | Nulo | Default | Descripción / regla de negocio |
|---|---|---|---|---|
| id | INTEGER PK | No | auto | |
| numero | SMALLINT | No | — | Único. Impreso en el QR físico (RF-10). |
| capacidad | SMALLINT | No | — | Número de comensales. |
| ubicacion | VARCHAR(60) | Sí | — | Ej. "terraza", "salón principal". |
| activa | BOOLEAN | No | true | Baja lógica si se retira una mesa del salón. |

## sesion_mesa

| Campo | Tipo | Nulo | Default | Descripción / regla de negocio |
|---|---|---|---|---|
| id | INTEGER PK | No | auto | |
| mesa_id | INTEGER FK → mesa | No | — | |
| mesero_id | INTEGER FK → usuario | No | — | Quien asignó la mesa. |
| estado | ENUM(ocupada, pedido_en_curso, pendiente_cobro, cerrada) | No | ocupada | Ver [`maquinas-estado.md`](maquinas-estado.md). "Libre" no es un valor de esta columna — ver nota de diseño en `modelo-datos.md`. |
| abierta_en | TIMESTAMP | No | now() | Base para calcular el tiempo de ocupación (RF-12). |
| cerrada_en | TIMESTAMP | Sí | NULL | Se llena al liberar la mesa. |
| num_comensales | SMALLINT | Sí | — | Informativo. |

Regla (RNF-07): antes de insertar una `sesion_mesa` nueva se bloquea la fila de `mesa` con `SELECT ... FOR UPDATE` y se verifica que no exista ya una sesión de esa mesa con `estado != 'cerrada'`, para impedir que dos meseros ocupen la misma mesa a la vez.

## pedido

| Campo | Tipo | Nulo | Default | Descripción / regla de negocio |
|---|---|---|---|---|
| id | INTEGER PK | No | auto | |
| sesion_mesa_id | INTEGER FK → sesion_mesa | No | — | |
| mesero_id | INTEGER FK → usuario | No | — | RF-13: el pedido queda ligado al mesero que lo abrió. |
| estado | ENUM(abierto, cerrado, anulado) | No | abierto | |
| abierto_en | TIMESTAMP | No | now() | |
| cerrado_en | TIMESTAMP | Sí | NULL | |
| motivo_anulacion | TEXT | Sí | NULL | Obligatorio si `estado = anulado` (RF-16). |
| anulado_por | INTEGER FK → usuario | Sí | NULL | Obligatorio si `estado = anulado`. |

Regla (RNF-10): anular es baja lógica; nunca se hace `DELETE` de un pedido. Toda anulación genera una fila en `bitacora`.

## pedido_linea

| Campo | Tipo | Nulo | Default | Descripción / regla de negocio |
|---|---|---|---|---|
| id | INTEGER PK | No | auto | |
| pedido_id | INTEGER FK → pedido | No | — | |
| platillo_id | INTEGER FK → platillo | No | — | |
| cantidad | SMALLINT | No | — | CHECK cantidad > 0. |
| precio_unitario | NUMERIC(8,2) | No | — | Copiado del precio vigente al momento de agregar la línea; no cambia si el precio del platillo cambia después. |
| nota_preparacion | VARCHAR(200) | Sí | — | RF-14. |
| estado | ENUM(pendiente, en_preparacion, listo, entregado, anulada) | No | pendiente | Ver [`maquinas-estado.md`](maquinas-estado.md). |
| creada_en | TIMESTAMP | No | now() | Determina el orden de antigüedad en la pantalla de cocina (RF-17). |
| actualizada_en | TIMESTAMP | No | now() | Se actualiza en cada cambio de estado. |

Regla (RF-15): cantidad, nota o eliminación (paso a `anulada`) solo se permiten mientras `estado = pendiente`.
Regla (RF-21): el total de un pedido es la suma de `cantidad × precio_unitario` de sus líneas con `estado != anulada`.

## cuenta

| Campo | Tipo | Nulo | Default | Descripción / regla de negocio |
|---|---|---|---|---|
| id | INTEGER PK | No | auto | |
| sesion_mesa_id | INTEGER FK → sesion_mesa | No | — | Único (relación 1:1). |
| total | NUMERIC(9,2) | No | — | Suma de todos los pedidos no anulados de la sesión (RF-21). |
| creada_en | TIMESTAMP | No | now() | Momento en que el mesero solicita la cuenta. |
| cerrada_en | TIMESTAMP | Sí | NULL | Momento del cobro efectivo. |
| cajero_id | INTEGER FK → usuario | Sí | NULL | Quien registró el cobro. |

## cuenta_division

| Campo | Tipo | Nulo | Default | Descripción / regla de negocio |
|---|---|---|---|---|
| id | INTEGER PK | No | auto | |
| cuenta_id | INTEGER FK → cuenta | No | — | |
| etiqueta | VARCHAR(40) | No | — | Ej. "Comensal 1"; si no se divide, una sola fila con etiqueta "Total". |
| monto | NUMERIC(9,2) | No | — | CHECK monto >= 0. |

Regla (RF-22): la suma de `monto` de las divisiones de una cuenta debe ser igual a `cuenta.total`.

## pago

| Campo | Tipo | Nulo | Default | Descripción / regla de negocio |
|---|---|---|---|---|
| id | INTEGER PK | No | auto | |
| cuenta_division_id | INTEGER FK → cuenta_division | No | — | |
| forma_pago | ENUM(efectivo, tarjeta, otro) | No | — | RF-23, RF-24. |
| monto | NUMERIC(9,2) | No | — | CHECK monto > 0. Permite pago mixto dentro de una misma división. |
| pagado_en | TIMESTAMP | No | now() | |
| corte_caja_id | INTEGER FK → corte_caja | Sí | NULL | Se asigna al cerrar el turno que lo incluye. |

## corte_caja

| Campo | Tipo | Nulo | Default | Descripción / regla de negocio |
|---|---|---|---|---|
| id | INTEGER PK | No | auto | |
| cajero_id | INTEGER FK → usuario | No | — | |
| turno_fecha | DATE | No | — | |
| abierto_en | TIMESTAMP | No | — | |
| cerrado_en | TIMESTAMP | Sí | NULL | |
| total_efectivo | NUMERIC(10,2) | No | 0 | Calculado al cerrar, sumando `pago.monto` donde `forma_pago = efectivo`. |
| total_tarjeta | NUMERIC(10,2) | No | 0 | Igual, para `tarjeta`. |
| total_otro | NUMERIC(10,2) | No | 0 | Igual, para `otro`. |
| total_general | NUMERIC(10,2) | No | 0 | Suma de los tres anteriores (RF-24). |

## bitacora

| Campo | Tipo | Nulo | Default | Descripción / regla de negocio |
|---|---|---|---|---|
| id | INTEGER PK | No | auto | |
| usuario_id | INTEGER FK → usuario | No | — | Quien ejecutó la acción. |
| accion | VARCHAR(40) | No | — | `anulacion_pedido` \| `cambio_precio` \| `cierre_caja` (RF-30). |
| entidad | VARCHAR(40) | No | — | Nombre de la tabla afectada (ej. `pedido`). No es una FK real: es una referencia genérica, aceptada como simplificación para el alcance de este ciclo. |
| entidad_id | INTEGER | No | — | Id del registro afectado dentro de esa tabla. |
| detalle | JSONB | Sí | NULL | Datos adicionales del evento (valores antes/después). Se usa JSONB, como ya está justificado en la propuesta para notas de preparación. |
| creado_en | TIMESTAMP | No | now() | |
