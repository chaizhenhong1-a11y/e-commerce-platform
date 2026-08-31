import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { OrderAccessService } from './order-access.service';
import { OrderExpirationService } from './order-expiration.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrderExpirationService,
    OrderAccessService,
  ],
  exports: [OrderAccessService],
})
export class OrdersModule {}
