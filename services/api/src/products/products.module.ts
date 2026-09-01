import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { StaffProductsController } from './staff-products.controller';

@Module({
  imports: [AuthModule, MediaModule],
  controllers: [ProductsController, StaffProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
