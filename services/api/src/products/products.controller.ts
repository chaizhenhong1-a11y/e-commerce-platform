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
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('inStock') inStock?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.findAll({
      query,
      category,
      sort,
      minPrice: this.optionalNumber(minPrice),
      maxPrice: this.optionalNumber(maxPrice),
      inStock: inStock === 'true' ? true : undefined,
      ...(this.optionalPositiveInteger(page) != null
        ? { page: this.optionalPositiveInteger(page) }
        : {}),
      ...(this.optionalPositiveInteger(limit) != null
        ? { limit: this.optionalPositiveInteger(limit) }
        : {}),
    });
  }

  @Get('catalog-meta')
  catalogMetadata() {
    return this.productsService.catalogMetadata();
  }

  private optionalNumber(value?: string) {
    if (!value?.trim()) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private optionalPositiveInteger(value?: string) {
    if (!value?.trim()) return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) return undefined;
    return parsed;
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }
}
