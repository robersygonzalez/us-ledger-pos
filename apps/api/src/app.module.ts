import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { ProductsModule } from "./products/products.module";
import { CustomersModule } from "./customers/customers.module";
import { InvoicesModule } from "./invoices/invoices.module";
import { ReportsModule } from "./reports/reports.module";

@Module({
  imports: [
    PrismaModule,
    ProductsModule,
    CustomersModule,
    InvoicesModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
