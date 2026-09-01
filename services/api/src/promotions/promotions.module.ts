import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StaffAuthGuard } from '../auth/guards/staff-auth.guard';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';
import { PublicPromotionsController } from './public-promotions.controller';
import { StaffPromotionsController } from './staff-promotions.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PromotionsController, PublicPromotionsController, StaffPromotionsController],
  providers: [PromotionsService, StaffAuthGuard],
  exports: [PromotionsService],
})
export class PromotionsModule {}
