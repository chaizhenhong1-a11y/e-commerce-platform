import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestRefundDto {
  @IsIn([
    'CHANGED_MIND',
    'ORDER_ISSUE',
    'DUPLICATE_ORDER',
    'OTHER',
  ])
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
