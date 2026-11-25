export interface FinancialSummaryReport {
  from: string | null;
  to: string | null;
  invoiceCount: number;
  totalSales: number;
  totalCost: number;
  grossProfit: number;
  totalTaxCollected: number;
}

export interface SalesTaxReportLine {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
}

export interface SalesTaxReport {
  from: string | null;
  to: string | null;
  invoiceCount: number;
  taxCollected: number;
  invoices: SalesTaxReportLine[];
}
