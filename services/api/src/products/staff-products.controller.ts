import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { UploadedImageFile } from '../media/media-storage.service';
import type { ProductStatus } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { StaffAuthGuard } from '../auth/guards/staff-auth.guard';
import {
  AdjustInventoryDto,
  CreateStaffImageDto,
  CreateStaffVariantDto,
  GenerateVariantMatrixDto,
  SaveStaffProductDto,
  UpdateStaffImageDto,
  UpdateStaffProductDto,
  UpdateStaffVariantDetailsDto,
  UpdateStaffVariantDto,
} from './dto/staff-catalog.dto';
import { ProductsService } from './products.service';

@Controller('staff/catalog')
@UseGuards(StaffAuthGuard)
export class StaffProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(
    @Query('q') q?: string,
    @Query('status') status?: ProductStatus,
    @Query('lowStock') lowStock?: string,
  ) {
    return this.productsService.listForStaff({
      q,
      status,
      lowStock: lowStock === 'true',
    });
  }

  @Get('editor/options')
  editorOptions() {
    return this.productsService.staffEditorOptions();
  }

  @Get('products/:productId')
  product(@Param('productId') productId: string) {
    return this.productsService.getProductForStaff(productId);
  }

  @Post('products')
  createProduct(@Body() dto: SaveStaffProductDto) {
    return this.productsService.createProductForStaff(dto);
  }

  @Put('products/:productId')
  saveProduct(
    @Param('productId') productId: string,
    @Body() dto: SaveStaffProductDto,
  ) {
    return this.productsService.saveProductForStaff(productId, dto);
  }

  @Patch('products/:productId')
  updateProduct(
    @Param('productId') productId: string,
    @Body() dto: UpdateStaffProductDto,
  ) {
    return this.productsService.updateProductForStaff(productId, dto);
  }

  @Delete('products/:productId')
  deleteProduct(@Param('productId') productId: string) {
    return this.productsService.deleteProductForStaff(productId);
  }

  @Post('products/:productId/variants')
  createVariant(
    @Param('productId') productId: string,
    @Body() dto: CreateStaffVariantDto,
  ) {
    return this.productsService.createVariantForStaff(productId, dto);
  }

  @Post('products/:productId/variant-matrix')
  generateVariantMatrix(
    @Param('productId') productId: string,
    @Body() dto: GenerateVariantMatrixDto,
  ) {
    return this.productsService.generateVariantMatrixForStaff(productId, dto);
  }

  @Patch('variants/:variantId/details')
  saveVariant(
    @Param('variantId') variantId: string,
    @Body() dto: UpdateStaffVariantDetailsDto,
  ) {
    return this.productsService.saveVariantForStaff(variantId, dto);
  }

  @Delete('variants/:variantId')
  deleteVariant(@Param('variantId') variantId: string) {
    return this.productsService.deleteVariantForStaff(variantId);
  }

  @Patch('variants/:variantId')
  updateVariant(
    @Param('variantId') variantId: string,
    @Body() dto: UpdateStaffVariantDto,
  ) {
    return this.productsService.updateVariantForStaff(variantId, dto);
  }

  @Post('products/:productId/images/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  uploadImage(
    @Param('productId') productId: string,
    @UploadedFile() file: UploadedImageFile,
    @Body() body: Record<string, string | undefined>,
  ) {
    return this.productsService.uploadImageForStaff(productId, file, {
      altText: body.altText?.trim() || null,
      variantId: body.variantId?.trim() || null,
      sortOrder: body.sortOrder ? Number.parseInt(body.sortOrder, 10) || 0 : 0,
      isPrimary: body.isPrimary === 'true',
    });
  }

  @Post('products/:productId/images')
  addImage(
    @Param('productId') productId: string,
    @Body() dto: CreateStaffImageDto,
  ) {
    return this.productsService.addImageForStaff(productId, dto);
  }

  @Patch('images/:imageId')
  updateImage(
    @Param('imageId') imageId: string,
    @Body() dto: UpdateStaffImageDto,
  ) {
    return this.productsService.updateImageForStaff(imageId, dto);
  }

  @Delete('images/:imageId')
  deleteImage(@Param('imageId') imageId: string) {
    return this.productsService.deleteImageForStaff(imageId);
  }

  @Post('variants/:variantId/inventory/adjust')
  adjust(
    @Param('variantId') variantId: string,
    @Body() dto: AdjustInventoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productsService.adjustInventoryForStaff(
      variantId,
      dto.delta,
      dto.reason,
      user.id,
    );
  }

  @Get('variants/:variantId/inventory/history')
  history(@Param('variantId') variantId: string) {
    return this.productsService.inventoryHistoryForStaff(variantId);
  }
}
