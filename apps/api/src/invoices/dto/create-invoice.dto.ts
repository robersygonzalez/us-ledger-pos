import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { CreateInvoiceItemDto } from "./create-invoice-item.dto";

export class CreateInvoiceDto {
  @IsString()
  invoiceNumber!: string;

  @IsString()
  customerId!: string;

  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @IsDateString()
  dueDate!: string;

  // Ej. 0.0825 = 8.25%. La tarifa la decide quien emite la factura
  // (varía por jurisdicción); el servicio solo la aplica.
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  taxRate!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items!: CreateInvoiceItemDto[];
}
