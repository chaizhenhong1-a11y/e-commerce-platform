import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { StaffCategoriesController } from './staff-categories.controller';

@Module({
  imports: [AuthModule],
  controllers: [CategoriesController, StaffCategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
