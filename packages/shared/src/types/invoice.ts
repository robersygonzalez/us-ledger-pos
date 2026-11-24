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

export type CreateInvoiceItemInput = Pick<
  InvoiceItem,
  "description" | "quantity" | "unitPrice"
> &
  Partial<Pick<InvoiceItem, "productId">>;

export type CreateInvoiceInput = Pick<Invoice, "customerId" | "dueDate"> & {
  items: CreateInvoiceItemInput[];
};
