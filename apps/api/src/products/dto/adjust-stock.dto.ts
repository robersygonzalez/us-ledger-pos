import { IsInt, IsOptional, IsString, NotEquals } from "class-validator";

export class AdjustStockDto {
  // Delta a aplicar sobre currentStock: positivo = entra stock, negativo = sale.
  @IsInt()
  @NotEquals(0)
  quantityDelta!: number;

  @IsOptional()
  @IsString()
  note?: string;
}
