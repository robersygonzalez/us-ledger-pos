import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { ProductsModule } from "./products/products.module";
import { CustomersModule } from "./customers/customers.module";
import { InvoicesModule } from "./invoices/invoices.module";

@Module({
  imports: [PrismaModule, ProductsModule, CustomersModule, InvoicesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
