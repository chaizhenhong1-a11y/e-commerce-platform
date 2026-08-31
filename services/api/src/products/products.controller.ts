import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(
    @Query('q') query?: string,
    @Query('category') category?: string,
    @Query('sort') sort?: string,
  ) {
    return this.productsService.findAll({
      query,
      category,
      sort,
    });
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }
}
