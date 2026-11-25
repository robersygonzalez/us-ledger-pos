import type {
  Customer,
  CreateCustomerInput,
  CreateInvoiceInput,
  CreateProductInput,
  Invoice,
  InvoiceStatus,
  Product,
} from "@us-ledger-pos/shared";

const BASE_URL = "/api";

export interface AdjustStockInput {
  quantityDelta: number;
  note?: string;
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
};
