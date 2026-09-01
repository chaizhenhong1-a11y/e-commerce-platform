import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { StaffAuthGuard } from '../auth/guards/staff-auth.guard';
import { CategoriesService } from './categories.service';
import { CreateStaffCategoryDto, UpdateStaffCategoryDto } from './dto/staff-category.dto';

@Controller('staff/categories')
@UseGuards(StaffAuthGuard)
export class StaffCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  list() {
    return this.categoriesService.findAllForStaff();
  }

  @Post()
  create(@Body() dto: CreateStaffCategoryDto) {
    return this.categoriesService.createForStaff(dto);
  }

  @Patch(':categoryId')
  update(@Param('categoryId') categoryId: string, @Body() dto: UpdateStaffCategoryDto) {
    return this.categoriesService.updateForStaff(categoryId, dto);
  }

  @Delete(':categoryId')
  remove(@Param('categoryId') categoryId: string) {
    return this.categoriesService.deleteForStaff(categoryId);
  }
}
