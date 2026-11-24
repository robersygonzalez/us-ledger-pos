import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";

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
}
