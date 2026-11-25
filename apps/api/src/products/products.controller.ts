import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { AdjustStockDto } from "./dto/adjust-stock.dto";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get("low-stock")
  findLowStock() {
    return this.productsService.findLowStock();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Post(":id/stock-adjustments")
  adjustStock(@Param("id") id: string, @Body() dto: AdjustStockDto) {
    return this.productsService.adjustStock(id, dto);
  }
}
