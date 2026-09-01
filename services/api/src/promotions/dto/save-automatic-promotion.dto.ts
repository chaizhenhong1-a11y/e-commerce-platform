import {
  ArrayMaxSize, IsArray, IsBoolean, IsDateString, IsEnum, IsInt,
  IsNotEmpty, IsOptional, IsString, MaxLength, Min,
} from 'class-validator';
import { CouponDiscountType } from '@prisma/client';

export class SaveAutomaticPromotionDto {
  @IsString() @IsNotEmpty() @MaxLength(120) name!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsEnum(CouponDiscountType) discountType!: CouponDiscountType;
  @IsInt() @Min(1) value!: number;
  @IsInt() @Min(0) minSubtotalCents!: number;
  @IsOptional() @IsInt() @Min(1) maxDiscountCents?: number | null;
  @IsOptional() @IsDateString() startsAt?: string | null;
  @IsOptional() @IsDateString() endsAt?: string | null;
  @IsInt() priority!: number;
  @IsBoolean() isActive!: boolean;
  @IsArray() @ArrayMaxSize(100) @IsString({ each: true }) productIds!: string[];
  @IsArray() @ArrayMaxSize(100) @IsString({ each: true }) categoryIds!: string[];
}
