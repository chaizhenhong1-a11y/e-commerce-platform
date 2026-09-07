import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderNumber!: string;

  @IsIn(['MANUAL_TEST', 'STRIPE', 'BILLPLZ'])
  provider!: 'MANUAL_TEST' | 'STRIPE' | 'BILLPLZ';

  @IsOptional()
  @IsString()
  returnBaseUrl?: string;
}

