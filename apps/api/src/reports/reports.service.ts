import { Injectable } from "@nestjs/common";
import { InvoiceStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ReportDateRangeDto } from "./dto/report-date-range.dto";

// Solo DRAFT->SENT/PAID representan una venta reconocida (el stock ya fue
// descontado, ver InvoicesService). DRAFT todavía no es una venta real y
// VOID fue anulada, así que ninguna de las dos cuenta para los reportes.
const RECOGNIZED_SALE_STATUSES: InvoiceStatus[] = [
  InvoiceStatus.SENT,
  InvoiceStatus.PAID,
];

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

const BARE_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// `to` suele llegar como fecha sin hora (ej. "2026-11-25"), que Date
// parsea como medianoche UTC de ese día. Si no se extiende al final del
// día, un `lte` con esa misma fecha excluiría casi todas las facturas
// emitidas ese día (cualquier hora después de 00:00:00.000 UTC).
function endOfDay(value: string): Date {
  const date = new Date(value);
  if (BARE_DATE_RE.test(value)) {
    date.setUTCHours(23, 59, 59, 999);
  }
  return date;
}

function salesWhere(query: ReportDateRangeDto): Prisma.InvoiceWhereInput {
  const where: Prisma.InvoiceWhereInput = {
    status: { in: RECOGNIZED_SALE_STATUSES },
  };
  if (query.from || query.to) {
    where.issueDate = {
      ...(query.from ? { gte: new Date(query.from) } : {}),
      ...(query.to ? { lte: endOfDay(query.to) } : {}),
    };
  }
  return where;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFinancialSummary(query: ReportDateRangeDto) {
    const invoices = await this.prisma.invoice.findMany({
      where: salesWhere(query),
      include: { items: { include: { product: true } } },
    });

    let totalSales = 0;
    let totalCost = 0;
    let totalTaxCollected = 0;

    for (const invoice of invoices) {
      totalSales = round2(totalSales + Number(invoice.subtotal));
      totalTaxCollected = round2(totalTaxCollected + Number(invoice.taxAmount));

      for (const item of invoice.items) {
        // El costo solo se conoce para ítems de catálogo (vía Product.unitCost
        // actual); los ítems libres sin producto no tienen costo asociado.
        const unitCost = item.product ? Number(item.product.unitCost) : 0;
        totalCost = round2(totalCost + unitCost * item.quantity);
      }
    }

    return {
      from: query.from ?? null,
      to: query.to ?? null,
      invoiceCount: invoices.length,
      totalSales,
      totalCost,
      grossProfit: round2(totalSales - totalCost),
      totalTaxCollected,
    };
  }

  async getSalesTaxReport(query: ReportDateRangeDto) {
    const invoices = await this.prisma.invoice.findMany({
      where: salesWhere(query),
      select: {
        id: true,
        invoiceNumber: true,
        issueDate: true,
        subtotal: true,
        taxRate: true,
        taxAmount: true,
      },
      orderBy: { issueDate: "asc" },
    });

    const taxCollected = round2(
      invoices.reduce((sum, invoice) => sum + Number(invoice.taxAmount), 0),
    );

    return {
      from: query.from ?? null,
      to: query.to ?? null,
      invoiceCount: invoices.length,
      taxCollected,
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate,
        subtotal: Number(invoice.subtotal),
        taxRate: Number(invoice.taxRate),
        taxAmount: Number(invoice.taxAmount),
      })),
    };
  }

  // Prisma no soporta comparar dos columnas entre sí dentro de un `where`
  // (ver ProductsService.findLowStock), así que se filtra en memoria.
  async getLowStockAlerts() {
    const products = await this.prisma.product.findMany({
      orderBy: { name: "asc" },
    });
    return products.filter((p) => p.currentStock <= p.reorderPoint);
  }
}
