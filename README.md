# US Ledger POS

Un ERP/POS ligero enfocado en los flujos de negocio de EE. UU.: facturación con **Sales Tax** por jurisdicción/cliente, control de inventario por movimientos de stock, clientes con términos de pago (`NET_15`, `NET_30`, `DUE_ON_RECEIPT`) y exención fiscal, y reportes financieros listos para revisar márgenes y obligaciones de impuestos.

Proyecto de portafolio que muestra un monorepo TypeScript full-stack (API transaccional + frontend) con decisiones de diseño explícitas alrededor de dinero, concurrencia e idempotencia.

## Stack tecnológico

| Capa | Tecnología |
| --- | --- |
| Monorepo | npm workspaces (TypeScript en todos los paquetes) |
| Backend | [NestJS](https://nestjs.com/) + [Prisma ORM](https://www.prisma.io/) |
| Base de datos | PostgreSQL ([Neon](https://neon.tech/), serverless) |
| Frontend | React + Vite + Tailwind CSS |
| Validación | `class-validator` / `class-transformer` (DTOs con transformación automática) |
| Tipos compartidos | `packages/shared` — enums y contratos TS consumidos por API y Web |
| Tests | Jest (unitarios, backend) |

### Estructura del monorepo

```
apps/
  api/      NestJS — módulos: products, customers, invoices, reports
  web/      React + Vite — pestañas: Inventario, Clientes, Nueva Factura, Facturas, Reportes
packages/
  shared/   Enums (InvoiceStatus, PaymentTerms, StockMovementType) y tipos
            (Product, Customer, Invoice, reportes) importados por api y web
```

## Funcionalidades clave

- **Inventario y movimientos de stock**: cada cambio de `currentStock` queda trazado como un `StockMovement` (`IN` / `OUT` / `ADJUSTMENT`) con referencia a la factura o ajuste que lo originó. Alertas de "por reordenar" cuando `currentStock <= reorderPoint`.
- **Clientes**: términos de pago por cliente y flag `isTaxExempt` que anula el cálculo de Sales Tax en sus facturas, sin importar si los ítems son `isTaxable`.
- **Facturación transaccional**: crear una factura calcula `subtotal`, `taxAmount` y `total` dentro de una transacción de Prisma; el stock se descuenta recién al pasar la factura a `SENT`/`PAID` (no al crearla en `DRAFT`), y se **revierte automáticamente** si se anula (`VOID`) una factura que ya lo había descontado.
- **Reportes financieros y fiscales**: ventas totales, ganancia bruta (revenue − costo de catálogo de los ítems vendidos), Sales Tax recaudado y alertas de inventario bajo — todo filtrable por rango de fechas o acumulado.
- **Vista imprimible de facturas**: modal con formato de recibo/factura comercial (`Bill To`, ítems, subtotal/tax/total) que usa `window.print()` con CSS dedicado para imprimir solo esa sección, sin el resto de la UI.

## Decisiones de arquitectura

- **Transacciones atómicas e idempotentes en cambios de estado.** `InvoicesService.updateStatus` decide si debe descontar o revertir stock comparando el estado *actual* de la factura contra el *destino*, no un flag separado. Esto hace que repetir la misma transición (ej. anular dos veces) sea un no-op seguro: una vez que la factura queda en `VOID`, ya no está en el conjunto de "estados con stock descontado", así que una segunda llamada a `VOID` no vuelve a sumar stock. Todo el descuento/reversión + la actualización de `Invoice.status` ocurre dentro de un único `prisma.$transaction`, para que nunca quede stock movido sin la factura reflejando ese estado (o viceversa).
- **Dinero siempre en `Decimal`, nunca `Float`.** Las columnas monetarias (`unitCost`, `unitPrice`, `subtotal`, `taxAmount`, `total`, etc.) son `Decimal(10,2)` en Postgres para evitar errores de redondeo de punto flotante. Como Prisma serializa `Decimal` a **string** en JSON (no a `number`), tanto los DTOs del backend (`@Type(() => Number)` + `class-validator`) como el frontend (conversión explícita con `Number(...)` antes de enviar el payload) normalizan estos valores a `number` en los bordes de la aplicación.
- **Rango de fechas inclusivo de fin de día en reportes.** Los filtros de `/reports/*` reciben fechas sin hora (`YYYY-MM-DD`). Un `to` de ese tipo se interpreta como las `23:59:59.999` de ese día (no medianoche) antes de aplicar el filtro `lte`, para no perder facturas emitidas ese mismo día por una comparación de timestamp demasiado estricta.
- **Ventas "reconocidas" = `SENT` / `PAID`.** Los reportes financieros solo cuentan facturas en esos estados (el mismo criterio que usa `InvoicesService` para decidir si ya se descontó inventario): una factura `DRAFT` todavía no es una venta real, y una `VOID` fue anulada.

## Correr el entorno local

### Requisitos

- Node.js 20+
- Una base de datos PostgreSQL (se usa [Neon](https://neon.tech/) en desarrollo; cualquier Postgres accesible por `DATABASE_URL` funciona)

### Pasos

```bash
# 1. Instalar dependencias de todos los workspaces
npm install

# 2. Configurar variables de entorno de la API
cp apps/api/.env.example apps/api/.env
# editar apps/api/.env con tu DATABASE_URL

# 3. Generar el cliente de Prisma y aplicar el schema
npm run prisma:generate
npm run --workspace=apps/api prisma:migrate

# 4. Levantar la API (NestJS, puerto 3000 por defecto)
npm run dev:api

# 5. En otra terminal, levantar el frontend (Vite, puerto 5173)
npm run dev:web
```

El frontend consume la API vía un proxy de Vite (`/api` → `http://localhost:3000`), configurado en `apps/web/vite.config.ts`.

### Build y tests

```bash
# Compila packages/shared, luego apps/api, luego apps/web, en ese orden
npm run build

# Tests unitarios del backend
npm run test --workspace=apps/api
```
