import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InvoiceStatus, StockMovementType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { UpdateInvoiceStatusDto } from "./dto/update-invoice-status.dto";

// Estados en los que el inventario ya fue descontado para esta factura.
// Se usa para decidir si una transición de status debe generar StockMovement:
// solo dispara al *entrar* a uno de estos estados viniendo de uno que no lo es
// (evita descontar dos veces, ej. al pasar de SENT a PAID).
const STOCK_DEDUCTED_STATUSES: InvoiceStatus[] = [
  InvoiceStatus.SENT,
  InvoiceStatus.PAID,
];

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.invoice.findMany({
      include: { customer: true, items: true },
      orderBy: { issueDate: "desc" },
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { customer: true, items: { include: { product: true } } },
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }
    return invoice;
  }

  create(dto: CreateInvoiceDto) {
    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: dto.customerId },
      });
      if (!customer) {
        throw new NotFoundException(`Customer ${dto.customerId} not found`);
      }

      let subtotal = 0;
      let taxableSubtotal = 0;
      const itemsData = [];

      for (const item of dto.items) {
        let unitPrice = item.unitPrice;
        let description = item.description;
        let isTaxable = true;

        if (item.productId) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });
          if (!product) {
            throw new NotFoundException(`Product ${item.productId} not found`);
          }
          unitPrice = unitPrice ?? Number(product.unitPrice);
          description = description ?? product.name;
          isTaxable = product.isTaxable;
        }

        if (unitPrice === undefined) {
          throw new BadRequestException(
            "unitPrice is required for items without productId",
          );
        }
        if (!description) {
          throw new BadRequestException(
            "description is required for items without productId",
          );
        }

        const lineTotal = round2(item.quantity * unitPrice);
        subtotal = round2(subtotal + lineTotal);
        if (isTaxable) {
          taxableSubtotal = round2(taxableSubtotal + lineTotal);
        }

        itemsData.push({
          productId: item.productId,
          description,
          quantity: item.quantity,
          unitPrice,
          lineTotal,
        });
      }

      // Cliente tax-exempt siempre gana sobre si los items son taxable.
      const taxAmount = customer.isTaxExempt
        ? 0
        : round2(taxableSubtotal * dto.taxRate);
      const total = round2(subtotal + taxAmount);

      return tx.invoice.create({
        data: {
          invoiceNumber: dto.invoiceNumber,
          customerId: dto.customerId,
          issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
          dueDate: new Date(dto.dueDate),
          subtotal,
          taxRate: dto.taxRate,
          taxAmount,
          total,
          notes: dto.notes,
          items: { create: itemsData },
        },
        include: { customer: true, items: true },
      });
    });
  }

  updateStatus(id: string, dto: UpdateInvoiceStatusDto) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!invoice) {
        throw new NotFoundException(`Invoice ${id} not found`);
      }

      const shouldDeductStock =
        !STOCK_DEDUCTED_STATUSES.includes(invoice.status) &&
        STOCK_DEDUCTED_STATUSES.includes(dto.status);

      if (shouldDeductStock) {
        for (const item of invoice.items) {
          if (!item.productId) continue;

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: StockMovementType.OUT,
              quantity: item.quantity,
              reference: invoice.invoiceNumber,
              note: `Invoice ${invoice.invoiceNumber} marked as ${dto.status}`,
            },
          });

          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } },
          });
        }
      }

      return tx.invoice.update({
        where: { id },
        data: { status: dto.status },
        include: { customer: true, items: true },
      });
    });
  }
}
