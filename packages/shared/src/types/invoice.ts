import { InvoiceStatus } from "../enums.js";

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: InvoiceItem[];
}

export type CreateInvoiceItemInput = Pick<InvoiceItem, "quantity"> &
  Partial<Pick<InvoiceItem, "productId" | "description" | "unitPrice">>;

export type CreateInvoiceInput = Pick<Invoice, "customerId" | "dueDate"> & {
  invoiceNumber: string;
  // Ej. 0.0825 = 8.25%. La decide quien emite la factura (varía por
  // jurisdicción); el backend solo la aplica a los items taxable.
  taxRate: number;
  issueDate?: string;
  notes?: string;
  items: CreateInvoiceItemInput[];
};
