import { InvoiceStatus, StockMovementType } from "@prisma/client";
import { InvoicesService } from "./invoices.service";

// InvoicesService.updateStatus solo necesita las piezas de PrismaService que
// toca dentro de $transaction, así que se mockea el cliente directamente en
// vez de levantar un PrismaClient real contra una base de datos.
function createPrismaMock(invoice: {
  status: InvoiceStatus;
  invoiceNumber: string;
  items: { productId: string | null; quantity: number }[];
}) {
  const stockMovementCreate = jest.fn().mockResolvedValue(undefined);
  const productUpdate = jest.fn().mockResolvedValue(undefined);
  const invoiceUpdate = jest
    .fn()
    .mockImplementation((args: { data: { status: InvoiceStatus } }) => ({
      ...invoice,
      status: args.data.status,
    }));

  const tx = {
    invoice: {
      findUnique: jest.fn().mockResolvedValue(invoice),
      update: invoiceUpdate,
    },
    stockMovement: { create: stockMovementCreate },
    product: { update: productUpdate },
  };

  const prisma = {
    $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(tx)),
  };

  return { prisma, stockMovementCreate, productUpdate, invoiceUpdate };
}

describe("InvoicesService.updateStatus — reversión de stock al anular", () => {
  const items = [
    { productId: "prod-1", quantity: 3 },
    { productId: "prod-2", quantity: 1 },
    // ítem libre (sin producto de catálogo): nunca debe tocar inventario.
    { productId: null, quantity: 5 },
  ];

  it("DRAFT -> VOID no revierte stock (nunca se descontó)", async () => {
    const { prisma, stockMovementCreate, productUpdate } = createPrismaMock({
      status: InvoiceStatus.DRAFT,
      invoiceNumber: "INV-1",
      items,
    });
    const service = new InvoicesService(prisma as never);

    await service.updateStatus("inv-1", { status: InvoiceStatus.VOID });

    expect(stockMovementCreate).not.toHaveBeenCalled();
    expect(productUpdate).not.toHaveBeenCalled();
  });

  it("SENT -> VOID revierte el stock de cada ítem con producto", async () => {
    const { prisma, stockMovementCreate, productUpdate } = createPrismaMock({
      status: InvoiceStatus.SENT,
      invoiceNumber: "INV-2",
      items,
    });
    const service = new InvoicesService(prisma as never);

    await service.updateStatus("inv-2", { status: InvoiceStatus.VOID });

    // Solo los 2 ítems con productId generan movimiento; el ítem libre no.
    expect(stockMovementCreate).toHaveBeenCalledTimes(2);
    expect(stockMovementCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        productId: "prod-1",
        type: StockMovementType.IN,
        quantity: 3,
      }),
    });
    expect(productUpdate).toHaveBeenCalledWith({
      where: { id: "prod-1" },
      data: { currentStock: { increment: 3 } },
    });
    expect(productUpdate).toHaveBeenCalledWith({
      where: { id: "prod-2" },
      data: { currentStock: { increment: 1 } },
    });
  });

  it("PAID -> VOID también revierte el stock", async () => {
    const { prisma, stockMovementCreate, productUpdate } = createPrismaMock({
      status: InvoiceStatus.PAID,
      invoiceNumber: "INV-3",
      items,
    });
    const service = new InvoicesService(prisma as never);

    await service.updateStatus("inv-3", { status: InvoiceStatus.VOID });

    expect(stockMovementCreate).toHaveBeenCalledTimes(2);
    expect(productUpdate).toHaveBeenCalledTimes(2);
  });

  it("VOID -> VOID es idempotente: no vuelve a revertir", async () => {
    const { prisma, stockMovementCreate, productUpdate } = createPrismaMock({
      status: InvoiceStatus.VOID,
      invoiceNumber: "INV-4",
      items,
    });
    const service = new InvoicesService(prisma as never);

    await service.updateStatus("inv-4", { status: InvoiceStatus.VOID });

    expect(stockMovementCreate).not.toHaveBeenCalled();
    expect(productUpdate).not.toHaveBeenCalled();
  });

  it("DRAFT -> SENT sigue descontando stock (regresión del flujo existente)", async () => {
    const { prisma, stockMovementCreate, productUpdate } = createPrismaMock({
      status: InvoiceStatus.DRAFT,
      invoiceNumber: "INV-5",
      items,
    });
    const service = new InvoicesService(prisma as never);

    await service.updateStatus("inv-5", { status: InvoiceStatus.SENT });

    expect(stockMovementCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        productId: "prod-1",
        type: StockMovementType.OUT,
        quantity: 3,
      }),
    });
    expect(productUpdate).toHaveBeenCalledWith({
      where: { id: "prod-1" },
      data: { currentStock: { decrement: 3 } },
    });
  });

  it("SENT -> PAID no descuenta ni revierte (ya estaba descontado)", async () => {
    const { prisma, stockMovementCreate, productUpdate } = createPrismaMock({
      status: InvoiceStatus.SENT,
      invoiceNumber: "INV-6",
      items,
    });
    const service = new InvoicesService(prisma as never);

    await service.updateStatus("inv-6", { status: InvoiceStatus.PAID });

    expect(stockMovementCreate).not.toHaveBeenCalled();
    expect(productUpdate).not.toHaveBeenCalled();
  });
});
