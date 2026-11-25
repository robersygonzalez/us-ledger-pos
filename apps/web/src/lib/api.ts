import type {
  Customer,
  CreateCustomerInput,
  CreateInvoiceInput,
  CreateProductInput,
  FinancialSummaryReport,
  Invoice,
  InvoiceStatus,
  Product,
  SalesTaxReport,
} from "@us-ledger-pos/shared";

const BASE_URL = "/api";

export interface AdjustStockInput {
  quantityDelta: number;
  note?: string;
}

export interface ReportDateRangeInput {
  from?: string;
  to?: string;
}

// El backend incluye el cliente relacionado en GET /invoices/:id.
export type InvoiceDetail = Invoice & { customer: Customer };

function toQueryString(params: ReportDateRangeInput) {
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string] => entry[1] !== undefined,
  );
  if (entries.length === 0) return "";
  return `?${new URLSearchParams(entries).toString()}`;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text();
    let message = body;
    try {
      const parsed = JSON.parse(body);
      message = Array.isArray(parsed?.message)
        ? parsed.message.join(", ")
        : parsed?.message ?? body;
    } catch {
      // body no era JSON, se usa como texto plano
    }
    throw new Error(message || `Request failed with status ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export const api = {
  health: () => request<{ status: string; service: string }>("/health"),

  products: {
    list: () => request<Product[]>("/products"),
    lowStock: () => request<Product[]>("/products/low-stock"),
    create: (data: CreateProductInput) =>
      request<Product>("/products", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    adjustStock: (id: string, data: AdjustStockInput) =>
      request<Product>(`/products/${id}/stock-adjustments`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  customers: {
    list: () => request<Customer[]>("/customers"),
    create: (data: CreateCustomerInput) =>
      request<Customer>("/customers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  invoices: {
    list: () => request<Invoice[]>("/invoices"),
    get: (id: string) => request<InvoiceDetail>(`/invoices/${id}`),
    create: (data: CreateInvoiceInput) =>
      request<Invoice>("/invoices", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateStatus: (id: string, status: InvoiceStatus) =>
      request<Invoice>(`/invoices/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  },

  reports: {
    financialSummary: (range?: ReportDateRangeInput) =>
      request<FinancialSummaryReport>(
        `/reports/financial-summary${toQueryString(range ?? {})}`,
      ),
    salesTax: (range?: ReportDateRangeInput) =>
      request<SalesTaxReport>(
        `/reports/sales-tax${toQueryString(range ?? {})}`,
      ),
    lowStockAlerts: () => request<Product[]>("/reports/low-stock-alerts"),
  },
};
