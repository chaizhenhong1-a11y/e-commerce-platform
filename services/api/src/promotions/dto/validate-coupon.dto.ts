import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ValidateCouponDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  sessionId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  couponCode!: string;
}
