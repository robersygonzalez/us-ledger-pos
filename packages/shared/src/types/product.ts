export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  unitCost: number;
  unitPrice: number;
  currentStock: number;
  reorderPoint: number;
  isTaxable: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateProductInput = Pick<
  Product,
  "sku" | "name" | "unitCost" | "unitPrice" | "reorderPoint" | "isTaxable"
> &
  Partial<Pick<Product, "description" | "currentStock">>;
