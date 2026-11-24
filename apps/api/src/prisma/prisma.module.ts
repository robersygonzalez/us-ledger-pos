import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

// @Global() hace que PrismaService esté disponible en toda la app sin
// tener que importar PrismaModule en cada feature module.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
