import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class RequestReturnItemDto {
  @IsString()
  orderItemId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class RequestReturnDto {
  @IsIn([
    'DAMAGED',
    'DEFECTIVE',
    'WRONG_ITEM',
    'NOT_AS_DESCRIBED',
    'CHANGED_MIND',
    'OTHER',
  ])
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RequestReturnItemDto)
  items!: RequestReturnItemDto[];
}
