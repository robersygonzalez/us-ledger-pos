import { StockMovementType } from "../enums.js";

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  reference: string | null;
  note: string | null;
  movementDate: string;
  createdAt: string;
}

export type CreateStockMovementInput = Pick<
  StockMovement,
  "productId" | "type" | "quantity"
> &
  Partial<Pick<StockMovement, "reference" | "note" | "movementDate">>;
