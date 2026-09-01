import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReturnDisposition, ReturnItemCondition } from '@prisma/client';

class InspectReturnItemDto {
  @IsString()
  returnItemId!: string;

  @IsEnum(ReturnItemCondition)
  condition!: ReturnItemCondition;

  @IsEnum(ReturnDisposition)
  disposition!: ReturnDisposition;
}

export class InspectReturnDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InspectReturnItemDto)
  items!: InspectReturnItemDto[];
}
