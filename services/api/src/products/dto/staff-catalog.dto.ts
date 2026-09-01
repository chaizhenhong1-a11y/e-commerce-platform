import { ProductStatus } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateStaffProductDto {
  @IsOptional() @IsEnum(ProductStatus) status?: ProductStatus;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
}

export class SaveStaffProductDto {
  @IsString() @MaxLength(140) name!: string;
  @IsString() @MaxLength(160) @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) slug!: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsString() categoryId?: string | null;
  @IsOptional() @IsEnum(ProductStatus) status?: ProductStatus;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
}

export class CreateStaffVariantDto {
  @IsString() @MaxLength(80) sku!: string;
  @IsString() @MaxLength(120) name!: string;
  @IsInt() @Min(0) priceCents!: number;
  @IsOptional() @IsInt() @Min(0) compareAtCents?: number | null;
  @IsOptional() @IsString() @MaxLength(8) currency?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() @Min(0) initialQuantity?: number;
  @IsOptional() @IsObject() optionValues?: Record<string, string>;
}

export class GenerateVariantMatrixDto {
  @IsArray() options!: unknown[];
  @IsString() @MaxLength(40) skuPrefix!: string;
  @IsInt() @Min(0) priceCents!: number;
  @IsOptional() @IsInt() @Min(0) compareAtCents?: number | null;
  @IsOptional() @IsString() @MaxLength(8) currency?: string;
  @IsOptional() @IsInt() @Min(0) initialQuantity?: number;
}

export class UpdateStaffVariantDetailsDto {
  @IsString() @MaxLength(80) sku!: string;
  @IsString() @MaxLength(120) name!: string;
  @IsInt() @Min(0) priceCents!: number;
  @IsOptional() @IsInt() @Min(0) compareAtCents?: number | null;
  @IsOptional() @IsString() @MaxLength(8) currency?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsObject() optionValues?: Record<string, string>;
}

export class CreateStaffImageDto {
  @IsString() @MaxLength(2000) url!: string;
  @IsOptional() @IsString() @MaxLength(220) altText?: string | null;
  @IsOptional() @IsString() variantId?: string | null;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
}

export class UpdateStaffImageDto {
  @IsOptional() @IsString() @MaxLength(220) altText?: string | null;
  @IsOptional() @IsString() variantId?: string | null;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
}

export class UpdateStaffVariantDto {
  @IsBoolean() isActive!: boolean;
}

export class AdjustInventoryDto {
  @IsInt() delta!: number;
  @IsString() @MaxLength(160) reason!: string;
}
