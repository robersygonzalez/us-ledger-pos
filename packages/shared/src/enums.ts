// Mirrors the enums defined in apps/api/prisma/schema.prisma.
// Kept here (instead of importing @prisma/client from the web app) so that
// apps/web never depends on Prisma or the database layer.

export enum StockMovementType {
  IN = "IN",
  OUT = "OUT",
  ADJUSTMENT = "ADJUSTMENT",
}

export enum PaymentTerms {
  DUE_ON_RECEIPT = "DUE_ON_RECEIPT",
  NET_15 = "NET_15",
  NET_30 = "NET_30",
}

export enum InvoiceStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  PAID = "PAID",
  VOID = "VOID",
}
