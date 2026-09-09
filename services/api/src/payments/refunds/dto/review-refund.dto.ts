import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewRefundDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
