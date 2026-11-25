import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { StockMovementType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { AdjustStockDto } from "./dto/adjust-stock.dto";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.product.findMany({ orderBy: { name: "asc" } });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        sku: dto.sku,
        name: dto.name,
        description: dto.description,
        unitCost: dto.unitCost,
        unitPrice: dto.unitPrice,
        currentStock: dto.currentStock ?? 0,
        reorderPoint: dto.reorderPoint,
        isTaxable: dto.isTaxable,
      },
    });
  }

  // Lista productos cuyo stock actual ya tocó o pasó el punto de reorden.
  // Prisma no soporta comparar dos columnas entre sí dentro de un `where`,
  // así que se filtra en memoria (catálogos de un POS suelen ser chicos).
  async findLowStock() {
    const products = await this.prisma.product.findMany();
    return products.filter((p) => p.currentStock <= p.reorderPoint);
  }

  adjustStock(id: string, dto: AdjustStockDto) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id } });
      if (!product) {
        throw new NotFoundException(`Product ${id} not found`);
      }

      const newStock = product.currentStock + dto.quantityDelta;
      if (newStock < 0) {
        throw new BadRequestException(
          "El ajuste dejaría el stock en un valor negativo",
        );
      }

      await tx.stockMovement.create({
        data: {
          productId: id,
          type: StockMovementType.ADJUSTMENT,
          quantity: Math.abs(dto.quantityDelta),
          note: dto.note,
        },
      });

      return tx.product.update({
        where: { id },
        data: { currentStock: newStock },
      });
    });
  }
}
