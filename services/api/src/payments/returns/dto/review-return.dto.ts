import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewReturnDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
