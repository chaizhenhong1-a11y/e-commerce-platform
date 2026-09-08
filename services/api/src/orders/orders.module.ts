import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { OrderAccessService } from './order-access.service';
import { OrderExpirationService } from './order-expiration.service';
import { OrdersController } from './orders.controller';
import { StaffCommerceService } from './staff-commerce.service';
import { StaffOrdersController } from './staff-orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [PrismaModule, AuthModule, SettingsModule],
  controllers: [OrdersController, StaffOrdersController],
  providers: [
    OrdersService,
    OrderExpirationService,
    OrderAccessService,
    StaffCommerceService,
  ],
  exports: [OrderAccessService],
})
export class OrdersModule {}
