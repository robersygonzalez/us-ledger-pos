import { Type } from "class-transformer";
import { IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateInvoiceItemDto {
  // Opcional: permite líneas de servicio/texto libre sin producto de catálogo.
  @IsOptional()
  @IsString()
  productId?: string;

  // Si se omite y hay productId, se usa el nombre del producto.
  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  // Si se omite y hay productId, se usa Product.unitPrice vigente.
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}
